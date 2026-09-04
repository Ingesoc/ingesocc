---
title: Ingesocc SAS — Mapa del Vault
tags:
  - ingesocc
  - moc
  - documentacion
fecha: 2026-09-03
estado: activo
---

# 🏗️ Ingesocc SAS — Mapa del Vault

Documentación técnica del sitio corporativo de Ingesocc S.A.S., estructurada como un vault de Obsidian. Cada nota cubre una pieza de la arquitectura, los flujos funcionales o la operación del proyecto, con enlaces entre sí para navegar por contexto.

> [!info] Ficha rápida
> - **Producto**: sitio corporativo + panel admin (Angular 19 SPA, CSR)
> - **Backend**: Supabase (Postgres + Auth + Storage + RLS)
> - **Estado**: production-ready en desarrollo — ver [[Pendientes Manuales]]
> - **Docs fuente (repo)**: [[Auditoría y Correcciones]] · [[Testing]]

## 🧭 Clusters

### Arquitectura
- [[Arquitectura]] — capas y flujo de datos (UI → components → signals → data-access → Supabase)
- [[Stack Tecnológico]] — stack inamovible y scripts de `package.json`
- [[Estructura del Código]] — árbol de `src/app`, `e2e`, `tools`, `supabase`
- [[Rutas y Navegación]] — rutas públicas y admin, guard, deep links
- [[Guía de Estilo Visual]] — tokens de diseño y reglas de contraste

### Supabase (datos y seguridad)
- [[Supabase]] — hub de la capa de datos
- [[Esquema de Base de Datos]] — las 8 tablas, funciones y triggers
- [[Row Level Security]] — matriz de políticas por rol (anon / user / admin)
- [[Storage]] — buckets, políticas y flujo de upload
- [[Seeds]] — `schema.sql` + `seed.sql` y su paridad con los seeds estáticos

### Funcionalidades
- [[Autenticación y Autorización]] — login, sesión, guard y roles
- [[CRUD Proyectos]] — ciclo de vida completo de `projects`
- [[CRUD Servicios]] — ciclo de vida completo de `services`
- [[Content Blocks]] — modo de edición in-place del contenido
- [[Contacto y Mensajes]] — formulario público y bandeja admin

### Calidad y operación
- [[SEO]] — meta por ruta, OG, canonical, sitemap
- [[Performance y Lighthouse]] — presupuestos y hallazgos
- [[Testing]] — unit (32/32), E2E (8/8) y QA visual
- [[Despliegue Vercel]] — config SPA y checklist pre-producción
- [[Auditoría y Correcciones]] — registro de bugs encontrados y corregidos
- [[Pendientes Manuales]] — lo que requiere intervención humana

## 🔗 Enlaces externos
- Repositorio: `https://github.com/Ingesoc/ingesocc`
- Proyecto Supabase de pruebas: `https://ietjikoddwpdybarcwfk.supabase.co`

> [!tip] Empezar por aquí
> Lee [[Arquitectura]] y [[Supabase]] primero; el resto de notas cuelgan de esos dos nodos.