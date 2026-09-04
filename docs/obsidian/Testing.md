---
title: Testing
tags:
  - ingesocc
  - testing
  - e2e
  - unit
fecha: 2026-09-03
estado: activo
---

# Testing

Tres suites + una herramienta de QA visual. Estado actual: **unit 32/32 · E2E 8/8 · QA visual 28/28 screenshots · Lighthouse A11y 100**.

## Unit (Jasmine + Karma, sin red)

`pnpm test:ci` → **32/32 SUCCESS** (ChromeHeadlessNoSandbox). No requieren credenciales ni DB: los servicios de datos se prueban con un cliente Supabase simulado.

Specs en `src/app/**/*.spec.ts`: `slugify`, `project.model`, `service-icons`, `image-utils`, `supabase.service`, `auth.guard`, `projects.service` (incluye los tests del **payload exacto** de insert/update — regresión de la capa snake_case, nº 17 de [[Auditoría y Correcciones]]), `content-blocks.service` (éxito / error RLS → rechazo sin cambio local / 42P01 → aplica en memoria), y otros.

## E2E (Playwright, `e2e/`)

`playwright.config.ts` levanta el dev server solo. `pnpm test:e2e` corre los flujos públicos (solo lectura); con credenciales añade los flujos admin:

```bash
E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... pnpm test:e2e
```

| Spec | Flujo | Requiere credenciales |
|---|---|---|
| `public-flows.spec.ts` | Home → navegación → Proyectos → detalle → 404 propio → sin overflow móvil | — |
| `admin-projects.spec.ts` | Login → crear → editar → publicar → verificar público → eliminar | ✅ |
| `admin-services.spec.ts` | Login → crear (ícono + foto) → verificar público → editar → quitar foto → verificar fallback de ícono → eliminar | ✅ |
| `contact-inbox.spec.ts` | Formulario de contacto → bandeja admin → marcar leído → eliminar | ✅ |

> [!danger] Escriben datos reales
> Los flujos admin/bandeja **crean y borran datos reales** (un proyecto, un servicio con foto, un mensaje) y se limpian solos. Apuntarlos a un **proyecto Supabase de pruebas** (schema+seed aplicados), nunca a producción. La suite verificada contra `ietjikoddwpdybarcwfk` deja la DB intacta: 10 proyectos · 6 servicios · 0 mensajes · 0 fotos huérfanas.

Los E2E contra la DB real destaparon 3 bugs reales: camelCase en insert/update (nº 17), embed to-one de categorías (nº 18) y la carrera foto/guardar (nº 20) — ver [[Auditoría y Correcciones]].

## QA visual (`pnpm test:visual`, `tools/visual-qa.mjs`)

Verifica en vivo contra el build de producción: color exacto `#a53a0c` en todo `text-accent-deep`, contraste ≥ 4.5:1 contra el **fondo efectivo** del elemento, chip de filtro activo de `/proyectos`, errores de validación de `/contacto` y ausencia de overflow horizontal. Screenshots en `test-results/visual-qa/`.

Con credenciales añade la **fase admin** (login real + dashboard, listados, formularios, bandeja, contenido). Intercepta solo la lectura de `profiles` (→ rol admin) para cuando el esquema no está aplicado; el resto va a la red real, de solo lectura.

Destapó el **bug de CSS sin capa** (`a { color: inherit }` anulaba las utilities de Tailwind sobre enlaces) — ver [[Guía de Estilo Visual]].

## Lighthouse

`pnpm test:perf` — presupuestos de rendimiento/a11y en dos modos. Ver [[Performance y Lighthouse]].

## Ver también

- [[Performance y Lighthouse]] · [[Auditoría y Correcciones]] · [[Pendientes Manuales]]