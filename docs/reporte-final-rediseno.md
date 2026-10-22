# Reporte final — Rediseño visual INGESOCC S.A.S.

Fecha: 2026-10-19 · Rama: `feature/redesign` · Plan: `docs/directrices/plan-accion-rediseno-visual.md`
Fases 00–12 completadas. Este informe cumple el formato obligatorio de la Fase 12 (§"Formato obligatorio del reporte final").

---

## 1. Resumen ejecutivo

El sitio público de INGESOCC pasó de una interfaz funcional pero con deuda visual y
accesibilidad (contrastes bajo AA, solape vertical en `/proyectos`, NG0904 en los mapas,
una imagen muerta, chips táctiles pequeños) a un sistema de diseño sobrio y coherente:
papel cálido, tipografía Archivo con jerarquía editorial, naranja de marca reservado a
superficie/acento (con token `--accent-deep` AA para texto), movimiento CSS mínimo con
`prefers-reduced-motion` respetado e iconos Lucide con intención (patrón itshover recreado).

Problemas principales resueltos durante el proyecto: solape vertical de tarjetas (P1),
error de seguridad NG0904 en los `<iframe>` de Google Maps, imagen 404 en servicios y
proyectos, contraste del footer y del texto atenuado, foco/nombres accesibles del menú
móvil y del lightbox, y — ya en la Fase 12 — un desbordamiento real de chips de ubicación
en tablet con zoom de texto 150 %.

## 2. Cambios por página

| Página | Cambios principales |
|---|---|
| **Home** | Hero editorial con foto de obra, revelado escalonado (opacity+translate), contadores reales con IO, mosaico de destacados, CTA único por bloque; scroll-cue y barra de progreso de scroll en CSS puro. |
| **Quiénes Somos** | Narrativa con línea de tiempo (línea `line-draw` scroll-driven con fallback IO), propósito con iconos, galería de operaciones con `<app-lightbox>`, sección de equipo/testimonios oculta sin datos. |
| **Servicios** | 6 filas editoriales (sin grid de cajas con sombra), badge circular de flecha con relleno accent en hover/foco, fichas con FAQ `<details>`. |
| **Proyectos** | Chips de categoría y ubicación (`app-filter-chip`, `aria-pressed`, ≥44 px), fila con scroll-snap en móvil y wrap ≥768 px, sincronización con `?categoria=`/`?ubicacion=`, "Cargar más", anuncio `aria-live`. |
| **Detalle de proyecto / La Holanda** | Galería con lightbox accesible (foco atrapado, Esc), navegación anterior/siguiente y relacionados, enlace real a `laholanda.ingesocc.com`. |
| **Contacto** | Campos con `aria-required`/`aria-invalid`/`aria-describedby`, `.field-error` inline, foco al primer inválido, región `role="status"`, mapas con `SafeResourceUrl` (NG0904 corregido), iconos de información con `pop`. |
| **Panel admin** | Login/recuperar/nueva-contraseña con errores `.field-error` y alertas `role="alert"`, skeletons `role="status"`, estados vacíos `.empty-state`, feedback de guardado `?guardado=1` + banner, tablas con etiquetas en móvil, iconos de acción (`pop`/`nudge-up`/`shake`). **Nota:** el panel autenticado no se pudo recorrer en navegador (sin `E2E_ADMIN_*`); su verificación es por specs + lint + build. |
| **Transversales** | Header con estado de scroll, menú móvil (Escape devuelve foco, bloquea scroll), footer con línea blueprint y token `--on-dark-muted`, 404 propio, View Transitions (`pagereveal`). |

## 3. Decisiones visuales

Tomado de **ui.live**: mosaico editorial con pieza protagonista, cards imagen+título+categoría,
nav con estado activo, tipografía con escala, chips de filtro con estado activo (adaptados a
≥44 px). Descartado de ui.live: dashboards/charts, glassmorphism y partículas (rompen la
sobriedad y el contraste).

De **Prompt Motion** (biblioteca de motion, tokens documentados en `docs/design/motion-language.md`):
revelado progresivo de fotos (`appReveal` + IO), aparición escalonada (`--motion-stagger`),
kinetic typography mínima en el hero, parallax muy leve solo desktop, transiciones de estado
con tokens, View Transitions cauteloso, contadores rAF. Descartado: 3D, partículas, morphing,
showreels y animaciones en bucle (salvo spinner de loading real).

