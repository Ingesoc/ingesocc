-- ============================================================================
-- Ingesocc SAS — 0013: visibilidad de imágenes de proyectos y storage
-- Depende de 20260917000001 (RLS) y 20260917000002 (buckets/políticas).
--
-- ING-SEC-01 de la auditoría: `project_images` permitía SELECT público de todas
-- las filas, así que un anónimo podía leer los `storage_path` de imágenes de
-- proyectos en borrador aunque `projects` sí los ocultara. La lectura se ata
-- ahora al estado del proyecto (o al rol admin).
--
-- Defensa en profundidad en storage.objects: se retira la política de lectura
-- amplia que permitía listar CUALQUIER objeto de los tres buckets y se sustituye
-- por:
--   - admin: lectura completa (necesaria para el panel).
--   - project-images: solo rutas `<project_id>/...` de proyectos publicados.
--   - service-images: solo rutas `services/<service_id>/...` de servicios
--     publicados.
--   - content-images: sin SELECT para anon/authenticated; el contenido del CMS
--     es público por diseño y se sirve por URL pública, pero no se expone el
--     listado de objetos.
--
-- Los buckets siguen siendo públicos a propósito: los assets publicados son
-- contenido del sitio (SEO, og:image, caché del CDN). La decisión de no
-- convertirlos en privados se documenta aquí; las rutas de borradores quedan
-- protegidas por RLS en `project_images` y por la imposibilidad de listar
-- objetos, y los nombres de archivo incluyen un UUID aleatorio.
--
-- Idempotente: drop policy if exists + create policy + create index if not
-- exists. Aplicar con `supabase db push` (nunca editar una migración ya
-- aplicada).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. project_images: solo imágenes de proyectos publicados (o admin)
-- ----------------------------------------------------------------------------

alter table public.project_images enable row level security;

create index if not exists project_images_project_id_idx
  on public.project_images (project_id);

drop policy if exists "project_images_select_public" on public.project_images;
drop policy if exists "project_images_select_published" on public.project_images;

create policy "project_images_select_published"
on public.project_images
for select
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_images.project_id
      and p.status = 'published'
  )
  or public.is_admin()
);

-- ----------------------------------------------------------------------------
-- 2. storage.objects: lectura acotada; escritura sigue siendo solo admin
--    (las políticas storage_admin_insert/update/delete de 0002 se conservan).
-- ----------------------------------------------------------------------------

drop policy if exists "storage_public_read" on storage.objects;
drop policy if exists "storage_admin_select" on storage.objects;
drop policy if exists "storage_project_images_select_published" on storage.objects;
drop policy if exists "storage_service_images_select_published" on storage.objects;
drop policy if exists "storage_content_images_select_published" on storage.objects;

create policy "storage_admin_select"
on storage.objects
for select
using (
  bucket_id in ('project-images', 'service-images', 'content-images')
  and public.is_admin()
);

create policy "storage_project_images_select_published"
on storage.objects
for select
using (
  bucket_id = 'project-images'
  and exists (
    select 1
    from public.projects p
    where p.id::text = split_part(storage.objects.name, '/', 1)
      and p.status = 'published'
  )
);

create policy "storage_service_images_select_published"
on storage.objects
for select
using (
  bucket_id = 'service-images'
  and split_part(storage.objects.name, '/', 1) = 'services'
  and exists (
    select 1
    from public.services s
    where s.id::text = split_part(storage.objects.name, '/', 2)
      and s.status = 'published'
  )
);

-- content-images no tiene un estado draft: es contenido editorial del CMS.
-- No se concede SELECT a anon/authenticated para evitar enumerar el bucket; la
-- descarga por URL pública sigue funcionando para los assets ya publicados.

-- ----------------------------------------------------------------------------
-- 3. Nota operativa
-- ----------------------------------------------------------------------------
-- Tras aplicar esta migración, verificar en staging:
--   1. anon no obtiene filas de project_images de un proyecto draft;
--   2. anon no puede listar storage.objects de borradores;
--   3. las URLs públicas de imágenes ya publicadas siguen respondiendo 200;
--   4. el admin sigue viendo y gestionando imágenes de borradores en /admin.
-- Si en el futuro se decide que algún asset es confidencial, moverlo a un
-- bucket privado y servirlo con `createSignedUrl` desde el cliente autenticado.
-- ============================================================================
