# Auditoría final y correcciones aplicadas — Ingesocc

Fecha: 2026-09-03 · Rama: `main`

Método: lectura completa de `src/app`, plantillas, `supabase/`, config y assets;
verificación empírica con `pnpm build` y `pnpm test:ci` (Karma + Chrome Headless).

Estado al cierre:

```bash
pnpm build     # ✅ OK — bundle de producción sin errores
pnpm test:ci   # ✅ 30/30 SUCCESS (suite unitaria restaurada)
pnpm test:e2e  # ✅ 5 passed · 2 skipped sin credenciales (Playwright)
pnpm test:perf # ✅ Lighthouse OK — Perf Desktop ~95-97 · Mobile ~65-66 · A11y 100 en las 4 corridas
```

## Lighthouse CI (presupuestos de rendimiento)

Se añadió `pnpm test:perf` (`tools/lighthouse-ci.mjs`): hace el build, sirve
`dist/` con `tools/serve-dist.mjs` (fallback SPA igual a `vercel.json`) y audita
`/` y `/proyectos` con `lighthouse` programático — reemplaza a LHCI CLI, que
falla en Windows por un bug de `chrome-launcher` (EPERM al limpiar su temp dir).

Configuración clave: **throttling explícito por modo** — sin el objeto
`throttling`, Lighthouse aplica los valores **móviles** por defecto también en
escritorio (1.6 Mbps, CPU 4×) y las métricas no reflejan el modo pedido (se
descubrió con FCP invariante ~3.6 s a pesar de los cambios).

Presupuestos en `tools/lighthouse-ci.mjs` (se evalúan ambos modos; exit 1 si
falla cualquier presupuesto de nivel "error"):

| Modo | Presupuesto | Aviso | Error | Actual |
|---|---|---|---|---|
| Desktop (1440×900 · 10 Mbps · CPU 1×) | Performance | ≥ 0.90 | ≥ 0.80 | 0.92-0.97 |
| Mobile (412×823 · 1.6 Mbps · CPU 4×) | Performance | ≥ 0.60 | ≥ 0.50 | 0.62-0.66 |
| Ambos | Accessibility | ≥ 0.90 | — | **1.00** |
| Ambos | Best practices | ≥ 0.90 | — | 0.96 |
| Ambos | SEO | ≥ 0.90 | — | 1.00 |
| Ambos | document transfer | ≤ 25 KB | ≤ 40 KB | 9.9 KB |
| Ambos | script transfer | ≤ 800 KB | ≤ 1 MB | ~707 KB |
| Ambos | total transfer | ≤ 2.8 MB | ≤ 3.5 MB | 1.6-2.2 MB |

Para depurar un modo solo (sin rebuild): `node tools/lighthouse-ci.mjs desktop`
o `node tools/lighthouse-ci.mjs mobile`. En móvil el CLS ya es 0 (heredó el
fix del hero) y el costo restante es el peso JS/imágenes a 1.6 Mbps.

Hallazgos reales de la auditoría (corregidos en esta sesión):

1. **Logo de 1 MB en cada página** — `public/logo/logo.png` era 1254×1254,
   1012 KB; se usa a 48-64 px. Redimensionado a 256 px (cubre 2× retina del uso
   mayor) → **80 KB** (12.6× menos).
2. **LCP = imagen del hero** sin `fetchpriority="high"` y pedida a `w=2200`.
   Se añadió el input `priority` a `EditableImage` (emite `fetchpriority=high`,
   aplicado al hero del Home y a la portada del detalle) y el seed baja a
   `w=1600&q=80`.
3. **CLS ~0.25 en el hero** — el contenedor de la imagen con `[fill]` tenía
   `relative` (base) y `absolute inset-0` (wrapperClass) a la vez; ganaba
   `relative` en el CSS y el fondo quedaba **en flujo**, re-floweando el h1 del
   hero (~150 ms tras el primer pintado). `wrapperClass` ahora aplica una sola
   clase de posición. Home pasó de 79 → 97 de Performance.
4. **Imágenes bajo el fold sin `loading="lazy"`** en cards de proyectos y
   galería del detalle; la portada del detalle (LCP de su ruta) lleva
   `fetchpriority="high"`.
