---
title: Arquitectura
tags:
  - ingesocc
  - angular
  - arquitectura
fecha: 2026-09-03
estado: activo
---

# Arquitectura

Aplicación **Angular 19** con componentes standalone, CSR (client-side rendering) servida como SPA por Vercel, con **Supabase** como backend (Postgres + Auth + Storage + RLS).

## Capas

```text
UI (plantillas + componentes)
  ↓
Components (Angular standalone, Signals)
  ↓
Signals / State (señales por feature)
  ↓
Data Access (servicios en `data-access/` por feature)
  ↓
Supabase (@supabase/supabase-js, wrapper único en core)
  ↓
PostgreSQL / Auth / Storage (RLS como fuente de verdad de permisos)
```

## Principios

1. **Separación estricta** — los componentes no ejecutan queries de Supabase: todo pasa por el servicio `data-access/` de su feature. Ver [[CRUD Proyectos]] y [[CRUD Servicios]].
2. **Dos capas de contenido** — CRUD total para `projects`/`services`; edición in-place de `content_blocks`. Ver [[Content Blocks]].
3. **Never trust the client** — los guards protegen la navegación, pero **RLS protege los datos** y las **storage policies** protegen los archivos. Ver [[Row Level Security]] y [[Storage]].
4. **Seeds como fallback, no como máscara** — el fallback estático solo cubre "tabla inexistente"; una tabla **existente y vacía** muestra el estado vacío real (bug corregido, ver [[Auditoría y Correcciones]] nº 8).
5. **Carga diferida del SDK** — supabase-js se importa con `import()` para no bloquear el primer pintado (ver [[Performance y Lighthouse]]).

## Datos

- Proyecto Supabase único (tests y prod comparten credenciales de entorno; los E2E de escritura deben apuntar al proyecto de **pruebas**).
- El esquema real vive en `supabase/schema.sql` y el seed en `supabase/seed.sql` — **el esquema es la fuente de verdad** de la estructura de datos (ver [[Seeds]] y [[Esquema de Base de Datos]]).

## Ver también

- [[Stack Tecnológico]] · [[Estructura del Código]] · [[Rutas y Navegación]]
- [[Supabase]] · [[Autenticación y Autorización]]
- [[Performance y Lighthouse]] · [[Despliegue Vercel]]