# Informe de QA visual — Ingesocc

Fecha: 2026-10-13 · Rama: `feature/redesign`

Verificación **programática** (medición de DOM + suites automatizadas). El modelo no
puede leer imágenes, por lo que las capturas en `test-results/audit/*.png` no se
evaluaron visualmente; se sustituyó por métricas de geometría reproducibles.

## Resultados de verificación

| Comando | Resultado |
|---|---|
| `pnpm lint` | ✅ limpio (0 errores) |
| `pnpm test:ci` (Karma/Chrome Headless) | ✅ 200/200 SUCCESS (2026-10-18) |
| `pnpm test:e2e` (Playwright, Chrome) | ✅ **70 passed · 3 skipped** |
| `pnpm build` | ✅ OK — 729.46 kB inicial (153.86 kB transfer) · 2026-10-18 |

Los 3 `skipped` son los flujos CRUD de admin (proyectos, servicios, bandeja de
contacto) que requieren `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`.

## Regresión: solape vertical en `/proyectos`

Métrica medida sobre las tarjetas (`app-project-card`): diferencia entre el borde
inferior del contenido (`<a>`) y el de su contenedor de fila.

| Viewport | Antes | Después |
|---|---|---|
| 1440 × 900 | `contentOverflowsHost = 146px` → solape con la fila siguiente | `0` · `parentAutoRows: auto` |
| 390 × 844 | `contentOverflowsHost = 81px` | `0` |
| 320 × 568 | — | `0` |

Causa: `auto-rows-[300px]` fijaba la fila por debajo del contenido real (~446px) de
la variante `panel`. Corrección en `projects-page.component.html`; el mosaico del Home
no se toca (usa `overlay` con contenido absoluto dentro de la celda).

## Auditoría de consola, red e imágenes

Diagnóstico con Playwright que recorre todas las rutas públicas (y la primera ficha de
servicio y de proyecto), capturando errores de consola, `pageerror`, respuestas ≥ 400 y
el estado real de cada `<img>` (tras disparar el lazy-load). Dos defectos reales,
**ambos corregidos**:

1. **NG0904 — `unsafe value used in a resource URL context`** en `/contacto` y
   `/proyectos/la-holanda`. Los `<iframe>` de Google Maps enlazaban `[src]` a un string
   plano; Angular rechaza strings en el contexto *resource URL*. Además, en apps
   standalone `bootstrapApplication` no registra el mapeo `{provide: Sanitizer,
   useExisting: DomSanitizer}` (vive en `BrowserModule`). Corrección: inyectar
   `DomSanitizer` y enlazar un `SafeResourceUrl` obtenido con
   `bypassSecurityTrustResourceUrl(...)` en `contact.component.ts` y
   `project-detail.component.ts`. Verificado: 0 `pageerror` de este tipo.

2. **Imagen muerta** `images.unsplash.com/photo-1504307651254-...` → **HTTP 404**
   (`net::ERR_BLOCKED_BY_ORB`), visible en `/servicios` y su ficha. Usada como
   `photoUrl` del servicio *Proyectos de Infraestructura* y en la galería del proyecto
   *Puente vehicular*. Reemplazada por imágenes válidas (verificadas en navegador) en
   `services.service.ts`, `projects.service.ts` y `supabase/seed.sql`. Verificado:
   `broken: []` en **todas** las rutas.

**Errores residuales (no de UI).** Quedan respuestas **400/404 de Supabase REST**
(`projects` 400, `services` 400, `testimonials` 404) en todas las rutas. Son
**ambientales**: el esquema remoto no tiene aplicadas las migraciones, así que el
cliente cae al seed estático y la interfaz se renderiza correctamente. Se resuelven
aplicando las migraciones (`supabase db push`), no con cambios de código. El
`media net::ERR_ABORTED` del vídeo Cloudinary en `/quienes-somos` es un abort de
`preload` (benigno).

## Cobertura de la suite e2e

