-- ============================================================================
-- Ingesocc SAS — Checks de regresión RLS (P0)
-- ----------------------------------------------------------------------------
-- Verifica que:
--   A) Un usuario autenticado SIN rol admin NO puede cambiarse el rol a 'admin'
--      (regresión del bug: policy profiles_update_own sin with check).
--   B) Un usuario NO-admin (y un anónimo) NO puede borrar contact_messages
--      (regresión del bug: no existía policy DELETE).
--   C) El admin SÍ puede borrar contact_messages.
--   D) Matriz de lectura: qué ve cada rol (published vs draft) en projects,
--      services y content_blocks.
--   E-G) CRUD de projects, services y content_blocks: anon y user bloqueados,
--        admin con CRUD completo.
--   H) Storage (storage.objects): lectura pública para anon/user/admin;
--      insert/update/delete solo admin.
--
-- Dónde correr: SQL Editor de Supabase, de arriba a abajo, en un proyecto de
-- PRUEBAS/STAGING. El script crea 2 usuarios de prueba + 1 mensaje + fixtures
-- de la matriz (projects/services/content_blocks/storage) y los elimina al
-- final, pero por seguridad no se corre contra producción.
--
-- Si el editor reporta "permission denied ... auth.users" (versiones donde
-- postgres no puede insertar ahí), crea los 2 usuarios desde
-- Authentication → Users y reemplaza <NON_ADMIN_ID>/<ADMIN_ID> por sus UUIDs
-- (el resto del script no cambia).
--
-- Resultado: cada check inserta una fila en public._rls_test_results y al
-- final se imprime el resumen. Esperado: TODAS las filas en PASS.
-- ============================================================================

-- IDs fijos de los fixtures (reemplazar solo si creas los usuarios a mano)
--   usuario NO-admin: 10000000-0000-4000-8000-000000000001 (rls-check-nonadmin@example.test)
--   usuario admin:    10000000-0000-4000-8000-000000000002 (rls-check-admin@example.test)
--   mensaje de prueba: 20000000-0000-4000-8000-000000000001

-- ----------------------------------------------------------------------------
-- 0. Setup (rol postgres del editor, fuera de RLS)
-- ----------------------------------------------------------------------------

create table if not exists public._rls_test_results (
  check_id text,
  status   text,
  detail   text
);
truncate public._rls_test_results;
-- Los DO blocks de los escenarios corren impersonando anon/authenticated:
grant select, insert on public._rls_test_results to anon, authenticated;

