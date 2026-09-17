-- ============================================================================
-- Ingesocc SAS — 0003: Storage (sección 8 de schema.sql)
-- Tres buckets públicos: lectura por cualquiera, escritura solo admin.
-- Idempotente: insert on conflict + drop policy if exists.
--
-- Nota: los límites de file_size_limit y allowed_mime_types se configuran en
-- 20260917000003_data_and_storage_hardening.sql (diagnóstico #15), en paridad
-- con la validación del frontend.
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('project-images', 'project-images', true),
  ('service-images', 'service-images', true),
  ('content-images', 'content-images', true)
on conflict (id) do nothing;

-- Lectura pública de los tres buckets
drop policy if exists "storage_public_read"
  on storage.objects;
create policy "storage_public_read"
  on storage.objects for select
  using (bucket_id in ('project-images', 'service-images', 'content-images'));

-- Escritura solo admin
drop policy if exists "storage_admin_insert"
  on storage.objects;
create policy "storage_admin_insert"
  on storage.objects for insert
  with check (bucket_id in ('project-images', 'service-images', 'content-images') and public.is_admin());

drop policy if exists "storage_admin_update"
  on storage.objects;
create policy "storage_admin_update"
  on storage.objects for update
  using (bucket_id in ('project-images', 'service-images', 'content-images') and public.is_admin());

drop policy if exists "storage_admin_delete"
  on storage.objects;
create policy "storage_admin_delete"
  on storage.objects for delete
  using (bucket_id in ('project-images', 'service-images', 'content-images') and public.is_admin());