- **12 viewports** (320 → 1920, inclusión landscape/tablet) × rutas públicas y de auth.
- Fichas de **todos** los servicios y proyectos, todos los filtros de categoría y
  ubicación, FAQ desplegada, lightbox de galería, errores y texto largo en `/contacto`,
  menú móvil abierto y zoom de texto al 150 %.
- Nuevas pruebas de esta sesión:
  - `Proyectos · tarjetas sin solape vertical` (320 / 768 / 1440) — 3 casos.
  - `menú móvil: cierra con Escape, devuelve el foco y bloquea el scroll`.

## QA de accesibilidad (cambios verificados)

| Elemento | Verificación | Resultado |
|---|---|---|
| Menú móvil | `Escape` cierra y devuelve foco al botón | ✅ e2e |
| Menú móvil | `document.body.style.overflow === 'hidden'` al abrir; `''` al cerrar | ✅ e2e |
| Menú móvil | cierre al cambiar de ruta (`NavigationEnd`) | ✅ (por diseño) |
| Lightbox | foco al diálogo al abrir; foco previo restituido al cerrar | ✅ (dominio + `role="dialog"`/`aria-modal` ya presentes) |
| Lightbox | bloqueo de scroll del fondo | ✅ (por diseño) |

## Limitaciones y riesgos residuales

1. **No verificado visualmente por persona** (caption del lightbox, metadatos del admin).
2. **Firecrawl no disponible** → no se rastreó el sitio de obra de referencia.
3. La migración `20260918000009_fix_contact_lead_guard.sql` está versionada pero
   **no aplicada**: requiere `supabase db push` y `supabase/rls-checks.sql` en staging.
   De ahí los 400/404 de Supabase REST descritos arriba.
4. Los flujos admin (persistencia CMS, links del dashboard) siguen con hallazgos
   abiertos; ver `docs/ui-audit.md`.

## Veredicto

Interfaz pública **sin regresiones**, sin desbordamiento horizontal en la matriz de
viewports y **sin errores propios de UI en consola ni imágenes rotas**. El solape P1,
el error NG0904 de los mapas y la imagen muerta quedaron cerrados. Los pendientes de
admin, la aplicación de migraciones y la validación humana son el siguiente paso.

## Fase 06 — Escaparate (Home) · 2026-10-15

Movimiento verificado programáticamente (Playwright + emulación de
`prefers-reduced-motion`), todo **CSS-only / sin dependencia de JS para ser legible**:

| Pieza | Verificación | Resultado |
|---|---|---|
| Hero (eyebrow→h1→subtítulo→acciones) | `.hero-reveal-1..4`, opacidad final 1 | ✅ |
| Hero con `reduced-motion` | reveals y scroll-cue anulados, texto visible | ✅ |
| Contadores de stats | 0 → valor al entrar en viewport (`IntersectionObserver` 0.4); `15+/120+/8+`; `tabular-nums` | ✅ |
| Contadores con `reduced-motion` | muestran el valor final directo | ✅ |
| Cards destacadas | entrada escalonada `appReveal`; conservan `reveal-visible` | ✅ |
| Icono de servicios | `appIconMotion="nudge-x"` por hover del contenedor | ✅ |
| Consola | `pageerror` en carga de Home | 0 |

Presupuestos Lighthouse (ejecución **local**, una pasada):

| Ruta | Perf | A11y | Best Practices | SEO |
|---|---|---|---|---|
| Home · Desktop | 89 (WARN) | 95 | 96 | 100 |
| Proyectos · Desktop | 91 | — | — | — |
| Home · Mobile | 63 | — | — | — |

El elemento **LCP del Home es la imagen del hero** (`img.absolute`, alt
"Obra de Ingesocc S.A.S."). La caída frente a la línea base de 2026-09 (Perf 97, LCP
~1.1 s) se explica por la introducción de la fotografía de hero en el rediseño —
**pre-existente a la Fase 06** — y no por la animación del texto. Se difiere el ajuste a
la **Fase 11** (rendimiento). Presupuestos de nivel *error* siguen OK.

