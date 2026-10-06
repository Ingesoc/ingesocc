-- ============================================================================
-- Ingesocc SAS — 0010: ubicación del proyecto y metadatos por imagen
--
-- QUÉ RESUELVE
-- 1. `projects.location` (text, null): dónde está la OBRA. Es información del
--    proyecto y NO la dirección de la empresa, que vive en content_blocks
--    (`contact.address`). Sin esta columna, la ubicación de cada obra solo
--    existía dentro del párrafo de `description`, donde no se puede filtrar,
--    editar ni mostrar en la ficha del proyecto.
--
-- 2. Metadatos por imagen en `project_images`: `alt`, `title`, `description` y
--    `category`, todos null. Hasta ahora cada imagen se renderizaba con
--    `[alt]="project.title"`, así que una galería de 7 fotos producía 7 alts
--    idénticos: inaccesible y, además, inútil como contenido.
--    Los cuatro campos son OPCIONALES a propósito (sin invención de contenido):
--    vacío = la vista cae a un texto neutro derivado del nombre del proyecto.
--
-- POR QUÉ UNA MIGRACIÓN NUEVA Y NO UN CAMBIO EN LAS ANTERIORES
-- Este archivo es aditivo e idempotente. Las migraciones ya aplicadas no se
-- tocan (el remoto ya las ejecutó); la versión canónica de la RPC sigue siendo
-- 20260917000005 y esta la amplía.
--
-- COMPATIBILIDAD DE LA RPC (punto delicado)
-- La RPC de 20260917000005 tiene 10 parámetros. Añadir `p_location` como
-- undécimo cambia la FIRMA, y `create or replace` no puede alterar los
-- parámetros de entrada: Postgres la rechazaría. Peor: si se eliminara la
-- versión de 10 parámetros, cualquier sesión de admin con el bundle anterior
-- en el navegador empezaría a recibir PGRST202 al guardar.
--
-- Solución: se defines DOS funciones.
--   * 11 parámetros (uuid, text, text, text, text, numeric, text, boolean,
--     int, uuid[], jsonb, text) -> versión canónica; escribe location.
--   * 10 parámetros -> envoltorio que delega en la de 11 con location NULL.
-- Se conservan AMBAS. Postgres resuelve por nombre de parámetro, así que
-- PostgREST despacha cada llamada a la versión que corresponda al bundle que
-- la hizo: los clientes viejos siguen funcionando (guardan sin tocar location)
-- y los nuevos escriben la columna. Cuando ning cliente antiguo quede abierto,
-- la versión de 10 parámetros puede retirarse en una migración posterior.
--
-- RLS: no se crean tablas ni políticas nuevas. `project_images` y `projects`
-- ya tienen select público (solo `status = 'published'` en projects) y
-- escritura restringida al rol admin vía `is_admin()`. Añadir columnas no
-- cambia ese acceso: sigue sin haber ninguna escritura pública.
-- Los metadatos son texto plano y los renderiza Angular con interpolación
-- (escapado por defecto); no se inyecta HTML.
--
-- Idempotente: `add column if not exists` + create or replace + grants.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Ubicación de la obra (columna, no tabla nueva)
-- ----------------------------------------------------------------------------
alter table public.projects
  add column if not exists location text;

comment on column public.projects.location is
  'Ubicación de la obra (p. ej. "Vía Quimbaya - Alcalá, Vereda Jazmín, Quimbaya, Quindío"). '
  'Distinto de la dirección corporativa, que vive en content_blocks (contact.address). '
  'Null = sin ubicación registrada.';

-- ----------------------------------------------------------------------------
-- 2. Metadatos por imagen
-- ----------------------------------------------------------------------------
alter table public.project_images
  add column if not exists alt text,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists category text;

comment on column public.project_images.alt is
  'Texto alternativo de la imagen. Es lo que lee un lector de pantalla; si está vacío la vista usa un texto neutro. '
  'Describe la imagen, no el proyecto entero.';
comment on column public.project_images.title is
  'Título visible de la imagen en la galería/lightbox. Null = sin título.';
comment on column public.project_images.description is
  'Descripción visible de la imagen. Null = sin descripción. No se inventa contenido: lo diligencia el admin.';