5. **SDK de Supabase bloqueando el primer pintado** — el bundle inicial pesaba
   ~700 KB gzipped (supabase-js ~220 KB con pésima compresión). `SupabaseService`
   ahora importa `createClient` con `import()` diferido: el chunk deja de estar
   en el gráfico inicial y el sitio público (que se renderiza desde los seeds)
   pinta sin esperarlo. Todos los métodos async de datos esperan
   `await supabase.clientPromise` antes de tocar `client`.
6. **Contraste del naranja de marca en texto pequeño**: `--accent` #f25623 en
   texto sobre superficies claras daba 3.17:1 (falla AA 4.5:1); sobre oscuro da
   5.23:1 (pasa). Se añadió el token **`--accent-deep` #a53a0c** (mismo family
   naranja, 6.05:1 sobre `--background` y 4.86:1 sobre `--secondary`) y todo
   texto accent sobre fondo claro pasó a `text-accent-deep`: kickers de sección,
   cifras y "+" de stats, enlaces, errores/validaciones (público y admin),
   hovers sobre claro y el botón de filtro activo de `/proyectos` (usaba
   `text-primary-foreground` claro sobre accent → `text-primary`). El accent
   de marca se conserva donde sí cumple: héroes oscuros, footer, sidebar,
   chips sobre fotos, íconos y rellenos `bg-accent`.
7. **`label-content-name-mismatch`** en el logo del header (aria-label distinto
   del nombre visible) → se quitó el `aria-label`.
8. **`heading-order`** en `/proyectos` (y `/servicios`): las tarjetas usaban
   `h3` directamente bajo el `h1` de la página. Los títulos de tarjetas de
   proyecto/servicio pasaron a `h2`.