`pnpm test:ci` = 170/170 · `node tools/visual-qa.mjs` = 0 warn · 0 FAIL.

## Fase 07 — Portafolio (Proyectos + detalle) · 2026-10-15

Verificado programáticamente (Playwright, script temporal):

| Pieza | Verificación | Resultado |
|---|---|---|
| Chips de filtro | `app-filter-chip` con `aria-pressed`; activo con fondo accent `#f25623` | ✅ |
| Fila de chips | `.chips-row` scroll-snap en móvil, `flex-wrap` ≥768 px, `role="group"` | ✅ |
| Filtro de categoría | listado 11 → 4 cards; sin overflow horizontal | ✅ |
| Anuncio `aria-live` | se resetea al filtrar; mensaje al "Cargar más" | ✅ |
| Entrada de cards | `appReveal` (`reveal-visible`) | ✅ |
| Detalle · navegación | "Proyectos relacionados" + anterior/siguiente | ✅ |
| Detalle · lightbox | `aria-label` "Imagen X de N: alt", foco atrapado (Tab), cierra con Esc | ✅ |
| La Holanda | enlace real a `laholanda.ingesocc.com` | ✅ |
| `reduced-motion` | sin `reveal-pending` | ✅ |
| Consola | `pageerror` en listado/detalle | 0 |

`pnpm test:ci` = 179/179 · `node tools/visual-qa.mjs` = 0 warn · 0 FAIL. El localizador de
chips de `visual-qa.mjs` se actualizó a `button.chip` (el markup ya no usa `button.rounded-full`).

## Fase 08 — Catálogo y Trayectoria (Servicios + Quiénes Somos) · 2026-10-15

Verificado programáticamente (Playwright, script temporal, 29/29 PASS):

| Pieza | Verificación | Resultado |
|---|---|---|
| `/servicios` · layout | 6 filas editoriales (sin grid de cajas con sombra) | ✅ |
| `/servicios` · acción | badge circular de flecha; relleno accent en hover/focus | ✅ |
| `/servicios` · entrada | `appReveal` sin `reveal-pending` tras scroll (desktop y móvil) | ✅ |
| Timeline · estructura | 4 hitos / 4 dots; línea con clase `line-draw` | ✅ |
| Timeline · escritorio | línea centrada (±0.0px); hitos alternados izq/der | ✅ |
| Timeline · móvil | una sola columna (Δ0.0px); línea a la izquierda (+5px) | ✅ |
| Propósito | iconos `lucideTarget` / `lucideEye` / `lucideShieldCheck` presentes | ✅ |
| Galería · lightbox | `<app-lightbox>` abre ("Imagen 1 de 43: …") y cierra con Esc | ✅ |
| Enlaces narrativos | a `/proyectos` y `/servicios` | ✅ |
| Overflow / consola | sin overflow horizontal; `pageerror` | 0 |

`pnpm test:ci` = 185/185 · `node tools/visual-qa.mjs` = 0 warn · 0 FAIL. Se añadió
`LineDrawDirective` (scroll-driven con fallback IO) y specs de timeline/galería.

## Fase 09 — Puente (Contacto + Footer + transversales) · 2026-10-15

Verificado programáticamente (Playwright, script temporal, 20/20 PASS):

| Pieza | Verificación | Resultado |
|---|---|---|
| `/contacto` · requeridos | `aria-required` en name/email/message; no en phone/subject | ✅ |
| `/contacto` · error | enviar vacío → `aria-invalid`, `aria-describedby=name-error`, mensaje inline | ✅ |
| `/contacto` · foco | foco automático en el primer campo inválido (`#name`) | ✅ |
| `/contacto` · estado | región `role="status" aria-live="polite"` para el envío | ✅ |
| `/contacto` · iconos | iconos de información con `appIconMotion="pop"` (hover de fila) | ✅ |
| Footer · cierre | línea superior blueprint; botón "volver arriba" `aria-label` funcional | ✅ |
| Footer · contraste | token `text-on-dark-muted`; sin `text-white/40` | ✅ |
| Transversal · progreso | `.scroll-progress` con `scaleX≈1.00` al final del scroll | ✅ |
| Transversal · navegación | View Transitions dispara `pagereveal` (crossfade) | ✅ |
| 404 | "Error 404"; numeral `aria-hidden`; 2 iconos con micro-movimiento | ✅ |
| Consola | `pageerror` | 0 |

