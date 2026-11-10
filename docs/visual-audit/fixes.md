# Plan de corrección (Fase A + B aplicada)

Principios: cambios mínimos y trazables a un hallazgo; sin rediseño a ciegas; sin
`overflow-x: hidden` global; sin ocultar contenido para "arreglar" overflow; sin librerías nuevas;
sin tocar Supabase/RLS/migraciones ni la lógica de datos.

Cada fase es independiente y reversible. Se aplicaron A1, A2, B1, B2, B3, B4 y las decisiones
C1 (conservadora) y C2. **No se hizo commit/push.** C3, C4 y C5 quedan pendientes.

## Estado de aplicación

| ID | Cambio | Estado |
| --- | --- | --- |
| A1 | Menú móvil desplazable + padding corto | `FIXED` + `VERIFIED` |
| A2 | Foco atrapado/inicial del menú | `FIXED` + `VERIFIED` |
| B1 | Chip con `max-width: 100%` | `FIXED` + `VERIFIED` |
| B2 | Galería Quiénes Somos 2 columnas | `FIXED` + `VERIFIED` |
| B3 | `minmax(min(220px,100%),1fr)` | `FIXED` + `VERIFIED` |
| B4 | Quitar `<main>` anidado / `overflow-hidden` | `FIXED` + `VERIFIED` |
| C1 | Safe-area (opción conservadora) | `FIXED` + `VERIFIED` |
| C2 | Hero 320 (reducir `pt` y titular) | `FIXED` + `VERIFIED` |
| C3 | Token de ritmo vertical | `OPEN` |
| C4 | Galería de detalle de proyecto | `OPEN` (sin datos para ejercitarla) |
| C5 | Panel admin | `OPEN` (sin credenciales) |

---

## Fase A — Bloqueante (P0)

### A1. Menú móvil: CTA inalcanzable en 320×568 (VIS-08)

- Archivo: `src/app/layouts/public-layout/site-header.component.html:56-77`.
- Cambio aplicado:
  - `overflow-y-auto overscroll-contain` en el `<nav #mobileMenu>`.
  - Contenido interno `pt-24 pb-8 sm:pt-28` (antes `py-24`).
  - Bloque inferior `mt-auto pb-12 pt-6` en lugar de centrar todo con `justify-center py-24`.
  - No se usa `env()` en el bloque inferior: C1 se resolvió con la opción conservadora.
- Criterio de aceptación:
  - A 320×568, tras abrir el menú, el CTA "Solicitar Cotización" es visible o alcanzable
    desplazando dentro del menú; Esc cierra y devuelve el foco al botón.
  - A 360/390/430 el aspecto actual no cambia (CTA visible sin scroll).
- Riesgo: bajo. Solo clases; no toca lógica. Verificar que el bloqueo de scroll del body siga
  funcionando y que el menú no "rebote" en iOS.
- Esfuerzo: S.

### A2. Menú móvil: foco atrapado y foco inicial (VIS-09)

- Archivo: `src/app/layouts/public-layout/site-header.component.ts:55-80` y plantilla.
- Cambio aplicado:
  - `viewChild` del menú + `effect` que enfoca el primer enlace al abrir.
  - `@HostListener('document:keydown.tab')` → `onMenuKeydown` cicla el foco entre los elementos
    enfocables del menú (incluye el botón); Shift+Tab invierte.
  - Esc cierra y devuelve el foco al botón.
  - No se usó `role="dialog"`: el trap explícito es suficiente para un `<nav>`.
- Criterio de aceptación:
  - Con teclado, Tab nunca sale del menú mientras está abierto; Esc cierra y enfoca el botón.
  - Test Playwright de teclado en 390×844 y 320×568.
- Riesgo: medio-bajo (gestión de foco en Angular). Aislado al header.
- Esfuerzo: M.

---

## Fase B — Alta / media (P1)

### B1. Chip de ubicación más ancho que la fila (VIS-06)

- Archivos: `src/styles.css:673-701`, `src/app/shared/components/filter-chip.component.html`.
- Cambio aplicado:
  - `.chips-row > * { max-width: 100%; }` en base.
  - `.chip { max-width: 100%; text-align: center; white-space: normal; overflow-wrap: anywhere; }`.
  - Se mantiene el scroll horizontal para varios chips y el wrap desde 768 px.
