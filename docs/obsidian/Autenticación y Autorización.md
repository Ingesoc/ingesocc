---
title: Autenticación y Autorización
tags:
  - ingesocc
  - supabase
  - seguridad
  - auth
fecha: 2026-09-03
estado: activo
---

# Autenticación y Autorización

Flujo completo: **Supabase Auth → sesión → `profiles` → rol → guard → admin**.

```text
Supabase Auth (email/password)
  ↓
AuthService (data-access/auth) — login, logout, restauración de sesión
  ↓
profiles.role ('user' | 'admin')  ← única fuente del rol
  ↓
authGuard (CanActivateFn async) — protege /admin/*
```

## Piezas

- **`AuthService`** (`features/auth/data-access/`): `login`/`logout`, `restoreSession()`, `whenReady()` (promesa que resuelve cuando la sesión persistida se restauró), `isAdmin()` con rol desde `profiles` y **fallback `'user'`** si la tabla no existe aún.
- **`authGuard`** (`features/auth/auth.guard.ts`): es **async** y espera `whenReady()` antes de decidir — sin esto, un admin con sesión persistida era rechazado al refrescar `/admin/*` (deep-link, corregido nº 2 de [[Auditoría y Correcciones]]).
- **Login** (`/admin/login`): valida el rol tras el login; usuario con rol `user` → cierra sesión y muestra mensaje claro (nº 3). Errores de Supabase Auth traducidos a español vía `mapAuthError`.

## Reglas

- Los guards protegen la **navegación**; **RLS protege los datos** (ver [[Row Level Security]]). No confiar solo en el frontend.
- El rol se asigna **solo por SQL** (dashboard / rol postgres), nunca desde el cliente: la policy `profiles_update_own` bloquea la auto-promoción (P0 corregido).
- El usuario admin se crea en Supabase (Authentication → Users) y luego:

```sql
update public.profiles set role = 'admin' where id = '<user id>';
```

## Casos cubiertos

- Login ok / error (mensajes en español) · logout · sesión persistente tras refresh · sesión expirada · anónimo → `/admin/login` · autenticado sin rol admin → mensaje + logout · deep-link a `/admin/*` con sesión válida.

## Ver también

- [[Rutas y Navegación]] · [[Row Level Security]] · [[Testing]] · [[Pendientes Manuales]]