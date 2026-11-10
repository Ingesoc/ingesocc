# Cambios de las auditorías — noviembre 2026

Fecha: 2026-11-09 · Rama: `feature/redesign` · Estado: cambios aplicados, **sin commit/push**.

Este documento consolida los cambios de las dos auditorías de esta etapa:

1. **Auditoría de rendimiento / Lighthouse** (presupuestos, rutas medidas, lazy loading, CI).
2. **Auditoría visual y responsive** (matriz de 8 viewports, hallazgos VIS-01…VIS-11, correcciones
   Fase A + B).

La auditoría histórica de septiembre sigue en `docs/cambios-auditoria-final.md`; el informe de QA
visual de octubre sigue en `docs/visual-qa-report.md`. El detalle del diagnóstico visual de esta
etapa está en `docs/visual-audit/`.

---

## 1. Resumen ejecutivo

| Auditoría | Alcance | Resultado |
| --- | --- | --- |
| Rendimiento | 8 rutas × 2 modos (desktop/móvil), presupuestos de transferencia y calidad | Presupuestos de error OK; CI añadido |
| Visual/responsive | 8 rutas públicas × 8 viewports (320→1440) | 8 hallazgos corregidos, 1 pendiente de decisión, 1 no verificado |
| Auditoría por elemento | 9 vistas × 10 viewports (320→1440) + interacciones | 0 desbordamientos reales; 2 touch targets corregidos |
| Accesibilidad del menú móvil | Foco inicial, trap, Esc, scroll interno | Corregido y verificado |
| Datos | Supabase/RLS/migraciones | **Sin cambios** |

Verificación final: `pnpm lint`, `pnpm typecheck:api`, `pnpm build`, `pnpm test:ci` (214/214),
`pnpm test:api` (33/33), `pnpm test:visual` (0 FAIL, 8 viewports × 9 rutas) y auditoría por elemento
(158 estados, 0 desbordamientos reales, 0 touch targets <44 px).

---

## 2. Auditoría de rendimiento / Lighthouse

### 2.1 `tools/lighthouse-ci.mjs`

- **Rutas medidas**: de 2 (`/`, `/proyectos`) a 8:
  `/`, `/quienes-somos`, `/servicios`, `/servicios/proyectos-de-infraestructura`,
  `/proyectos`, `/proyectos/la-holanda`, `/contacto` y `/admin/login`.
  Las rutas dinámicas usan slugs estables del seed para que las corridas sean comparables.
- **Presupuesto móvil**: error `0.50 → 0.55`, aviso `0.60 → 0.65`. Se midió 8 rutas × 2 corridas
  (60–66, varianza 3–5 puntos) antes de fijarlo.
- **Calidad no negociable**: Accessibility, Best Practices y SEO ahora **fallan** por debajo de
  `0.85` y avisan por debajo de `0.90` (antes solo avisaban).
- **JS separado por origen**:
  - `script 1st-party`: aviso 800 KB / error 1 MB.
  - `script 3rd-party`: aviso 600 KB / error 900 KB.
  Esto evita que un embed deliberado (Google Maps, ~500 KB en contacto y detalle de proyecto) se
  confunda con una regresión del bundle propio.
- **Excepción de SEO** en `/admin/login` (`skipBudgets: ['seo']`) porque la página lleva `noindex`
  a propósito.
- El cálculo de transferencia de scripts usa `network-requests` y compara el origen con el servidor
  local; el resto de presupuestos sigue usando `resource-summary`.

### 2.2 `src/app/app.routes.ts`

- Las rutas públicas distintas de Home pasan de `component` a **`loadComponent`**:
  `quienes-somos`, `servicios`, `servicios/:slug`, `proyectos`, `proyectos/:slug`, `contacto` y
  `no-encontrada`.
- Home y el layout público siguen en el bundle inicial; cada página pública se carga en su chunk.
- No cambian guards, datos, rutas ni deep-links.

### 2.3 `src/app/features/projects/data-access/projects.service.ts`

- Se documenta explícitamente la matriz de `load()`:
  - **Error de consulta** (tabla inexistente, sin credenciales, red): conserva el seed y marca
    `loadState = true`.
  - **Tabla existente pero vacía**: muestra `[]` (no el seed).
  - **Carga correcta**: reemplaza el seed con las filas de la DB.
