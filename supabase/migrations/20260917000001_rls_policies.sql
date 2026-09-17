-- ============================================================================
-- Ingesocc SAS — 0002: Row Level Security (secciones 1 y 7 de schema.sql)
-- Depende de 20260917000000_initial_schema.sql (tablas e is_admin()).
-- Idempotente: drop policy if exists + create policy.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- RLS en profiles (creada junto a la tabla en la migración 0001)
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

-- Cada usuario puede actualizar su propia fila, pero NUNCA su rol: el with check
-- (id = auth.uid() and role = 'user') impide la auto-promoción a 'admin' (sin with
-- check, una policy FOR UPDATE lo hereda del using y cualquiera podía ejecutar
-- `update profiles set role = 'admin' where id = auth.uid()`). El rol se asigna
-- por SQL con rol postgres/dashboard, nunca desde el cliente.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = 'user');

-- ----------------------------------------------------------------------------
-- Habilitar RLS en el resto de tablas
-- ----------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.project_categories enable row level security;
alter table public.project_images enable row level security;
alter table public.services enable row level security;
alter table public.content_blocks enable row level security;
alter table public.contact_messages enable row level security;

-- ----------------------------------------------------------------------------
-- Lectura pública
-- ----------------------------------------------------------------------------

drop policy if exists "categories_select_public" on public.categories;
create policy "categories_select_public" on public.categories
  for select using (true);

drop policy if exists "projects_select_published" on public.projects;
create policy "projects_select_published" on public.projects
  for select using (status = 'published');

drop policy if exists "project_categories_select_public" on public.project_categories;
create policy "project_categories_select_public" on public.project_categories
  for select using (true);

drop policy if exists "project_images_select_public" on public.project_images;
create policy "project_images_select_public" on public.project_images
  for select using (true);

drop policy if exists "services_select_published" on public.services;
create policy "services_select_published" on public.services
  for select using (status = 'published');

drop policy if exists "content_blocks_select_public" on public.content_blocks;
create policy "content_blocks_select_public" on public.content_blocks
  for select using (true);

-- ----------------------------------------------------------------------------
-- Formulario de contacto: cualquiera inserta, solo admin lee/actualiza/borra
-- ----------------------------------------------------------------------------

drop policy if exists "contact_messages_insert_public" on public.contact_messages;
create policy "contact_messages_insert_public" on public.contact_messages
  for insert with check (true);

drop policy if exists "contact_messages_admin_select" on public.contact_messages;
create policy "contact_messages_admin_select" on public.contact_messages
  for select using (public.is_admin());

drop policy if exists "contact_messages_admin_update" on public.contact_messages;
create policy "contact_messages_admin_update" on public.contact_messages
  for update using (public.is_admin());

-- Sin una política de delete, el DELETE de la bandeja admin afecta 0 filas por RLS
-- (el inbox lo quitaba de la UI de forma optimista y el mensaje reaparecía al
-- recargar). Solo admin puede borrar.
drop policy if exists "contact_messages_admin_delete" on public.contact_messages;
create policy "contact_messages_admin_delete" on public.contact_messages
  for delete using (public.is_admin());

-- ----------------------------------------------------------------------------
-- Escritura solo admin
-- ----------------------------------------------------------------------------

drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "projects_admin_all" on public.projects;
create policy "projects_admin_all" on public.projects
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "project_categories_admin_all" on public.project_categories;
create policy "project_categories_admin_all" on public.project_categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "project_images_admin_all" on public.project_images;
create policy "project_images_admin_all" on public.project_images
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "services_admin_all" on public.services;
create policy "services_admin_all" on public.services
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "content_blocks_admin_all" on public.content_blocks;
create policy "content_blocks_admin_all" on public.content_blocks
  for all using (public.is_admin()) with check (public.is_admin());
