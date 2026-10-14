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

`title` · `slug` (auto desde título, único en DB) · `description` · `location` · `price_min_wages` (valor en salarios mínimos, nullable) · `external_url` (micrositio oficial) · `status` (`draft`/`published`) · `featured` · `sort_order` · categorías (`project_categories` N:M con `categories`) · imágenes (`project_images`: portada `is_cover` + galería) · **caso de estudio** (slice 3.3).

## Caso de estudio (slice 3.3)

El CRUD y el detalle público soportan el caso de estudio completo del proyecto:

- `client` (cliente/entidad que contrató) · `scope` (alcance del trabajo) · `timeline` (plazo en texto) · `progress` (avance) · `results` (resultados destacados) — `text`, nullable.
- `key_figures` — `jsonb` `{label, value}[]` (p. ej. `2400 m²`); el público solo muestra los pares con ambas partes y se editan como pares en el form.
- Semántica de guardado en la RPC: `null` **no toca** el caso vigente; un objeto reemplaza el caso completo. Los `''` se normalizan a `null` y `key_figures` se filtra (sin pares vacíos).
- El detalle muestra el caso de estudio con cifras destacadas + texto libre de resultados (mosaico editorial).

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

- Upload con compresión (`browser-image-compression` ≤2 MB / 2000 px) + validación MIME/extensión/tamaño (`image-utils.ts`, nº 7).
- El guardado es **atómico**: el form sube los archivos nuevos a Cloudinary (sin fila en DB) y luego una sola RPC `admin_save_project` crea/actualiza proyecto + imágenes + categorías + **caso de estudio** en una transacción. Para proyectos nuevos el uuid se genera en el cliente, lo que permite subir al prefijo antes de que exista la fila.
- La RPC canónica tiene **13 parámetros** (`20260918000007`): 11 de la variante de ubicación + `p_external_url` (se reintroduce porque `0004` lo omitió — PGRST202) + `p_case_study`. `null` en `p_location`/`p_external_url`/`p_case_study` conserva el valor vigente; los bundles viejos siguen resolviendo por los `default`. Se dropan las dos variantes intermedias (11 args) para no dejar aridad ambigua.
- Compensación: si la RPC falla, se borran los assets recién subidos; si acierta, se limpian las imágenes eliminadas que la RPC devuelve en `orphan_storage_paths` (Storage no es transaccional).
- Cover por `is_cover`; galería con `sort_order`; el borrado pasa por `CloudinaryService` (Cloudinary o bucket legacy según la referencia, ver [[Cloudinary y Media]]).
- El detalle usa la portada como `og:image`, con `fetchpriority="high"` y transform `hero` (ver [[SEO]] y [[Performance y Lighthouse]]).

## Estados de UI

Loading · empty ("No hay proyectos…" / "No hay proyectos publicados en esta categoría") · error (banner en form, listado con error) · éxito (navegación tras guardar). Paginación pública "Cargar Más" en bloques de 8 con `hasMore` y reset al filtrar.

## Ver también

- [[Esquema de Base de Datos]] · [[Row Level Security]] · [[Cloudinary y Media]] · [[CRUD Servicios]] · [[Testing]]