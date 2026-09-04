---
title: Row Level Security
tags:
  - ingesocc
  - supabase
  - rls
  - seguridad
fecha: 2026-09-03
estado: activo
---

# Row Level Security

Todas las tablas tienen RLS habilitado. La app usa la **anon key**; RLS (no el frontend) es la fuente de verdad de permisos. Regresión automatizable en `supabase/rls-checks.sql`.

## Matriz de políticas

| Tabla | Anónimo | Usuario (`user`) | Admin |
|---|---|---|---|
| `profiles` | — | select/update **propia fila**, sin cambiar `role` | select propia; rol por SQL |
| `categories` | select | select | todo |
| `projects` | select `status='published'` | select publicado | todo (incluye drafts) |
| `project_categories` | select | select | todo |
| `project_images` | select | select | todo |
| `services` | select `status='published'` | select publicado | todo |
| `content_blocks` | select | select | todo |
| `contact_messages` | **insert** | insert | select/update/delete |

## Políticas clave

- **`profiles_update_own`** — `using (id = auth.uid()) with check (id = auth.uid() and role = 'user')`: un usuario puede editar su fila pero **nunca su rol**. Sin `with check`, una policy `FOR UPDATE` hereda el `using` y cualquiera podía ejecutar `update profiles set role = 'admin'` (elevación de privilegios — P0 corregido, ver [[Auditoría y Correcciones]]).
- **`contact_messages_admin_delete`** — sin política `DELETE`, el botón "eliminar" de la bandeja afectaba 0 filas en silencio (P0 corregido).
- **Escritura solo admin** — `*_admin_all` con `using (is_admin()) with check (is_admin())` en `categories`, `projects`, `project_categories`, `project_images`, `services`, `content_blocks`.
- **Insert público** — `contact_messages_insert_public` (`with check (true)`): cualquiera puede enviar el formulario de contacto; nadie más puede leer la bandeja.

## Storage

Las políticas de `storage.objects` (lectura pública de los 3 buckets, escritura solo admin) viven en `schema.sql` sección 8 — ver [[Storage]].

## Anti-XSS

0 usos de `innerHTML`/`bypassSecurityTrust*`/`DomSanitizer` en `src/app`: todo el render es interpolación escapada por Angular.

## Verificación

- `supabase/rls-checks.sql` — regresión anon/user/admin (auto-promoción bloqueada, delete admin de mensajes, publicado vs draft, CRUD bloqueado para anon/user, storage). **Pendiente de ejecutar** en el proyecto de pruebas (ver [[Pendientes Manuales]]).

## Ver también

- [[Esquema de Base de Datos]] · [[Autenticación y Autorización]] · [[Supabase]]