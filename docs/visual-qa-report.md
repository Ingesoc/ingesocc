# Informe de QA visual — Ingesocc

Fecha: 2026-10-13 · Rama: `feature/redesign`

Verificación **programática** (medición de DOM + suites automatizadas). El modelo no
puede leer imágenes, por lo que las capturas en `test-results/audit/*.png` no se
evaluaron visualmente; se sustituyó por métricas de geometría reproducibles.

## Resultados de verificación

| Comando | Resultado |
|---|---|
| `pnpm lint` | ✅ limpio (0 errores) |
| `pnpm test:ci` (Karma/Chrome Headless) | ✅ 164/164 SUCCESS |
| `pnpm test:e2e` (Playwright, Chrome) | ✅ **70 passed · 3 skipped** |
| `pnpm build` | ✅ OK — 689.83 kB inicial (146.95 kB transfer) |

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
