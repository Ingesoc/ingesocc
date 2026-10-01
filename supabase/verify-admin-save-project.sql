-- ============================================================================
-- Ingesocc SAS — Verificación de public.admin_save_project
-- ----------------------------------------------------------------------------
-- El panel guarda proyectos con UNA sola llamada RPC (`rpc('admin_save_project')`
-- en projects.service.ts). Si la función no existe, o existe con otra firma,
-- PostgREST responde PGRST202 y /admin/proyectos no puede guardar NADA.
-- Este script comprueba existencia, firma exacta, permisos, atributos de
-- seguridad y el comportamiento transaccional completo (crear / actualizar /
-- categorías / imágenes / portada / orden / huérfanos / autorización).
--
-- Dónde correr: SQL Editor de Supabase, de arriba a abajo, en un proyecto de
-- PRUEBAS/STAGING. Crea 2 usuarios de prueba y 1 proyecto temporal; ambos se
-- borran al final. NO correr contra producción.
--
-- Requisitos: al menos una fila en public.categories (la semilla las trae) y
-- las migraciones aplicadas (la función debe existir; si M1 falla, aplica
-- 20260917000005 antes de interpretar el resto).
--
-- La última sentencia es el RESUMEN: es lo que muestra el SQL Editor.
-- Resultado esperado: todas las filas en PASS.
-- ============================================================================

-- IDs fijos de los fixtures
--   usuario NO-admin: 40000000-0000-4000-8000-000000000001
--   usuario admin:    40000000-0000-4000-8000-000000000002

drop table if exists public._rpc_test_results;
create table public._rpc_test_results (
  check_id text,
  status   text,
  detail   text
);
-- Los checks de abajo corren impersonando a authenticated/anon (igual que
-- PostgREST), así que ambos roles necesitan poder escribir el resultado.
grant insert on public._rpc_test_results to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 1. Metadatos: existencia, firma, permisos y atributos de seguridad
--    (rol postgres del editor: sin RLS ni JWT)
-- ----------------------------------------------------------------------------

-- M1: exactamente UNA función admin_save_project. Con overloads de otras
--     firmas, PostgREST resuelve una y el panel recibe otra cosa.
insert into public._rpc_test_results
select 'M1',
       case when count(*) = 1 then 'PASS' else 'FAIL' end,
       'funciones admin_save_project en public: ' || count(*)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'admin_save_project';

-- M2: la firma EXACTA que llama el frontend (orden y tipos de los 10 parámetros).
insert into public._rpc_test_results
select 'M2',
       case
         when count(*) = 1
          and bool_and(pg_get_function_identity_arguments(p.oid) =
            'p_project_id uuid, p_title text, p_slug text, p_description text, '
            || 'p_price_min_wages numeric, p_status text, p_featured boolean, '
            || 'p_sort_order integer, p_category_ids uuid[], p_image_rows jsonb')
         then 'PASS' else 'FAIL'
       end,
       'firma observada: ' || coalesce(string_agg(
         pg_get_function_identity_arguments(p.oid), ' | '), '(sin función)')
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'admin_save_project';

-- M3: devuelve TABLE(project_id uuid, orphan_storage_paths text[]) — lo que el
--     cliente lee en projects.service.ts (`result[0].orphan_storage_paths`).
insert into public._rpc_test_results
select 'M3',
       case
         when count(*) = 1
          and bool_and(position('project_id uuid' in pg_get_function_result(p.oid)) > 0
                   and position('orphan_storage_paths text[]' in pg_get_function_result(p.oid)) > 0)
         then 'PASS' else 'FAIL'
       end,
       'returns observado: ' || coalesce(string_agg(
         pg_get_function_result(p.oid), ' | '), '(sin función)')
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'admin_save_project';

-- M4: SECURITY INVOKER (prosecdef = false). Con SECURITY DEFINER la función
--     saltaría RLS y el check de admin; aquí mandan RLS + el check explícito.
insert into public._rpc_test_results
select 'M4',
       case when bool_and(p.prosecdef = false) then 'PASS' else 'FAIL' end,
       'security definer: ' || coalesce(string_agg(p.prosecdef::text, ' | '), '(sin función)')
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'admin_save_project';

-- M5: search_path fijado a public (no hereda el del invocante).
insert into public._rpc_test_results
select 'M5',
       case
         when bool_and(coalesce(p.proconfig::text, '') like '%search_path=public%')
         then 'PASS' else 'FAIL'
       end,
       'proconfig: ' || coalesce(string_agg(p.proconfig::text, ' | '), '(sin función)')
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'admin_save_project';

