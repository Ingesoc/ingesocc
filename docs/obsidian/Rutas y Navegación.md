---
title: Rutas y Navegación
tags:
  - ingesocc
  - angular
  - rutas
fecha: 2026-09-03
estado: activo
---

# Rutas y Navegación

Definidas en `src/app/app.routes.ts`. Catch-all (`**`) → `/`. El admin completo cuelga bajo `canActivate: [authGuard]`.

## Rutas públicas

| Ruta | Página |
|---|---|
| `/` | Home (hero, stats, proyectos destacados, servicios, capacidad) |
| `/quienes-somos` | Historia, timeline, misión/visión/valores, equipo |
| `/servicios` | Los 6 servicios (foto o ícono de respaldo) |
| `/proyectos` | Grid con filtros de categoría + "Cargar Más" (bloques de 8) |
| `/proyectos/:slug` | Detalle: descripción, valor en salarios mínimos, galería |
| `/contacto` | Formulario (guarda en `contact_messages`) + información de contacto |

## Rutas admin (protegidas por sesión + rol)

| Ruta | Página |
|---|---|
| `/admin/login` | Login (público, sin guard) |
| `/admin` | Dashboard con resumen (contadores) |
| `/admin/proyectos` | Listado (editar/eliminar) |
| `/admin/proyectos/nuevo` | Crear proyecto |
| `/admin/proyectos/:id` | Editar proyecto (imágenes, categorías, estado) |
| `/admin/servicios` | Listado (editar/eliminar) |
| `/admin/servicios/nuevo` | Crear servicio |
| `/admin/servicios/:id` | Editar servicio (foto, ícono, estado) |
| `/admin/contenido` | Placeholder informativo: el contenido se edita **in-place** en las páginas públicas (ver [[Content Blocks]]) |
| `/admin/mensajes` | Bandeja de `contact_messages` (leído/no leído, eliminar) |

## Guard y deep links

- `authGuard` es **async** y espera `AuthService.whenReady()` antes de decidir: así un admin con sesión persistida que recarga `/admin/proyectos` no es rechazado (bug corregido, ver [[Auditoría y Correcciones]] nº 2).
- Anónimo o rol `user` → redirige a `/admin/login`.
- El login valida el rol antes de navegar: usuario sin rol admin cierra sesión y ve un mensaje claro (nº 3).

## Deep links en Vercel

`vercel.json` sirve `dist/ingesocc-web/browser` con rewrites a `index.html`, de modo que `/proyectos/:slug` y cualquier ruta profunda funcionan al entrar directo (no solo tras navegar desde `/`). Ver [[Despliegue Vercel]].

## Ver también

- [[Autenticación y Autorización]] · [[CRUD Proyectos]] · [[Contacto y Mensajes]]