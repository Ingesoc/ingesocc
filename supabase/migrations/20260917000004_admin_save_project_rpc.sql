-- ============================================================================
-- Ingesocc SAS — 0005: guardado atómico de proyectos vía RPC
-- Reemplaza la orquestación multi-paso del panel (update proyecto → upload
-- imágenes → delete imágenes → sync orden/portada → replace categorías) por
-- UNA llamada transaccional (diagnóstico #9/#10/#11):
--
--   Angular
--     └── rpc('admin_save_project', …)
--           └── TRANSACCIÓN Postgres
--                 ├── upsert del proyecto (insert o update)
--                 ├── project_images: insert nuevos / update orden+portada /
--                 │   delete de los eliminados
--                 └── project_categories: delete masivo + insert (atómico)
--
-- Storage NO es transaccional con la DB, así que el RPC no toca buckets.
-- El cliente sube los archivos ANTES de llamar el RPC (si el RPC falla, borra
-- esos archivos con la API de storage: compensación barata) y elimina los
-- objetos huérfanos DESPUÉS usando la lista `orphan_storage_paths` que el RPC
-- devuelve (filas borradas en la transacción que ya no referencian nada).
--
-- Seguridad: SECURITY INVOKER + EXECUTE solo a `authenticated`. Las políticas
-- RLS de projects/project_images/project_categories siguen aplicando dentro de
-- la función: sin rol admin, cada statement falla y la transacción entera
-- hace ROLLBACK. No se concede nada nuevo.
-- Idempotente: create or replace function + drop/grant por si se re-ejecuta.
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
  v_orphans text[];
  v_existing_path text;
begin
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
  -- Delete: toda fila del proyecto que no venga en p_image_rows.
  -- Los paths se acumulan en v_orphans para que el cliente borre los objetos
  -- del bucket DESPUÉS de que la transacción haya commiteado.
  create temp table if not exists _incoming_images (
    image_id uuid,
    storage_path text,
    is_cover boolean,
    sort_order int
  ) on commit drop;

  delete from _incoming_images;
  insert into _incoming_images
  select
    (img->>'id')::uuid,
    img->>'storage_path',
    coalesce((img->>'is_cover')::boolean, false),
    coalesce((img->>'sort_order')::int, 0)
  from jsonb_array_elements(p_image_rows) as img
  where img->>'storage_path' is not null;

  for v_existing_path in
    select pi.storage_path
    from public.project_images pi
    where pi.project_id = v_project
      and not exists (
        select 1 from _incoming_images i
        where i.image_id = pi.id
           or (i.image_id is null and i.storage_path = pi.storage_path)
      )
  loop
    v_orphans := array_append(v_orphans, v_existing_path);
  end loop;

  delete from public.project_images pi
  where pi.project_id = v_project
    and not exists (
      select 1 from _incoming_images i
      where i.image_id = pi.id
         or (i.image_id is null and i.storage_path = pi.storage_path)
    );

  -- Update de existentes (orden y portada)
  update public.project_images pi
     set sort_order = i.sort_order,
         is_cover = i.is_cover
  from _incoming_images i
  where i.image_id = pi.id
    and pi.project_id = v_project;

  -- Insert de nuevos (sin id): la fila la crea el RPC, no el cliente, para
  -- cerrar la ventana "archivo en Storage sin fila en DB" (diagnóstico #8):
  -- si el upload funcionó y el RPC falla, el cliente borra el archivo y no
  -- queda nada huérfano.
  insert into public.project_images (project_id, storage_path, is_cover, sort_order)
  select v_project, i.storage_path, i.is_cover, i.sort_order
  from _incoming_images i
  where i.image_id is null;

  -- ------------------------------------------------------- categorías
  -- Delete + insert dentro de la MISMA transacción: si el insert falla
  -- (uuid inválido, sin permisos), el delete también se revierte.
  delete from public.project_categories pc where pc.project_id = v_project;

  if array_length(p_category_ids, 1) > 0 then
    insert into public.project_categories (project_id, category_id)
    select v_project, cid
    from unnest(p_category_ids) as cid
    where exists (select 1 from public.categories c where c.id = cid)
    on conflict do nothing;
  end if;

  return query select v_project, coalesce(v_orphans, '{}'::text[]);
end;
$$;

-- EXECUTE solo a usuarios autenticados; anon ni siquiera puede llamarla.
-- (Idempotente: se revoca antes de conceder.)
revoke execute on function public.admin_save_project(uuid, text, text, text, numeric, text, boolean, int, uuid[], jsonb)
  from public, anon;
grant execute on function public.admin_save_project(uuid, text, text, text, numeric, text, boolean, int, uuid[], jsonb)
  to authenticated;