`pnpm test:ci` = 195/195 (185 + 10 nuevos) · `node tools/visual-qa.mjs` = 0 warn · 0 FAIL.
Validación y guardado en `contact_messages`/RLS intactos (D-19); transversales en CSS puro con
degradación elegante (D-20).

## ## Fase 11 — Control de Calidad · 2026-10-18

- **Build:** pnpm build OK. pnpm lint 0 errores. pnpm test:ci **200/200 SUCCESS**. pnpm test:visual 0 warn/0 FAIL. pnpm test:perf cumple presupuestos de nivel *error*; Desktop Home Perf **0.87** (WARN < 0.90 objetivo), Proyectos **0.89**, A11y **1.00** en todas las corridas; Mobile Perf **0.62–0.64**, A11y **1.00**.
- **Hallazgos corregidos en Fase 11:** #12 (em-dash en aria-label de marca), #13/#15 (contrastes 	ext-white/40→	ext-white/70 y 	ext-muted-foreground/70→	ext-muted-foreground), chips ≥44×44. Lighthouse Accessibility = **100** en / y /proyectos.

Fase 10 — Bastidores (Admin sobrio) · 2026-10-18

Verificado con specs + runtime sobre el build de producción (script temporal
`tools/_phase10-verify.mjs`, 10/10 PASS, borrado tras la ejecución). El panel
**autenticado** no es recorrible en navegador sin credenciales E2E: su verificación
es de código (specs + lint + build).

| Pieza | Verificación | Resultado |
|---|---|---|
| `/admin/login` · campos | enviar vacío → 2 `p.field-error` en `rgb(165,58,12)`; botón 44 px | ✅ |
| `/admin/recuperar` · campos | email inválido → 1 `.field-error` con el token | ✅ |
| `/admin/nueva-contrasena` · enlace | sin token → `role="alert" class="alert alert-error"` | ✅ |
| `/contacto` · errores | 3 `.field-error`, 3/3 vinculados con `aria-describedby`, `aria-invalid` | ✅ |
| Errores de carga/guardado (admin) | `role="alert" class="alert alert-error"` en listados, formularios, bandeja, CMS, dashboard | ✅ (specs) |
| Skeletons | `role="status"` + `sr-only` en listados, formularios, bandeja, CMS | ✅ |
| Vacíos | `.empty-state` en listados y en el CMS (antes `panel` ad-hoc) | ✅ |
| Feedback de guardado | formularios → `?guardado=1`; banner `alert-success alert-enter` 6 s y limpieza del query param | ✅ (5 specs) |
| Tablas en móvil | etiquetas `sm:hidden` por celda (Categorías/Valor/Orden/Estado/Testimonio/Estrellas) | ✅ |
| Iconos de acción | `pop` guardar · `nudge-up` subir imagen · `shake` eliminar; `aria-hidden` decorativos | ✅ |
| Consola | `pageerror` en login/recuperar/nueva-contraseña/contacto | 0 |

`pnpm build` OK · `pnpm lint` 0 errores · `pnpm test:ci` = **200/200** (195 + 5 nuevos) ·
`node tools/visual-qa.mjs` = 0 warn · 0 FAIL (selector de errores de contacto actualizado a
`.field-error` en la herramienta). Contraste preservado: `.field-error`/`.alert-error` usan el
token `--accent-deep` ya auditado; no se modificaron botones, campos ni espaciado global (D-21).
