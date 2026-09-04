---
title: Stack Tecnológico
tags:
  - ingesocc
  - angular
  - supabase
  - tailwind
fecha: 2026-09-03
estado: activo
---

# Stack Tecnológico

> [!warning] Stack inamovible
> No migrar a React/Next.js/Vue, otro framework CSS ni otro backend sin una razón crítica y explícitamente justificada (regla del plan técnico).

| Capa | Elección |
|---|---|
| Frontend | Angular 19 (standalone) + TypeScript ~5.7, CSR |
| Estilos | Tailwind CSS v4 (vía `@tailwindcss/postcss`) |
| Iconos | `@lucide/angular` |
| Backend | Supabase (Postgres + Auth + Storage + RLS) |
| Estado/datos | Angular Signals + servicios en `data-access/` por feature |
| Compresión de imágenes | `browser-image-compression` (cliente, ≤2 MB / 2000 px) |
| Cliente Supabase | `@supabase/supabase-js` ^2.114 (SDK diferido, ver [[Performance y Lighthouse]]) |
| Tests unitarios | Jasmine + Karma (headless) |
| Tests E2E | Playwright |
| Perf/A11y | Lighthouse programático (`tools/lighthouse-ci.mjs`) |
| QA visual | Playwright (`tools/visual-qa.mjs`) |
| Despliegue | Vercel (SPA, `vercel.json`) |
| Paquete | pnpm |

## Scripts de `package.json`

| Script | Comando | Uso |
|---|---|---|
| `start` | `ng serve` | dev server en `http://localhost:4200` |
| `build` | `ng build` | build de producción en `dist/ingesocc-web` |
| `test` | `ng test` | unit tests (watch) |
| `test:ci` | `ng test --watch=false --browsers=ChromeHeadlessNoSandbox` | unit tests en una pasada |
| `test:e2e` | `playwright test` | E2E (flujos públicos; + admin con credenciales) |
| `test:perf` | `pnpm build && node tools/lighthouse-ci.mjs` | Lighthouse con presupuestos |
| `test:visual` | `pnpm build && node tools/visual-qa.mjs` | QA visual de paleta/contraste |

Ver [[Testing]] para los detalles de cada suite y [[Performance y Lighthouse]] para los presupuestos.

## Notas de build

- **Tailwind v4**: Angular 19 solo carga la config de PostCSS desde `.postcssrc.json` (no `postcss.config.mjs`), y la detección automática de contenido falla en rutas con espacios/OneDrive → `src/styles.css` declara `@source "./src"` explícitamente.
- **Capas CSS**: la regla base `a { color: inherit }` debe vivir dentro de `@layer base`, o gana sobre todas las utilities de Tailwind (bug corregido, ver [[Guía de Estilo Visual]]).
- **Chrome para E2E**: se usa el Chrome instalado (`channel: 'chrome'`); si no existe, Playwright Chromium con `E2E_CHROMIUM=1`.