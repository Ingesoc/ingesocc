-- ============================================================================
-- Ingesocc SAS — 0006: corrección de public.admin_save_project
-- Depende de 20260917000000 (tablas e is_admin()), 20260917000001 (RLS) y
-- 20260917000004 (firma original de la RPC).
--
-- POR QUÉ EXISTE ESTA MIGRACIÓN
-- El panel llama a `admin_save_project` desde
-- `projects.service.ts → saveProjectAtomic()` (una sola transacción: proyecto +
-- imágenes + categorías). Con esa función ausente en la base de datos, PostgREST
-- responde PGRST202 y NADA se puede guardar desde /admin/proyectos. La función
-- solo vivía en 20260917000004, que nunca se aplicó a los proyectos remotos
-- (el remoto se provisionó con el antiguo `schema.sql`, ya convertido en stub).
--
-- Esta migración NO cambia la firma: son los mismos 10 parámetros, los mismos
-- tipos y el mismo `returns table`. Por eso `create or replace function` basta
-- (misma firma de entrada y de salida) y no hace falta `drop function`: ninguna
-- dependencia, ningún grant y ningún cliente se rompen al aplicarla. Es la
-- versión canónica a partir de ahora; 0004 queda como historial.
--
-- QUÉ CORRIGE (sin cambiar el diseño ni el contrato del panel)
--
-- 1. `p_image_rows` llega como `jsonb`. El cliente canónico envía un ARRAY JSON,
--    pero el panel anterior enviaba `JSON.stringify(...)`, es decir, un escalar
--    JSON de tipo string. `jsonb_array_elements()` sobre un escalar aborta con
--    "cannot extract elements from a scalar": aunque la función existiera, la
--    primera imagen habría tumbado el guardado. Ahora se normaliza el lote:
--    array (canónico) o string con el JSON dentro (clientes previos). El
--    frontend se corrige en el mismo cambio para enviar el array directo
--    (`projects.service.ts`), y esta tolerancia evita romper sesiones abiertas
--    con el bundle anterior mientras se despliega.
--
-- 2. El diff de imágenes usaba una TEMP TABLE (`on commit drop`). Se sustituye
--    por CTEs: el lote se normaliza y deduplica UNA vez en un `jsonb` y cada
--    sentencia posterior lo lee con `jsonb_to_recordset`. Sin estado de sesión,
--    sin dependencia del privilegio TEMP del rol `authenticated` y sin el
--    `delete from _incoming_images` de limpieza.
--
-- 3. Duplicados: si el mismo `storage_path` llega dos veces (la misma foto
--    reenviada, o una entrada con id y otra sin id), antes se insertaban dos
--    filas. Ahora gana la que trae `id` (es la fila real) y, a igualdad, la
--    primera del lote.
--
-- 4. Portada: si el lote no marca ninguna `is_cover` (cliente antiguo o datos
--    inconsistentes), la imagen de menor `sort_order` la asume; si marcara
--    varias, solo gana la de menor `sort_order`. Nunca quedan dos portadas ni
--    un proyecto sin portada por un descuido del cliente.
--
-- 5. Autorización: `SECURITY INVOKER` + RLS (que sigue mandando) y un check
--    explícito de `public.is_admin()` al inicio para fallar con un mensaje
--    claro (`42501`) en vez de con un "new row violates row-level security
--    policy" a media transacción. Mismo mecanismo de siempre: el rol vive en
--    `profiles` y solo lo asigna SQL, nunca el cliente.
--
-- COMPATIBILIDAD (no se pierde nada existente)
-- * `storage_path` sigue siendo texto libre: conviven `secure_url` de Cloudinary,
--   rutas del bucket legacy (`<project_id>/<uuid>.jpg`) y URLs externas
--   antiguas (unsplash, etc.). La RPC no interpreta ni valida la referencia.
-- * Las imágenes que no vienen en el lote se BORRAN de `project_images` y su
--   `storage_path` se devuelve en `orphan_storage_paths` para que el cliente
--   limpe el asset (Storage y Cloudinary no son transaccionales con la DB).
-- * No se toca ninguna tabla, columna ni dato: la migración solo (re)define la
--   función y sus permisos.
--
-- Idempotente: `create or replace` + `revoke`/`grant` explícitos, se puede
-- aplicar más de una vez sin efectos acumulativos.
-- ============================================================================

