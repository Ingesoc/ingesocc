-- ============================================================================
-- Ingesocc SAS — 0008: tabla testimonials (slice 3.5 del plan Fase 3)
-- ----------------------------------------------------------------------------
-- Testimonios de clientes, administrados desde el panel /admin/testimonios.
--
-- IMPORTANTE: la tabla NO recibe fixtures de ejemplo (plan 1.7 / regla del
-- proyecto: no se inventan opiniones de clientes). Hasta que el admin publique
-- el primer testimonio, la sección del Home se oculta.
--
-- RLS: lectura pública SOLO de publicados; CRUD completo exclusivo admin.
-- ============================================================================

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author text not null,                         -- nombre/empresa del autor
  role text,                                    -- cargo o contexto, opcional
  quote text not null,                          -- el testimonio en sí
  rating smallint check (rating between 1 and 5), -- estrellas opcionales (null = sin mostrar)
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists testimonials_set_updated_at on public.testimonials;
create trigger testimonials_set_updated_at
  before update on public.testimonials
  for each row execute function public.set_updated_at();

alter table public.testimonials enable row level security;

-- El sitio público solo ve testimonios publicados.
drop policy if exists "testimonials_select_published" on public.testimonials;
create policy "testimonials_select_published" on public.testimonials
  for select using (status = 'published');

-- CRUD completo exclusivo para el rol admin (cuentas con profiles.role = 'admin').
drop policy if exists "testimonials_admin_all" on public.testimonials;
create policy "testimonials_admin_all" on public.testimonials
  for all using (public.is_admin()) with check (public.is_admin());