De **ItsHover** (Apache-2.0 verificada): patrón "icono que se mueve con intención" recreado
en CSS/Angular sobre geometría Lucide (`appIconMotion`: nudge-x/nudge-up/pop/rotate/shake/
pulse/draw, triggers hover|focus|parent|inview); no se portó código, solo el patrón; atribución
en `THIRD_PARTY.md`. Descartado: iconos decorativos animados sin acción.

Otras decisiones registradas en `docs/design/decisions.md` (D-01…): naranja no como texto
sobre claro, neutros cálidos, elevación/radios sobrios, tema oscuro fuera de alcance,
tokens de movimiento centralizados.

## 4. Archivos principales modificados

- **`src/styles.css`** — sistema de diseño completo: tokens (`--accent-deep`, `--on-dark-muted`,
  motion), botones, campos, chips, `.chips-row`, skeletons, alertas, reveal, barra de progreso.
- **`src/app/layouts/public-layout/*`** — header (scroll state, menú móvil accesible) y footer.
- **`src/app/shared/components/*`** — `filter-chip`, `lightbox`, `icon-motion`, `reveal`,
  `counter`, `project-card`, `service-card`.
- **`src/app/features/*/public/*`** — páginas públicas (home, proyectos, servicios, quienes-somos,
  contacto, 404) y sus detalles.
- **`src/app/features/*/admin/*`** + auth — formularios/listados con estados accesibles.
- **`e2e/*.spec.ts`** — suites de regresión (responsive 12 viewports, flujos públicos, a11y).
- **`tools/*.mjs`** — `visual-qa.mjs`, `baseline-shots.mjs`, `lighthouse-ci.mjs`, `serve-dist.mjs`.
- **`docs/`** — `design-system.md`, `design/*`, `visual-qa-report.md`, `ui-audit.md`, este reporte.

No se tocó `supabase/` (migraciones/RLS), `api/`, `src/environments/`, `vercel.json`,
`package.json` ni `angular.json` por el rediseño.

## 5. Validación

Ejecutados sobre el código final (2026-10-19):

| Comando | Resultado |
|---|---|
| `pnpm build` | ✅ OK — 729.33 kB inicial / 153.87 kB transfer |
| `pnpm lint` | ✅ 0 errores |
| `pnpm test:ci` | ✅ 200/200 SUCCESS |
| `pnpm test:e2e` | 69 passed · 3 skipped · **1 failed** (ambiental, §6/§8) |
| `node tools/visual-qa.mjs` | ✅ 0 warn · 0 FAIL (fase pública; admin omitido sin credenciales) |
| `node tools/lighthouse-ci.mjs` | ✅ presupuestos de nivel *error* OK; A11y **100** ×4 |
| `node tools/baseline-shots.mjs` + capturas Fase 12 | ✅ 21 + 10 capturas, 0 overflow |
| Escaneo de secretos (`git diff 357a11c..HEAD`) | ✅ 0 hallazgos |

No ejecutados (y por eso no se afirma su resultado): flujos e2e autenticados de admin
(requieren `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`), `supabase db push` / `rls-checks.sql`
(requiere el proyecto Supabase), validación por persona (capturas como evidencia), y el
rastreo del sitio de La Holanda (Firecrawl no disponible).

## 6. Comparación visual

- **Viewports:** e2e en matriz de **12** (320→1920, landscape/tablet); capturas antes/después
  en **390 · 820 · 1440** (mismo método que la Fase 00: servido desde `dist/`, navegación directa).
- **Capturas:** "antes" en `docs/design/baseline/screenshots/`; "después" en
  `docs/design/baseline/screenshots-after/` con `after-metrics.json` espejo de
  `baseline-metrics.json`. 21 páginas + 10 estados (filtro activo, formulario inválido,
  imagen ausente simulada, error de red simulado, `prefers-reduced-motion`).
- **Resultado:** 0 overflow horizontal en todas las capturas; sin cambios de `h1` ni de
  `overflowX` vs. baseline. Alturas crecen en `/quienes-somos` (+606…+813 px) y
  `/proyectos/casa-ladera` (+725…+1598 px) por narrativa/galería ampliadas; `/proyectos@390`
  baja 154 px.
