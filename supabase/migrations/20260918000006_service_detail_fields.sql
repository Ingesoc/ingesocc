-- ============================================================================
-- Ingesocc SAS — 0012: campos de detalle del servicio (services)
-- Depende de 20260917000000 (tabla services) y 20260917000001 (RLS).
--
-- La vista /servicios/:slug mostraba el contexto ("Alcance" + "Entregables") y
-- las preguntas frecuentes con copy fija en el componente (service-detail).
-- Estos campos los mueven al CRUD del panel para que el contenido sea editable:
--   - scope:         párrafo de alcance propio (si es null se usa description).
--   - deliverables:  jsonb array de textos (entregables por línea de servicio).
--   - faq:           jsonb array de { q, a } (preguntas frecuentes).
--
-- Se usa jsonb (no tablas hijas): son listas cortas y ordenadas que se editan
-- como un bloque en el formulario; jsonb evita tablas + RLS + orden extra.
-- Nullable: sin valor la página usa sus respaldos genéricos (sitio nunca roto).
--
-- Idempotente: add column if not exists + DO block por constraint. Aplicar con
-- `supabase db push` (nunca editar una migración ya aplicada).
-- ============================================================================

alter table public.services
  add column if not exists scope text;

alter table public.services
  add column if not exists deliverables jsonb;

alter table public.services
  add column if not exists faq jsonb;

-- Los valores deben ser listas JSON (no escalares/objetos): el cliente tipa
-- deliverables como string[] y faq como { q, a }[]. La forma del elemento la
-- valida el formulario (no es barrera de seguridad aquí porque solo escribe el
-- admin por RLS, pero sí evita guardar un tipo que rompa el render público).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.services'::regclass
      and conname = 'services_deliverables_is_array'
  ) then
    alter table public.services
      add constraint services_deliverables_is_array
      check (deliverables is null or jsonb_typeof(deliverables) = 'array');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.services'::regclass
      and conname = 'services_faq_is_array'
  ) then
    alter table public.services
      add constraint services_faq_is_array
      check (faq is null or jsonb_typeof(faq) = 'array');
  end if;
end
$$;

-- ============================================================================
-- Nota de operación: aplicar con `supabase db push`. Las filas existentes
-- quedan con scope/deliverables/faq en NULL; el sitio público usa sus respaldos
-- genéricos y el admin puede diligenciar cada servicio desde /admin/servicios.
-- El seed (supabase/seed.sql) trae entregables de ejemplo [PENDIENTE: validar
-- con el cliente] para que el sitio se vea igual con y sin la DB aplicada.
-- ============================================================================