- No hubo cambio de comportamiento en este diff; el cambio es de documentación y el
  comportamiento queda cubierto por los tests nuevos.

### 2.4 `src/app/features/projects/data-access/projects.service.spec.ts`

Dos tests nuevos para `loadState`:

1. Error de conexión: `load()` devuelve `false`, conserva el seed (11 proyectos publicados) y deja
   `loadState = true`.
2. Error seguido de carga correcta: el segundo `load()` limpia `loadState` y reemplaza el seed por
   las filas de la DB.

### 2.5 `src/styles.css` (rendimiento)

- `[data-icon-motion]` ya no declara `will-change: transform` de forma permanente.
- Ahora solo se aplica con `[data-icon-motion].is-animating`, es decir, mientras la animación está
  en curso. Evita una capa de composición por icono y reduce memoria.

### 2.6 `package.json`

- Nuevo script `build:stats`: `ng build --stats-json`, para analizar el bundle sin cambiar el build
  normal.

### 2.7 `README.md`

- Actualiza la sección de Lighthouse:
  - todas las rutas de `PAGES`;
  - presupuestos móviles 0.55/0.65;
  - JS propio vs. terceros;
  - calidad con error por debajo de 0.85;
  - estado actual y decisión de **no migrar a SSR/prerender** en esta fase.

### 2.8 `.github/workflows/quality.yml` (nuevo)

Workflow de calidad con tres jobs:

| Job | Pasos |
| --- | --- |
| `static-and-tests` | install → lint → typecheck API → unit tests → API tests → build |
| `e2e` | install → Playwright Chromium → `pnpm test:e2e` (flujos públicos, sin credenciales admin) |
| `lighthouse` | install → `pnpm test:perf` → subida de `.lighthouseci/` como artefacto |

Se ejecuta en push a `main`, `master` y `feature/redesign`, en pull requests y manualmente.

---

## 3. Auditoría visual y responsive

### 3.1 `src/app/layouts/public-layout/site-header.component.html`

- `<nav #mobileMenu>` ahora tiene `overflow-y-auto overscroll-contain`.
- El bloque de enlaces usa `pt-24 pb-8 sm:pt-28` (antes `py-24`).
- El bloque inferior (CTA + firma) usa `mt-auto pb-12 pt-6` en lugar de centrar todo el menú con
  `justify-center py-24`.
- El botón de menú móvil añade `shrink-0` para que conserve sus 44 px de ancho junto al logo.
- Resultado: en 320×568 el menú conserva el alto del viewport, hace scroll interno y el CTA
  "Solicitar Cotización" es alcanzable; el botón de menú mide 44×44 px.

### 3.2 `src/app/layouts/public-layout/site-header.component.ts`

- `viewChild` del menú móvil.
- `effect` que enfoca el primer enlace al abrir.
- `@HostListener('document:keydown.tab')` → `onMenuKeydown`:
  - cicla el foco dentro del menú (incluye el botón de menú);
  - Shift+Tab invierte el ciclo;
  - impide que el foco escape al contenido de fondo.
- Esc mantiene el cierre y devuelve el foco al botón.
- El `keydown` se movió a `@HostListener` para cumplir
  `@angular-eslint/template/interactive-supports-focus`.

### 3.3 `src/app/layouts/public-layout/mobile-action-bar.component.html`

- Se retiró `style="padding-bottom: env(safe-area-inset-bottom)"`.
- Decisión: opción conservadora, sin `viewport-fit=cover`; el soporte edge-to-edge queda para una
  fase futura.

### 3.4 `src/app/layouts/public-layout/public-layout.component.html`

- Spacer de la barra inferior: `h-[57px]` → `h-[50px]`.
- La barra mide 49,5 px; el spacer deja 0,5 px de holgura y elimina los 7,5 px sobrantes.

### 3.5 `src/styles.css` (chips)

- `.chip`:
  - `max-width: 100%`;
  - `text-align: center`;
  - `white-space: normal`;
  - `overflow-wrap: anywhere`.
