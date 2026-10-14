---
title: Esquema de Base de Datos
tags:
  - ingesocc
  - supabase
  - base-de-datos
  - postgres
fecha: 2026-09-03
estado: activo
---

# Esquema de Base de Datos

Definido en `supabase/migrations/` (versionado; `supabase/schema.sql` es un stub que apunta ahí — no aplicarlo como fuente de verdad). **9 tablas** en `public`:

| Tabla | Columnas clave | Notas |
|---|---|---|
| `profiles` | `id` (FK auth.users), `email`, `role` ('user'/'admin'), timestamps | Se crea sola vía trigger al registrarse; `role` solo se asigna por SQL con rol postgres/dashboard |
| `categories` | `name` (unique), `slug` (unique), `sort_order` | Las 4 del filtro público |
| `projects` | `title`, `slug` (unique), `description`, `location`, `external_url`, `price_min_wages`, `status` ('draft'/'published'), `featured`, `sort_order` | Caso de estudio (slices 3.3): `client`, `scope`, `timeline`, `progress`, `results` (text) + `key_figures` (jsonb `{label, value}[]`, default `[]`) |
| `project_categories` | `project_id` + `category_id` (PK compuesta, cascade) | Relación N:M |
| `project_images` | `project_id` (cascade), `storage_path`, `is_cover`, `sort_order`, `alt`/`title`/`description`/`category` | Sin clave natural → seed usa `NOT EXISTS` para idempotencia |
| `services` | `name`, `slug` (unique), `description`, `photo_path` (nullable), `icon_name` (fallback lucide), `status`, `sort_order` | Detalle editable (slice 3.2): `scope` (text), `deliverables` (jsonb de textos) y `faq` (jsonb `{q,a}[]`), todos nullable |
| `content_blocks` | `page`, `section_key`, `type` ('text'/'richtext'/'image'/'number'), `value_text`, `value_number`, `value_image_path` | `unique (page, section_key)` |
| `contact_messages` | `name`, `email`, `phone`, `subject`, `message`, `read` | Lead (slice 3.1): `project_type`/`budget_range`/`timeline` (nullable), `status` ('new'/'contacted'/'closed'), `is_spam`, `website` (honeypot). Insert público, lectura solo admin |
| `testimonials` | `author`, `role`, `quote`, `rating` (1–5, nullable), `status` ('draft'/'published'), `sort_order` | Creada en `20260918000008` (slice 3.5). RLS: lectura pública solo `published`, CRUD solo admin. Sin seeds (no se inventan opiniones) |

## Funciones y triggers

| Objeto | Rol |
|---|---|
| `set_updated_at()` | Trigger `before update` en `projects`, `services`, `content_blocks`, `testimonials` |
| `is_admin()` | `security definer`, consulta `profiles` por `auth.uid()` — base de todas las políticas de escritura |
| `handle_new_user()` | Trigger `after insert on auth.users` → crea la fila en `profiles` |
| `admin_save_project(...)` | RPC atómica de guardado de proyectos (13 parámetros), `security invoker`, solo `authenticated` — ver [[CRUD Proyectos]] |
| `contact_messages_lead_guard()` | Trigger `before insert on contact_messages`: honeypot → `is_spam = true`; rate-limit por email (3 por ventana de 15 min) → `return null` — ver [[Contacto y Mensajes]] |

> [!warning] Orden de creación (42P01)
> `is_admin()` es `language sql` y Postgres **valida el cuerpo al crearla**: debe definirse **después** de `create table public.profiles`. Definirla antes hacía fallar la primera aplicación sobre una DB vacía (`relation "public.profiles" does not exist`) — corregido (nº 14 de [[Auditoría y Correcciones]]).

## Storage

Los buckets se crean en la sección 8 del mismo archivo (ver [[Storage]]).

## Ver también

- [[Row Level Security]] · [[Seeds]] · [[CRUD Proyectos]] · [[CRUD Servicios]] · [[Contacto y Mensajes]]