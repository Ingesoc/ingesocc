---
title: CRUD Servicios
tags:
  - ingesocc
  - crud
  - servicios
  - supabase
fecha: 2026-09-03
estado: activo
---

# CRUD Servicios

Ciclo de vida completo de la entidad `services` contra Supabase (via `ServicesService` en `features/services/data-access/`).

## Campos soportados

`name` · `slug` (único) · `description` · `photo_path` (nullable) · `icon_name` (fallback lucide) · `status` (`draft`/`published`) · `sort_order`.

## Foto o ícono

- Si hay foto → se muestra la foto (URL resuelta desde `photo_path`).
- Si no → **ícono de respaldo** desde `icon_name` mapeado a componente lucide por `service-icons.ts` (`SERVICE_ICON_NAMES`); clave desconocida → sin ícono.
- Regla visual de paridad: los 2 servicios del seed con foto (Infraestructura, Hospitalarios) tienen `photo_path`; los otros 4 usan `icon_name` — igual que el fallback estático (nº 16 de [[Auditoría y Correcciones]]).

## Errores reales corregidos

1. **Insert/update camelCase** (`iconName` → `icon_name`, `sortOrder` → `sort_order`): mismo bug latente que en proyectos, corregido con `toServiceRow()` en la capa data-access (nº 17).
2. **Carrera foto/guardar** (nº 20): `onPhotoSelected` comprime la imagen de forma async (web worker); si el admin hacía clic en "Crear servicio" antes de terminar, el servicio se guardaba **sin foto y sin error**. La señal `photoProcessing` deshabilita el botón ("Procesando foto…") hasta que la compresión termina.

## Flujo del form (admin)

Validación de tipo de archivo (`image-utils.ts`, nº 7) → compresión → upload a `service-images` → preview → guardar con botón deshabilitado mientras procesa. Eliminación con confirm + `storage.remove()` (resultado ignorado, ver [[Storage]]).

## Estados de UI

Loading · empty ("Todavía no hay servicios") · error · éxito con navegación tras guardar · drafts visibles solo en el listado admin.

## Ver también

- [[CRUD Proyectos]] · [[Esquema de Base de Datos]] · [[Storage]] · [[Testing]]