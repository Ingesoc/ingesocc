---
title: Testimonios
tags:
  - ingesocc
  - testimonios
  - supabase
  - admin
fecha: 2026-10-12
estado: activo
---

# Testimonios

Módulo de opiniones de clientes (slice 3.5 de la fase de contenido). Tabla `testimonials` + CRUD admin en `/admin/testimonios` + sección en el Home.

## Regla de datos (plan 1.7)

**No hay seeds ni datos de ejemplo**: no se inventan opiniones de clientes. Mientras no haya testimonios **publicados**, la sección del Home se oculta sola (el servicio devuelve `[]` y el componente no renderiza). El estado de carga pública fallida también oculta la sección (nunca rompe la página).

## Esquema (`supabase/migrations/20260918000008_testimonials.sql`)

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `author` | text NOT NULL | Nombre o empresa del autor |
| `role` | text nullable | Cargo o contexto, opcional |
| `quote` | text NOT NULL | El testimonio en sí |
| `rating` | smallint | Check 1–5; `null` = el diseño no muestra la fila de estrellas |
| `status` | text NOT NULL default 'draft' | `draft` / `published` |
| `sort_order` | int NOT NULL default 0 | Orden de aparición en el Home |
| `created_at` / `updated_at` | timestamptz | Trigger `set_updated_at` en update |

### RLS

- `testimonials_select_published` — lectura pública **solo** de `status = 'published'`.
- `testimonials_admin_all` — CRUD completo con `is_admin()` (USING + WITH CHECK).

## Capa de datos (`features/testimonials/data-access/`)

- **`TestimonialsService`** (`providedIn: 'root'`, singleton): `published` (computado ordenado por `sort_order`, lo que consume el Home), `adminTestimonials` (para el panel, incluye borradores — RLS admin), `refreshAll()`, `createTestimonial()` (vuelve el id), `updateTestimonial()`, `deleteTestimonial()`, `byId()`.
- RLS decide el filtro de publicación (el servicio no duplica la condición), igual que en proyectos/servicios.
- `Testimonial` (modelo camelCase) ↔ fila: `sortOrder` ↔ `sort_order`.

## Panel admin (`/admin/testimonios`)

| Ruta | Página |
|---|---|
| `/admin/testimonios` | Listado: autor, preview de la cita, estrellas, badge de estado, editar/eliminar con confirmación, empty state y skeletons |
| `/admin/testimonios/nuevo` | Formulario de creación (`author` ≥3, `quote` ≥10, `role` opcional, valoración 1–5 o "sin mostrar", estado, orden) |
| `/admin/testimonios/:id` | Edición (carga por `byId` sobre `loadAll`) |

Tras guardar/eliminar el panel refresca (`refreshAll`) y navega al listado. En el menú admin aparece como **Testimonios** (icono estrella) entre Contenido y Mensajes.

## Home

Sección editorial ordenada por `sort_order`; las estrellas solo se pintan si `rating` no es `null`. El CTA final de cierre enumera las secciones del Home dinámicamente (`06` → `07` cuando existe la sección de testimonios).

## Ver también

- [[Inicio]] · [[Esquema de Base de Datos]] · [[Row Level Security]] · [[Rutas y Navegación]] · [[Testing]]