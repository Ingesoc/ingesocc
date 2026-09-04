---
title: Performance y Lighthouse
tags:
  - ingesocc
  - rendimiento
  - lighthouse
fecha: 2026-09-03
estado: activo
---

# Performance y Lighthouse

`pnpm test:perf` (`tools/lighthouse-ci.mjs`) construye, sirve `dist/` con `tools/serve-dist.mjs` (fallback SPA igual a `vercel.json`) y audita `/` y `/proyectos` en **dos modos**:

| Modo | Throttling | Performance actual | Presupuesto error / aviso |
|---|---|---|---|
| Desktop | 1440×900 · 10 Mbps · CPU 1× | ~92 | ≥ 0.80 / ≥ 0.90 |
| Mobile | 412×823 · 1.6 Mbps · CPU 4× | ~64-65 | ≥ 0.50 / ≥ 0.60 |

En ambos modos se vigilan también **Accessibility (95)**, Best practices (1.00), SEO (1.00) y bytes transferidos (documento ≤ 25/40 KB · script ≤ 800 KB/1 MB · total ≤ 2.8/3.5 MB). Reportes JSON en `.lighthouseci/` (ignorado por git). `node tools/lighthouse-ci.mjs desktop|mobile` para un solo modo sin rebuild.

> [!note] Rediseño UI/UX y rendimiento (2026-09-04)
> El [[Guía de Estilo Visual|rediseño]] añadió fuente variable autoalojada
> (2 × ~35 KB, swap + preload) y un DOM más rico; el desktop bajó de ~95-97 a
> **~92** y el móvil de ~64-66 a **~64-65**, ambos **dentro de presupuesto**.
> A11y pasó de 100 a **95** (mejores focus states y semántica nueva). Los
> reportes `NO_FCP` de DevTools son un artefacto de captura (pestaña no
> enfocada), no una regresión — reproducir con `pnpm test:perf` (headless).

> [!note] Throttling explícito
> Sin el objeto `throttling`, Lighthouse aplica valores móviles por defecto también en escritorio — se descubrió con FCP invariante ~3.6 s. El script lo define explícitamente por modo.

## Hallazgos reales corregidos

1. **Logo de 1 MB en cada página** → redimensionado a 256 px (80 KB, 12.6× menos).
2. **LCP = hero** sin `fetchpriority="high"` y pedido a `w=2200` → input `priority` en `EditableImage` + seed a `w=1600&q=80`.
3. **CLS ~0.25** — el contenedor del fondo del hero renderizaba en flujo por un conflicto `relative`/`absolute` → Home pasó de 79 a 97.
4. **Imágenes bajo el fold sin `lazy`** → `loading="lazy"` en cards y galería; la portada del detalle lleva `fetchpriority="high"`.
5. **SDK de Supabase (~220 KB) bloqueando el primer pintado** → `import()` diferido en `SupabaseService`; el sitio público pinta desde los seeds sin esperar la red.
6. **Rediseño: fuente de sistema (Arial) → Archivo variable autoalojada** → 2 woff2 (latin + latin-ext) de ~35 KB cada una, `font-display: swap` + preload; sin dependencia de Google Fonts y sin bloqueo del render.
7. **Rediseño: hero display y mosaico editorial** → LCP sigue siendo el hero con `fetchpriority="high"`; el mosaico usa `object-fit: cover` + `aspect-ratio` + lazy loading, sin deformar imágenes ni inflar el CLS.

## Límite documentado (no migrado)

Para pasar de ~95 a ~100 y bajar el JS inicial (~700 KB de un SPA CSR con Angular) haría falta **SSR/prerender** (Angular Universal o similar). Es una recomendación documentada; no se migra sin necesidad.

## Ver también

- [[Testing]] · [[SEO]] · [[Despliegue Vercel]] · [[Auditoría y Correcciones]] (sección Lighthouse)