-- 0.1 Usuarios de prueba en auth.users (dispara el trigger on_auth_user_created,
--     que crea su fila en profiles con role 'user').
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_sso_user, is_anonymous
) values
  ('00000000-0000-0000-0000-000000000000',
   '10000000-0000-4000-8000-000000000001',
   'authenticated', 'authenticated', 'rls-check-nonadmin@example.test',
   crypt('test-password-123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), false, false),
  ('00000000-0000-0000-0000-000000000000',
   '10000000-0000-4000-8000-000000000002',
   'authenticated', 'authenticated', 'rls-check-admin@example.test',
   crypt('test-password-123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), false, false)
on conflict (id) do nothing;

-- 0.2 Roles deterministas en profiles (postgres, dueño de la tabla: ignora RLS).
update public.profiles set role = 'user'  where id = '10000000-0000-4000-8000-000000000001';
update public.profiles set role = 'admin' where id = '10000000-0000-4000-8000-000000000002';

-- 0.3 Mensaje de contacto de prueba.
insert into public.contact_messages (id, name, email, message)
values ('20000000-0000-4000-8000-000000000001', 'RLS Check', 'rls-check@example.test',
        'Mensaje temporal para los checks de RLS; se elimina al final del script.')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 0.4 Helpers de los checks de la matriz. Se ejecutan BAJO el rol impersonado
--      (anon/authenticated), así que requieren los grants de 0 y el execute
--      público por defecto de las funciones. El SQL dinámico corre con el rol
--      que llama → RLS aplica igual que en un statement directo.
--      * _rls_check_select: cuenta las filas visibles y las compara con el
--        número esperado (para la matriz de lectura).
--      * _rls_check_blocked: ejecuta una operación que DEBE quedar bloqueada
--        (error de RLS o 0 filas afectadas = PASS).
--      * _rls_check_exact: ejecuta una operación que DEBE afectar exactamente
--        N filas (para el CRUD del admin).
-- ----------------------------------------------------------------------------
create or replace function public._rls_check_select(p_check text, p_sql text, p_expected int)
returns void
language plpgsql
as $$
declare v_count integer;
begin
  begin
    execute 'select count(*) from (' || p_sql || ') t' into v_count;
  exception when others then
    insert into public._rls_test_results
    values (p_check, 'FAIL', 'error inesperado: ' || left(sqlerrm, 70));
    return;
  end;
  insert into public._rls_test_results
  values (p_check, case when v_count = p_expected then 'PASS' else 'FAIL' end,
          'filas visibles: ' || v_count || ' (esperado: ' || p_expected || ')');
end;
$$;

create or replace function public._rls_check_blocked(p_check text, p_sql text)
returns void
language plpgsql
as $$
declare
  v_rows integer := 0;
  v_err  text;
begin
  begin
    execute p_sql;
    get diagnostics v_rows = row_count;
  exception when others then
    v_err := sqlerrm;
  end;
  if v_rows = 0 or v_err is not null then
    insert into public._rls_test_results
    values (p_check, 'PASS', coalesce('bloqueado: ' || left(v_err, 70),
                                     '0 filas afectadas'));
  else
    insert into public._rls_test_results
    values (p_check, 'FAIL', 'operación afectó ' || v_rows ||
            ' fila(s); debería estar bloqueada');
  end if;
end;
$$;

create or replace function public._rls_check_exact(p_check text, p_sql text, p_expected int)
returns void
language plpgsql
as $$
declare
  v_rows integer := 0;
  v_err  text;
begin
  begin
    execute p_sql;
    get diagnostics v_rows = row_count;
  exception when others then
    v_err := sqlerrm;
  end;
  if v_err is not null then
    insert into public._rls_test_results
    values (p_check, 'FAIL', 'error inesperado: ' || left(v_err, 70));
  elsif v_rows = p_expected then
    insert into public._rls_test_results
    values (p_check, 'PASS', 'filas afectadas: ' || v_rows);
  else
    insert into public._rls_test_results
    values (p_check, 'FAIL', 'filas afectadas: ' || v_rows ||
            ' (esperado: ' || p_expected || ')');
  end if;
end;
$$;

-- 0.5 Fixtures de la matriz (projects/services/content_blocks/storage).
--      Primero se limpia cualquier resto de un run anterior que haya quedado a
--      medias (slugs/pages/names con prefijo 'rls-check'), y luego se insertan
--      con IDs fijos para poder borrarlos al final:
--        proyectos: 30000000-...-0001 publicado, 30000000-...-0002 draft
--        servicios: 40000000-...-0001 publicado, 40000000-...-0002 draft
--        content:   50000000-...-0001 (page 'rls-check')
--        storage:   'rls-checks/fixture.png' en project-images
delete from public.projects where slug like 'rls-check-%';
delete from public.services where slug like 'rls-check-%';
delete from public.content_blocks where page = 'rls-check';
delete from storage.objects
where bucket_id in ('project-images', 'service-images', 'content-images')
  and name like 'rls-checks/%';

insert into public.projects (id, title, slug, description, status)
values
  ('30000000-0000-4000-8000-000000000001', 'Proyecto publicado RLS',
   'rls-check-published', 'Fixture publicado para la matriz RLS.', 'published'),
  ('30000000-0000-4000-8000-000000000002', 'Proyecto draft RLS',
   'rls-check-draft', 'Fixture en borrador para la matriz RLS.', 'draft')
on conflict (id) do nothing;

insert into public.services (id, name, slug, description, status)
values
  ('40000000-0000-4000-8000-000000000001', 'Servicio publicado RLS',
   'rls-check-published', 'Fixture publicado para la matriz RLS.', 'published'),
  ('40000000-0000-4000-8000-000000000002', 'Servicio draft RLS',
   'rls-check-draft', 'Fixture en borrador para la matriz RLS.', 'draft')
on conflict (id) do nothing;

insert into public.content_blocks (id, page, section_key, type, value_text)
values ('50000000-0000-4000-8000-000000000001', 'rls-check', 'matrix.value',
        'text', 'Contenido temporal de la matriz RLS; se elimina al final.')
on conflict (page, section_key) do nothing;

insert into storage.objects (bucket_id, name, owner, metadata)
values ('project-images', 'rls-checks/fixture.png', null, '{}'::jsonb)
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 1. A) Usuario NO-admin no puede auto-promoverse a 'admin'
-- ----------------------------------------------------------------------------
begin;

  set local role authenticated;
  -- auth.uid() puede leer el claim nuevo (request.jwt.claims) o el legado
  -- (request.jwt.claim.sub) según la versión de Supabase; se fijan ambos.
  select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
  select set_config('request.jwt.claims',
    json_build_object('sub', '10000000-0000-4000-8000-000000000001'::text)::text, true);

  -- A1: intentar `set role = 'admin'` sobre la propia fila debe quedar bloqueado
  --     (error de with check, o 0 filas si la policy se endurece aún más).
  do $$
  declare
    v_rows integer := 0;
    v_err  text;
  begin
    begin
      update public.profiles set role = 'admin' where id = auth.uid();
      get diagnostics v_rows = row_count;
    exception when others then
      v_err := sqlerrm;
    end;

    if v_rows = 0 or v_err is not null then
      insert into public._rls_test_results values
        ('A1', 'PASS', coalesce('bloqueado: ' || left(v_err, 80), '0 filas afectadas'));
    else
      insert into public._rls_test_results values
        ('A1', 'FAIL', 'el update afectó ' || v_rows || ' fila(s): el usuario pudo auto-promoverse');
    end if;
  end $$;

  -- A2: el rol persistido sigue siendo 'user' tras el intento.
  do $$
  declare v_role text;
  begin
    select role into v_role from public.profiles where id = auth.uid();
    insert into public._rls_test_results values
      ('A2', case when v_role = 'user' then 'PASS' else 'FAIL' end,
       'rol tras el intento: ' || coalesce(v_role, '(sin fila)'));
  end $$;

  -- A3: tampoco puede alterar el rol de OTRO usuario (fila invisible → 0 filas).
  do $$
  declare v_rows integer;
  begin
    update public.profiles set role = 'user'
    where id = '10000000-0000-4000-8000-000000000002'; -- el admin
    get diagnostics v_rows = row_count;
    insert into public._rls_test_results values
      ('A3', case when v_rows = 0 then 'PASS' else 'FAIL' end,
       'filas afectadas al editar el rol de otro usuario: ' || v_rows);
  end $$;

-- commit (no rollback): los resultados A1-A3 se insertaron en
-- _rls_test_results dentro de esta transacción y deben persistir para el
-- resumen final. Ninguna operación bloqueada llegó a modificar datos.
commit;

-- ----------------------------------------------------------------------------
-- 2. B) NO-admin y anónimo NO pueden borrar contact_messages
-- ----------------------------------------------------------------------------
begin;

  set local role authenticated;
  select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
  select set_config('request.jwt.claims',
    json_build_object('sub', '10000000-0000-4000-8000-000000000001'::text)::text, true);

  do $$
  declare
    v_rows integer := 0;
    v_err  text;
  begin
    begin
      delete from public.contact_messages
      where id = '20000000-0000-4000-8000-000000000001';
      get diagnostics v_rows = row_count;
    exception when others then
      v_err := sqlerrm;
    end;

    if v_rows = 0 or v_err is not null then
      insert into public._rls_test_results values
        ('B1', 'PASS', coalesce('bloqueado: ' || left(v_err, 80), '0 filas borradas'));
    else
      insert into public._rls_test_results values
        ('B1', 'FAIL', 'el delete afectó ' || v_rows || ' fila(s): no-admin pudo borrar mensajes');
    end if;
  end $$;

-- Lo mismo que en A: commit para que B1 sobreviva hasta el resumen.
commit;

begin;

  set local role anon; -- sin claims: auth.uid() = null

  do $$
  declare
    v_rows integer := 0;
    v_err  text;
  begin
    begin
      delete from public.contact_messages
      where id = '20000000-0000-4000-8000-000000000001';
      get diagnostics v_rows = row_count;
    exception when others then
      v_err := sqlerrm;
    end;

    if v_rows = 0 or v_err is not null then
      insert into public._rls_test_results values
        ('B2', 'PASS', coalesce('bloqueado: ' || left(v_err, 80), '0 filas borradas'));
    else
      insert into public._rls_test_results values
        ('B2', 'FAIL', 'el delete afectó ' || v_rows || ' fila(s): anónimo pudo borrar mensajes');
    end if;
  end $$;

commit;

-- ----------------------------------------------------------------------------
-- 3. C) El admin SÍ puede borrar contact_messages
-- ----------------------------------------------------------------------------
begin;

  set local role authenticated;
  select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
  select set_config('request.jwt.claims',
    json_build_object('sub', '10000000-0000-4000-8000-000000000002'::text)::text, true);

  do $$
  declare
    v_rows integer := 0;
    v_err  text;
  begin
    begin
      delete from public.contact_messages
      where id = '20000000-0000-4000-8000-000000000001';
      get diagnostics v_rows = row_count;
    exception when others then
      v_err := sqlerrm;
    end;

    if v_rows = 1 then
      insert into public._rls_test_results values
        ('C1', 'PASS', 'mensaje eliminado (1 fila)');
    else
      insert into public._rls_test_results values
        ('C1', 'FAIL', coalesce('error: ' || left(v_err, 80),
                               'filas borradas: ' || v_rows || ' (se esperaba 1)'));
    end if;
  end $$;

commit;

-- C2: verificación independiente (rol postgres): el mensaje ya no existe.
insert into public._rls_test_results
select 'C2',
       case when count(*) = 0 then 'PASS' else 'FAIL' end,
       'filas restantes del mensaje de prueba: ' || count(*)
from public.contact_messages
where id = '20000000-0000-4000-8000-000000000001';

-- ----------------------------------------------------------------------------
-- 4. D) Matriz de lectura: qué ve cada rol en projects/services/content_blocks
--      (los drafts deben ser invisibles para anon/user y visibles para admin)
-- ----------------------------------------------------------------------------
begin;
  set local role anon;

  select public._rls_check_select('D1',
    'select * from public.projects where slug = ''rls-check-published''', 1);
  select public._rls_check_select('D2',
    'select * from public.projects where slug = ''rls-check-draft''', 0);
  select public._rls_check_select('D5',
    'select * from public.services where slug = ''rls-check-published''', 1);
  select public._rls_check_select('D6',
    'select * from public.services where slug = ''rls-check-draft''', 0);
  select public._rls_check_select('D9',
    'select * from public.content_blocks where page = ''rls-check''', 1);
