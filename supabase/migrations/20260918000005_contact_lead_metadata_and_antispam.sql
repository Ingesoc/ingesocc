-- ============================================================================
-- Ingesocc SAS — 0011: metadatos de lead y anti-spam en contact_messages
-- Depende de 20260917000000 (tabla) y 20260917000003 (constraints de longitud).
--
-- 1. La bandeja del admin necesita contexto comercial del lead: tipo de
--    proyecto, rango de presupuesto y plazo estimado (selects opcionales del
--    formulario público) más un estado de gestión para el seguimiento.
-- 2. Anti-spam: el INSERT de contact_messages es público por RLS y no exige
--    sesión, así que la barrera vive en la DB (la validación del cliente no
--    es barrera de seguridad, diagnóstico #14 del hardening):
--      - honeypot `website`: campo oculto que los bots suelen rellenar; si
--        llega con contenido la fila se marca is_spam = true (se conserva como
--        evidencia, no se pierde el ataque) y la bandeja la resalta para que el
--        admin la borre.
--      - rate limit por email: más de N mensajes del mismo correo dentro de
--        la ventana se descartan en silencio (trigger devuelve null), para no
--        revelarle al atacante la regla aplicada.
--
-- Idempotente: add column if not exists, create or replace y DO blocks con
-- `if not exists` por constraint/trigger. Puede re-aplicarse sin perder datos.
-- Aplicar con `supabase db push` (nunca editar una migración ya aplicada).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Columnas de lead
--    - status/is_spam/website nacen con valores por defecto, así las filas
--      existentes quedan 'new'/false sin necesidad de update previo.
--    - project_type/budget_range/timeline son nullable: el formulario de
--      contacto marca estos campos como opcionales.
-- ----------------------------------------------------------------------------

alter table public.contact_messages
  add column if not exists project_type text;

alter table public.contact_messages
  add column if not exists budget_range text;

alter table public.contact_messages
  add column if not exists timeline text;

alter table public.contact_messages
  add column if not exists status text not null default 'new';

alter table public.contact_messages
  add column if not exists is_spam boolean not null default false;

-- Honeypot: el formulario real lo envía siempre vacío; los bots lo rellenan.
alter table public.contact_messages
  add column if not exists website text;

-- ----------------------------------------------------------------------------
-- 2. Constraints de valores (paridad con los <option> del formulario Angular)
-- ----------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.contact_messages'::regclass
      and conname = 'contact_messages_project_type_enum'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_project_type_enum
      check (
        project_type is null
        or project_type in (
          'Construcción', 'Diseño', 'Remodelación', 'Infraestructura',
          'Industria', 'Salud', 'Otro'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.contact_messages'::regclass
      and conname = 'contact_messages_budget_range_enum'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_budget_range_enum
      check (
        budget_range is null
        or budget_range in (
          'Menos de $100M', 'Entre $100M y $500M', 'Más de $500M',
          'Aún sin definir'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.contact_messages'::regclass
      and conname = 'contact_messages_timeline_enum'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_timeline_enum
      check (
        timeline is null
        or timeline in (
          'Inmediato', '1 a 3 meses', '3 a 6 meses', '6 a 12 meses',
          'Más de un año'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.contact_messages'::regclass
      and conname = 'contact_messages_status_enum'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_status_enum
      check (status in ('new', 'contacted', 'closed'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.contact_messages'::regclass
      and conname = 'contact_messages_website_len'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_website_len
      check (website is null or char_length(website) <= 300);
  end if;
end
$$;

-- ----------------------------------------------------------------------------
-- 3. Guard: honeypot + rate limit antes de cada INSERT
--    - `security invoker`: corre con los permisos de quien inserta (RLS
--      público), no se salta ninguna política.
--    - `return null` descarta la fila: el cliente recibe éxito sin filas, así
--      el bot no recibe feedback sobre la regla que lo frenó.
-- ----------------------------------------------------------------------------

create or replace function public.contact_messages_lead_guard()
returns trigger
language plpgsql
security invoker
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
-- Nota de operación: aplica con `supabase db push` en staging/producción.
-- Tras el push, la bandeja admin debe recargar (select *) para ver las nuevas
-- columnas; las filas anteriores quedan con status='new' e is_spam=false.
-- ----------------------------------------------------------------------------