- Criterio de aceptación:
  - Ningún chip supera el `clientWidth` de su `.chips-row` en 320/360/390/430.
  - El chip de 495 px pasa a ocupar como máximo el ancho de la fila y su texto envuelve.
- Riesgo: bajo (visual). Verificar que el snap siga alineando.
- Esfuerzo: S.

### B2. Densidad de la galería de Quiénes Somos (VIS-07)

- Archivo: `src/app/features/about/about.component.html:106-129`.
- Cambio aplicado:
  - `auto-rows-[140px] grid-cols-2 gap-3 sm:auto-rows-[220px] sm:grid-cols-2 md:grid-cols-3`
    (se mantiene el breakpoint `md` existente para 3 columnas).
  - Se mantiene `object-cover` y el lightbox; no cambió la lógica de índices.
- Criterio de aceptación:
  - A 320 px, la galería ocupa 2 columnas; la altura de Quiénes Somos baja de 18.031 px
    (objetivo orientativo: ≤ 12.000 px).
  - No aparecen recortes que oculten sujetos principales (revisión visual con fotos reales).
- Riesgo: medio (recorte de fotos). Requiere revisión con imágenes reales, no solo semilla.
- Esfuerzo: S–M.

### B3. Grid del formulario de contacto a 320 px (VIS-03)

- Archivo: `src/app/features/contact/contact.component.html:145,167,187`.
- Cambio aplicado:
  - `grid-cols-[repeat(auto-fit,minmax(220px,1fr))]` →
    `grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))]` en los dos grids de 220 px.
  - Igual para el grid de `150px`.
- Criterio de aceptación:
  - A 320 px, ningún hijo invade el padding del panel (`overflowPx = 0`).
  - A 360+ el layout no cambia.
- Riesgo: muy bajo.
- Esfuerzo: S.

### B4. `<main>` anidado y `overflow-hidden` en Home (VIS-10)

- Archivo: `src/app/features/home/home.component.html:1`.
- Cambio aplicado:
  - El `<main>` raíz pasó a `<div>` (el `<main>` ya lo aporta `public-layout`).
  - Se retiró `overflow-hidden` de la raíz; el `hero` conserva su propio recorte si lo necesita.
- Criterio de aceptación:
  - `document.querySelectorAll('main').length === 1` en todas las rutas.
  - No reaparece overflow horizontal al retirar el recorte (verificado con la matriz).
- Riesgo: bajo; el recorte de la raíz hoy no oculta nada (0 offenders), pero puede ocultar
  sombras/focos. Revisar visualmente.
- Esfuerzo: S.

---

## Fase C — Baja / decisiones de diseño (P2)

### C1. Safe-area de la barra inferior (VIS-01)

- Archivos: `src/index.html:7`, `mobile-action-bar.component.html:2-3`,
  `public-layout.component.html:13`.
- Decisión del usuario: **Opción 1 (conservadora, sin edge-to-edge)**. Aplicada:
  - Se retiró `padding-bottom: env(safe-area-inset-bottom)` de la barra.
  - Spacer `h-[57px]` → `h-[50px]` (barra real 49,5 px).
  - No se añadió `viewport-fit=cover`; el riesgo latente de edge-to-edge queda documentado.
- Opción 2 (no aplicada): `viewport-fit=cover` + spacer
  `h-[calc(3.0625rem+env(safe-area-inset-bottom))]`.
- Criterio de aceptación:
  - En Chromium no sobran más de 1–2 px (resultado: 0,5 px).
  - Sin `viewport-fit=cover`, iOS no extiende la barra; el pie no queda tapado.
- Riesgo: bajo en la opción conservadora; el riesgo medio solo aplica si se activa
  `viewport-fit=cover` en el futuro.
- Esfuerzo: S.

### C2. Hero a 320×568 (VIS-04)

- Archivo: `src/app/features/home/home.component.html:3,7,12`.
- Decisión del usuario: **sí, reducir `pt` y titular en base**. Aplicado:
  - Hero `pb-8 pt-20 sm:pb-12 sm:pt-32 md:pb-20 md:pt-40`.
  - H1 base `text-[2.25rem]` (antes 2,7 rem); separación `mt-8 sm:mt-10 md:mt-12`.
  - Resultado: hero de **636 px** a 320×568 (objetivo ≤653 px); CTA visible sin recortes.
