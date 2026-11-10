# Hallazgos

Severidad: `CRITICAL` (bloquea uso) · `HIGH` (CTA/contenido principal inaccesible) ·
`MEDIUM` (degradación con workaround) · `LOW` (cosmético/menor).

## Veredicto de las 7 hipótesis del brief

| ID | Hipótesis | Veredicto | Severidad real | Corrección |
| --- | --- | --- | --- | --- |
| VIS-01 | Barra inferior con safe-area y spacer fijo de 57 px | `LATENTE` (hoy `env()` = 0) | LOW | `FIXED` conservador + `VERIFIED` |
| VIS-02 | Menú móvil `text-4xl` desborda a 320–360 px | `NO REPRODUCIDO` (envuelve texto) | — | Sin acción |
| VIS-03 | Grid del formulario `minmax(220px,1fr)` desborda a 320 px | `REPRODUCIDO` a nivel de panel (5 px) | LOW | `FIXED` + `VERIFIED` |
| VIS-04 | Hero `min-h-[620px]` fuerza altura excesiva en móvil | `PARCIAL` (el mínimo no es el que manda) | LOW | `FIXED` + `VERIFIED` |
| VIS-05 | Exceso de `py-24` (96 px) en móvil | `REPRODUCIDO` como densidad | MEDIUM | `OPEN` (C3 pendiente) |
| VIS-06 | Chips de filtro con scroll-snap | `REPRODUCIDO` (un chip de 495 px) | MEDIUM | `FIXED` + `VERIFIED` |
| VIS-07 | Galerías con alturas fijas (`auto-rows-[180px]`) | `REPRODUCIDO` en Quiénes Somos | MEDIUM | `FIXED` + `VERIFIED` |

Hallazgos nuevos: **VIS-08**, **VIS-09**, **VIS-10** (`FIXED` + `VERIFIED`).
Panel admin: **VIS-11** (`NO VERIFICADO`).

---

## VIS-01 — Safe-area de la barra inferior vs spacer fijo (57 px antes)

- Estado: `LATENTE` → `FIXED` conservador · `VERIFIED` · Severidad: LOW (pasaría a MEDIUM si se activa `viewport-fit=cover`).
- Corrección aplicada (decisión del usuario: conservadora, sin `viewport-fit=cover`):
  - `mobile-action-bar.component.html`: se retiró `padding-bottom: env(safe-area-inset-bottom)`.
  - `public-layout.component.html:13`: spacer `h-[57px]` → `h-[50px]`.
  - Medición post-fix: barra = **49,5 px**, spacer = **50 px**, sin solape y sin hueco de 7,5 px.
- Riesgo latente restante: sigue sin soporte edge-to-edge; si en el futuro se añade
  `viewport-fit=cover`, habrá que volver a sincronizar barra y spacer.
- Rutas: todas las públicas con layout.
- Evidencia original:
  - `mobile-action-bar.component.html:2-3` usaba `padding-bottom: env(safe-area-inset-bottom)`.
  - `public-layout.component.html:13` reservaba `h-[57px]`.
  - Medición: barra = **49,5 px**, spacer = **57 px**, `padding-bottom` computado = **0 px**.
  - `src/index.html:7` declara `width=device-width, initial-scale=1` **sin `viewport-fit=cover`**.
    Por eso `env(safe-area-inset-bottom)` vale 0 en iOS Safari y la barra no se extiende.
- Impacto original: sobraban 7,5 px de espacio al final del documento (cosmético). No había solape.
- Riesgo latente: si se añade `viewport-fit=cover` (deseable para edge-to-edge), la barra pasa a
  ~49,5 + inset (≈34 px en iPhone con home indicator) = **83,5 px**, pero el spacer (ahora 50 px)
  dejaría el pie tapado por **≈33,5 px**.
- Causa raíz: dos fuentes de verdad para la altura (contenido de la barra y un spacer hardcodeado).

## VIS-02 — Menú móvil `text-4xl` y desborde horizontal

