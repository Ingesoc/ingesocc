---
title: Ingesocc SAS — Mapa del Vault
tags:
  - ingesocc
  - moc
  - documentacion
fecha: 2026-09-03
estado: activo
---

# Ingesocc SAS — Mapa del Vault

Documentación técnica del sitio corporativo de Ingesocc S.A.S., estructurada como un vault de Obsidian. Cada nota cubre una pieza de la arquitectura, los flujos funcionales o la operación del proyecto, con enlaces entre sí para navegar por contexto.

> [!info] Ficha rápida
> - **Producto**: sitio corporativo + panel admin (Angular 19 SPA, CSR)
> - **Backend**: Supabase (Postgres + Auth + RLS) + **Cloudinary** para imágenes vía Vercel Functions
> - **UI**: rediseño integral UI/UX completado (2026-09-04) — ver [[Guía de Estilo Visual]] y [[Auditoría y Correcciones]] nº 21
> - **Contenido**: fase de contenido productivo (slices 3.1–3.5) — contacto/lead con anti-spam, detalle de servicio, caso de estudio de proyecto, certificaciones y testimonios
> - **Estado**: production-ready en desarrollo — ver [[Pendientes Manuales]]
> - **Docs fuente (repo)**: [[Auditoría y Correcciones]] · [[Testing]]

## Clusters

### Manuales de uso
- [[Guías de Uso]] — manual operativo completo: sitio público, panel admin paso a paso, edición in-place, desarrollo, base de datos y despliegue
- [[Casos de Uso]] — catálogo completo de casos de uso (actores, precondiciones, flujos y postcondiciones)

### Arquitectura
- [[Arquitectura]] — capas y flujo de datos (UI → components → signals → data-access → Supabase)
- [[Stack Tecnológico]] — stack inamovible y scripts de `package.json`
- [[Estructura del Código]] — árbol de `src/app`, `e2e`, `tools`, `supabase`
- [[Rutas y Navegación]] — rutas públicas y admin, guard, deep links
- [[Guía de Estilo Visual]] — tokens de diseño y reglas de contraste

### Supabase (datos y seguridad)
- [[Supabase]] — hub de la capa de datos
- [[Esquema de Base de Datos]] — las 9 tablas, funciones y triggers
- [[Row Level Security]] — matriz de políticas por rol (anon / user / admin)
- [[Storage]] — buckets legacy y por qué siguen existiendo
- [[Seeds]] — `schema.sql` + `seed.sql` y su paridad con los seeds estáticos

### Media
- [[Cloudinary y Media]] — proveedor principal de imágenes: upload firmado, autorización, transforms, degradación a Storage y compensación de huérfanos

### Funcionalidades
- [[Autenticación y Autorización]] — login, sesión, guard y roles
- [[CRUD Proyectos]] — ciclo de vida completo de `projects` (incl. caso de estudio, slice 3.3)
- [[CRUD Servicios]] — ciclo de vida completo de `services` (incl. detalle editable, slice 3.2)
- [[Content Blocks]] — modo de edición in-place + CMS de contenido
- [[Contacto y Mensajes]] — formulario público y bandeja admin (incl. metadatos de lead y anti-spam, slice 3.1)
- **[[Testimonios]]** — CRUD admin y sección del Home (slice 3.5)

### Calidad y operación
- [[SEO]] — meta por ruta, OG, canonical, sitemap
- [[Performance y Lighthouse]] — presupuestos y hallazgos
- [[Testing]] — unit (164/164), API (33/33), E2E (30/33; 3 admin sin credenciales) y QA visual
- [[Despliegue Vercel]] — config SPA + functions, variables de entorno y checklist pre-producción
- [[Auditoría y Correcciones]] — registro de bugs encontrados y corregidos
- [[Pendientes Manuales]] — lo que requiere intervención humana

## Enlaces externos
- Repositorio: `https://github.com/Ingesoc/ingesocc`
- Proyecto Supabase de pruebas: `https://ietjikoddwpdybarcwfk.supabase.co`

> [!tip] Empezar por aquí
> Lee [[Arquitectura]] y [[Supabase]] primero; el resto de notas cuelgan de esos dos nodos.