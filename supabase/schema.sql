-- ============================================================================
-- Ingesocc SAS — Esquema de base de datos (Supabase / Postgres)
-- Fase 1 del plan técnico. Aplicar en el SQL Editor de Supabase (una sola vez).
-- Sección 3 (modelo de datos) y 4 (storage) del plan.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Helpers
-- ----------------------------------------------------------------------------

-- ¿El usuario autenticado tiene rol admin? (usado por las políticas RLS)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Actualiza updated_at automáticamente en tablas con trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 1. profiles (rol del usuario; se crea automáticamente al registrarse)
-- ----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

-- Cada usuario puede actualizar su propia fila, pero NUNCA su rol: el with check
-- (id = auth.uid() and role = 'user') impide la auto-promoción a 'admin' (sin with
-- check, una policy FOR UPDATE lo hereda del using y cualquiera podía ejecutar
-- `update profiles set role = 'admin' where id = auth.uid()`). El rol se asigna
-- por SQL con rol postgres/dashboard, nunca desde el cliente. El bloque drop +
-- create permite re-aplicar solo este fix sobre una DB ya creada.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = 'user');

-- ----------------------------------------------------------------------------
-- 2. categories (sección 3.1 del plan)
-- ----------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order int not null default 0
);

-- ----------------------------------------------------------------------------
-- 3. projects + project_categories + project_images (sección 3.2 del plan)
-- ----------------------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  price_min_wages numeric(6, 2),            -- valor en X salarios mínimos, nullable
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,  -- controla la sección destacada del Home
  sort_order int not null default 0,        -- control manual del admin
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create table public.project_categories (
  project_id uuid not null references public.projects(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (project_id, category_id)
);

create table public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null,
  is_cover boolean not null default false,
  sort_order int not null default 0
);

-- ----------------------------------------------------------------------------
-- 4. services (sección 3.3 del plan)
-- ----------------------------------------------------------------------------

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null,
  photo_path text,                          -- nullable: si hay foto se muestra, si no el ícono
  icon_name text,                           -- fallback (clave de ícono lucide)
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order int not null default 0,        -- semilla: infra/hospitalario/industrial antes que vivienda
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. content_blocks (sección 3.4 del plan — módulos editables)
-- ----------------------------------------------------------------------------

create table public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  page text not null,                       -- 'home' | 'about' | 'contact' | 'global'
  section_key text not null,                -- 'hero.title', 'stats.years_experience', ...
  type text not null check (type in ('text', 'richtext', 'image', 'number')),
  value_text text,
  value_number numeric,
  value_image_path text,
  updated_at timestamptz not null default now(),
  unique (page, section_key)
);

create trigger content_blocks_set_updated_at
  before update on public.content_blocks
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. contact_messages (sección 3.5 del plan)
-- ----------------------------------------------------------------------------

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 7. Row Level Security (sección 3.6 del plan)
-- ----------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.project_categories enable row level security;
alter table public.project_images enable row level security;
alter table public.services enable row level security;
alter table public.content_blocks enable row level security;
alter table public.contact_messages enable row level security;

-- Lectura pública
create policy "categories_select_public" on public.categories
  for select using (true);

create policy "projects_select_published" on public.projects
  for select using (status = 'published');

create policy "project_categories_select_public" on public.project_categories
  for select using (true);

create policy "project_images_select_public" on public.project_images
  for select using (true);

create policy "services_select_published" on public.services
  for select using (status = 'published');

create policy "content_blocks_select_public" on public.content_blocks
  for select using (true);

-- Formulario de contacto: cualquiera puede insertar, solo admin lee/actualiza
create policy "contact_messages_insert_public" on public.contact_messages
  for insert with check (true);

create policy "contact_messages_admin_select" on public.contact_messages
  for select using (public.is_admin());

create policy "contact_messages_admin_update" on public.contact_messages
  for update using (public.is_admin());

-- Sin una política de delete, el DELETE de la bandeja admin afecta 0 filas por RLS
-- (el inbox lo quitaba de la UI de forma optimista y el mensaje reaparecía al
-- recargar). Solo admin puede borrar.
drop policy if exists "contact_messages_admin_delete" on public.contact_messages;
create policy "contact_messages_admin_delete" on public.contact_messages
  for delete using (public.is_admin());

-- Escritura solo admin
create policy "categories_admin_all" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "projects_admin_all" on public.projects
  for all using (public.is_admin()) with check (public.is_admin());

create policy "project_categories_admin_all" on public.project_categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "project_images_admin_all" on public.project_images
  for all using (public.is_admin()) with check (public.is_admin());

create policy "services_admin_all" on public.services
  for all using (public.is_admin()) with check (public.is_admin());

create policy "content_blocks_admin_all" on public.content_blocks
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 8. Storage buckets (sección 4 del plan)
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('project-images', 'project-images', true),
  ('service-images', 'service-images', true),
  ('content-images', 'content-images', true)
on conflict (id) do nothing;

-- Lectura pública de los tres buckets
create policy "storage_public_read"
  on storage.objects for select
  using (bucket_id in ('project-images', 'service-images', 'content-images'));

-- Escritura solo admin
create policy "storage_admin_insert"
  on storage.objects for insert
  with check (bucket_id in ('project-images', 'service-images', 'content-images') and public.is_admin());

create policy "storage_admin_update"
  on storage.objects for update
  using (bucket_id in ('project-images', 'service-images', 'content-images') and public.is_admin());

create policy "storage_admin_delete"
  on storage.objects for delete
  using (bucket_id in ('project-images', 'service-images', 'content-images') and public.is_admin());