- Estado: `NO REPRODUCIDO` · Sin acción.
- Evidencia a 320×568: ancho de fila = 280 px; texto más ancho = **204 px** ("Quiénes Somos"),
  borde derecho del texto = **261 px** ≤ 300 px. El texto envuelve ("Quiénes Somos" ocupa 2 líneas,
  alto 121 px vs 81 px del resto), pero no desborda horizontalmente.
- Nota: el problema real del menú es **vertical** (VIS-08), no horizontal.

## VIS-03 — Grid del formulario de contacto a 320 px

- Estado: `REPRODUCIDO` → `FIXED` · `VERIFIED` · Severidad: LOW.
- Corrección aplicada: los tres grids usan ahora `minmax(min(220px,100%),1fr)` (×2) y
  `minmax(min(150px,100%),1fr)` en `contact.component.html`. Medición post-fix: desborde del
  contenido del panel = **0 px** en 320, 360, 390 y 430 px.
- Evidencia original (`contact.component.html:129,145,167,187`):
  - Panel `p-8` (32 px) dentro de `wrap` de 280 px → caja de contenido = **216 px**.
  - `grid-cols-[repeat(auto-fit,minmax(220px,1fr))]` → track de **220 px**.
  - Borde derecho de los hijos = **273 px**; borde derecho del contenido del panel = **268 px**.
  - Desborde = **5 px** dentro del padding derecho (el padding efectivo baja de 32 a 27 px).
- No genera scroll horizontal de página (`scrollWidth === clientWidth`). Solo a 320 px; a 360 px
  el contenido del panel es 256 px y ya cabe.
- Mismo patrón en los tres grids (`220px` ×2 y `150px` ×1).

## VIS-04 — Altura del hero en móvil

- Estado: `PARCIAL` → `FIXED` · `VERIFIED` · Severidad: LOW.
- Corrección aplicada (decisión del usuario: reducir `pt` y titular en base):
  - `home.component.html`: hero `pb-8 pt-20 sm:pb-12 sm:pt-32 md:pb-20 md:pt-40`.
  - H1 base `text-[2.25rem]` (antes 2,7 rem); separación `mt-8 sm:mt-10 md:mt-12`.
  - Medición post-fix a 320×568: hero = **636 px** (objetivo ≤653 px). El CTA queda visible.
- Evidencia original (`home.component.html:3,7`): el `min-h-[620px]` **no es la restricción que manda**;
  el contenido lo supera.
  | Viewport | Alto del hero | Alto del viewport |
  | --- | --- | --- |
  | 320×568 | **777 px** | 568 px |
  | 360×800 | 669 px | 800 px |
  | 390×844 | 669 px | 844 px |
  | 430×932 | 669 px | 932 px |
  | 768×1024 | 901 px (`md:min-h-[88vh]`) | 1024 px |
  | 1024×768 | 676 px | 768 px |
  | 1280×800 | 704 px | 800 px |
  | 1440×900 | 792 px | 900 px |
- Solo 320×568 deja el hero 209 px por encima del viewport. El `pt-40` (160 px) + título a
  2,7 rem + `pb-14` son los que elevan la altura, no el `min-h`.
- No hay recorte ni overflow: el hero crece (`min-h`), no se rompe.

## VIS-05 — Densidad vertical por `py-24` en móvil

- Estado: `REPRODUCIDO` → `OPEN` (no implementado) · Severidad: MEDIUM (decisión de diseño).
- Corrección: **no aplicada** por decisión de alcance (Fase A + B, sin C3). Queda propuesta la
  escala de ritmo vertical en `fixes.md`.
- Evidencia: `py-24` = 96 px por lado (192 px por sección). Se repite 8 veces en Home, 7 en
  Quiénes Somos, 7 en detalle de proyecto. Alturas completas de página a 320 px **antes** de las
  correcciones:
  | Ruta | Alto (320×568) | Alto (390×844) |
  | --- | --- | --- |
  | Home | 9.139 px | 8.720 px |
  | Quiénes Somos | **18.031 px** | 17.801 px |
  | Servicios | 5.508 px | — |
  | Detalle de servicio | 5.049 px | — |
  | Proyectos | 5.390 px | — |
  | Detalle de proyecto | 4.908 px | — |
  | Contacto | 4.120 px | — |
  | No encontrada | 2.090 px | — |
