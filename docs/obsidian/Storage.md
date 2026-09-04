---
title: Storage
tags:
  - ingesocc
  - supabase
  - storage
  - seguridad
fecha: 2026-09-03
estado: activo
---

# Storage

Tres buckets públicos creados por `schema.sql` (sección 8, con `on conflict do nothing`):

| Bucket | Uso |
|---|---|
| `project-images` | Portadas y galería de proyectos |
| `service-images` | Fotos de servicios |
| `content-images` | Imágenes de `content_blocks` (hero, historia, equipo) |

## Políticas (en `storage.objects`)

- **Lectura pública** (`storage_public_read`) — cualquiera puede ver los objetos de los 3 buckets.
- **Escritura solo admin** (`storage_admin_insert/update/delete`) — `bucket_id in (...) and is_admin()`.

> [!warning] No almacenar binarios en Postgres
> Las imágenes viven en buckets; la DB solo guarda `storage_path`/`photo_path`/`value_image_path` (texto). `resolvePublicUrl` (en `core/supabase.service.ts`) convierte el path en URL pública; si el valor ya es una URL absoluta (caso de los seeds), la devuelve tal cual.

## Flujo de upload (admin)

1. El admin elige el archivo (input con `accept="image/*"`).
2. **Validación de tipo**: `isAcceptableImageFile` (`core/image-utils.ts`) — MIME `image/*` **y** extensión JPG/PNG/WebP/GIF/AVIF, con mensaje de error en español (nº 7 de [[Auditoría y Correcciones]]).
3. **Compresión** con `browser-image-compression` (≤2 MB / 2000 px) — async (web worker).
4. Upload al bucket → se guarda el `storage_path` en la fila.
5. El form de servicios **deshabilita el botón de guardar** mientras la foto se procesa ("Procesando foto…") — corrige la carrera que perdía la foto en silencio (nº 20 de [[Auditoría y Correcciones]]).

## Borrado

- `deleteProject`/`removeProjectImage`/`deleteService` llaman a `storage.remove()` con cada path almacenado; el resultado se **ignora** (no lanza) — por eso los seeds con URLs absolutas no rompen la eliminación admin (nº 16).
- Riesgo menor documentado: si el delete de DB falla tras borrar el objeto, queda un objeto huérfano en el bucket.

## Ver también

- [[Row Level Security]] · [[Esquema de Base de Datos]] · [[CRUD Proyectos]] · [[CRUD Servicios]] · [[Content Blocks]]