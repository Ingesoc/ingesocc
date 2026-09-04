---
title: Contacto y Mensajes
tags:
  - ingesocc
  - contacto
  - supabase
  - admin
fecha: 2026-09-03
estado: activo
---

# Contacto y Mensajes

Formulario público → tabla `contact_messages` → bandeja admin en `/admin/mensajes`.

## Formulario público (`/contacto`)

- Validación: `name` requerido + min 2 · `email` requerido + formato · `message` requerido + min 10; `phone`/`subject` opcionales.
- **`maxLength`** en todos los campos (80 / 254 / 30 / 200 / 5000) con mensajes por error (nº 9 de [[Auditoría y Correcciones]]).
- Estados: `submitting` (botón deshabilitado, previene doble submit) · `submitted` (éxito) · `submitError` (error visible) · validación en vivo.
- RLS: **insert público** (`with check (true)`), lectura solo admin.

## Bandeja admin (`/admin/mensajes`)

- Listado con leído/no leído, marcar como leído, **eliminar con confirmación**.
- Empty state: "No hay mensajes todavía".
- El delete **persiste** gracias a la política `contact_messages_admin_delete` (faltaba — P0 corregido; sin ella el inbox quitaba el mensaje de forma optimista y reaparecía al recargar).

## Flujo E2E verificado

Formulario público → submit → bandeja admin → marcar leído (persiste tras reload) → eliminar (ver [[Testing]]).

## Ver también

- [[Esquema de Base de Datos]] · [[Row Level Security]] · [[Rutas y Navegación]]