- **Después** de Fase A + B: Home = **9.015 px** (objetivo 8.000, sigue por encima) y
  Quiénes Somos = **13.224 px** (objetivo 12.000, sigue por encima). El resto de rutas no cambió.
- La mayor parte del exceso de Quiénes Somos era la galería (VIS-07), ya corregida; lo que queda
  es densidad por `py-24`.

## VIS-06 — Chip de ubicación más ancho que la fila

- Estado: `REPRODUCIDO` → `FIXED` · `VERIFIED` · Severidad: MEDIUM.
- Corrección aplicada (`styles.css`):
  - `.chip`: `max-width:100%; text-align:center; white-space:normal; overflow-wrap:anywhere;`.
  - `.chips-row > *`: `max-width:100%` en base.
  - Medición post-fix: el chip más ancho (incluida la ubicación larga) queda **≤ ancho de la
    fila** en 320, 360, 390 y 430 px; el texto envuelve y la fila conserva el scroll-snap.
- Evidencia original (`projects-page.component.html:22,37`, `styles.css:673-701`):
  - Fila de ubicación: `scrollWidth` = **589 px** vs `clientWidth` 280/320/350/390 px.
  - El chip "Todos" mide 102 px; el chip de la ubicación larga mide **495 px**.
  - En móvil `.chips-row > * { flex: 0 0 auto }` dimensiona el chip a `max-content`; el texto
    no se parte y el chip supera el ancho de la fila en todos los teléfonos.
- El scroll horizontal con snap es intencional y funciona para varios chips; el problema es que
  **un chip individual no cabe** en la fila.
- La fila de categorías no quedó representativa en esta corrida (datos abortados → solo "Todos");
  el defecto se midió en la fila de ubicación, que sí salió de la semilla.

## VIS-07 — Galería de Quiénes Somos en una columna

- Estado: `REPRODUCIDO` → `FIXED` · `VERIFIED` · Severidad: MEDIUM.
- Corrección aplicada (decisión del usuario: 2 columnas con filas de 140 px):
  - `about.component.html:109`: `auto-rows-[140px] grid-cols-2 gap-3 sm:auto-rows-[220px]
    sm:grid-cols-2 md:grid-cols-3`.
  - Medición post-fix: Quiénes Somos a 320 px = **13.224 px** (antes 18.031 px, −4.807 px).
  - Verificado que en móvil la galería computa exactamente 2 columnas.
- Evidencia original (`about.component.html:106-129`):
  - 4 grupos con **44 imágenes** en total (17 + 11 + 7 + 9).
  - `grid-cols-1` hasta 640 px; `auto-rows-[180px]` a 320 px.
  - Solo la galería ocupa ≈ 44×180 + 43×12 ≈ **8.436 px** en una columna.
- Detalle de proyecto: `auto-rows-[200px]` (`project-detail.component.html:165`), pero la semilla
  de `casa-ladera` tiene 1 imagen, así que el mosaico no quedó ejercitado.

## VIS-08 — Menú móvil sin ajuste vertical en pantallas cortas (nuevo)

- Estado: `REPRODUCIDO` → `FIXED` · `VERIFIED` · Severidad: **HIGH**.
- Corrección aplicada (`site-header.component.html`):
  - `<nav #mobileMenu>` con `overflow-y-auto overscroll-contain`.
  - Contenido interno `pt-24 pb-8 sm:pt-28` (antes `py-24`) y bloque inferior
    `mt-auto pb-12 pt-6` (antes centrado con `justify-center py-24`).
  - Medición post-fix a 320×568: el CTA es alcanzable haciendo scroll dentro del menú; el menú
    sigue midiendo el viewport y el `body` sigue bloqueado.
