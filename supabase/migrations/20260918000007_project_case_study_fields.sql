-- ============================================================================
-- Ingesocc SAS — 0013: campos de caso de estudio en projects
-- Depende de 20260917000000 (tablas), 20260917000001 (RLS) y
-- 20260918000004 (ubicación + metadatos de imagen; versión canónica previa).
--
-- QUÉ HACE
-- 1. Nuevas columnas en `projects` (todas null): `client`, `scope`, `timeline`,
--    `progress` y `results` (text) + `key_figures` (jsonb, default '[]').
--    `key_figures` es un array de {label, value} (cifras del caso de estudio).
--    Sigue la decisión del equipo: listas estructuradas como jsonb.
--
-- 2. `admin_save_project` gana un parámetro `p_case_study jsonb default null`
--    que persiste TODO el caso de estudio en la misma transacción atómica.
--    Contrato:
--      * null                      -> NO tocar (bundle viejo = no borra).
--      * objeto {client, scope,
--        timeline, progress,
--        results, key_figures}     -> reemplazo completo: los 5 textos se
--                                    normalizan ('' -> null) y key_figures se
--                                    filtra (solo pares label+value no vacíos).
--
-- 3. CORRECCIÓN de una regresión silenciosa: la RPC canónica de 20260918000004
--    omitió `p_external_url` (lo introdujo 20260918000001). Tras ella, guardar
--    un proyecto enviando p_location + p_external_url no tenía función con
--    ambos parámetros (PGRST202). La canónica nueva vuelve a aceptar
--    `p_external_url` y lo persiste; la regla NULL/'' es la misma de 0001.
--
-- COMPATIBILIDAD DE LA RPC
-- La canónica pasa a 13 parámetros (11 de 0004 + external_url + p_case_study).
-- Se DROPEAN las dos variantes intermedias (las de 11 parámetros de 0001 y
-- 0004) para que la resolución de aridad no sea ambigua, y con los parámetros
-- con DEFAULT los bundles anteriores siguen resolviendo a la canónica:
--   * bundle nuevo (13 args)                    -> canónica.
--   * bundle con external_url pero sin la nueva -> canónica (default null).
--   * bundle de 10 args (pre-0001)              -> envoltorio de 10 parámetros
--                                                  que delega posicional.
-- RLS: no cambia nada. La función sigue siendo SECURITY INVOKER con el check
-- is_admin() explícito; EXECUTE solo a `authenticated`.
--
-- Idempotente: add column if not exists + drop/create de las funciones.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Columnas del caso de estudio
-- ----------------------------------------------------------------------------
alter table public.projects
  add column if not exists client text,
  add column if not exists scope text,
  add column if not exists timeline text,
  add column if not exists progress text,
  add column if not exists results text,
  add column if not exists key_figures jsonb default '[]'::jsonb;

comment on column public.projects.client is
  'Cliente del proyecto (persona/entidad que contrató la obra). Null = no registrado.';
comment on column public.projects.scope is
  'Alcance del trabajo contratado (descripción de actividades). Null = no registrado.';
comment on column public.projects.timeline is
  'Plazo o duración del proyecto en texto libre (p. ej. "8 meses"). Null = no registrado.';
comment on column public.projects.progress is
  'Avance/estado actual del proyecto en texto (p. ej. "En ejecución, 60%"). Null = no registrado.';
comment on column public.projects.results is
  'Resultados/entregables destacados del caso de estudio. Null = no registrado.';
comment on column public.projects.key_figures is
  'Cifras del caso de estudio: array de {label, value} (p. ej. 2400 m²). El admin las diligencia; '
  'la vista pública solo muestra las que tengan ambas partes. Vacío = sin cifras.';

-- ----------------------------------------------------------------------------
-- 2. RPC canónica (13 parámetros)
-- ----------------------------------------------------------------------------
drop function if exists public.admin_save_project(
  uuid, text, text, text, numeric, text, boolean, int, uuid[], jsonb, text
);
-- Canónica transitoria de 20260918000004 (ubicación, sin p_external_url). Es
-- de 11 parámetros: misma aridad que la variante de 20260918000001, pero con
-- p_location (5º text) en vez de p_external_url (text final).
drop function if exists public.admin_save_project(
  uuid, text, text, text, text, numeric, text, boolean, int, uuid[], jsonb
);

