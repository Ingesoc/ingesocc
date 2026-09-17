-- ============================================================================
-- Ingesocc SAS — 0001: esquema inicial (tablas, funciones y triggers)
-- Extraído de supabase/schema.sql (secciones 0–6). Las políticas RLS viven en
-- 20260917000001_rls_policies.sql y los buckets en 20260917000002_storage.sql.
--
-- Idempotente (drop if exists / if not exists / create or replace): puede
-- aplicarse sobre DBs donde ya se aplicó el schema.sql original sin romper ni
-- perder datos, y el CLI de Supabase la registra como migración aplicada.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Helpers
-- ----------------------------------------------------------------------------

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

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ¿El usuario autenticado tiene rol admin? (usado por las políticas RLS).
-- Va DESPUÉS de `profiles`: es `language sql` y Postgres valida el cuerpo al
-- crearla — si se definiera antes de que exista la tabla, la primera aplicación
-- sobre una DB vacía fallaría con 42P01 (la re-ejecución sí funcionaba porque
-- la tabla ya existía).
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. categories (sección 3.1 del plan)
-- ----------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order int not null default 0
);

-- ----------------------------------------------------------------------------
-- 3. projects + project_categories + project_images (sección 3.2 del plan)
-- ----------------------------------------------------------------------------

create table if not exists public.projects (
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

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create table if not exists public.project_categories (
  project_id uuid not null references public.projects(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (project_id, category_id)
);

create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null,
  is_cover boolean not null default false,
  sort_order int not null default 0
);

-- ----------------------------------------------------------------------------
-- 4. services (sección 3.3 del plan)
-- ----------------------------------------------------------------------------

create table if not exists public.services (
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

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. content_blocks (sección 3.4 del plan — módulos editables)
-- ----------------------------------------------------------------------------

create table if not exists public.content_blocks (
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

drop trigger if exists content_blocks_set_updated_at on public.content_blocks;
create trigger content_blocks_set_updated_at
  before update on public.content_blocks
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. contact_messages (sección 3.5 del plan)
-- ----------------------------------------------------------------------------

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
