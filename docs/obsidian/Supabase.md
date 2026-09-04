---
title: Supabase
tags:
  - ingesocc
  - supabase
  - base-de-datos
fecha: 2026-09-03
estado: activo
---

# Supabase

Hub de la capa de datos. Proyecto conectado: `https://ietjikoddwpdybarcwfk.supabase.co` con la URL y clave **publishable** (anon) en `src/environments/` (`environment.ts` y `environment.prod.ts` apuntan al mismo proyecto).

## Flujo de datos

```text
Components (señales)
  ↓
data-access/ (servicios por feature)
  ↓
SupabaseService (wrapper único; SDK con import() diferido)
  ↓
PostgREST / Auth / Storage   ← RLS decide qué puede ver/escribir cada rol
```

## Reglas de seguridad

- **Nunca se coloca una `service_role` key en el frontend** — solo la anon key.
- **Nunca se desactiva RLS** para solucionar un error: RLS es la fuente de verdad de permisos; los guards del frontend son solo UX (ver [[Row Level Security]]).
- Los **seeds estáticos** de la app son el fallback cuando la tabla no existe o no hay credenciales; una tabla existente y vacía muestra el estado vacío real (nº 8 de [[Auditoría y Correcciones]]).

## Notas

- El esquema real es `supabase/schema.sql` y el seed `supabase/seed.sql` — **aplicar siempre en este orden** y verificar con los counts de [[Seeds]].
- Los E2E de escritura (admin CRUD, bandeja) **escriben datos reales** → apuntar a un proyecto de **pruebas**, no producción (ver [[Testing]]).

## Notas del cluster

- [[Esquema de Base de Datos]] — las 8 tablas, funciones y triggers
- [[Row Level Security]] — matriz de políticas anon / user / admin
- [[Storage]] — buckets y políticas de archivos
- [[Seeds]] — schema + seed y su paridad con los seeds estáticos

## Ver también

- [[Arquitectura]] · [[Autenticación y Autorización]] · [[Pendientes Manuales]]