-- ============================================================================
-- Ingesocc SAS — 0014: hardening del rate limit de contact_messages
-- Depende de 20260918000005 y 20260918000009 (guard anti-spam).
--
-- ING-SEC-02 de la auditoría: el límite anterior contaba por `email` sin
-- normalizar y con un `COUNT` seguido de `INSERT`, que no es atómico. Además
-- el contador no sobrevivía al borrado de mensajes desde el panel.
--
-- Cambios:
--   1. Se normaliza `new.email` (trim + minúsculas) antes de guardar y contar.
--   2. El conteo pasa a una tabla de contadores con UPSERT atómico
--      (`insert ... on conflict do update`), sin ventana de carrera entre el
--      COUNT y el INSERT.
--   3. Se añade un límite global por ventana para evitar el llenado masivo de
--      la tabla aun cuando el atacante rote correos.
--   4. La tabla de contadores queda fuera del alcance de anon/authenticated
--      (solo la función SECURITY DEFINER la usa).
--
-- Límite distribuido por IP: PostgREST no expone la IP real del visitante
-- (la conexión llega por el pooler), así que un límite por IP fiable debe
-- aplicarse en el borde (Vercel/Cloudflare/WAF). Este guard cubre la capa de
-- base de datos y debe complementarse con ese control perimetral.
--
-- Idempotente: create table/index if not exists, create or replace function,
-- drop trigger if exists. Aplicar con `supabase db push`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabla de contadores por ventana
-- ----------------------------------------------------------------------------

create table if not exists public.contact_rate_limits (
  bucket_key   text primary key,
  window_start timestamptz not null default now(),
  hits         integer not null default 0,
  updated_at   timestamptz not null default now()
);

create index if not exists contact_rate_limits_updated_at_idx
  on public.contact_rate_limits (updated_at);

-- Sin políticas: anon/authenticated no pueden leer ni escribir esta tabla.
alter table public.contact_rate_limits enable row level security;
revoke all on table public.contact_rate_limits from anon, authenticated;

-- Normaliza los correos ya guardados para que el nuevo contador y las
-- búsquedas del panel sean consistentes. No hay unique en email, así que la
-- actualización no puede violar restricciones.
update public.contact_messages
set email = lower(btrim(email))
where email <> lower(btrim(email));

-- ----------------------------------------------------------------------------
-- 2. Guard: honeypot + rate limit atómico por correo + límite global
-- ----------------------------------------------------------------------------

create or replace function public.contact_messages_lead_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  window_minutes    int := 15;
  max_per_email     int := 3;
  max_global        int := 300;
  normalized_email  text;
  current_hits      int;
begin
  -- Honeypot rellenado = bot. Se conserva como evidencia marcada como spam.
  if new.website is not null and btrim(new.website) <> '' then
    new.is_spam := true;
    return new;
  end if;

  normalized_email := lower(btrim(new.email));
  new.email := normalized_email;

  -- Contador atómico por correo. El UPSERT evita la carrera COUNT+INSERT: dos
  -- solicitudes concurrentes del mismo correo ven incrementos consistentes.
  insert into public.contact_rate_limits as r
    (bucket_key, window_start, hits, updated_at)
  values
    ('contact:email:' || normalized_email, now(), 1, now())
  on conflict (bucket_key) do update
    set hits = case
                 when r.window_start < now() - make_interval(mins => window_minutes)
                   then 1
                 else r.hits + 1
               end,
        window_start = case
                         when r.window_start < now() - make_interval(mins => window_minutes)
                           then now()
                         else r.window_start
                       end,
        updated_at = now()
  returning r.hits into current_hits;

  if current_hits > max_per_email then
    return null;
  end if;

  -- Límite global: frena un ataque que rote correos. Es deliberadamente alto
  -- para no bloquear el tráfico legítimo; el límite por IP del borde es la
  -- primera línea de defensa.
  insert into public.contact_rate_limits as r
    (bucket_key, window_start, hits, updated_at)
  values
    ('contact:global', now(), 1, now())
  on conflict (bucket_key) do update
    set hits = case
                 when r.window_start < now() - make_interval(mins => window_minutes)
                   then 1
                 else r.hits + 1
               end,
        window_start = case
                         when r.window_start < now() - make_interval(mins => window_minutes)
                           then now()
                         else r.window_start
                       end,
        updated_at = now()
  returning r.hits into current_hits;

  if current_hits > max_global then
    return null;
  end if;

  -- Limpieza oportunista de contadores inactivos (la tabla es pequeña).
  delete from public.contact_rate_limits
  where updated_at < now() - interval '1 day';

  return new;
end;
$$;

-- La función solo debe dispararse como trigger, no invocarse por RPC.
revoke execute on function public.contact_messages_lead_guard()
  from public, anon, authenticated;

drop trigger if exists contact_messages_lead_guard on public.contact_messages;
create trigger contact_messages_lead_guard
  before insert on public.contact_messages
  for each row execute function public.contact_messages_lead_guard();

-- ----------------------------------------------------------------------------
-- 3. Nota operativa
-- ----------------------------------------------------------------------------
-- Verificar en staging:
--   1. 4 inserts del mismo correo en 15 min: el cuarto no crea fila;
--   2. el mismo correo con MAYÚSCULAS/espacios cae en el mismo contador;
--   3. N inserts concurrentes no superan el máximo (UPSERT atómico);
--   4. el honeypot sigue marcando is_spam sin insertar el mensaje en la
--      bandeja visible (se conserva como evidencia);
--   5. el límite global no bloquea el volumen normal del sitio.
-- El límite por IP debe configurarse además en el proveedor perimetral.
-- ============================================================================
