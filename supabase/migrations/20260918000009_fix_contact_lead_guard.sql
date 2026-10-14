-- ============================================================================
-- Ingesocc SAS — 0012: corrige el guard anti-spam de contact_messages
-- Depende de 20260918000005 (función/trigger) y 20260917000001 (RLS).
--
-- Problema: `contact_messages_lead_guard` se declaró `security invoker`. La
-- política `contact_messages_admin_select` solo permite SELECT a admin, así que
-- cuando un visitante anónimo inserta, el `select count(*)` de la ventana corre
-- bajo RLS con rol anon y siempre devuelve 0. Resultado: el rate limit por
-- email (3 mensajes / 15 min) nunca se disparaba y la barrera era un no-op.
--
-- Corrección: la función pasa a `security definer` para leer el conteo real
-- saltando RLS (el owner de la tabla no está sujeto a sus políticas). Se fija
-- `search_path = public` para blindar el definer y la función no usa SQL
-- dinámico: solo compara `new.email` como valor, sin superficie de inyección.
-- El honeypot se mantiene idéntico.
--
-- Idempotente: `create or replace` + `drop trigger if exists`.
-- Aplicar con `supabase db push` (nunca editar una migración ya aplicada).
-- ============================================================================

create or replace function public.contact_messages_lead_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  window_minutes int := 15;
  max_per_window int := 3;
  recent_count   int;
begin
  -- Honeypot rellenado = bot. Se conserva como evidencia marcada como spam.
  if new.website is not null and btrim(new.website) <> '' then
    new.is_spam := true;
    return new;
  end if;

  -- Límite por correo dentro de la ventana: excluye los que ya eran spam para
  -- que un atacante no envenene el límite de un correo legítimo.
  select count(*) into recent_count
    from public.contact_messages
    where email = new.email
      and not is_spam
      and created_at > now() - make_interval(mins => window_minutes);

  if recent_count >= max_per_window then
    return null;
  end if;

  return new;
end;
$$;

drop trigger if exists contact_messages_lead_guard on public.contact_messages;
create trigger contact_messages_lead_guard
  before insert on public.contact_messages
  for each row execute function public.contact_messages_lead_guard();

-- ----------------------------------------------------------------------------
-- Nota de operación: aplicar con `supabase db push` en staging/producción.
-- Comprobar con `supabase/rls-checks.sql` que un anon no puede leer la bandeja.
-- ----------------------------------------------------------------------------
