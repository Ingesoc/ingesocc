# Auditoría de interfaz (UI) — Ingesocc

Fecha: 2026-10-13 · Rama: `feature/redesign`

> **Actualización 2026-10-14 (Fase 01 — Radiografía).** Revisión de esta sesión:
> se re-ejecutaron build, tests, Lighthouse y captura de pantallas; se añadieron
> los hallazgos #12–#17 (accesibilidad actual 95, contraste, `label-content-name-mismatch`,
> objetivo táctil, páginas largas y duplicidad de tokens). Línea base del estado
> "antes" en `docs/design/baseline/` (métricas + screenshots 390/820/1440).
> Las capturas siguen sin evaluarse visualmente por el modelo (no lee imágenes).

Método: lectura de plantillas/estilos, **medición programática del DOM con Playwright**
(geometría, overflow, overflow de contenido), Lighthouse y revisión de la suite e2e existente.
Las capturas (`docs/design/baseline/screenshots/`, `test-results/visual-qa/`) no se
inspeccionaron visualmente porque el modelo no puede leer imágenes; se usó medición.

## Fortalezas confirmadas

- Sistema de componentes único en `src/styles.css` (`.btn`, `.field`, `.badge`,
  `.kicker`, `.panel`, `.media-zoom`, `.wrap`) compartido por público y admin.
- Accesibilidad de base: `:focus-visible` global, `prefers-reduced-motion`
  neutralizando animaciones, `overflow-wrap: anywhere` para tolerar zoom 150 %.
- SEO/social: `index.html` con OG/Twitter/JSON-LD, cabecera canónica y preload de
  fuentes Archivo.
- Sin desbordamiento horizontal: la suite `responsive-overflow.spec.ts` cubre 12
  viewports × todas las rutas públicas y pasa; verificado también en 390/820/1440
  (`baseline-metrics.json`, 0 overflow).
- LCP del hero con `fetchpriority="high"` y `decoding="async"`; `loading="lazy"`
  bajo el pliegue; `aspect-ratio` reservado en cards y galerías (cero CLS evitable).


## Hallazgos

Clasificación: **P0** crítico (regresión funcional, a11y básica rota, error de carga,
exposición de datos) · **P1** alto · **P2** medio · **P3** bajo.

| ID | Página/componente | Problema comprobado | Impacto para el usuario | Prioridad | Solución propuesta | Forma de verificar |
|---|---|---|---|---|---|---|
| 1 | `/proyectos` (rejilla) | Filas fijas `auto-rows-[300px]` mientras la tarjeta panel mide ~446px; desbordaba 146px (1440) / 81px (390) y se solapaba con la fila siguiente. | Solape/recorte de tarjetas; lectura rota del portafolio. | P1 | **Corregido**: quitar el alto de fila fijo (`projects-page.component.html`). | `responsive-overflow.spec.ts`; `contentOverflowsHost: 0`. |
| 2 | Header (menú móvil) | Se abría sin `Escape`, sin bloqueo de scroll, sin cierre al navegar ni `aria-controls`. | Usuario atrapado; scroll de fondo. | P1 | **Corregido**: Escape+foco, `overflow:hidden`, cierre en `NavigationEnd`, `aria-controls`. | `e2e/public-flows.spec.ts`. |
| 3 | Lightbox (proyecto) | Sin bloqueo de scroll ni gestión de foco al abrir/cerrar. | Foco perdido. | P2 | **Corregido** en `project-detail.component.ts`. | Revisión de código. |
| 4 | `/admin` (CMS) | "Guardado" sin persistir en algunos flujos; "Actualizar" puede borrar ediciones. | Pérdida de cambios. | P2 | Reparar guardado/`dirty`. | Sesión admin. |
| 5 | `/admin` (dashboard) | Enlaces apuntan todos a `activePage='home'`. | Navegación confusa. | P2 | Enlazar cada tarjeta a su página. | Sesión admin. |
| 6 | `/admin` (recuperación) | `new-password` puede mostrar falso "enlace inválido". | Bloquea restablecer clave. | P3 | Corregir detección de sesión/token. | E2E recuperación. |
| 7 | `/admin` (formularios) | Inputs `file` ocultos no enfocables; botones icono solo `title`; FAQ sin labels. | A11y teclado/lector. | P3 | `aria-label` y labels. | Lint a11y + teclado. |
| 8 | Público (content_blocks) | `[href]` sin validar esquema (`javascript:`). | Enlace malicioso. | P3 | Allowlist de esquemas. | Revisión de código. |
| 9 | Varios | `setTimeout` sin limpieza. | Fugas menores. | P3 | `takeUntilDestroyed`/`clearTimeout`. | Revisión de código. |
| 10 | Contacto/proyecto | NG0904: `<iframe>` de Maps con `[src]` string plano. | Maps no carga. | P1 | **Corregido**: `bypassSecurityTrustResourceUrl`. | 0 `pageerror`. |
| 11 | Servicios/ficha | Imagen Unsplash muerta (404/ORB). | Imagen rota. | P2 | **Corregido**: imágenes válidas. | `broken: []`. |
| 12 | Todas (a11y) | Lighthouse Accessibility 95; fallan `color-contrast` y `label-content-name-mismatch`. | Baja visión/lectores. | P1 | Ajustar contraste y nombres accesibles. | Lighthouse ≥ 100. |
| 13 | Footer y `/proyectos` | Contraste 3.83:1 (`text-white/40`) y 3.34:1 (muted claro), < 4.5:1. | Texto difícil de leer. | P2 | Subir a tono AA. | Lighthouse `color-contrast`. |
| 14 | Logo (header/footer) | `aria-label` no incluye el texto visible. | Dictado por voz inconsistente. | P2 | Alinear `aria-label`. | Lighthouse. |
| 15 | `/proyectos` (chips) | Filtros `py-2.5` = 37–39px, < 44px. | Táctil pequeño en móvil. | P2 | Alto ≥ 44px. | Medición Playwright. |
| 16 | `/quienes-somos`, `/` | Páginas muy largas en móvil (17195px / 8681px @390). | Fatiga de scroll. | P2 | Condensar secciones. | `baseline-metrics.json`. |
| 17 | `styles.css` | Tokens `--text-*`/`--spacing-*`/`--shadow-*`/`--radius` duplicados vs Tailwind v4. | Mantenimiento. | P3 | Consolidar en `@theme`. | Revisión `styles.css`. |
| 18 | `/contacto` (email) | Muestra `juankos0714@gmail.com` (CMS remoto) en vez de `gerencia.ingesocc@gmail.com`. | Contacto va a correo ajeno. | P1 | Corregir `content_block` `email`. | Recargar `/contacto`. |