create or replace function public.admin_save_project(
  p_project_id uuid,                -- null = genera el servidor; uuid nuevo = crear
                                    -- con ese id (permite subir imágenes al prefijo
                                    -- ANTES del RPC); uuid existente = actualizar
  p_title text,
  p_slug text,
  p_description text,
  p_price_min_wages numeric,
  p_status text,
  p_featured boolean,
  p_sort_order int,
  p_category_ids uuid[],
  p_image_rows jsonb                -- [{id?, storage_path, is_cover, sort_order}]
                                    --   con id    → update (orden/portada)
                                    --   sin id    → insert (imagen recién subida)
                                    --   ausente   → su fila se BORRA
  -- NOTA: borrar imágenes ya no exige pasar todos los ítems no eliminados;
  -- cualquier fila del proyecto que no venga en p_image_rows se elimina.
)
returns table (
  project_id uuid,
  orphan_storage_paths text[]
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_project uuid;
  v_input jsonb;   -- p_image_rows tal cual llega
  v_rows jsonb;    -- lote normalizado (array) y deduplicado
  v_orphans text[] := '{}'::text[];
  v_cover uuid;
begin
  -- ------------------------------------------------------------------ auth
  -- SECURITY INVOKER + RLS ya impedían la escritura a un no-admin; el check
  -- explícito solo convierte ese fallo en un error legible y corta antes de
  -- tocar nada. Misma fuente de verdad que el resto de la app: public.is_admin().
  if auth.uid() is null or not public.is_admin() then
    raise exception 'admin_save_project: se requiere un usuario autenticado con rol admin'
      using errcode = '42501';
  end if;

  -- --------------------------------------------------- normaliza p_image_rows
  -- Acepta el array JSON (canónico) y el string JSON-encoded que enviaba el
  -- cliente anterior. Cualquier otra forma es un error de contrato explícito.
  v_input := coalesce(p_image_rows, '[]'::jsonb);

  if jsonb_typeof(v_input) = 'string' then
    begin
      v_input := (v_input #>> '{}')::jsonb;
    exception
      when others then
        raise exception 'admin_save_project: p_image_rows no contiene un JSON válido'
          using errcode = '22P02';
    end;
  end if;

  if jsonb_typeof(v_input) <> 'array' then
    raise exception 'admin_save_project: p_image_rows debe ser un array de imágenes'
      using errcode = '22023';
  end if;

  -- Normaliza y deduplica UNA vez: descarta entradas sin storage_path, quita
  -- duplicados por referencia (gana la que trae id) y deja el lote ordenado por
  -- sort_order para que las sentencias siguientes solo tengan que leerlo.
  select coalesce(jsonb_agg(to_jsonb(k) order by k.sort_order, k.image_id nulls last), '[]'::jsonb)
  into v_rows
  from (
    select image_id, storage_path, is_cover, sort_order
    from (
      select
        nullif(btrim(img->>'id'), '')::uuid         as image_id,
        btrim(img->>'storage_path')                  as storage_path,
        coalesce((img->>'is_cover')::boolean, false) as is_cover,
        coalesce((img->>'sort_order')::int, 0)       as sort_order,
        row_number() over (
          partition by btrim(img->>'storage_path')
          order by (nullif(btrim(img->>'id'), '') is not null) desc, ord
        )                                           as rn
      from jsonb_array_elements(v_input) with ordinality as t(img, ord)
      where nullif(btrim(img->>'storage_path'), '') is not null
    ) r
    where r.rn = 1
  ) k;

  -- ------------------------------------------------------------------ upsert
  -- Un solo statement: si el id no existe hace INSERT y si existe hace UPDATE
  -- (el trigger projects_set_updated_at sigue firmando updated_at).
  insert into public.projects (id, title, slug, description, price_min_wages,
                               status, featured, sort_order)
  values (coalesce(p_project_id, gen_random_uuid()),
          p_title, p_slug, p_description, p_price_min_wages,
          p_status, p_featured, p_sort_order)
  on conflict (id) do update
    set title = excluded.title,
        slug = excluded.slug,
        description = excluded.description,
        price_min_wages = excluded.price_min_wages,
        status = excluded.status,
        featured = excluded.featured,
        sort_order = excluded.sort_order
  returning id into v_project;

  -- ------------------------------------------------------ imágenes (diff)
  -- Delete de lo que no viene en el lote + recolección de sus paths en el
  -- MISMO statement (CTE con RETURNING). Los paths se devuelven para que el
  -- cliente borre el asset DESPUÉS de que la transacción haya commiteado.
  with incoming as (
    select image_id, storage_path
    from jsonb_to_recordset(v_rows) as x(image_id uuid, storage_path text)
  ),
  removed as (
    delete from public.project_images pi
    where pi.project_id = v_project
      and not exists (
        select 1 from incoming i
        where i.image_id = pi.id
           or (i.image_id is null and i.storage_path = pi.storage_path)
      )
    returning pi.storage_path
  )
  select coalesce(array_agg(r.storage_path), '{}'::text[])
  into v_orphans
  from removed r;

  -- Update de existentes (orden y portada). El id va atado al proyecto: un id
  -- ajeno no se toca (y no se inserta, porque solo se insertan los sin id).
  update public.project_images pi
     set sort_order = i.sort_order,
         is_cover = i.is_cover
  from jsonb_to_recordset(v_rows) as i(image_id uuid, storage_path text,
                                       is_cover boolean, sort_order int)
  where i.image_id is not null
    and pi.id = i.image_id
    and pi.project_id = v_project;

  -- Insert de nuevos (sin id): la fila la crea el RPC, no el cliente, para
  -- cerrar la ventana "archivo subido sin fila en DB" (diagnóstico #8): si el
  -- upload funcionó y el RPC falla, el cliente borra el archivo y no queda nada
  -- huérfano.
  -- El `not exists` cubre el caso en que una imagen llega sin id pero con una
  -- referencia que YA está en el proyecto: esa fila se conserva arriba (el
  -- borrado la protegió) y aquí no se duplica.
  insert into public.project_images (project_id, storage_path, is_cover, sort_order)
  select v_project, i.storage_path, i.is_cover, i.sort_order
  from jsonb_to_recordset(v_rows) as i(image_id uuid, storage_path text,
                                       is_cover boolean, sort_order int)
  where i.image_id is null
    and not exists (
      select 1 from public.project_images pi
      where pi.project_id = v_project and pi.storage_path = i.storage_path
    );

  -- Portada única: se elige sobre el estado FINAL (ya insertadas las nuevas, que
  -- aún no tienen id del cliente). Primero la que venga marcada; si el lote no
  -- marcó ninguna, la de menor sort_order. El where evita el update si el
  -- estado ya era correcto.
  select pi.id
  into v_cover
  from public.project_images pi
  where pi.project_id = v_project
  order by pi.is_cover desc, pi.sort_order, pi.id
  limit 1;

  if v_cover is not null then
    update public.project_images pi
       set is_cover = (pi.id = v_cover)
     where pi.project_id = v_project
       and pi.is_cover is distinct from (pi.id = v_cover);
  end if;

  -- ------------------------------------------------------- categorías
  -- Delete + insert dentro de la MISMA transacción: si el insert falla
  -- (uuid inválido, sin permisos), el delete también se revierte.
  delete from public.project_categories pc where pc.project_id = v_project;

  if cardinality(p_category_ids) > 0 then
    insert into public.project_categories (project_id, category_id)
    select v_project, cid
    from unnest(p_category_ids) as cid
    where exists (select 1 from public.categories c where c.id = cid)
    on conflict do nothing;
  end if;

  return query select v_project, v_orphans;
end;
$$;

-- EXECUTE solo a usuarios autenticados; anon ni siquiera puede llamarla.
-- (Idempotente: se revoca antes de conceder.)
revoke execute on function public.admin_save_project(uuid, text, text, text, numeric, text, boolean, int, uuid[], jsonb)
  from public, anon;
grant execute on function public.admin_save_project(uuid, text, text, text, numeric, text, boolean, int, uuid[], jsonb)
  to authenticated;