-- M6: `authenticated` SÍ puede ejecutarla (es el rol del panel).
insert into public._rpc_test_results
select 'M6',
       case when bool_and(has_function_privilege('authenticated', p.oid, 'execute'))
            then 'PASS' else 'FAIL' end,
       'execute para authenticated: ' || coalesce(string_agg(
         has_function_privilege('authenticated', p.oid, 'execute')::text, ' | '), '(sin función)')
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'admin_save_project';

-- M7: ni `anon` ni PUBLIC pueden ejecutarla (grantee = 0 es PUBLIC en aclexplode).
insert into public._rpc_test_results
select 'M7',
       case when count(*) = 0 then 'PASS' else 'FAIL' end,
       'EXECUTE concedidos a anon/PUBLIC: ' || count(*)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
where n.nspname = 'public' and p.proname = 'admin_save_project'
  and acl.privilege_type = 'EXECUTE'
  and acl.grantee in (0, (select oid from pg_roles where rolname = 'anon'));

-- ----------------------------------------------------------------------------
-- 2. Fixtures: 1 admin + 1 usuario normal en auth.users (el trigger
--    on_auth_user_created crea sus perfiles con role 'user').
-- ----------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_sso_user, is_anonymous
) values
  ('00000000-0000-0000-0000-000000000000',
   '40000000-0000-4000-8000-000000000001',
   'authenticated', 'authenticated', 'rpc-verify-user@example.test',
   crypt('test-password-123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), false, false),
  ('00000000-0000-0000-0000-000000000000',
   '40000000-0000-4000-8000-000000000002',
   'authenticated', 'authenticated', 'rpc-verify-admin@example.test',
   crypt('test-password-123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), false, false)
on conflict (id) do nothing;

update public.profiles set role = 'user'  where id = '40000000-0000-4000-8000-000000000001';
update public.profiles set role = 'admin' where id = '40000000-0000-4000-8000-000000000002';

delete from public.projects where slug like 'rpc-verify-%';

-- ----------------------------------------------------------------------------
-- 3. Comportamiento funcional (impersonando al admin igual que PostgREST:
--    rol `authenticated` + los claims del JWT).
-- ----------------------------------------------------------------------------

begin;
  set local role authenticated;
  select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000002', true);
  select set_config('request.jwt.claims',
    json_build_object('sub', '40000000-0000-4000-8000-000000000002'::text)::text, true);

  do $$
  declare
    v_project uuid;
    v_orphans text[];
    v_cat     uuid;
    v_ids     uuid[];
    v_paths   text[];
    v_orders  int[];
    v_n        int;
    v_covers  int;
    v_text    text;
  begin
    select c.id into v_cat
    from public.categories c
    order by c.sort_order, c.name
    limit 1;

    -- F1: CREATE con p_project_id = null. Tres referencias que deben convivir
    --     sin transformarse: secure_url de Cloudinary, ruta del bucket legacy
    --     y URL externa antigua.
    select s.project_id, s.orphan_storage_paths into v_project, v_orphans
    from public.admin_save_project(
      null,
      'RPC Verify',
      'rpc-verify-proyecto',
      'Proyecto temporal para verificar admin_save_project.',
      123.45,
      'draft',
      false,
      7,
      array[v_cat],
      jsonb_build_array(
        jsonb_build_object('id', null, 'storage_path', 'https://res.cloudinary.com/demo/image/upload/ingesocc/projects/rpc-verify/cloudinary.jpg', 'is_cover', true,  'sort_order', 0),
        jsonb_build_object('id', null, 'storage_path', 'rpc-verify/legacy.jpg',                                                                 'is_cover', false, 'sort_order', 1),
        jsonb_build_object('id', null, 'storage_path', 'https://images.unsplash.com/photo-1?w=1600',                                             'is_cover', false, 'sort_order', 2)
      )
    ) s;

    select count(*),
           count(*) filter (where is_cover),
           array_agg(storage_path order by sort_order),
           array_agg(sort_order order by sort_order)
    into v_n, v_covers, v_paths, v_orders
    from public.project_images where project_id = v_project;

    insert into public._rpc_test_results values
      ('F1', case when v_project is not null then 'PASS' else 'FAIL' end,
       'create: project_id devuelto = ' || coalesce(v_project::text, 'null')),
      ('F2', case when coalesce(array_length(v_orphans, 1), 0) = 0 then 'PASS' else 'FAIL' end,
       'create: huérfanos = ' || coalesce(v_orphans::text, '{}')),
      ('F3', case when v_n = 3 then 'PASS' else 'FAIL' end,
       'create: filas en project_images = ' || v_n),
      ('F4', case when v_covers = 1 then 'PASS' else 'FAIL' end,
       'create: imágenes marcadas portada = ' || v_covers),
      ('F5', case when v_orders = array[0, 1, 2] then 'PASS' else 'FAIL' end,
       'create: sort_order = ' || v_orders::text),
      ('F6', case when v_paths = array[
             'https://res.cloudinary.com/demo/image/upload/ingesocc/projects/rpc-verify/cloudinary.jpg',
             'rpc-verify/legacy.jpg',
             'https://images.unsplash.com/photo-1?w=1600'] then 'PASS' else 'FAIL' end,
       'create: storage_path guardados = ' || v_paths::text),
      ('F7', case when (select count(*) from public.project_categories pc
                        where pc.project_id = v_project) = 1 then 'PASS' else 'FAIL' end,
       'create: categorías vinculadas = ' ||
         (select count(*) from public.project_categories pc where pc.project_id = v_project)::text);

    select array_agg(id order by sort_order) into v_ids
    from public.project_images where project_id = v_project;

    -- F8: UPDATE. Cambia título/precio/estado/featured/orden del proyecto y
    --     ADELGA la galería: la imagen de Cloudinary desaparece y sus dos
    --     restantes se reordenan, cambiando la portada.
    select s.project_id, s.orphan_storage_paths into v_project, v_orphans
    from public.admin_save_project(
      v_project,
      'RPC Verify editado',
      'rpc-verify-proyecto',
      'Proyecto temporal para verificar admin_save_project (editado).',
      999.99,
      'published',
      true,
      3,
      array[v_cat],
      jsonb_build_array(
        jsonb_build_object('id', v_ids[2], 'storage_path', 'rpc-verify/legacy.jpg', 'is_cover', false, 'sort_order', 5),
        jsonb_build_object('id', v_ids[3], 'storage_path', 'https://images.unsplash.com/photo-1?w=1600', 'is_cover', true, 'sort_order', 0)
      )
    ) s;

    select count(*) into v_n
    from public.project_images where project_id = v_project;

    insert into public._rpc_test_results values
      ('F8', case when v_n = 2
                 and (select title from public.projects where id = v_project) = 'RPC Verify editado'
                 and (select status from public.projects where id = v_project) = 'published'
                 and (select featured from public.projects where id = v_project)
                 and (select sort_order from public.projects where id = v_project) = 3
                 and (select price_min_wages from public.projects where id = v_project) = 999.99
            then 'PASS' else 'FAIL' end,
       'update: proyecto actualizado y galería reducida a ' || v_n || ' imágenes'),
      ('F9', case when v_orphans = array[
             'https://res.cloudinary.com/demo/image/upload/ingesocc/projects/rpc-verify/cloudinary.jpg']
            then 'PASS' else 'FAIL' end,
       'update: orphan_storage_paths = ' || coalesce(v_orphans::text, '{}')),
      ('F10', case when (select count(*) from public.project_images
                         where project_id = v_project and is_cover) = 1
                  and (select is_cover from public.project_images
                        where project_id = v_project
                          and storage_path = 'https://images.unsplash.com/photo-1?w=1600')
            then 'PASS' else 'FAIL' end,
       'update: la portada pasó a la imagen reordenada'),
      ('F11', case when (select sort_order from public.project_images
                         where project_id = v_project
                           and storage_path = 'rpc-verify/legacy.jpg') = 5
            then 'PASS' else 'FAIL' end,
       'update: sort_order aplicado a la imagen existente');

    -- F12/F13: p_image_rows como STRING JSON (compatibilidad con el bundle
    --     anterior, que hacía JSON.stringify). PostgREST lo entrega como un
    --     escalar jsonb de tipo string y la RPC debe interpretarlo igual.
    --     Ojo: 'rpc-verify/legacy.jpg' llega SIN id pero su fila ya existe →
    --     debe sobrevivir sin duplicarse.
    v_text := '[{"id":null,"storage_path":"https://res.cloudinary.com/demo/image/upload/ingesocc/projects/rpc-verify/string.jpg","is_cover":false,"sort_order":0},'
              || '{"id":null,"storage_path":"rpc-verify/legacy.jpg","is_cover":true,"sort_order":1}]';

    select s.project_id into v_project
    from public.admin_save_project(
      v_project, 'RPC Verify string', 'rpc-verify-proyecto',
      'Proyecto temporal para verificar admin_save_project (string).',
      1, 'draft', false, 0, array[v_cat], v_text::jsonb
    ) s;

    select count(*), count(*) filter (where is_cover) into v_n, v_covers
    from public.project_images where project_id = v_project;

    insert into public._rpc_test_results values
      ('F12', case when v_n = 2 then 'PASS' else 'FAIL' end,
       'p_image_rows como string: imágenes tras el guardado = ' || v_n),
      ('F13', case when v_covers = 1 then 'PASS' else 'FAIL' end,
       'p_image_rows como string: portada única respetada = ' || v_covers);

    -- F14: lote sin portada marcada → la de menor sort_order la asume.
    select s.project_id into v_project
    from public.admin_save_project(
      v_project, 'RPC Verify sin portada', 'rpc-verify-proyecto',
      'Proyecto temporal para verificar admin_save_project (sin portada).',
      1, 'draft', false, 0, array[v_cat],
      '[{"id":null,"storage_path":"rpc-verify/legacy.jpg","is_cover":false,"sort_order":4},'
      || '{"id":null,"storage_path":"rpc-verify/otra.jpg","is_cover":false,"sort_order":2}]'::jsonb
    ) s;

    insert into public._rpc_test_results values
      ('F14', case when (select count(*) from public.project_images
                         where project_id = v_project and is_cover) = 1
                  and (select is_cover from public.project_images
                        where project_id = v_project
                          and storage_path = 'rpc-verify/otra.jpg')
            then 'PASS' else 'FAIL' end,
       'lote sin portada: 1 portada, la de menor sort_order (2)');

    -- F15: la misma referencia dos veces en el lote → una sola fila.
    select s.project_id into v_project
    from public.admin_save_project(
      v_project, 'RPC Verify duplicados', 'rpc-verify-proyecto',
      'Proyecto temporal para verificar admin_save_project (duplicados).',
      1, 'draft', false, 0, array[v_cat],
      jsonb_build_array(
        jsonb_build_object('id', null, 'storage_path', 'rpc-verify/legacy.jpg', 'is_cover', true,  'sort_order', 0),
        jsonb_build_object('id', null, 'storage_path', 'rpc-verify/legacy.jpg', 'is_cover', false, 'sort_order', 1)
      )
    ) s;

    select count(*) into v_n
    from public.project_images where project_id = v_project;

    insert into public._rpc_test_results values
      ('F15', case when v_n = 1 then 'PASS' else 'FAIL' end,
       'duplicados en el lote: filas para la misma referencia = ' || v_n);

    -- F16: lote vacío → la galería se vacía y su último path vuelve como
    --       huérfano para que el cliente limpie el asset tras el commit.
    select s.orphan_storage_paths into v_orphans
    from public.admin_save_project(
      v_project, 'RPC Verify sin imagenes', 'rpc-verify-proyecto',
      'Proyecto temporal para verificar admin_save_project (sin imagenes).',
      1, 'draft', false, 0, '{}'::uuid[], '[]'::jsonb
    ) s;

    select count(*) into v_n
    from public.project_images where project_id = v_project;

    insert into public._rpc_test_results values
      ('F16', case when v_n = 0 then 'PASS' else 'FAIL' end,
       'lote vacío: imágenes restantes = ' || v_n),
      ('F17', case when v_orphans = array['rpc-verify/legacy.jpg'] then 'PASS' else 'FAIL' end,
       'lote vacío: orphan_storage_paths = ' || coalesce(v_orphans::text, '{}'));

    -- F18: slug duplicado → 23505 (el panel lo traduce a un mensaje claro).
    begin
      perform * from public.admin_save_project(
        null, 'RPC Verify slug repetido', 'rpc-verify-proyecto', 'x', 1, 'draft', false, 0,
        '{}'::uuid[], '[]'::jsonb);
      insert into public._rpc_test_results values
        ('F18', 'FAIL', 'el slug duplicado NO dio error');
    exception when unique_violation then
      insert into public._rpc_test_results values
        ('F18', 'PASS', 'slug duplicado rechazado con 23505');
    end;

    -- F19: p_image_rows con una forma inválida → error de contrato explícito.
    begin
      perform * from public.admin_save_project(
        v_project, 'RPC Verify objeto', 'rpc-verify-proyecto', 'x', 1, 'draft', false, 0,
        '{}'::uuid[], '{"no":"es un array"}'::jsonb);
      insert into public._rpc_test_results values
        ('F19', 'FAIL', 'p_image_rows con un objeto NO dio error');
    exception when invalid_parameter_value then
      insert into public._rpc_test_results values
        ('F19', 'PASS', 'p_image_rows no-array rechazado con 22023');
    end;
  end
  $$;
commit;

-- ----------------------------------------------------------------------------
-- 4. Autorización
-- ----------------------------------------------------------------------------

-- A1: un usuario autenticado SIN rol admin recibe 42501.
begin;
  set local role authenticated;
  select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000001', true);
  select set_config('request.jwt.claims',
    json_build_object('sub', '40000000-0000-4000-8000-000000000001'::text)::text, true);

  do $$
  begin
    begin
      perform * from public.admin_save_project(
        null, 'RPC Verify no admin', 'rpc-verify-no-admin', 'x', 1, 'draft', false, 0,
        '{}'::uuid[], '[]'::jsonb);
      insert into public._rpc_test_results values
        ('A1', 'FAIL', 'un usuario SIN rol admin pudo llamar la RPC');
    exception when insufficient_privilege then
      insert into public._rpc_test_results values
        ('A1', 'PASS', 'no-admin bloqueado con 42501');
    end;
  end
  $$;
commit;

-- A1b: y no dejó nada escrito (esta comprobación es con rol postgres: un
--      SELECT del propio proyecto no-admin lo ocultaría por RLS).
insert into public._rpc_test_results
select 'A1b',
       case when count(*) = 0 then 'PASS' else 'FAIL' end,
       'proyectos creados por el no-admin: ' || count(*)
from public.projects where slug = 'rpc-verify-no-admin';

-- A2: un anónimo ni siquiera puede ejecutar la función.
begin;
  set local role anon;
  do $$
  begin
    begin
      perform * from public.admin_save_project(
        null, 'RPC Verify anon', 'rpc-verify-anon', 'x', 1, 'draft', false, 0,
        '{}'::uuid[], '[]'::jsonb);
      insert into public._rpc_test_results values
        ('A2', 'FAIL', 'anon pudo llamar la RPC');
    exception when insufficient_privilege then
      insert into public._rpc_test_results values ('A2', 'PASS', 'anon bloqueado (42501)');
    end;
  end
  $$;
commit;

-- A2b: y anónimo no dejó nada escrito.
insert into public._rpc_test_results
select 'A2b',
       case when count(*) = 0 then 'PASS' else 'FAIL' end,
       'proyectos creados por anon: ' || count(*)
from public.projects where slug = 'rpc-verify-anon';

-- ----------------------------------------------------------------------------
-- 5. Schema cache de PostgREST
-- ----------------------------------------------------------------------------
-- Tras aplicar la migración, la función aparece en el OpenAPI del proyecto:
--   GET https://<ref>.supabase.co/rest/v1/   (Accept: application/openapi+json)
-- y debe incluir la ruta /rpc/admin_save_project.
-- Si el DDL se aplicó pero la llamada sigue dando PGRST202, fuerza el refresco:
--   notify pgrst, 'reload schema';
-- (Supabase ya lo dispara con su event trigger de DDL; el NOTIFY es para el
-- caso raro de una conexión con el schema cache viejo.)

-- ----------------------------------------------------------------------------
-- 6. Limpieza de los datos de prueba (la tabla de resultados se queda: es la
--    salida del script y la siguiente ejecución la borra en la línea 1).
-- ----------------------------------------------------------------------------
delete from auth.users
where id in ('40000000-0000-4000-8000-000000000001',
             '40000000-0000-4000-8000-000000000002');        -- cascade a profiles
delete from public.projects where slug like 'rpc-verify-%';  -- cascade a imágenes y categorías

-- ----------------------------------------------------------------------------
-- 7. Resumen — ÚLTIMA sentencia a propósito: es lo que muestra el SQL Editor.
--    Cualquier fila en FAIL indica un problema (el `detail` lo explica).
-- ----------------------------------------------------------------------------
select check_id, status, detail
from public._rpc_test_results
order by check_id;
