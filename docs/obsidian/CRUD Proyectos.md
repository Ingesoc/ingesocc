---
title: CRUD Proyectos
tags:
  - ingesocc
  - crud
  - proyectos
  - supabase
fecha: 2026-09-03
estado: activo
---

# CRUD Proyectos

Ciclo de vida completo de la entidad `projects` contra Supabase (via `ProjectsService` en `features/projects/data-access/`).

```text
UI (form) → validación → data-access (ProjectsService) → PostgREST → Postgres → refresh de señales
```

## Campos soportados

`title` · `slug` (auto desde título, único en DB) · `description` · `price_min_wages` (valor en salarios mínimos, nullable) · `status` (`draft`/`published`) · `featured` · `sort_order` · categorías (`project_categories` N:M con `categories`) · imágenes (`project_images`: portada `is_cover` + galería).

## Reglas de negocio

- **Los `draft` NO aparecen públicamente** — las políticas de lectura pública filtran `status='published'` en RLS (no solo en el cliente).
- **Publicación pública**: `/proyectos/:slug` sirve el proyecto publicado; draft/inexistente → "Proyecto no encontrado".
- **Slugs únicos** (constraint `unique` en DB) con error 23505 mapeado a mensaje claro en español en el form.
- Filtro público con chips desde la tabla `categories` (vía `categoryNames` del servicio) — antes usaba una constante fija (corregido nº 6).
- Borradores visibles solo en el listado admin.

## Errores reales corregidos (detalle en [[Auditoría y Correcciones]])

1. **Insert/update con columnas camelCase** (`priceMinWages` → `price_min_wages`): los payloads iban tal cual a PostgREST y el guardado fallaba con PGRST204 contra la DB real. Se mapea con `toProjectRow()` en la capa data-access (nº 17). Test unitario que verifica el payload exacto.
2. **Embed to-one de categorías**: `select('project_id, categories(name)')` devuelve **objeto** `{name}`, no array — `for...of` lanzaba `object is not iterable`, y el sitio público caía silenciosamente al seed estático. Normalizado objeto/array/null en `load()` + tipo `CategoryLinkRow` corregido (nº 18).

## Imágenes

- Upload con compresión (`browser-image-compression` ≤2 MB / 2000 px) + validación MIME/extensión (`image-utils.ts`, nº 7).
- Cover por `is_cover`; galería con `sort_order`; reemplazo y borrado con `storage.remove()` (ver [[Storage]]).
- El detalle usa la portada como `og:image` y con `fetchpriority="high"` (ver [[SEO]] y [[Performance y Lighthouse]]).

## Estados de UI

Loading · empty ("No hay proyectos…" / "No hay proyectos publicados en esta categoría") · error (banner en form, listado con error) · éxito (navegación tras guardar). Paginación pública "Cargar Más" en bloques de 8 con `hasMore` y reset al filtrar.

## Ver también

- [[Esquema de Base de Datos]] · [[Row Level Security]] · [[Storage]] · [[CRUD Servicios]] · [[Testing]]