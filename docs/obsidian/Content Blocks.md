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

Sistema de **contenido editable sin tocar código**: un admin modifica textos, números e imágenes de las páginas públicas desde el propio sitio (modo edición in-place). **No es CRUD admin** — `/admin/contenido` es un placeholder informativo (intencional).

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
- **`EditableImage`** — reemplazo de imagen (upload a `content-images`), emite `fetchpriority`/`lazy` según contexto (hero del Home: `high`).

## Reglas de persistencia (importante)

- El fallback en memoria (cambio local sin DB) queda reservado a **tabla inexistente** (código Postgres `42P01`/`PGRST205`, "does not exist") o credenciales no configuradas.
- **Cualquier otro error se re-lanza** para que la UI muestre el error — antes se tragaba todo con `console.warn` y el cambio desaparecía al recargar (corregido nº 4).
- Al aplicar un cambio en memoria, `valueImagePath` se resuelve a URL pública para que la imagen no quede rota hasta recargar (nº 5).

## Inventario de bloques

53 `section_key`s (texto, richtext, número e imagen) repartidos en `global` (header/footer), `home`, `about` y `contact` — idénticos entre DB y seed estático (ver [[Seeds]]).

## Ver también

- [[Seeds]] · [[Esquema de Base de Datos]] · [[Row Level Security]] · [[Storage]] · [[Rutas y Navegación]]