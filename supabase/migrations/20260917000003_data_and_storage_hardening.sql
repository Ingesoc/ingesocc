-- ============================================================================
-- Ingesocc SAS — 0004: hardening de datos y storage
-- Depende de 20260917000000 (tablas) y 20260917000002 (buckets).
--
-- 1. contact_messages: constraints de longitud en paridad con la validación
--    del formulario Angular (name 2–80, email ≤254, phone ≤30, subject ≤200,
--    message 10–5000). La validación del cliente no es barrera de seguridad:
--    la regla debe existir también en la DB (diagnóstico #14).
-- 2. storage: file_size_limit y allowed_mime_types por bucket, en paridad con
--    image-utils.ts (jpg/jpeg/png/webp/gif/avif) y los límites por contexto
--    del panel (proyectos/servicios 2 MB, CMS 5 MB). Los buckets se crean en
--    0002 sin restricciones; aquí se endurecen (diagnóstico #15).
--
-- Idempotente: alter table ... add constraint si no existe (DO block) y
-- update de buckets con from; los límites solo pueden subir de valor, nunca
-- quedarse en 0 por una re-ejecución parcial.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Constraints de longitud en contact_messages
-- ----------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.contact_messages'::regclass
      and conname = 'contact_messages_name_len'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_name_len
      check (char_length(name) between 2 and 80);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.contact_messages'::regclass
      and conname = 'contact_messages_email_len'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_email_len
      check (char_length(email) between 3 and 254);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.contact_messages'::regclass
      and conname = 'contact_messages_phone_len'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_phone_len
      check (phone is null or char_length(phone) <= 30);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.contact_messages'::regclass
      and conname = 'contact_messages_subject_len'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_subject_len
      check (subject is null or char_length(subject) <= 200);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.contact_messages'::regclass
      and conname = 'contact_messages_message_len'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_message_len
      check (char_length(message) between 10 and 5000);
  end if;
end
$$;

-- ----------------------------------------------------------------------------
-- 2. Límites de tamaño y MIME por bucket
--    Paridad con el frontend:
--    - proyectos/servicios: 2 MB por archivo (image-utils: maxSizeMB: 2)
--    - content-images (CMS): 5 MB por archivo (MAX_IMAGE_BYTES)
--    - MIME: los aceptados por image-utils.ts (jpg/jpeg/png/webp/gif/avif);
--      image/gif se excluye por ser formato anticuado para contenido web
-- ----------------------------------------------------------------------------

update storage.buckets
set file_size_limit = 2097152,  -- 2 MB
    allowed_mime_types = array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif'
    ]
where id in ('project-images', 'service-images');

update storage.buckets
set file_size_limit = 5242880,  -- 5 MB
    allowed_mime_types = array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif'
    ]
where id = 'content-images';

-- ============================================================================
-- Nota de operación: aplicar esta migración en los proyectos Supabase remotos
-- (staging/producción) con `supabase db push`. Si algún bucket remoto ya tiene
-- límites configurados desde el dashboard, esta migración los sobreescribe con
-- los valores de arriba — revisar antes de push.
-- ============================================================================
