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
PostgREST / Auth   ← RLS decide qué puede ver/escribir cada rol
```

Las imágenes **no** pasan por aquí: van a Cloudinary con firma de Vercel Functions y solo el texto (la `secure_url`) llega a la DB. Ver [[Cloudinary y Media]].

## Reglas de seguridad

- **Nunca se coloca una `service_role` key en el frontend** — solo la anon key. Tampoco en las Functions de Vercel: validan el JWT del llamante y consultan el rol con esa misma anon key (ver [[Cloudinary y Media]]).
- **Nunca se desactiva RLS** para solucionar un error: RLS es la fuente de verdad de permisos; los guards del frontend son solo UX (ver [[Row Level Security]]).
- Los **seeds estáticos** de la app son el fallback cuando la tabla no existe o no hay credenciales; una tabla existente y vacía muestra el estado vacío real (nº 8 de [[Auditoría y Correcciones]]).

## Notas

- El esquema real son las **migraciones versionadas** de `supabase/migrations/` (0001–0006); `supabase/schema.sql` es un stub que ya no crea nada. Aplicar con `supabase db push` y verificar con los counts de [[Seeds]].
- El guardado de proyectos va por una RPC, `public.admin_save_project` (migración `20260917000004` + correctiva `20260917000005`): una sola transacción para proyecto + imágenes + categorías. `supabase/verify-admin-save-project.sql` comprueba existencia, firma, permisos y comportamiento.
- Los E2E de escritura (admin CRUD, bandeja) **escriben datos reales** → apuntar a un proyecto de **pruebas**, no producción (ver [[Testing]]).

## Notas del cluster

- [[Esquema de Base de Datos]] — las 8 tablas, funciones y triggers
- [[Row Level Security]] — matriz de políticas anon / user / admin
- [[Storage]] — buckets legacy y políticas de archivos
- [[Cloudinary y Media]] — el proveedor actual de imágenes (fuera de este cluster, pero comparte el JWT del admin)
- [[Seeds]] — schema + seed y su paridad con los seeds estáticos

## Ver también

- [[Arquitectura]] · [[Autenticación y Autorización]] · [[Pendientes Manuales]]