-- ============================================================================
-- Ingesocc SAS — 0007: enlaces externos de proyecto (projects.external_url)
-- Depende de 20260917000000 (tablas), 20260917000001 (RLS) y
-- 20260917000005 (versión canónica de public.admin_save_project).
--
-- QUÉ HACE
-- 1. `projects.external_url` (text, nullable): enlace público opcional de un
--    proyecto (p. ej. el micrositio oficial de La Holanda). Genérico a
--    propósito: cualquier proyecto futuro con micrositio lo reutiliza sin
--    cambios de código. NULL = proyecto sin enlace externo (comportamiento
--    idéntico al actual).
-- 2. `admin_save_project` acepta `p_external_url text` (default NULL) para
--    guardar el campo en la misma transacción atómica del panel.
-- 3. Seed del proyecto La Holanda (publicada + destacada), vinculada a la
--    categoría existente "Proyectos Especiales" — no se crean categorías
--    nuevas — con imagen oficial del micrositio (Cloudinary de la empresa).
--
-- COMPATIBILIDAD
-- * La columna nace nullable con default NULL: ninguna consulta, política RLS
--   ni vista existente cambia de comportamiento.
-- * La RPC cambia de firma (nuevo parámetro opcional al final), por eso va
--   DROP + CREATE y no `create or replace`: un replace crearía un OVERLOAD y
--   dejaría DOS funciones admin_save_project en public (PostgREST resolvería
--   una al azar). Mismos grants explícitos que 0005: EXECUTE solo a
--   `authenticated`; anon/PUBLIC sin acceso. RLS y el check is_admin() siguen
--   mandando dentro de la función (SECURITY INVOKER).
-- * `external_url` viaja como parámetro con DEFAULT: los clientes antiguos que
--   aún llaman la firma de 10 parámetros siguen funcionando sin cambios.
--
-- Idempotente: add column if not exists + drop/create de la función.

-- ----------------------------------------------------------------------------
-- 1. Columna genérica de enlace externo
-- ----------------------------------------------------------------------------
alter table public.projects
  add column if not exists external_url text;

-- ----------------------------------------------------------------------------
-- 2. admin_save_project con soporte de external_url
--    (misma lógica canónica de 20260917000005 + el campo nuevo)
-- ----------------------------------------------------------------------------
drop function if exists public.admin_save_project(
  uuid, text, text, text, numeric, text, boolean, int, uuid[], jsonb
);

create function public.admin_save_project(
  p_project_id uuid,                -- null = genera el servidor; uuid nuevo = crear
                                    -- con ese id; uuid existente = actualizar
  p_title text,
  p_slug text,
  p_description text,
  p_price_min_wages numeric,
  p_status text,
  p_featured boolean,
  p_sort_order int,
  p_category_ids uuid[],
  p_image_rows jsonb,               -- [{id?, storage_path, is_cover, sort_order}]
  p_external_url text default null  -- enlace público opcional del proyecto.
                                    -- Contrato: NULL = no cambiar el valor
                                    -- (compatibilidad con clientes que aún
                                    -- llaman la firma de 10 parámetros),
                                    -- '' = quitar el enlace, URL = asignar.
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

  -- Normaliza y deduplica UNA vez (idéntico a 0005).
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
  -- external_url: en INSERT una cadena vacía tras btrim queda como NULL
  -- (columna nullable); en UPDATE el CASE decide según el contrato de arriba.
  insert into public.projects (id, title, slug, description, price_min_wages,
                               status, featured, sort_order, external_url)
  values (coalesce(p_project_id, gen_random_uuid()),
          p_title, p_slug, p_description, p_price_min_wages,
          p_status, p_featured, p_sort_order,
          nullif(btrim(coalesce(p_external_url, '')), ''))
  on conflict (id) do update
    set title = excluded.title,
        slug = excluded.slug,
        description = excluded.description,
        price_min_wages = excluded.price_min_wages,
        status = excluded.status,
        featured = excluded.featured,
        sort_order = excluded.sort_order,
        -- p_external_url: NULL conserva el valor vigente (un cliente antiguo que
        -- omite el parámetro no borra el enlace por accidente); '' lo quita.
        external_url = case
          when p_external_url is null then projects.external_url
          else nullif(btrim(p_external_url), '')
        end
  returning id into v_project;

  -- ------------------------------------------------------ imágenes (diff)
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

  -- Update de existentes (orden y portada).
  update public.project_images pi
     set sort_order = i.sort_order,
         is_cover = i.is_cover
  from jsonb_to_recordset(v_rows) as i(image_id uuid, storage_path text,
                                       is_cover boolean, sort_order int)
  where i.image_id is not null
    and pi.id = i.image_id
    and pi.project_id = v_project;

  -- Insert de nuevos (sin id) sin duplicar referencias ya presentes.
  insert into public.project_images (project_id, storage_path, is_cover, sort_order)
  select v_project, i.storage_path, i.is_cover, i.sort_order
  from jsonb_to_recordset(v_rows) as i(image_id uuid, storage_path text,
                                       is_cover boolean, sort_order int)
  where i.image_id is null
    and not exists (
      select 1 from public.project_images pi
      where pi.project_id = v_project and pi.storage_path = i.storage_path
    );

  -- Portada única sobre el estado FINAL.
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

revoke execute on function public.admin_save_project(uuid, text, text, text, numeric, text, boolean, int, uuid[], jsonb, text)
  from public, anon;
grant execute on function public.admin_save_project(uuid, text, text, text, numeric, text, boolean, int, uuid[], jsonb, text)
  to authenticated;