comment on column public.project_images.category is
  'Categoría libre de la imagen (p. ej. "Urbanismo", "Estructura"). Sin catálogo propio a propósito: '
  'es un agrupamiento editorial, no un filtro del portafolio.';

-- ----------------------------------------------------------------------------
-- 3. RPC canónica (11 parámetros): añade p_location y persiste los metadatos
--    de imagen dentro de p_image_rows (sin cambiar ese parámetro: ya es jsonb
--    libre, así que la firma de entrada del lote no cambia).
-- ----------------------------------------------------------------------------
create or replace function public.admin_save_project(
  p_project_id uuid,
  p_title text,
  p_slug text,
  p_description text,
  p_location text,                      -- NUEVO: ubicación de la obra.
                                         --   null  = NO CAMBIAR (lo envía el envoltorio de
                                         --           compatibilidad; así un bundle viejo
                                         --           no borra la ubicación ya guardada)
                                         --   ''    = dejarla vacía a propósito
                                         --   texto  = guardar ese valor
  p_price_min_wages numeric,
  p_status text,
  p_featured boolean,
  p_sort_order int,
  p_category_ids uuid[],
  p_image_rows jsonb                    -- [{id?, storage_path, is_cover, sort_order,
                                         --    alt?, title?, description?, category?}]
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
  v_input jsonb;
  v_rows jsonb;
  v_orphans text[] := '{}'::text[];
  v_cover uuid;
begin
  -- SECURITY INVOKER + RLS siguen siendo la frontera real; el check solo
  -- convierte el fallo en un mensaje legible (42501) en vez de un error de RLS
  -- a media transacción. Misma fuente de verdad que el resto de la app.
  if auth.uid() is null or not public.is_admin() then
    raise exception 'admin_save_project: se requiere un usuario autenticado con rol admin'
      using errcode = '42501';
  end if;

  -- --------------------------------------------------- normaliza p_image_rows
  -- Array JSON (canónico) o string JSON-encoded (clientes previos). Cualquier
  -- otra forma es un error de contrato explícito.
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

  -- Normaliza y deduplica UNA vez. Además de id/storage_path/is_cover/sort_order
  -- conserva los cuatro metadatos; null explícito = "sin valor", y '' se
  -- normaliza a null para que un campo vacío del admin no se guarde como texto
  -- en blanco. Deduplica por storage_path (gana la entrada con id).
  select coalesce(jsonb_agg(to_jsonb(k) order by k.sort_order, k.image_id nulls last), '[]'::jsonb)
  into v_rows
  from (
    select image_id, storage_path, is_cover, sort_order, alt, title, description, category
    from (
      select
        nullif(btrim(img->>'id'), '')::uuid         as image_id,
        btrim(img->>'storage_path')                  as storage_path,
        coalesce((img->>'is_cover')::boolean, false) as is_cover,
        coalesce((img->>'sort_order')::int, 0)       as sort_order,
        nullif(btrim(img->>'alt'), '')               as alt,
        nullif(btrim(img->>'title'), '')             as title,
        nullif(btrim(img->>'description'), '')       as description,
        nullif(btrim(img->>'category'), '')          as category,
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
  -- p_location NULL = "no tocar" (ver el comentario del parámetro): en el
  -- INSERT no hay fila previa, así que se guarda NULL; en el UPDATE se conserva
  -- el valor actual. Solo un '' explícito vacía el campo.
  insert into public.projects (id, title, slug, description, location,
                               price_min_wages, status, featured, sort_order)
  values (coalesce(p_project_id, gen_random_uuid()),
          p_title, p_slug, p_description, nullif(btrim(p_location), ''),
          p_price_min_wages, p_status, p_featured, p_sort_order)
  on conflict (id) do update
    set title = excluded.title,
        slug = excluded.slug,
        description = excluded.description,
        location = case
                     when p_location is null then public.projects.location
                     else nullif(btrim(p_location), '')
                   end,
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

  -- Update de existentes: orden, portada y metadatos. El id va atado al
  -- proyecto: un id ajeno no se toca (ni se inserta, porque solo se insertan
  -- los sin id). Los metadatos vienen del lote, así que un cliente antiguo que
  -- no los envíe los deja en NULL (no pisa lo ya guardado con texto vacío).
  update public.project_images pi
     set sort_order = i.sort_order,
         is_cover = i.is_cover,
         alt = coalesce(i.alt, pi.alt),
         title = coalesce(i.title, pi.title),
         description = coalesce(i.description, pi.description),
         category = coalesce(i.category, pi.category)
  from jsonb_to_recordset(v_rows) as i(image_id uuid, storage_path text,
                                       is_cover boolean, sort_order int,
                                       alt text, title text,
                                       description text, category text)
  where i.image_id is not null
    and pi.id = i.image_id
    and pi.project_id = v_project;

  -- Insert de nuevos (sin id): la fila la crea el RPC, no el cliente, para
  -- cerrar la ventana "archivo subido sin fila en DB". El `not exists` evita
  -- duplicar una referencia que ya está en el proyecto.
  insert into public.project_images (project_id, storage_path, is_cover, sort_order,
                                      alt, title, description, category)
  select v_project, i.storage_path, i.is_cover, i.sort_order,
         i.alt, i.title, i.description, i.category
  from jsonb_to_recordset(v_rows) as i(image_id uuid, storage_path text,
                                       is_cover boolean, sort_order int,
                                       alt text, title text,
                                       description text, category text)
  where i.image_id is null
    and not exists (
      select 1 from public.project_images pi
      where pi.project_id = v_project and pi.storage_path = i.storage_path
    );

  -- Portada única, decidida sobre el estado FINAL (ya insertadas las nuevas,
  -- que aún no tienen id del cliente). Primero la marcada; si el lote no marcó
  -- ninguna, la de menor sort_order. Nunca quedan dos portadas ni un proyecto
  -- sin portada.
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

-- ----------------------------------------------------------------------------
-- 4. RPC de compatibilidad (10 parámetros): delega en la de 11 con
--    location NULL, para que los bundles ya abiertos sigan guardando.
--    No reimplementa la lógica: si algo cambia arriba, cambia abajo.
-- ----------------------------------------------------------------------------
create or replace function public.admin_save_project(
  p_project_id uuid,
  p_title text,
  p_slug text,
  p_description text,
  p_price_min_wages numeric,
  p_status text,
  p_featured boolean,
  p_sort_order int,
  p_category_ids uuid[],
  p_image_rows jsonb
)
returns table (
  project_id uuid,
  orphan_storage_paths text[]
)
language plpgsql
security invoker
set search_path = public
as $$
begin
  return query
    select * from public.admin_save_project(
      p_project_id, p_title, p_slug, p_description, null, p_price_min_wages,
      p_status, p_featured, p_sort_order, p_category_ids, p_image_rows
    );
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. Permisos: EXECUTE solo a usuarios autenticados; anon ni siquiera puede
--    llamarlas. Ambas versiones, cada una con su firma exacta.
--    (Idempotente: se revoca antes de conceder.)
-- ----------------------------------------------------------------------------
revoke execute on function public.admin_save_project(uuid, text, text, text, numeric, text, boolean, int, uuid[], jsonb)
  from public, anon;
grant execute on function public.admin_save_project(uuid, text, text, text, numeric, text, boolean, int, uuid[], jsonb)
  to authenticated;

revoke execute on function public.admin_save_project(uuid, text, text, text, text, numeric, text, boolean, int, uuid[], jsonb)
  from public, anon;
grant execute on function public.admin_save_project(uuid, text, text, text, text, numeric, text, boolean, int, uuid[], jsonb)
  to authenticated;

-- ----------------------------------------------------------------------------
-- 6. Semilla: ubicación real de La Holanda (dato verificado del micrositio).
--    Es la UBICACIÓN DE LA OBRA. La dirección corporativa de Ingesocc
--    (Armenia, km 6 vía La Tebaida) sigue en content_blocks.contact.address y
--    no se toca aquí: son dos datos distintos y no deben mezclarse.
-- ----------------------------------------------------------------------------
update public.projects
   set location = 'Vía Quimbaya - Alcalá, Vereda Jazmín, Quimbaya, Quindío'
 where slug = 'la-holanda'
   and (location is null or btrim(location) = '');