create function public.admin_save_project(
  p_project_id uuid,                -- null = genera el servidor; uuid nuevo = crear
                                    -- con ese id; uuid existente = actualizar
  p_title text,
  p_slug text,
  p_description text,
  p_location text,                  -- null = NO tocar; '' = vaciar; texto = asignar
  p_price_min_wages numeric,
  p_status text,
  p_featured boolean,
  p_sort_order int,
  p_category_ids uuid[],
  p_image_rows jsonb,               -- [{id?, storage_path, is_cover, sort_order,
                                    --    alt?, title?, description?, category?}]
  p_external_url text default null, -- null = NO tocar; '' = quitar; URL = asignar
  p_case_study jsonb default null   -- null = NO tocar; objeto = reemplazo completo:
                                    --   {client?, scope?, timeline?, progress?,
                                    --    results?, key_figures?: [{label, value}]}
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
  v_case jsonb;
  v_figures jsonb;
begin
  -- SECURITY INVOKER + RLS son la frontera real; el check solo convierte el
  -- fallo en un mensaje legible (42501) en vez de un error de RLS a media
  -- transacción. Misma fuente de verdad que el resto de la app.
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

  -- Normaliza y deduplica UNA vez (misma lógica que 0004).
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

  -- ------------------------------------------------------ p_case_study
  v_case := p_case_study;
  if v_case is not null and jsonb_typeof(v_case) <> 'object' then
    raise exception 'admin_save_project: p_case_study debe ser un objeto'
      using errcode = '22023';
  end if;

  -- key_figures normalizado: solo pares con label Y value no vacíos, en orden.
  -- jsonb_agg sobre cero filas devuelve NULL -> se coalescea a '[]'.
  select coalesce(jsonb_agg(e order by ord), '[]'::jsonb)
  into v_figures
  from (
    select jsonb_build_object('label', btrim(f->>'label'), 'value', btrim(f->>'value')) as e, ord
    from jsonb_array_elements(coalesce(v_case->'key_figures', '[]'::jsonb)) with ordinality as t(f, ord)
    where nullif(btrim(f->>'label'), '') is not null
      and nullif(btrim(f->>'value'), '') is not null
  ) s;

  -- ------------------------------------------------------------------ upsert
  -- Uso de los parámetros "opacables":
  --   * p_location / p_external_url con null = conservar el valor vigente.
  --   * p_case_study con null = conservar todo el caso de estudio (bundle viejo
  --     que no lo envía no lo borra); objeto = aplicar el reemplazo completo.
  insert into public.projects (id, title, slug, description, location,
                               price_min_wages, status, featured, sort_order,
                               external_url,
                               client, scope, timeline, progress, results,
                               key_figures)
  values (coalesce(p_project_id, gen_random_uuid()),
          p_title, p_slug, p_description, nullif(btrim(p_location), ''),
          p_price_min_wages, p_status, p_featured, p_sort_order,
          nullif(btrim(coalesce(p_external_url, '')), ''),
          nullif(btrim(coalesce(v_case->>'client', '')), ''),
          nullif(btrim(coalesce(v_case->>'scope', '')), ''),
          nullif(btrim(coalesce(v_case->>'timeline', '')), ''),
          nullif(btrim(coalesce(v_case->>'progress', '')), ''),
          nullif(btrim(coalesce(v_case->>'results', '')), ''),
          v_figures)
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
        sort_order = excluded.sort_order,
        external_url = case
                         when p_external_url is null then public.projects.external_url
                         else nullif(btrim(p_external_url), '')
                       end,
        client = case
                   when p_case_study is null then public.projects.client
                   else nullif(btrim(coalesce(v_case->>'client', '')), '')
                 end,
        scope = case
                  when p_case_study is null then public.projects.scope
                  else nullif(btrim(coalesce(v_case->>'scope', '')), '')
                end,
        timeline = case
                     when p_case_study is null then public.projects.timeline
                     else nullif(btrim(coalesce(v_case->>'timeline', '')), '')
                   end,
        progress = case
                     when p_case_study is null then public.projects.progress
                     else nullif(btrim(coalesce(v_case->>'progress', '')), '')
                   end,
        results = case
                    when p_case_study is null then public.projects.results
                    else nullif(btrim(coalesce(v_case->>'results', '')), '')
                  end,
        key_figures = case
                        when p_case_study is null then public.projects.key_figures
                        else v_figures
                      end
  returning id into v_project;

  -- ------------------------------------------------------ imágenes (diff)
  -- Delete de lo que no viene en el lote + recolección de sus paths (el
  -- cliente borra el asset DESPUÉS de que la transacción commiteó).
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

  -- Update de existentes: orden, portada y metadatos.
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

  -- Insert de nuevos (sin id), sin duplicar referencias ya presentes.
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

  -- Portada única, decidida sobre el estado FINAL.
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

-- ----------------------------------------------------------------------------
-- 3. Permisos (canónica de 13 parámetros)
-- ----------------------------------------------------------------------------
revoke execute on function public.admin_save_project(
  uuid, text, text, text, text, numeric, text, boolean, int, uuid[], jsonb, text, jsonb
) from public, anon;
grant execute on function public.admin_save_project(
  uuid, text, text, text, text, numeric, text, boolean, int, uuid[], jsonb, text, jsonb
) to authenticated;