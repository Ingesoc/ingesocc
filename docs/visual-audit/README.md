# Auditoría visual y responsive — Ingesocc S.A.S.

Fecha: 2026-11-09
Rama: `feature/redesign`
Alcance: sitio público (`/`, `/quienes-somos`, `/servicios`, `/servicios/:slug`, `/proyectos`, `/proyectos/:slug`, `/contacto`, `/no-encontrada`) y barrido de código del panel admin.

## Estado de esta entrega

Esta carpeta contiene el **diagnóstico, el inventario y las correcciones de la Fase A + B**
aprobadas. Se modificó `src/` y `tools/visual-qa.mjs`; **no se hizo commit/push**. Quedan
pendientes VIS-05 (ritmo vertical, C3), la verificación del panel admin (VIS-11) y la prueba en
iPhone/WebKit real. El detalle está en `fixes.md` y `regression-tests.md`.

## Documentos

- `findings.md`: veredicto de las 7 hipótesis + hallazgos nuevos, con evidencia y `archivo:línea`.
- `responsive-matrix.md`: resultados ruta × viewport, alturas y mediciones de componentes.
- `design-system.md`: tokens, breakpoints, clases compartidas y brechas del sistema.
- `fixes.md`: plan por fases (P0/P1/P2), criterios de aceptación, riesgos y decisiones pendientes.
- `regression-tests.md`: aserciones automáticas, presupuestos de altura y checklist manual.
- `screenshots/`: capturas curadas para revisión.
- `../cambios-auditorias-2026-11.md`: changelog consolidado de rendimiento + visual (nov 2026).

## Método de reproducción

- Build de producción (`pnpm build`, ya existente en `dist/ingesocc-web/browser`).
- Servidor estático `tools/serve-dist.mjs` (mismo fallback SPA que Vercel).
- Playwright + Chromium headless (el binario incluido en `@playwright/test`).
- 8 rutas públicas × 8 viewports (matriz de `responsive-matrix.md`).
- Se abortaron las peticiones externas (Supabase, Cloudinary, Google Maps) para que la medición
  sea determinista; la app cae a sus datos semilla/defaults. Las imágenes no cargan, pero todos
  los contenedores tienen altura reservada, así que las mediciones de layout son válidas.
- Scripts de medición: `test-results/audit-temp.mjs` y `test-results/menu-temp.mjs`
  (carpeta `test-results/` ignorada por git).
- Reporte crudo: `test-results/visual-audit/report.json`.
- Capturas completas: `test-results/visual-audit/*.jpg` (ignoradas por git).
- Capturas curadas para revisión: `docs/visual-audit/screenshots/`.

## Limitaciones

1. Chromium headless en Windows. **No se ejecutó WebKit/Safari real ni un iPhone/Pixel físico.**
2. `env(safe-area-inset-bottom)` resuelve `0` en Chromium de escritorio; el caso de notch/home
   indicator se evaluó por aritmética de alturas, no por captura en dispositivo.
3. El panel admin **no se recorrió** (requiere `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`); solo se
   revisó el código de sus plantillas.
4. Los datos vienen de semilla/fallback. Un proyecto con varias imágenes de galería no quedó
   ejercitado (`casa-ladera` tiene 1 imagen en la semilla).
5. Las capturas son JPEG `fullPage`; el menú móvil abierto se capturó a viewport.

## Leyenda de estados

- `REPRODUCIDO`: medido en navegador con el build actual.
- `PARCIAL`: el síntoma existe, pero no en la forma/severidad descrita.
- `NO REPRODUCIDO`: la hipótesis no se sostiene con el código/build actual.
- `NO VERIFICADO`: requiere credenciales o dispositivo no disponible.
- `LATENTE`: no ocurre hoy, pero el código lo provocará al cambiar una condición (p. ej. safe-area).
- `FIXED`: corrección aplicada en `src/`.
- `VERIFIED`: corrección comprobada con la matriz y/o `pnpm test:visual`.
- `OPEN`: hallazgo confirmado sin corrección aplicada.

## Resumen ejecutivo

- **No hay overflow horizontal a nivel de página en ninguna de las 8 rutas × 8 viewports.**
  `documentElement.scrollWidth === clientWidth` en las 64 combinaciones. El chequeo de overflow
  del `pnpm test:visual` original no detectaba los problemas reales de esta auditoría.
- El defecto más grave era **vertical**: en 320×568 el menú móvil dejaba el CTA "Solicitar
  Cotización" por debajo del viewport y no tenía scroll interno (VIS-08, HIGH). **Corregido y
  verificado**: el menú ahora hace scroll, recibe foco inicial, atrapa el foco y Esc lo cierra.
- **Quiénes Somos bajó de 18.031 px a 13.224 px** de alto en 320 px al pasar la galería de 44
  imágenes a 2 columnas de 140 px (VIS-07). Sigue siendo la página más larga; VIS-05 (ritmo
  vertical) queda pendiente como C3.
- El chip de ubicación más largo medía **495 px** dentro de una fila de 280–390 px (VIS-06).
  **Corregido**: ningún chip supera ahora el ancho de su fila; el texto envuelve.
- De las 7 hipótesis del brief: **4 se reproducen** (VIS-03, VIS-05, VIS-06, VIS-07), **1 es
  parcial** (VIS-04), **1 no se reproduce** (VIS-02) y **1 es latente** (VIS-01). Ver
  `findings.md` para el veredicto uno por uno.
- Se detectaron 3 hallazgos nuevos: menú sin ajuste vertical (VIS-08), menú sin foco atrapado
  (VIS-09) y `<main>` anidado + `overflow-hidden` en Home (VIS-10). Los tres están **corregidos**.

## Verificación

- `pnpm lint`, `pnpm typecheck:api`, `pnpm build`: OK.
- `pnpm test:ci`: 214/214. `pnpm test:api`: 33/33.
- `pnpm test:visual` (extendido a 8 viewports y 9 rutas): **0 FAIL**. Comprueba overflow,
  `<main>` único, barra/spacer, chips, grids del formulario, galería de Quiénes Somos y menú
  móvil (foco, scroll, CTA, trap, Esc).
- Auditoría por elemento (10 viewports × 9 vistas + interacciones): **158 estados**, 0
  desbordamientos reales y 0 touch targets <44 px. Evidencia en
  `test-results/full-layout-audit/report.json` (carpeta ignorada por git).
- Medición independiente con red externa abortada: `test-results/verify-fixes/report.json`
  (carpeta ignorada por git).
