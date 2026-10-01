---
title: Storage
tags:
  - ingesocc
  - supabase
  - storage
  - seguridad
  - legacy
fecha: 2026-09-03
estado: activo
---

# Storage

> [!warning] Proveedor LEGACY desde 2026-09-25
> Las imágenes **nuevas** van a Cloudinary (ver [[Cloudinary y Media]]). Estos tres buckets quedan para tres cosas: leer lo ya guardado, escribir solo si Cloudinary no está disponible, y seguir siendo el destino del borrado de rutas antiguas. No se borra ni se migra nada de aquí sin una decisión explícita.

Tres buckets públicos creados por `schema.sql` (sección 8, con `on conflict do nothing`):

| Bucket | Uso |
|---|---|
| `project-images` | Portadas y galería de proyectos |
| `service-images` | Fotos de servicios |
| `content-images` | Imágenes de `content_blocks` (hero, historia, equipo) |

## Políticas (en `storage.objects`)

- **Lectura pública** (`storage_public_read`) — cualquiera puede ver los objetos de los 3 buckets.
- **Escritura solo admin** (`storage_admin_insert/update/delete`) — `bucket_id in (...) and is_admin()`.

> [!note] No almacenar binarios en Postgres
> Las imágenes viven en el bucket (o en Cloudinary); la DB solo guarda texto en `storage_path`/`photo_path`/`value_image_path`. `resolvePublicUrl` (en `core/supabase.service.ts`) convierte el path en URL pública; si el valor ya es una URL absoluta —los seeds o una `secure_url` de Cloudinary— la devuelve tal cual. Esa Tolerancia es lo que permite servir ambos proveedores a la vez.

## Quién escribe aquí

Solo `core/supabase-storage.service.ts` (inyectado en `core/cloudinary.service.ts`). Ningún servicio de feature escribe en Storage directamente:

```text
CloudinaryService (único punto de entrada a media)
  ├─ sube a Cloudinary (proveedor principal)
  └─ si la API no está disponible → SupabaseStorageService.upload()
```

## Flujo de upload (admin)

1. El admin elige el archivo (input con `accept` explícito a los MIME aceptados).
2. **Validación de tipo y tamaño**: `validateImageFile` (`core/image-utils.ts`) — MIME **y** extensión JPEG/PNG/WebP/AVIF, 2 MB (5 MB en el CMS).
3. **Compresión** con `browser-image-compression` (≤2 MB / 2000 px) — async (web worker).
4. Upload a Cloudinary vía firma; se guarda la `secure_url` en la columna.
5. El botón de guardar queda deshabilitado mientras se comprime o sube ("Subiendo foto…"), y el objeto local (`URL.createObjectURL`) se revoca al salir del form.

## Borrado

- El borrado pasa por `CloudinaryService.deleteImage()`: si la referencia es una URL de Cloudinary, la destruye vía `/api/cloudinary/destroy`; si es una ruta de bucket, la borra con `storage.remove()`.
- El resultado se **ignora** (se avisa por consola): el cambio principal ya está guardado y un fallo de limpieza no debe tumbar la operación.
- Si no se puede deducir el `public_id` de una URL de Cloudinary, el borrado se omite en vez de adivinar.
- Los seeds con URLs absolutas no rompen la eliminación admin (nº 16 de [[Auditoría y Correcciones]]).
- Riesgo menor documentado: si el delete de DB falla tras borrar el objeto, queda un objeto huérfano en el bucket.

## Límites por bucket

Migración `20260917000003`: 2 MB para `project-images` y `service-images`, 5 MB para `content-images`. Son los mismos límites que aplica `core/image-utils.ts` del lado del cliente, para que el navegador rechace antes de wasting un round trip.

> [!tip] Migración física de assets: fase aparte
> Copiar los archivos de estos buckets a Cloudinary (y vaciar estos) es un proyecto en sí mismo: hay que reescribir las filas, decidir qué hacer con las URLs ya compartidas y validar que nada quede apuntando a un path muerto. No forma parte del despliegue actual.

## Ver también

- [[Cloudinary y Media]] — el proveedor principal y la compatibilidad con estos buckets
- [[Row Level Security]] · [[Esquema de Base de Datos]] · [[CRUD Proyectos]] · [[CRUD Servicios]] · [[Content Blocks]]
