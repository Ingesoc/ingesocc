---
title: Auditoría y Correcciones
tags:
  - ingesocc
  - auditoria
  - changelog
fecha: 2026-09-03
estado: activo
---

# Auditoría y Correcciones

Registro de los bugs reales encontrados y corregidos durante la auditoría. La versión completa, con formato PROBLEM/CAUSE/SOLUTION/FILES/TEST/RESULT, vive en `docs/cambios-auditoria-final.md` del repo; esta nota es el índice navegable.

## Corregido (índice)

| # | Bug | Nota relacionada |
|---|---|---|
| 1 | Logo roto en login y sidebar admin | [[Autenticación y Autorización]] |
| 2 | Deep-link a `/admin` rechazado tras refresh (guard decidía antes de restaurar sesión) | [[Autenticación y Autorización]] |
| 3 | Login sin rol admin: loop silencioso (UX) | [[Autenticación y Autorización]] |
| 4 | `ContentBlocksService` ocultaba errores reales de persistencia | [[Content Blocks]] |
| 5 | Imagen de bloque rota tras editar sin recargar | [[Content Blocks]] |
| 6 | Filtro público con categorías fijas en código | [[CRUD Proyectos]] |
| 7 | Uploads sin validación de tipo de archivo (MIME/extensión) | [[Storage]] |
| 8 | Tabla vacía ≠ seed estático (contenido fantasma) | [[Supabase]] |
| 9 | Error de slug duplicado en inglés (23505) + `maxLength` faltante | [[CRUD Proyectos]] / [[Contacto y Mensajes]] |
| 10 | Panel admin sin navegación en móvil | [[Rutas y Navegación]] |
| 11 | SEO: `og:image` por proyecto, `og:locale`, `twitter:*` | [[SEO]] |
| 12 | `schema.sql` no re-ejecutable | [[Seeds]] |
| 13 | Runner de tests roto (0 specs) → suite unitaria restaurada | [[Testing]] |
| 14 | Primera aplicación de `schema.sql` en DB vacía (42P01, orden de `is_admin()`) | [[Esquema de Base de Datos]] |
| 15 | `seed.sql`: aridad inconsistente en `content_blocks` | [[Seeds]] |
| 16 | Seed sin imágenes (paridad con seeds estáticos: 6 bloques, 2 fotos de servicio, 17 imágenes de proyecto) | [[Seeds]] / [[Storage]] |
| 17 | CRUD contra DB real: insert/update con columnas camelCase (PGRST204) en proyectos **y** servicios | [[CRUD Proyectos]] / [[CRUD Servicios]] |
| 18 | `load()` rompía con el embed to-one de categorías (TypeError; error oculto por el seed) | [[CRUD Proyectos]] |
| 19 | CRUD de servicios sin cobertura E2E → `e2e/admin-services.spec.ts` | [[Testing]] |
| 20 | Carrera foto/guardar en el form de servicios (pérdida silenciosa de foto) | [[CRUD Servicios]] |

## Seguridad (P0)

- **Elevación de privilegios**: `profiles_update_own` permitía auto-promoverse a `admin` → `with check (id = auth.uid() and role = 'user')` (nº RLS, ver [[Row Level Security]]).
- **DELETE de `contact_messages` sin política** → la bandeja "eliminaba" sin persistir → nueva policy `contact_messages_admin_delete`.

## QA visual y CSS

- **Regla CSS sin capa**: `a { color: inherit }` anulaba todas las utilities de color de Tailwind sobre `<a>` → movida a `@layer base` (ver [[Guía de Estilo Visual]]).
- Hover del CTA del header: texto claro sobre naranja (3.4:1) → `hover:text-primary` (5.2:1).

## Fuentes

- Registro completo: `docs/cambios-auditoria-final.md`
- Auditoría vs. plan maestro: `docs/test-plan-audit.md`
- Regresión RLS automatizable: `supabase/rls-checks.sql` (pendiente de ejecutar — [[Pendientes Manuales]])

## Ver también

- [[Pendientes Manuales]] · [[Testing]] · [[Performance y Lighthouse]]