- `.chips-row > *`: `max-width: 100%` en base.
- Se eliminó el `max-width: 100%` duplicado del bloque `@media (min-width: 768px)`.
- Resultado: ningún chip individual supera el ancho de su fila en 320/360/390/430; el scroll-snap
  de la fila se conserva.

### 3.6 `src/app/features/contact/contact.component.html`

- Los tres grids del formulario pasan a:
  - `minmax(min(220px,100%),1fr)` (×2);
  - `minmax(min(150px,100%),1fr)` (×1).
- Resultado: el contenido del panel ya no invade el padding a 320 px (desborde 5 px → 0 px).

### 3.7 `src/app/features/home/home.component.html`

- Raíz: `<main class="min-h-screen overflow-hidden ...">` → `<div class="min-h-screen ...">`.
  El `<main>` lo aporta `public-layout`; se elimina el landmark duplicado y el `overflow-hidden`
  que podía enmascarar desbordes.
- Hero:
  - `pb-8 pt-20 sm:pb-12 sm:pt-32 md:pb-20 md:pt-40` (antes `pb-14 pt-40 md:pb-20`);
  - H1 base `text-[2.25rem]` (antes `2.7rem`);
  - separación `mt-8 sm:mt-10 md:mt-12`.
- Resultado: hero de 777 px → 636 px a 320×568; el CTA queda dentro del primer viewport.

### 3.8 `src/app/features/about/about.component.html`

- Galería de operaciones:
  - `auto-rows-[140px] grid-cols-2 gap-3`;
  - `sm:auto-rows-[220px] sm:grid-cols-2`;
  - `md:grid-cols-3` (sin cambios).
- Resultado: 2 columnas en móvil, Quiénes Somos baja de 18.031 px a 13.224 px a 320 px.

### 3.9 `tools/visual-qa.mjs`

- **8 viewports**: `small` 320×568, `phone-s` 360×800, `phone` 390×844, `phone-l` 430×932,
  `tablet` 768×1024, `landscape` 1024×768, `laptop` 1280×800, `desktop` 1440×900.
- **9 rutas**: las 8 públicas (incluye `/servicios/:slug` y `/no-encontrada`) + `/admin/login`.
- Red externa abortada en cada página para que el layout sea determinista (datos seed/defaults).
- Nuevas comprobaciones de layout:
  - overflow horizontal de página;
  - exactamente 1 `<main>`;
  - spacer de la barra inferior ≥ alto de la barra;
  - chips ≤ ancho de su `.chips-row`;
  - grids del formulario sin invadir el padding del panel;
  - hero de Home ≤ 115 % del viewport a 320 px.
- Nuevas comprobaciones del menú móvil:
  - foco inicial dentro del menú;
  - scroll interno cuando el contenido no cabe;
  - CTA alcanzable (visible o tras scroll);
  - Tab no escapa del menú;
  - Esc cierra y devuelve el foco al botón.
- Comprobación específica de la galería de Quiénes Somos: 2 columnas en <640 px.
- Salida: 72 capturas de la última corrida (8 viewports × 9 rutas) y `0 FAIL`.

### 3.10 `src/app/layouts/public-layout/site-footer.component.html`

- El enlace "Volver arriba" añade `min-h-11` para alcanzar 44 px de alto (antes 16,5 px).
- Resultado: el objetivo táctil cumple el mínimo de 44×44 px sin alterar el layout del footer.

---

## 4. Documentación añadida o actualizada

| Archivo | Contenido |
| --- | --- |
| `docs/visual-audit/README.md` | Índice, método, limitaciones, resumen ejecutivo y verificación |
| `docs/visual-audit/findings.md` | VIS-01…VIS-11 con evidencia, estado y corrección |
| `docs/visual-audit/responsive-matrix.md` | Matriz ruta × viewport antes/después y mediciones |
| `docs/visual-audit/design-system.md` | Tokens, breakpoints, clases y brechas del sistema |
| `docs/visual-audit/fixes.md` | Plan A/B/C, estado de aplicación y decisiones |
| `docs/visual-audit/regression-tests.md` | Aserciones, presupuestos y checklist manual |
| `docs/visual-audit/screenshots/` | Capturas curadas de los hallazgos |
| `docs/cambios-auditorias-2026-11.md` | Este documento consolidado |
| `README.md` | Índice de documentación con enlace al changelog y al diagnóstico visual |
| `docs/cambios-auditoria-final.md` | Nota de continuación hacia este changelog |