- Criterio de aceptación: medir de nuevo; sin overflow ni recortes.
- Riesgo: bajo, pero es una decisión visual.
- Esfuerzo: S.

### C3. Ritmo vertical de sección (VIS-05)

- Estado: `OPEN` — **no aplicado** (fuera del alcance aprobado).
- Archivos: `src/styles.css` (nuevo token), y las secciones con `py-24 md:py-36` en
  `home`, `about`, `project-detail`, `service-detail`.
- Cambio propuesto:
  - Añadir `--section-y: clamp(3rem, 7vw, 9rem)` y una clase `.section` (o usar
    `py-[var(--section-y)]`) para reemplazar los valores sueltos.
  - En móvil, `py-24` (96 px) baja a ~48–64 px; en desktop se mantiene el ritmo actual.
- Criterio de aceptación:
  - Reducción medible de altura de página en 320 px sin perder jerarquía.
  - Un solo token para el ritmo vertical (sin `py-24`/`py-36` dispersos).
- Riesgo: medio (toca varias plantillas). Hacerlo por página y verificar con capturas.
- Esfuerzo: M.

### C4. Galería de detalle de proyecto (VIS-07, variante)

- Estado: `OPEN` — no aplicado; la semilla no permite ejercitar el mosaico.
- Archivo: `project-detail.component.html:165`.
- Cambio propuesto (opcional): `grid-cols-2` en el base con `auto-rows-[140px]`, manteniendo el
  mosaico `md:grid-cols-12` y los `GALLERY_SPANS` (que solo aplican desde `md`).
- Requisito previo: probar con un proyecto con ≥ 4 imágenes (la semilla actual no lo ejercita).
- Esfuerzo: S.

### C5. Panel admin (VIS-11)

- Estado: `OPEN` — sin credenciales; no hay cambios propuestos hasta recorrerlo.
- Acción: ejecutar la fase admin de `tools/visual-qa.mjs` con `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`
  y añadir los viewports móviles. Corregir solo defectos reproducidos.
- Esfuerzo: S (medición) + lo que aparezca.

---

## Orden sugerido y esfuerzo

| Orden | ID | Cambio | Esfuerzo | Riesgo |
| --- | --- | --- | --- | --- |
| 1 | A1 | Menú móvil desplazable + padding corto | S | Bajo |
| 2 | A2 | Foco atrapado/inicial del menú | M | Medio-bajo |
| 3 | B3 | `minmax(min(220px,100%),1fr)` | S | Muy bajo |
| 4 | B4 | Quitar `<main>` anidado / `overflow-hidden` | S | Bajo |
| 5 | B1 | Chip con `max-width: 100%` | S | Bajo |
| 6 | B2 | Galería Quiénes Somos 2 columnas | S–M | Medio |
| 7 | C1 | Safe-area (decisión) | S | Medio |
| 8 | C2 | Hero 320 (decisión) | S | Bajo |
| 9 | C3 | Token de ritmo vertical | M | Medio |
| 10 | C4/C5 | Galería detalle / admin | S | Bajo |

## Decisiones

Resueltas:

1. **Safe-area:** opción conservadora, sin `viewport-fit=cover` (C1).
2. **Hero en 320×568:** priorizar el CTA reduciendo `pt` y el titular base (C2).
3. **Galería Quiénes Somos:** 2 columnas con filas de 140 px en móvil (B2).
4. **Alcance:** Fase A + B, sin C3.

Pendientes:

5. **Ritmo vertical:** ¿se aplica C3 a todas las páginas o solo a Home/Quiénes Somos?
6. **Admin:** ¿hay credenciales de prueba para completar VIS-11?
7. **Galería de detalle:** ¿se prueba C4 con un proyecto de ≥4 imágenes?

## Rollback

Cada cambio es de plantilla/CSS y está aislado por archivo. No hay migraciones, RLS ni cambios de
datos. Revertir un commit (o el bloque) restaura el estado actual sin efectos colaterales.
