---
title: Content Blocks
tags:
  - ingesocc
  - contenido
  - supabase
  - admin
fecha: 2026-09-03
estado: activo
---

# Content Blocks

Sistema de **contenido editable sin tocar código**: un admin modifica textos, números e imágenes de las páginas públicas desde el propio sitio (modo edición in-place) **o** desde el CMS `/admin/contenido` (pestañas por página, editor según el tipo de bloque: texto, enriquecido, número, imagen).

```text
Edit Mode (toggle flotante, solo admin)
  ↓
EditableText / EditableImage (en Home, Quiénes Somos, Contacto, header y footer)
  ↓
ContentBlocksService (data-access)
  ↓
content_blocks (Supabase, unique (page, section_key))
  ↓
Público ve el cambio guardado
```

## Piezas

- **`EditModeService`** — estado global del modo edición; activable solo con `isAdmin()`, se desactiva al hacer logout.
- **`EditModeToggle`** — botón flotante renderizado solo cuando `canEdit()`.
- **`EditableText`** — edición inline con guardar/cancelar y validación (número, texto vacío).
- **`EditableImage`** — reemplazo de imagen (upload por [[Cloudinary y Media]]), emite `fetchpriority`/`lazy` según contexto (hero del Home: `high`).
- El CMS (`/admin/contenido`) sube por el mismo servicio con el límite de **5 MB**; al reemplazar, la imagen anterior se borra solo después de que el bloque se guardó, y la nueva se borra si el guardado falla (compensación).

## Reglas de persistencia (importante)

- El fallback en memoria (cambio local sin DB) queda reservado a **tabla inexistente** (código Postgres `42P01`/`PGRST205`, "does not exist") o credenciales no configuradas.
- **Cualquier otro error se re-lanza** para que la UI muestre el error — antes se tragaba todo con `console.warn` y el cambio desaparecía al recargar (corregido nº 4).
- Al aplicar un cambio en memoria, `valueImagePath` se resuelve a URL pública para que la imagen no quede rota hasta recargar (nº 5).

## Inventario de bloques

**69 `section_key`s** (texto, richtext, número e imagen) repartidos en `global` (header/footer), `home`, `about` y `contact` — idénticos entre DB y seed estático (ver [[Seeds]]).

Del slice 3.4: el grupo `about.certificaciones` (4 items × `title`/`issuer`/`link`/`logo`) nace **vacío** a propósito — las certificaciones/licencias las aporta el cliente desde el CMS (plan 1.4); la sección de Quiénes Somos muestra el estado "en validación" mientras no haya títulos. Catálogo en `content-blocks.catalog.ts` (`GROUP_LABELS.certificaciones`).

## Ver también

- [[Seeds]] · [[Esquema de Base de Datos]] · [[Row Level Security]] · [[Cloudinary y Media]] · [[Rutas y Navegación]]