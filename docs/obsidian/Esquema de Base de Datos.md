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

Definido en `supabase/schema.sql` (idempotente: `drop … if exists` + `create … if not exists` + `create or replace`). **8 tablas** en `public`:

| Tabla | Columnas clave | Notas |
|---|---|---|
| `profiles` | `id` (FK auth.users), `email`, `role` ('user'/'admin'), timestamps | Se crea sola vía trigger al registrarse; `role` solo se asigna por SQL con rol postgres/dashboard |
| `categories` | `name` (unique), `slug` (unique), `sort_order` | Las 4 del filtro público |
| `projects` | `title`, `slug` (unique), `description`, `price_min_wages`, `status` ('draft'/'published'), `featured`, `sort_order` | `slug` único = URL pública |
| `project_categories` | `project_id` + `category_id` (PK compuesta, cascade) | Relación N:M |
| `project_images` | `project_id` (cascade), `storage_path`, `is_cover`, `sort_order` | Sin clave natural → seed usa `NOT EXISTS` para idempotencia |
| `services` | `name`, `slug` (unique), `description`, `photo_path` (nullable), `icon_name` (fallback lucide), `status`, `sort_order` | Foto **o** ícono |
| `content_blocks` | `page`, `section_key`, `type` ('text'/'richtext'/'image'/'number'), `value_text`, `value_number`, `value_image_path` | `unique (page, section_key)` |
| `contact_messages` | `name`, `email`, `phone`, `subject`, `message`, `read` | Insert público, lectura solo admin |

## Funciones y triggers

| Objeto | Rol |
|---|---|
| `set_updated_at()` | Trigger `before update` en `projects`, `services`, `content_blocks` |
| `is_admin()` | `security definer`, consulta `profiles` por `auth.uid()` — base de todas las políticas de escritura |
| `handle_new_user()` | Trigger `after insert on auth.users` → crea la fila en `profiles` |

> [!warning] Orden de creación (42P01)
> `is_admin()` es `language sql` y Postgres **valida el cuerpo al crearla**: debe definirse **después** de `create table public.profiles`. Definirla antes hacía fallar la primera aplicación sobre una DB vacía (`relation "public.profiles" does not exist`) — corregido (nº 14 de [[Auditoría y Correcciones]]).

## Storage

Los buckets se crean en la sección 8 del mismo archivo (ver [[Storage]]).

## Ver también

- [[Row Level Security]] · [[Seeds]] · [[CRUD Proyectos]] · [[CRUD Servicios]] · [[Contacto y Mensajes]]