- **Regresiones detectadas y corregidas en la Fase 12** (25 fallos e2e → 1 ambiental):
  1. **Bug real:** chips de ubicación desbordaban el documento a ≥768 px con zoom 150 %
     (`html +30px`). Corregido en `styles.css` (chips encogibles en modo wrap).
  2. Check e2e `isClipped` obsoleto frente a filas con scroll horizontal (16 falsos positivos).
  3. Selector e2e de errores de contacto desactualizado (`text-accent-deep` → `.field-error`).
  4. Localizador e2e de la fila de filtros desactualizado (`div.flex.flex-wrap` → `getByRole('group')`).
  5. `password-recovery` — fallo **ambiental** (Supabase local caído), preexistente en la Fase 00.
- El modelo no puede leer imágenes: la comparación es métrica; las capturas quedan como
  evidencia para revisión humana.

## 7. Rendimiento y accesibilidad

| Métrica (Lighthouse, `dist/`) | Línea base (Fase 00) | Final (Fase 12) |
|---|---|---|
| Desktop Home · Perf | 87 | **87** (WARN ≥80; objetivo 90 no alcanzado) |
| Desktop Proyectos · Perf | 91 | **89** |
| Mobile Home · Perf | 61 | **62** |
| Mobile Proyectos · Perf | 63 | **64** |
| Accessibility | 95 | **100** en las 4 corridas |
| Best practices / SEO | 96 / 100 | 96 / 100 |
| Bundle inicial | 689.70 kB / 146.99 kB transfer | 729.33 kB / 153.87 kB transfer |

Presupuestos de nivel *error* cumplidos; `script` transfer 868.9 kB en WARN (≤976.6 kB).
El LCP del Home es la imagen del hero (fotografía real de obra): es la causa del Perf
Desktop < 90 y se documenta como **trade-off consciente** de diseño; optimizarla (formato,
preloads, tamaño) queda como pendiente del cliente.

Accesibilidad: Lighthouse = 100 en Home y Proyectos; controles ≥44 px; menú móvil, lightbox,
formularios y chips verificados con foco/nombres/estados accesibles por e2e; movimiento
anulado bajo `prefers-reduced-motion` y contenido legible sin JS.

## 8. Riesgos o pendientes

1. **Supabase sin migrar** — REST 400/404 en local; la app cae al seed. Requiere
   `supabase db push` y `supabase/rls-checks.sql` en staging (ajeno al rediseño, preexistente).
2. **Panel autenticado sin recorrido real** — sin `E2E_ADMIN_*`; verificado por specs/lint/build.
3. **Hallazgo #18** (`docs/ui-audit.md`): contenido CMS remoto heredado en `/contacto` —
   pendiente de reportar/confirmar con el cliente.
4. **Perf Desktop Home 87 < 90** — por la imagen LCP del hero (ver §7).
5. **Contenido del cliente faltante** — testimonios/certificaciones vacíos a propósito;
   fotos de obra irregulares cubiertas por estados consistentes.
6. **Validación humana de capturas** — el modelo no lee imágenes; queda la revisión visual
   de `screenshots/` y `screenshots-after/`.

## 9. Estado de Git

- **Rama:** `feature/redesign` (no se hizo merge a main).
- **Commits existentes:** los trabajos de las fases están confirmados en esta rama (HEAD
  `f938de6`; los mensajes de commit dicen "Phase 04" por error de rotulación — el contenido
  cubre hasta la Fase 11).
- **Cambios locales sin commitear al cierre de la Fase 12:**
  `src/styles.css` (chips wrap ≥768), `e2e/responsive-overflow.spec.ts`,
  `e2e/public-flows.spec.ts`, `docs/visual-qa-report.md`, `docs/design/baseline/after-metrics.json`,
  `docs/design/baseline/screenshots-after/` (nuevo), `docs/reporte-final-rediseno.md` (nuevo)
  y este plan al actualizarse.
- **No se hizo push ni deploy, y no se hará sin autorización.** Se recomienda un commit de
  cierre de Fase 12 cuando el usuario lo indique.