commit;

begin;
  set local role authenticated;
  select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
  select set_config('request.jwt.claims',
    json_build_object('sub', '10000000-0000-4000-8000-000000000001'::text)::text, true);

  select public._rls_check_select('D3',
    'select * from public.projects where slug = ''rls-check-published''', 1);
  select public._rls_check_select('D4',
    'select * from public.projects where slug = ''rls-check-draft''', 0);
  select public._rls_check_select('D7',
    'select * from public.services where slug = ''rls-check-published''', 1);
  select public._rls_check_select('D8',
    'select * from public.services where slug = ''rls-check-draft''', 0);
  select public._rls_check_select('D10',
    'select * from public.content_blocks where page = ''rls-check''', 1);
commit;

begin;
  set local role authenticated;
  select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
  select set_config('request.jwt.claims',
    json_build_object('sub', '10000000-0000-4000-8000-000000000002'::text)::text, true);

  -- El admin ve hasta los drafts (policy for all + using is_admin()).
  select public._rls_check_select('D11',
    'select * from public.projects where slug = ''rls-check-draft''', 1);
  select public._rls_check_select('D12',
    'select * from public.services where slug = ''rls-check-draft''', 1);
  select public._rls_check_select('D13',
    'select * from public.content_blocks where page = ''rls-check''', 1);