---

## 5. Métricas antes / después

| Métrica (320×568) | Antes | Después |
| --- | --- | --- |
| Home · alto de página | 9.139 px | 9.015 px |
| Quiénes Somos · alto de página | 18.031 px | 13.224 px |
| Home · alto del hero | 777 px | 636 px |
| Barra inferior / spacer | 49,5 / 57 px | 49,5 / 50 px |
| Formulario de contacto · invasión del padding | 5 px | 0 px |
| Chip de ubicación más ancho | 495 px (> fila) | ≤ ancho de la fila |
| Landmarks `<main>` en Home | 2 | 1 |
| Galería de Quiénes Somos en móvil | 1 columna × 180 px | 2 columnas × 140 px |
| Menú móvil a 320×568 | CTA inalcanzable | CTA alcanzable con scroll |
| Foco del menú | sin foco inicial ni trap | foco inicial + trap + Esc |
| Touch targets <44 px (todas las vistas) | 138 | 0 |

---

## 6. Verificación ejecutada

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | OK |
| `pnpm typecheck:api` | OK |
| `pnpm build` | OK |
| `pnpm test:ci` | 214/214 SUCCESS |
| `pnpm test:api` | 33/33 pass |
| `pnpm test:visual` | 0 FAIL · 8 viewports × 9 rutas · 72 capturas |
| Auditoría por elemento | 158 estados · 0 desbordamientos reales · 0 touch targets <44 px |

La verificación visual se hizo con Chromium headless y red externa abortada. Las alturas y
geometrías no dependen de que las imágenes externas carguen porque los contenedores reservan
espacio.

La auditoría por elemento cubrió 10 anchos (320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1440),
las 8 vistas públicas y `/admin/login`, en estado base, menú abierto, errores de formulario y filtro
activo. Se detectaron 138 touch targets <44 px; tras añadir `shrink-0` al botón de menú y `min-h-11`
a "Volver arriba", la repetición dio 0. El único falso positivo fue el honeypot `#website` con
`.sr-only` (oculto a propósito). Evidencia en `test-results/full-layout-audit/report.json`.

---

## 7. Pendientes y riesgos

1. **VIS-05 / C3 — ritmo vertical**: Home (9.015 px) y Quiénes Somos (13.224 px) siguen por encima
   de los presupuestos de 8.000 / 12.000 px. Requiere decidir si se aplica el token
   `--section-y` a todas las páginas o solo a Home/Quiénes Somos.
2. **VIS-11 — panel admin**: no recorrido visualmente; faltan `E2E_ADMIN_EMAIL` /
   `E2E_ADMIN_PASSWORD`.
3. **C4 — galería de detalle de proyecto**: el mosaico no se ejercitó porque la semilla de
   `casa-ladera` tiene 1 imagen; hace falta un proyecto con ≥4 imágenes.
4. **iOS/Safari real**: no se probó en iPhone físico ni WebKit. La opción conservadora de
   safe-area evita el riesgo de solape, pero no se validó edge-to-edge.
5. **`src/index.html:5,8`**: se observó mojibake en el guion largo de `<title>` y de la
   descripción; no se tocó por estar fuera del alcance.
6. **Sin commit/push**: todos los cambios están en el working tree.

---

## 8. Rollback

Todos los cambios son de plantillas, CSS, rutas, tests y herramientas. No hay migraciones, RLS ni
cambios de datos. Revertir los archivos listados (o el bloque de cambios) restaura el estado
anterior sin efectos colaterales en Supabase.

---

## 9. Referencias

- Diagnóstico visual: `docs/visual-audit/README.md`
- Hallazgos y estados: `docs/visual-audit/findings.md`
- Matriz responsive: `docs/visual-audit/responsive-matrix.md`
- Plan y decisiones: `docs/visual-audit/fixes.md`
- Pruebas de regresión: `docs/visual-audit/regression-tests.md`
- Auditoría histórica (sep 2026): `docs/cambios-auditoria-final.md`
- QA visual histórico (oct 2026): `docs/visual-qa-report.md`
