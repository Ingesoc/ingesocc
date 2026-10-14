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
- **Metadatos de lead** (slice 3.1, opcionales): `project_type` (Construcción/Diseño/Remodelación/Infraestructura/Industria/Salud/Otro), `budget_range` (rangos en $100M/$500M) y `timeline` (Inmediato…Más de un año) — selects que el admin ve en la bandeja como contexto comercial.
- **Honeypot `website`**: `<input>` en `div.sr-only` con `aria-hidden`, `tabindex="-1"` y `autocomplete="off"` (oculto para humanos, fuera de la tabulación); los bots lo rellenan y la fila se marca `is_spam = true` (se conserva como evidencia). El formulario humano lo envía siempre vacío.
- Estados: `submitting` (botón deshabilitado, previene doble submit) · `submitted` (éxito) · `submitError` (error visible) · validación en vivo.
- RLS: **insert público** (`with check (true)`), lectura solo admin.

## Bandeja admin (`/admin/mensajes`)

- Listado con leído/no leído, marcar como leído, **eliminar con confirmación**.
- **Estado de gestión** (slice 3.1): nuevo / contactado / cerrado — el admin actualiza el seguimiento comercial desde la bandeja.
- **Spam**: los mensajes `is_spam` se resaltan (borde/etiqueta) para que el admin los borre; un bot recibió "éxito" de Supabase pero la fila **no cruza el guard** (ver abajo), nunca se pierde el ataque.
- Empty state: "No hay mensajes todavía".
- El delete **persiste** gracias a la política `contact_messages_admin_delete` (faltaba — P0 corregido; sin ella el inbox quitaba el mensaje de forma optimista y reaparecía al recargar).

## Anti-spam en la DB (migración `20260918000005`, slice 3.1)

El `INSERT` es público por RLS y no exige sesión: la barrera real vive en el trigger `contact_messages_lead_guard` (`before insert`, `security invoker` — no se salta ninguna política):

1. **Honeypot**: si `website` viene con contenido → `is_spam = true` y la fila **se guarda** (evidencia).
2. **Rate-limit por email**: más de 3 mensajes del mismo correo dentro de una ventana de 15 minutos (excluyendo spam) → `return null` descarta la fila **en silencio** (el cliente recibe éxito sin filas; el bot no aprende la regla).

Los checks de valores (`project_type_enum`, `budget_range_enum`, `timeline_enum`, `status_enum`) viven en la propia migración para que la forma `{label}` de los `<option>` del formulario y la DB no deriven.

## Flujo E2E verificado

Formulario público → submit → bandeja admin → marcar leído (persiste tras reload) → eliminar (ver [[Testing]]).

## Ver también

- [[Esquema de Base de Datos]] · [[Row Level Security]] · [[Rutas y Navegación]]