- Evidencia original (`site-header.component.html:56-77`; `site-header.component.ts:55-62`):
  | Viewport | Contenido interno | CTA "Solicitar Cotización" | ¿Visible? |
  | --- | --- | --- | --- |
  | 320×568 | 653 px | top 653 / bottom 697 | **No** |
  | 360×800 | 669 px | top 669 / bottom 713 | Sí |
  | 390×844 | 713 px | top 713 / bottom 757 | Sí |
  | 430×932 | 801 px | top 801 / bottom 845 | Sí |
- En 320×568 el menú mide 568 px (correcto), pero su contenido mide 653 px y el CTA queda
  85 px por debajo del viewport. `py-24` (192 px) + 5 enlaces (81/121 px cada uno) lo provocan.
- El `<nav>` no tiene `overflow-y-auto` y el `body` está bloqueado (`overflow:hidden`), así que
  no se puede desplazar: el CTA y el texto "Ingesocc S.A.S." son inalcanzables.
- Captura: `screenshots/menu-open@320x568.jpg`.

## VIS-09 — Menú móvil sin foco atrapado ni foco inicial (nuevo)

- Estado: `REPRODUCIDO` → `FIXED` · `VERIFIED` · Severidad: MEDIUM.
- Corrección aplicada (`site-header.component.ts`):
  - `viewChild` del menú + `effect` que enfoca el primer enlace al abrir.
  - `@HostListener('document:keydown.tab')` → `onMenuKeydown` atrapa el foco dentro del menú
    (incluye el botón de menú) y cicla en ambos sentidos.
  - Esc mantiene el cierre y devuelve el foco al botón.
  - Verificado con `runMenuChecks` de `tools/visual-qa.mjs`.
- El brief (§6.1) pedía "foco atrapado"; ya está implementado.
- Nota de lint: el primer intento con `(keydown.tab)` en plantilla falló
  `@angular-eslint/template/interactive-supports-focus`; se resolvió moviéndolo a `@HostListener`.

## VIS-10 — `<main>` anidado y `overflow-hidden` en Home (nuevo)

- Estado: `REPRODUCIDO` → `FIXED` · `VERIFIED` · Severidad: MEDIUM (semántica/robustez).
- Corrección aplicada: el raíz de `home.component.html` pasó de `<main overflow-hidden>` a `<div>`
  (se eliminó `overflow-hidden`). Medición post-fix: **1 solo `<main>`** en `/` y en el resto de
  rutas, en los 8 viewports. El overflow horizontal se sigue midiendo sin enmascarar.
- Evidencia original: `public-layout.component.html:6` ya renderiza `<main>`; `home.component.html:1` vuelve a usar
  `<main>`. Resultado medido: **2 landmarks `<main>`** en `/` en todos los viewports.
- El mismo `<main>` raíz de Home aplica `overflow-hidden`, lo que **enmascara** cualquier desborde
  horizontal futuro (y recorta sombras/focos). Hoy no hay desborde, pero el chequeo de overflow
  del `test:visual` no lo detectaría si lo hubiera.
- Otras rutas tienen exactamente 1 `<main>`.

## VIS-11 — Panel admin (no verificado)

- Estado: `NO VERIFICADO` · Severidad: pendiente.
- Requiere credenciales (`E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`).
- Revisión de código: los listados usan tarjetas responsive, **no `<table>`**
  (`projects-admin-page.component.html:41-98`), y los formularios usan grids que colapsan a una
  columna (`project-form.component.html:257` solo usa 3 columnas desde `sm`). No se encontraron
  anchos fijos sospechosos, pero falta la pasada visual real.

---

## Lo que NO es un hallazgo

- El scroll horizontal con snap de `.chips-row` es intencional y tiene fallback a wrap desde 768 px.
- Los reveals con `opacity: 0` inicial no alteran el layout (reservan espacio).
- `overflow-wrap: anywhere` global (`styles.css:246-248`) evita desbordes de emails/slugs.
- Los objetivos táctiles principales cumplen 44 px (`.chip`, `.btn`, botón de menú, barra inferior).
- La barra inferior se oculta correctamente desde 1024 px (`lg:hidden`).