commit;

-- ----------------------------------------------------------------------------
-- 5. E) Escritura projects: anon/user bloqueados; admin con CRUD completo
-- ----------------------------------------------------------------------------
begin;
  set local role anon;

  select public._rls_check_blocked('E1',
    'insert into public.projects (title, slug, description, status)
     values (''Intento anónimo'', ''rls-check-intento-anon'', ''no debe insertarse'', ''published'')');
  select public._rls_check_blocked('E2',
    'update public.projects set title = ''Hackeado'' where slug = ''rls-check-published''');
  select public._rls_check_blocked('E3',
    'delete from public.projects where slug = ''rls-check-published''');
commit;

begin;
  set local role authenticated;
  select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
  select set_config('request.jwt.claims',
    json_build_object('sub', '10000000-0000-4000-8000-000000000001'::text)::text, true);

  select public._rls_check_blocked('E4',
    'insert into public.projects (title, slug, description, status)
     values (''Intento user'', ''rls-check-intento-user'', ''no debe insertarse'', ''published'')');
  select public._rls_check_blocked('E5',
    'update public.projects set title = ''Hackeado'' where slug = ''rls-check-published''');
  select public._rls_check_blocked('E6',
    'delete from public.projects where slug = ''rls-check-published''');
commit;

begin;
  set local role authenticated;
  select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
  select set_config('request.jwt.claims',
    json_build_object('sub', '10000000-0000-4000-8000-000000000002'::text)::text, true);

  select public._rls_check_exact('E7',
    'insert into public.projects (title, slug, description, status)
     values (''Proyecto admin RLS'', ''rls-check-admin-proj'', ''Creado por el check E7.'', ''published'')', 1);
  select public._rls_check_exact('E8',
    'update public.projects set title = ''Proyecto admin RLS (editado)''
     where slug = ''rls-check-admin-proj''', 1);
  select public._rls_check_exact('E9',
    'delete from public.projects where slug = ''rls-check-admin-proj''', 1);
commit;

-- E10: verificación independiente (rol postgres): el proyecto admin ya no existe.
insert into public._rls_test_results
select 'E10', case when count(*) = 0 then 'PASS' else 'FAIL' end,
       'filas restantes del proyecto admin: ' || count(*)
from public.projects where slug = 'rls-check-admin-proj';

-- ----------------------------------------------------------------------------
-- 6. F) Escritura services: anon/user bloqueados; admin con CRUD completo
-- ----------------------------------------------------------------------------
begin;
  set local role anon;

  select public._rls_check_blocked('F1',
    'insert into public.services (name, slug, description, status)
     values (''Intento anónimo'', ''rls-check-intento-anon'', ''no debe insertarse'', ''published'')');
  select public._rls_check_blocked('F2',
    'update public.services set name = ''Hackeado'' where slug = ''rls-check-published''');
  select public._rls_check_blocked('F3',
    'delete from public.services where slug = ''rls-check-published''');
commit;

begin;
  set local role authenticated;
  select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
  select set_config('request.jwt.claims',
    json_build_object('sub', '10000000-0000-4000-8000-000000000001'::text)::text, true);

  select public._rls_check_blocked('F4',
    'insert into public.services (name, slug, description, status)
     values (''Intento user'', ''rls-check-intento-user'', ''no debe insertarse'', ''published'')');
  select public._rls_check_blocked('F5',
    'update public.services set name = ''Hackeado'' where slug = ''rls-check-published''');
  select public._rls_check_blocked('F6',
    'delete from public.services where slug = ''rls-check-published''');
commit;

begin;
  set local role authenticated;
  select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
  select set_config('request.jwt.claims',
    json_build_object('sub', '10000000-0000-4000-8000-000000000002'::text)::text, true);

  select public._rls_check_exact('F7',
    'insert into public.services (name, slug, description, status)
     values (''Servicio admin RLS'', ''rls-check-admin-svc'', ''Creado por el check F7.'', ''published'')', 1);
  select public._rls_check_exact('F8',
    'update public.services set name = ''Servicio admin RLS (editado)''
     where slug = ''rls-check-admin-svc''', 1);
  select public._rls_check_exact('F9',
    'delete from public.services where slug = ''rls-check-admin-svc''', 1);
commit;

-- F10: verificación independiente (rol postgres): el servicio admin ya no existe.
insert into public._rls_test_results
select 'F10', case when count(*) = 0 then 'PASS' else 'FAIL' end,
       'filas restantes del servicio admin: ' || count(*)
from public.services where slug = 'rls-check-admin-svc';

-- ----------------------------------------------------------------------------
-- 7. G) Escritura content_blocks: anon/user bloqueados; admin CRUD completo
-- ----------------------------------------------------------------------------
begin;
  set local role anon;

  select public._rls_check_blocked('G1',
    'insert into public.content_blocks (page, section_key, type, value_text)
     values (''rls-check'', ''matrix.intento-anon'', ''text'', ''no debe insertarse'')');
  select public._rls_check_blocked('G2',
    'update public.content_blocks set value_text = ''Hackeado'' where page = ''rls-check''');
  select public._rls_check_blocked('G3',
    'delete from public.content_blocks where page = ''rls-check''');
commit;

begin;
  set local role authenticated;
  select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
  select set_config('request.jwt.claims',
    json_build_object('sub', '10000000-0000-4000-8000-000000000001'::text)::text, true);

  select public._rls_check_blocked('G4',
    'insert into public.content_blocks (page, section_key, type, value_text)
     values (''rls-check'', ''matrix.intento-user'', ''text'', ''no debe insertarse'')');
  select public._rls_check_blocked('G5',
    'update public.content_blocks set value_text = ''Hackeado'' where page = ''rls-check''');
  select public._rls_check_blocked('G6',
    'delete from public.content_blocks where page = ''rls-check''');
commit;

begin;
  set local role authenticated;
  select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
  select set_config('request.jwt.claims',
    json_build_object('sub', '10000000-0000-4000-8000-000000000002'::text)::text, true);

  select public._rls_check_exact('G7',
    'insert into public.content_blocks (page, section_key, type, value_text)
     values (''rls-check'', ''matrix.admin'', ''text'', ''Creado por el check G7.'')', 1);
  select public._rls_check_exact('G8',
    'update public.content_blocks set value_text = ''Editado por G8''
     where page = ''rls-check'' and section_key = ''matrix.admin''', 1);
  select public._rls_check_exact('G9',
    'delete from public.content_blocks
     where page = ''rls-check'' and section_key = ''matrix.admin''', 1);
commit;

-- G10: verificación independiente (rol postgres): el bloque admin ya no existe.
insert into public._rls_test_results
select 'G10', case when count(*) = 0 then 'PASS' else 'FAIL' end,
       'filas restantes del bloque admin: ' || count(*)
from public.content_blocks where page = 'rls-check' and section_key = 'matrix.admin';

-- ----------------------------------------------------------------------------
-- 8. H) Storage objects: lectura pública para todos; escritura solo admin
-- ----------------------------------------------------------------------------
begin;
  set local role anon;

  select public._rls_check_select('H1',
    'select * from storage.objects
     where bucket_id = ''project-images'' and name = ''rls-checks/fixture.png''', 1);
  select public._rls_check_blocked('H4',
    'insert into storage.objects (bucket_id, name, owner, metadata)
     values (''project-images'', ''rls-checks/anon.png'', null, ''{}''::jsonb)');
  select public._rls_check_blocked('H7',
    'update storage.objects set metadata = ''{"hack": true}''::jsonb
     where bucket_id = ''project-images'' and name = ''rls-checks/fixture.png''');
  select public._rls_check_blocked('H10',
    'delete from storage.objects
     where bucket_id = ''project-images'' and name = ''rls-checks/fixture.png''');
commit;

begin;
  set local role authenticated;
  select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
  select set_config('request.jwt.claims',
    json_build_object('sub', '10000000-0000-4000-8000-000000000001'::text)::text, true);

  select public._rls_check_select('H2',
    'select * from storage.objects
     where bucket_id = ''project-images'' and name = ''rls-checks/fixture.png''', 1);
  select public._rls_check_blocked('H5',
    'insert into storage.objects (bucket_id, name, owner, metadata)
     values (''project-images'', ''rls-checks/user.png'', null, ''{}''::jsonb)');
  select public._rls_check_blocked('H8',
    'update storage.objects set metadata = ''{"hack": true}''::jsonb
     where bucket_id = ''project-images'' and name = ''rls-checks/fixture.png''');
  select public._rls_check_blocked('H11',
    'delete from storage.objects
     where bucket_id = ''project-images'' and name = ''rls-checks/fixture.png''');
commit;

begin;
  set local role authenticated;
  select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
  select set_config('request.jwt.claims',
    json_build_object('sub', '10000000-0000-4000-8000-000000000002'::text)::text, true);

  select public._rls_check_select('H3',
    'select * from storage.objects
     where bucket_id = ''project-images'' and name = ''rls-checks/fixture.png''', 1);
  select public._rls_check_exact('H6',
    'insert into storage.objects (bucket_id, name, owner, metadata)
     values (''project-images'', ''rls-checks/admin-insert.png'', null, ''{}''::jsonb)', 1);
  select public._rls_check_exact('H9',
    'update storage.objects set metadata = ''{"size": 2}''::jsonb
     where bucket_id = ''project-images'' and name = ''rls-checks/fixture.png''', 1);
  select public._rls_check_exact('H12',
    'delete from storage.objects
     where bucket_id = ''project-images'' and name = ''rls-checks/fixture.png''', 1);
commit;

-- H13: verificación independiente (rol postgres): el fixture ya no existe.
insert into public._rls_test_results
select 'H13', case when count(*) = 0 then 'PASS' else 'FAIL' end,
       'objetos restantes del fixture: ' || count(*)
from storage.objects
where bucket_id = 'project-images' and name = 'rls-checks/fixture.png';

-- ----------------------------------------------------------------------------
-- 9. Resumen y limpieza
-- ----------------------------------------------------------------------------
select * from public._rls_test_results order by check_id;

-- Limpieza: borra los usuarios de prueba (cascade a profiles vía FK), el
-- mensaje si quedara, los fixtures de la matriz, los objetos de storage de
-- prueba, los helpers y la tabla de resultados.
delete from auth.users
where id in ('10000000-0000-4000-8000-000000000001',
             '10000000-0000-4000-8000-000000000002');
delete from public.contact_messages
where id = '20000000-0000-4000-8000-000000000001';
delete from public.projects
where id in ('30000000-0000-4000-8000-000000000001',
             '30000000-0000-4000-8000-000000000002')
   or slug like 'rls-check-%';
delete from public.services
where id in ('40000000-0000-4000-8000-000000000001',
             '40000000-0000-4000-8000-000000000002')
   or slug like 'rls-check-%';
delete from public.content_blocks where page = 'rls-check';
delete from storage.objects
where bucket_id in ('project-images', 'service-images', 'content-images')
  and name like 'rls-checks/%';
drop function if exists public._rls_check_select(text, text, int);
drop function if exists public._rls_check_blocked(text, text);
drop function if exists public._rls_check_exact(text, text, int);
drop table if exists public._rls_test_results;