Resultado de accesibilidad: **100 en las 4 corridas** (Desktop/Mobile ×
Home/Proyectos). Un QA visual posterior reveló además que las clases de color
sobre `<a>` estaban anuladas por una regla CSS sin capa (ver sección "QA
visual").

### QA visual en navegador (tools/visual-qa.mjs, `pnpm test:visual`)

Se escribió un runner Playwright que verifica la paleta en vivo (color
`#a53a0c` exacto en cada `text-accent-deep` estático + contraste ≥ 4.5:1 contra
el fondo efectivo del elemento + overflow horizontal) y guarda screenshots
completos por página/viewport en `test-results/visual-qa/`. Con credenciales
(`E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`) añade la fase admin: login real y
recorrido por /admin, listados, formularios, bandeja y contenido (interceptando
solo la query de `profiles` → rol admin cuando el esquema aún no está aplicado;
resto solo lectura).

El QA destapó un **bug silencioso de CSS**: la regla unlayered
`a { color: inherit; text-decoration: none; }` en `styles.css` ganaba sobre
TODAS las utilities de Tailwind (capas), anulando `text-accent`, `text-accent-deep`
y cualquier clase de color sobre `<a>` — los enlaces nunca pintaron su clase.
Se movió a `@layer base` (equivalente al preflight) y las utilities vuelven a
mandar. De paso se corrigió el hover del CTA del header
(`hover:bg-accent hover:text-primary-foreground` → `hover:text-primary`, texto
claro sobre naranja daba 3.4:1).

Verificado: **28/28 screenshots** (7 públicas × 2 viewports + 7 admin × 2
viewports), todas las rutas admin con contenido real (dashboard, listados,
formularios con errores de validación visibles, bandeja, contenido) y **0
fallos** de color/contraste/overflow. Performance y accesibilidad de Lighthouse
siguen estables (Perf 95-97 desktop / 64-66 mobile · A11y 100).

Recomendación documentada (no implementada): para pasar de ~95 a ~100 y bajar
el JS inicial (~700 KB de un SPA CSR con Angular) haría falta SSR/prerender
(Angular Universal o similar); no se migra sin necesidad.

## E2E (Playwright)

Suite E2E en `e2e/` con `playwright.config.ts` (levanta el dev server solo):

| Spec | Flujo | Requiere |
|---|---|---|
| `public-flows.spec.ts` | Home → navegación → Proyectos → detalle → 404 propio → sin overflow móvil | — |
| `admin-projects.spec.ts` | Login → crear → editar → publicar → verificar público → eliminar | `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` |
| `contact-inbox.spec.ts` | Formulario de contacto → bandeja admin → marcar leído → eliminar | `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` |

```bash
pnpm test:e2e   # flujos públicos (solo lectura)
E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... pnpm test:e2e   # + flujos admin (escribe datos reales → usar Supabase de pruebas)
```

La suite destapó y permitió corregir un **bug real de UI**: las tarjetas del
listado `/proyectos` quedaban con altura 0 (`.h-full` del componente anulaba al
`h-80` de la variante compacta y la grilla no fijaba la altura de fila); se fijó
la grilla con `auto-rows-[320px]`.

La auditoría Lighthouse (`pnpm test:perf`) destapó y permitió corregir **dos
bugs reales más**: el contenedor del fondo del hero se renderizaba en flujo
(CLS ~0.25; ver sección Lighthouse) y el SDK de supabase-js bloqueaba el primer
pintado (ver sección Lighthouse, punto 5).

---

## Resumen ejecutivo

El proyecto estaba funcional en casi todas las fases del plan (rutas, CRUD,
content-blocks, auth, RLS, storage, SEO básico). La auditoría final encontró y
corrigió:

1. **Imagen de marca rota** en login y panel admin (`/ingesocc-logo.jpg` no existe).
2. **Bug de auth en deep-links**: el guard decidía antes de restaurar la sesión
   persistida y rechazaba a admins legítimos al refrescar `/admin/*`.
3. **UX de login ambigua** para usuarios sin rol admin (loop silencioso).
4. **`ContentBlocksService` ocultaba errores reales** de persistencia (caía a
   memoria ante cualquier fallo, el cambio desaparecía al recargar).
5. **Imagen de contenido rota tras editar** (la URL local no se resolvía hasta recargar).
6. **Filtro público de proyectos con categorías fijas en código** en vez de la
   tabla `categories`.
7. **Uploads sin validación de tipo de archivo** (MIME/extensión).
8. **Seeds estáticos mostrados cuando la tabla existe pero está vacía** (borrar
   todos los proyectos no vaciaba el sitio público).
9. **Errores de slug duplicado en inglés** (23505) y **sin `maxLength`** en
   formularios.
10. **Panel admin sin navegación en móvil** (< `md` no había forma de cambiar de módulo).
11. **SEO**: sin `og:image` propio por proyecto; meta sociales incompletas.
12. **`schema.sql` no re-ejecutable** (políticas/triggers duplicados al re-aplicar).
13. **Runner de tests roto** (0 specs → TS18003) y sin suite unitaria.

---

## Registro por fase (PROBLEM / CAUSE / SOLUTION / FILES / TEST / RESULT)

### 1. Logo roto en login y sidebar admin

- **PROBLEM**: `<img src="/ingesocc-logo.jpg">` mostraba imagen rota.
- **CAUSE**: el asset no existe en `public/` (solo existe `/logo/logo.png`).
- **SOLUTION**: apuntar ambos `<img>` a `/logo/logo.png`.
- **FILES**: `features/auth/login.component.html`, `layouts/admin-layout/admin-layout.component.html`.
- **TEST**: `pnpm build` OK.
- **RESULT**: ✅ Resuelto.

### 2. Auth: deep-link a /admin rechazado tras refresh

- **PROBLEM**: un admin con sesión persistida que recarga `/admin/proyectos` podía
  terminar en `/admin/login` (y al revés: `/admin/login` no redirigía aunque ya
  hubiera sesión).
- **CAUSE**: `restoreSession()` es asíncrono y el guard (y el `ngOnInit` del
  login) decidían con la señal aún vacía.
- **SOLUTION**: `AuthService` expone `whenReady()` (promesa que resuelve cuando
  la sesión inicial se restauró); `authGuard` es `async` y la espera;
  `LoginComponent` también espera antes de redirigir.
- **FILES**: `features/auth/data-access/auth.service.ts`, `features/auth/auth.guard.ts`,
  `features/auth/login.component.ts`.
- **TEST**: `auth.guard.spec.ts` (admin→`true`, no-admin→`UrlTree` a `/admin/login`); build OK.
- **RESULT**: ✅ Resuelto.

### 3. Login UX para cuentas sin rol admin

- **PROBLEM**: un usuario con rol `user` entraba al login y era devuelto en
  silencio por el guard (sin explicación) y quedaba con sesión abierta ambigua.
- **CAUSE**: el login navegaba a `/admin` sin verificar el rol.
- **SOLUTION**: tras `login()`, si `isAdmin()` es falso se cierra sesión y se
  muestra un mensaje claro. Además los errores de Supabase Auth se traducen a
  mensajes en español (`mapAuthError`).
- **FILES**: `features/auth/login.component.ts`, `features/auth/data-access/auth.service.ts`.
- **TEST**: build OK (cubierto indirectamente por specs de guard).
- **RESULT**: ✅ Resuelto.

### 4. Content blocks ocultaban errores reales de persistencia

- **PROBLEM**: `updateBlock()` aplicaba el cambio en memoria ante **cualquier**
  error (red, RLS, timeout), con `console.warn`; el admin veía éxito y el cambio
  se perdía al recargar.
- **CAUSE**: fallback incondicional pensado solo para "tabla no aplicada aún".
- **SOLUTION**: el fallback en memoria queda reservado a tabla inexistente
  (código Postgres `42P01`/`PGRST205`, mensaje "does not exist") o credenciales
  no configuradas; cualquier otro error se re-lanza para que la UI lo muestre.
- **FILES**: `features/content-blocks/data-access/content-blocks.service.ts`.
- **TEST**: `content-blocks.service.spec.ts` (éxito, error RLS→rechazo sin cambio
  local, 42P01→aplica en memoria).
- **RESULT**: ✅ Resuelto.

### 5. Imagen de contenido rota tras editar sin recargar

- **PROBLEM**: al cambiar una imagen de bloque, el `<img>` mostraba
  `content/...` (ruta de storage cruda) hasta recargar la página.
- **CAUSE**: el estado local guardaba el `storage_path` sin resolver a URL
  pública (solo `load()` lo resolvía).
- **SOLUTION**: `applyLocalUpdate()` resuelve `valueImagePath` con
  `resolvePublicUrl('content-images', …)` al aplicarlo en memoria.
- **FILES**: `features/content-blocks/data-access/content-blocks.service.ts`.
- **TEST**: spec que verifica `storage path → https://cdn.test/…` tras guardar.
- **RESULT**: ✅ Resuelto.

### 6. Filtro público con categorías fijas

- **PROBLEM**: los chips del filtro de `/proyectos` salían de la constante
  `PROJECT_CATEGORIES`; una categoría nueva/renombrada en DB no se podía filtrar.
- **CAUSE**: el componente no usaba la tabla `categories` (ya cargada por el servicio).
- **SOLUTION**: `ProjectsService` expone `categoryNames` (computed sobre la señal
  `categories`) y la página arma los chips con `['Todos', ...categoryNames()]`.
- **FILES**: `features/projects/data-access/projects.service.ts`,
  `features/projects/public/projects-page.component.ts/.html`.
- **TEST**: spec `loadCategories` con filas de DB y names ordenados; build OK.
- **RESULT**: ✅ Resuelto.

### 7. Validación de tipo de archivo en uploads

- **PROBLEM**: subir un PDF renombrado como `.jpg` pasaba (solo `accept` del input).
- **SOLUTION**: helper `image-utils.ts` (`isAcceptableImageFile`: MIME `image/*` +
  extensión JPG/PNG/WebP/GIF/AVIF) aplicado en formulario de proyecto, formulario
  de servicio y `EditableImage`, con mensaje de error en español.
- **FILES**: `core/image-utils.ts` (nuevo), `features/projects/admin/project-form.component.ts`,
  `features/services/admin/service-form.component.ts`,
  `features/content-blocks/editable-image.component.ts`.
- **TEST**: `image-utils.spec.ts` (MIME/extensión/vacío). 
- **RESULT**: ✅ Resuelto.

### 8. Tabla vacía ≠ seed estático

- **PROBLEM**: con la tabla creada pero vacía (p. ej. tras borrar todos los
  proyectos desde el panel), el sitio público seguía mostrando los proyectos de
  ejemplo del seed en memoria → contenido fantasma e inconsistente con el admin.
- **CAUSE**: los servicios hacían `return` (conservando el seed) cuando la
  consulta volvía 0 filas; el seed solo debería cubrir "tabla inexistente".
- **SOLUTION**: si la consulta **falla** (relación inexistente/sin credenciales)
  se conserva el seed; si la tabla **existe y está vacía**, la señal se pone en
  `[]` y la UI muestra su estado vacío real.
- **FILES**: `projects.service.ts`, `services.service.ts`, `content-blocks.service.ts`
  (métodos `load()` / `loadCategories()`).
- **TEST**: specs de `projects.service` (error→seed; vacío→`published` en 0).
- **RESULT**: ✅ Resuelto.

### 9. Slug duplicado y validación de contacto

- **PROBLEM**: el error 23505 de Postgres llegaba crudo en inglés al form; el
  formulario de contacto no limitaba la longitud de campos.
- **SOLUTION**: mapeo `23505 → mensaje claro` en `create/update` de proyectos y
  servicios; `maxLength` en contacto (80/254/30/200/5000) con mensajes por error
  vía `fieldError()`.
- **FILES**: `projects.service.ts`, `services.service.ts`, `contact.component.ts/.html`.
- **TEST**: build OK.
- **RESULT**: ✅ Resuelto.

### 10. Navegación móvil del panel admin

- **PROBLEM**: en `< md` el sidebar desaparecía y no existía forma de cambiar de
  módulo (solo logout).
- **SOLUTION**: header móvil con botón hamburguesa + menú desplegable con los 5
  módulos (usa `navItems` compartido y cierra al navegar).
- **FILES**: `layouts/admin-layout/admin-layout.component.ts/.html`.
- **TEST**: build OK.
- **RESULT**: ✅ Resuelto.

### 11. SEO

- **PROBLEM**: detalle de proyecto no publicaba `og:image` con la portada; faltaban
  `og:locale`/`twitter:*` en el HTML base.
- **SOLUTION**: `SeoService.set()` acepta `imageOverride`; el detalle la pasa con la
  portada; `index.html` suma `og:locale`, `twitter:title/description/image` y
  cambia `twitter:card` a `summary_large_image`.
- **FILES**: `core/seo.service.ts`, `features/projects/public/project-detail.component.ts`,
  `src/index.html`.
- **TEST**: build OK.
- **RESULT**: ✅ Resuelto.

### 12. schema.sql re-ejecutable

- **PROBLEM**: re-aplicar `schema.sql` fallaba al duplicar policies/triggers.
- **SOLUTION**: `drop … if exists` previo a cada policy y trigger; `create table
  if not exists`; funciones ya eran `create or replace`. El archivo se puede
  re-aplicar sobre una DB existente sin perder datos.
- **FILES**: `supabase/schema.sql`.
- **TEST**: revisión sintáctica manual (no se dispone de Postgres local para
  ejecutarlo). ⚠️ **Recomendado**: re-ejecutar en el SQL Editor del proyecto de
  pruebas antes de producción.
- **RESULT**: ✅ aplicado (validación SQL pendiente en Supabase real).

### 13. Suite de tests

- **PROBLEM**: `pnpm test` fallaba con TS18003 (no había `.spec.ts`).
- **SOLUTION**: suite unitaria Jasmine + Karma (el builder moderno auto-inicializa
  TestBed; sin red ni credenciales reales):
  `slugify`, `project.model`, `service-icons`, `image-utils`, `supabase.service`,
  `auth.guard`, `projects.service`, `content-blocks.service`.
  Script `test:ci` en `package.json`.
- **FILES**: 8 specs nuevos + `package.json`.
- **TEST**: `pnpm test:ci` → **30/30 SUCCESS**.
- **RESULT**: ✅ Resuelto.

### 14. Primera aplicación de schema.sql en DB vacía (42P01)

- **PROBLEM**: aplicar `supabase/schema.sql` a un proyecto nuevo fallaba en
  `relation "public.profiles" does not exist` al crear `is_admin()`.
- **CAUSE**: `is_admin()` es `language sql` y Postgres **valida el cuerpo al
  crearla**; estaba definida ANTES de la tabla `profiles` (a la que consulta).
  La re-ejecución sobre una DB ya creada sí funcionaba (por eso no se detectó
  antes), pero la primera aplicación sobre una DB vacía fallaba.
- **SOLUTION**: mover `is_admin()` después de `create table public.profiles`
  (con comentario explicando el porqué del orden).
- **FILES**: `supabase/schema.sql`.
- **TEST**: inspección del orden de creación; no hay Postgres local para
  ejecutarlo (verificado al aplicar en el SQL Editor).
- **RESULT**: ✅ Resuelto.

### 15. seed.sql: aridad inconsistente en content_blocks

- **PROBLEM**: el `insert into content_blocks` declaraba 6 columnas
  (`value_image_path`) pero las filas de texto/número solo aportaban 5 valores
  → fallaba toda la sentencia en la primera aplicación.
- **CAUSE**: al añadir URLs de imagen al seed (paridad con el seed estático,
  plan §22) solo se actualizaron las filas de tipo `image`.
- **SOLUTION**: dividir en dos inserts con columnas coherentes:
  texto/richtext/número (`value_text`, `value_number`) e imágenes
  (`value_image_path`). Verificado con un checker de aridad (todas las filas
  de todos los inserts de `seed.sql` cuadran con su lista de columnas).
- **FILES**: `supabase/seed.sql`.
- **TEST**: checker de aridad automático sobre los 4 bloques `insert … values`.
- **RESULT**: ✅ Resuelto.

### 16. seed.sql: imágenes sin URL (paridad con seeds estáticos)

- **PROBLEM**: al aplicar la DB, los bloques de imagen (hero del Home, historia,
  fotos de equipo) y las portadas de proyectos quedaban vacíos: la app confía en
  las filas de la DB (que existían pero sin `value_image_path` / sin filas en
  `project_images`) y el sitio se veía distinto que con el fallback estático.
- **SOLUTION**: espejar las mismas URLs de Unsplash de los seeds estáticos:
  - `content_blocks`: 6 filas `image` con `value_image_path` (URL completa;
    `resolvePublicUrl` la devuelve tal cual).
  - `services`: `photo_path` con URL para los 2 servicios que en el seed
    estático muestran foto (Infraestructura, Hospitalarios); los otros 4 siguen
    con `icon_name` (fallback) como en el estático.
  - `project_images`: 17 filas (portadas + galería) con `is_cover`/`sort_order`
    espejando el seed estático. Guard `NOT EXISTS` por proyecto para mantener la
    idempotencia del archivo (la tabla no tiene clave natural única).
  `storage.remove()` no lanza ante rutas inexistentes (el error se ignora en los
  3 paths de borrado), así que las URLs absolutas no rompen la eliminación admin.
- **FILES**: `supabase/seed.sql`.
- **TEST**: checker de paridad (53 claves de `content_blocks` idénticas entre DB
  y estático; URLs de imagen idénticas; portadas de los 10 proyectos idénticas;
  slugs de servicios presentes).
- **RESULT**: ✅ Resuelto.

---

## Pendiente manual (requiere intervención humana)

1. **Dominio real**: reemplazar `https://ingesocc.com` (SITE_URL en
   `core/seo.service.ts`, canonical/og:image/JSON-LD en `index.html`,
   `public/sitemap.xml`, `public/robots.txt`) cuando exista el dominio de
   producción.
2. **Aplicar `supabase/schema.sql` + `seed.sql`** en el proyecto Supabase de
   pruebas y producción (ahora sí aplicables de cero; puntos 14–16).
3. **Crear el usuario admin** (Auth → Users) y
   `update public.profiles set role = 'admin' where id = '<user id>';`.
4. **Datos reales de empresa** (contacto, equipo, redes, proyectos e imágenes)
   vía panel admin / `content_blocks` / seeds.
5. Ejecutar `supabase/rls-checks.sql` contra el proyecto de pruebas (no prod) para
   la regresión RLS.