> **Evidencia detallada:** `.lighthouseci/*.json` (#12–#14), `docs/design/baseline/baseline-metrics.json`
> (#16), `docs/design/baseline/screenshots/` y las mediciones Playwright de esta sesión (#15).

## Detalle del hallazgo #18 (evidencia)

La build de producción (`environment.prod.ts` → `https://ietjikoddwpdybarcwfk.supabase.co`)
renderiza el correo del CMS, no el fallback del repo:

```
RENDER:   juankos0714@gmail.com          (content_blocks, Supabase remoto)
FALLBACK: gerencia.ingesocc@gmail.com    (src/app/core/site-config.ts, content-blocks.service.ts)
```

`juankos0714@gmail.com` **no aparece en el repositorio** (búsqueda global = 0): es contenido
del CMS remoto que prevalece sobre el fallback verificado.

## Detalle del hallazgo #1 (evidencia)

Medición con Playwright sobre `/proyectos` (antes del arreglo):

```
INNER w=1440 hostBottom=1044 aBottom=1190 contentOverflowsHost=146
INNER w=390  hostBottom=1201 aBottom=1282 contentOverflowsHost=81
```

Tras el arreglo (`contentOverflowsHost: 0` y `parentAutoRows: auto`). Nota: el mosaico
del Home **sí** usa filas fijas, pero con tarjetas `overlay` cuyo contenido es absoluto
y llena la celda; no debe copiarse ese `auto-rows` a las tarjetas `panel` con texto.

## Detalle de los hallazgos #10 y #11 (evidencia)

Diagnóstico con Playwright sobre todas las rutas públicas, capturando `pageerror`,
errores de consola, respuestas ≥ 400 y el estado real de cada `<img>` (forzando lazy).

```
# #10  antes: pageErrors: ["NG0904: unsafe value used in a resource URL context ..."]
# #10  después: pageErrors: []
# #11  antes: broken: ["https://images.unsplash.com/photo-1504307651254-..."]
# #11  después: broken: []
```

Errores residuales (no de UI): respuestas **400/404 de Supabase REST** en todas las
rutas (`projects` 400, `services` 400, `testimonials` 404) por migraciones sin aplicar;
el cliente cae al seed y la interfaz se ve bien.

## Recomendaciones

1. Cerrar los hallazgos de admin (#4–#5) en una sesión dedicada por tocar estado y
   persistencia, no estética.
2. Revisar visualmente (persona) el caption del lightbox y los campos de metadatos del
   admin: la verificación de esta sesión fue programática.
3. Añadir labels accesibles a los inputs de archivo y sustituir `title` por
   `aria-label` en botones icono (#7).
4. Resolver los fallos de Lighthouse #12–#14 (contraste y nombre accesible) para
   alcanzar Accessibility 100.
5. Aumentar el objetivo táctil de los chips de filtro (#15) a ≥44 px.

---

## Mapa técnico (Fase 01)

### Stack y configuración

| Área | Ubicación | Notas |
|---|---|---|
| Tokens/estilos globales | `src/styles.css` | `@theme inline` + `:root`; componentes en `@layer components`. |
| PostCSS | `.postcssrc.json` | Solo `@tailwindcss/postcss`. |
| Rutas | `src/app/app.routes.ts` | Público + admin con `authGuard`; `**` → `no-encontrada`. |
| Layout público | `src/app/layouts/public-layout/` | `site-header`, `site-footer`, `mobile-action-bar`, `public-layout`. |
| Layout admin | `src/app/layouts/admin-layout/` | Dashboard sobrio; solo tokens compartidos. |
| Datos | `src/app/features/*/data-access/` | `projects`, `services`, `content-blocks`, `testimonials`, `contact`, `auth`. |
| Imágenes | `src/app/core/cloudinary-urls.ts`, `cloudinary.service.ts`, `EditableImage` | Contextos `cover/gallery/hero/service/thumbnail` (`q_auto,f_auto`). |
| SEO | `src/app/core/seo.service.ts`, `src/index.html` | Títulos/descriptions por ruta, OG/JSON-LD. |
| Móvil | `mobile-action-bar.component.ts` | Barra fija inferior WhatsApp/Llamar (`lg:hidden`). |

### Inventario de componentes reutilizables (a consolidar en Fase 05)

| Componente | Ubicación | Uso | Candidato a |
|---|---|---|---|
| `.btn` / `.btn-solid` / `.btn-accent` / `.btn-outline` / `.btn-sm` | `styles.css` | CTAs globales | Mantener y documentar estados. |
| `.field` / `.field-label` | `styles.css` | Formularios contacto/admin | Mantener; asociar errores. |
| `.badge-*` | `styles.css` | Estados admin (published/draft/unread) | Mantener. |
| `app-project-card` | `projects/public` | Home (mosaico) y listado (panel) | Unificar hover/foco; API `variant`. |
| `app-service-card` | `services/public` | Servicios | Igualar con project-card. |
| `app-morph-icon` | `core` | Icono menú abrir/cerrar | Base para iconos animados (Fase 04). |
| `Reveal` / `Counter` | **no existen** | — | Crear en Fase 04 (`src/app/shared/icons/`). |
| `SectionHeading` (eyebrow+título) | **no existe** (patrón repetido inline) | Todas las páginas | Extraer en Fase 05. |
| `Lightbox` | Duplicado inline en `project-detail` y `about` | Galería | Extraer a componente compartido. |

### No existe todavía

- `src/app/shared/` (lo crea la Fase 04): `icons/`, directivas `Reveal`, `Counter`.

### Entornos (relevante para hallazgos de datos)

- **Dev** (`environment.ts`): Supabase local `http://127.0.0.1:64321` (no corriendo en
  esta máquina) → REST 400/404 y fallo e2e de recuperación.
- **Prod** (`environment.prod.ts`, usado por `pnpm build`): Supabase remoto
  `https://ietjikoddwpdybarcwfk.supabase.co`. Por eso la build auditada muestra
  contenido del CMS remoto (p. ej. el correo de #18) que **no** está en el repo.


## Mapa de experiencia (estado actual por ruta)

| Ruta | Observación de la auditoría | Prioridad |
|---|---|---|
| `/` | Hero sólido (LCP priorizado, no lazy), cifras, mosaico de destacados, servicios, proceso, capacidad, operaciones, testimonios y CTA. Muy largo en móvil (8681 px). Sin overflow. | Media (longitud) |
| `/quienes-somos` | Narrativa completa (historia, timeline, misión/visión/valores, operaciones con lightbox, certificaciones, equipo). **17195 px @390** (la más larga); bloque de certificaciones es placeholder. | Media |
| `/servicios` | Listado editorial por líneas; imagen o icono de respaldo por servicio. Consistente. | Baja |
| `/proyectos` | Cabecera + chips de categoría/ubicación + rejilla + "cargar más". Sin solape (corregido). | Baja |
| `/proyectos/:slug` | Reportaje: hero a sangre, ficha, caso de estudio, mapa, galería+lightbox, CTA. Sólido. | Baja |
| `/contacto` | Info + formulario validado, honeypot, estados; mapa. Datos de contacto verificados (`site-config.ts`). | Baja |
| `/admin/login` | Público; header/footer compartidos. | N/A |
| `/admin/*` | **No auditado** en esta sesión (requiere credenciales; ver §Bloqueos). | — |

## Bloqueos de la auditoría

1. **Admin autenticado no recorrido**: sin `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`.
   Los hallazgos #4–#5 quedan sin verificar en esta sesión.
2. **Sin inspección visual humana**: el modelo no lee imágenes; la verificación se
   hace por métricas. Se recomienda revisión humana de `docs/design/baseline/screenshots/`.
3. **Supabase local caído**: 400/404 REST y el fallo e2e de recuperación (ver baseline).

