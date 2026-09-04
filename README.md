# Ingesocc SAS — Sitio Corporativo

Sitio corporativo de Ingesocc S.A.S. construido con **Angular 19** (standalone components) + **Tailwind CSS v4** y **Supabase** como backend (Postgres + Auth + Storage + RLS).

Migrado desde el sitio Next.js original (diseño actual preservado como lenguaje visual del sitio). Sigue el plan técnico del proyecto: dos capas de contenido (CRUD total para Proyectos/Servicios, edición in-place para `content_blocks`).

## Documentación (vault Obsidian)

La documentación técnica del proyecto vive también como un **vault de Obsidian** en
`docs/obsidian/` — 23 notas interconectadas (wikilinks, frontmatter, mapas de
contenido) que cubren arquitectura, Supabase/RLS/storage, los CRUD, auth,
content blocks, SEO, performance, testing y los pendientes operativos.

Abrir en Obsidian: *Open folder as vault* → `docs/obsidian/` → empezar por
`Inicio.md` (el mapa del vault). Los docs `docs/cambios-auditoria-final.md` y
`docs/test-plan-audit.md` siguen siendo la fuente cronológica de la auditoría.

## Stack

| Capa | Elección |
|---|---|
| Frontend | Angular 19 (standalone) + TypeScript, CSR |
| Estilos | Tailwind CSS v4 |
| Iconos | `@lucide/angular` |
| Backend | Supabase (Postgres + Auth + Storage + RLS) |
| Estado/datos | Signals + servicios en `data-access/` (por feature) |

## Estado por fases

- [x] **Fase 0** — Repo Angular 19 + Tailwind v4, tokens de diseño del sitio actual
- [x] **Fase 1** — Esquema Supabase (`supabase/schema.sql` + `supabase/seed.sql`): tablas, RLS, buckets, seed
- [x] **Fase 2** — Las 5 páginas públicas (Home, Quiénes Somos, Servicios, Proyectos, Contacto + detalle de proyecto) con nav/CTA/footer unificados (plan 1.1), leyendo de seeds estáticos con el mismo contrato que las tablas de Supabase
- [x] **Fase 3** — Login admin + `authGuard` (`CanActivateFn`) + layout admin (auth real vía Supabase Auth, rol desde `profiles`)
- [x] **Fase 4** — CRUD Proyectos contra Supabase: listar (con borradores), crear, editar, eliminar, subir imágenes al bucket con compresión y portada, asignar categorías, destacar y estado draft/published (la paginación pública "Cargar Más" ya estaba en Fase 2, 1.2.3)
- [x] **Fase 5** — CRUD Servicios contra Supabase: listar (con borradores), crear, editar, eliminar, subir/quitar foto al bucket, ícono de respaldo y estado draft/published
- [x] **Fase 6** — Modo edición de `content_blocks` (plan §7): `EditModeService` + toggle flotante solo-admin + `EditableText`/`EditableImage` integrados en Home, Quiénes Somos, Contacto y el header/footer global (timeline y equipo como slots fijos, plan 1.4)
- [x] **Fase 7** — Formulario de contacto guardando en `contact_messages` (insert público por RLS, validación plan 1.5) + bandeja admin con leído/no leído y eliminación
- [x] **Fase 8** — Proyectos destacados en Home con `featured` (1.2.2) y filtros de categoría (implementados en Fases 2 y 4)
- [x] **Fase 9** — SEO básico (títulos/descripciones por ruta, Open Graph, canonical, sitemap/robots, JSON-LD) + preparación de despliegue (Vercel). **Pendiente operativo**: reemplazar los datos de relleno (contacto, equipo, redes) por los reales — se editan en el panel sin tocar código (`content_blocks`), o en `supabase/seed.sql`

## Rutas públicas

| Ruta | Página |
|---|---|
| `/` | Home (hero, stats, proyectos destacados, servicios, capacidad) |
| `/quienes-somos` | Historia, timeline, misión/visión/valores, equipo |
| `/servicios` | Los 6 servicios (foto o ícono de respaldo, plan 1.3) |
| `/proyectos` | Grid con filtros de categoría + "Cargar Más" (bloques de 8) |
| `/proyectos/:slug` | Detalle: descripción, valor en salarios mínimos, galería |
| `/contacto` | Formulario (guarda en `contact_messages`) + información de contacto |

## Rutas admin (protegidas por sesión + rol)

| Ruta | Página |
|---|---|
| `/admin/login` | Login (público) |
| `/admin` | Dashboard con resumen |
| `/admin/proyectos` | Listado de proyectos (editar/eliminar) |
| `/admin/proyectos/nuevo` | Crear proyecto |
| `/admin/proyectos/:id` | Editar proyecto (imágenes, categorías, estado) |
| `/admin/servicios` | Listado de servicios (editar/eliminar) |
| `/admin/servicios/nuevo` | Crear servicio |
| `/admin/servicios/:id` | Editar servicio (foto, ícono, estado) |
| `/admin/contenido` | Nota: el contenido se edita **in-place** en las páginas públicas (toggle "Modo edición" con sesión admin) |
| `/admin/mensajes` | Bandeja de `contact_messages` (leído/no leído, eliminar) |

**Acceso admin**: crea el usuario en Supabase (Authentication → Users) y asigna `role = 'admin'` en la tabla `profiles` (ver abajo).

## Desarrollo

```bash
pnpm install
pnpm start      # http://localhost:4200
pnpm build      # build de producción en dist/ingesocc-web
pnpm test       # tests unitarios (Karma + Chrome)
pnpm test:ci    # tests unitarios en una sola pasada (headless)
pnpm test:e2e   # tests E2E (Playwright, flujos públicos)
pnpm test:perf  # auditoría Lighthouse con presupuestos (/ y /proyectos)
pnpm test:visual # QA visual: accent-deep + contraste + overflow + screenshots
```

> Los tests unitarios (Jasmine/Karma) corren sin red: los servicios de datos se
> prueban con un cliente Supabase simulado y no requieren credenciales ni una
> base de datos disponible.
>
> Los tests E2E (Playwright) levantan el dev server automáticamente y cubren
> Home → Proyectos → Detalle, el CRUD completo de proyectos y de servicios
> (con foto e ícono) y el flujo contacto → bandeja admin. Los flujos de
> escritura (admin/bandeja) necesitan credenciales y **escriben datos reales**:
> apúntalos a un proyecto Supabase de pruebas.
>
> ```bash
> pnpm test:e2e                                  # solo lectura pública
> E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... pnpm test:e2e   # + admin CRUD y bandeja
> ```
>
> Usa el Chrome instalado (`channel: 'chrome'`); si no existe, corre con
> Chromium de Playwright instalado y `E2E_CHROMIUM=1`.

## Auditoría Lighthouse (presupuestos de rendimiento)

`pnpm test:perf` hace el build, sirve `dist/` localmente y audita `/` y
`/proyectos` con Lighthouse en **dos modos** contra los presupuestos de
`tools/lighthouse-ci.mjs`: **escritorio** simulado (1440×900, 10 Mbps, CPU 1×)
con Performance ≥ 0.80 (error, exit 1) y ≥ 0.90 (aviso); y **móvil** real
(412×823, 1.6 Mbps, CPU 4×) con Performance ≥ 0.50 (error) y ≥ 0.60 (aviso).
En ambos modos se vigilan además los bytes transferidos (documento/script/total)
y las categorías de accesibilidad/buenas prácticas/SEO. Los reportes JSON
quedan en `.lighthouseci/` (ignorado por git).

```bash
pnpm test:perf             # escritorio + móvil (exit 0 si se cumplen los presupuestos de nivel "error")
node tools/lighthouse-ci.mjs desktop   # solo un modo (sin rebuild)
node tools/lighthouse-ci.mjs mobile
```

Estado actual (2026-09): **Desktop ~95-97 · Mobile ~65-66** en ambas páginas,
**Accessibility 100** en las 4 corridas (el texto naranja sobre fondos claros
usa `text-accent-deep`, un rust de la misma familia con contraste AA). La auditoría
ya destapó y sirvió para corregir: logo de 1 MB → 80 KB (256 px, 2× retina en
su uso mayor), LCP del hero (imagen sin `fetchpriority` y pedida a `w=2200`),
CLS del hero (el fondo se renderizaba en flujo normal por un conflicto
`relative`/`absolute` en `EditableImage`), imágenes bajo el fold sin `lazy`, y
el SDK de Supabase (~220 KB) que bloqueaba el primer pintado — ahora se importa
con `import()` diferido y no forma parte del bundle inicial. Para llegar más
allá haría falta SSR/prerender (recomendación documentada, no migrada).

## QA visual (paleta y contrastes en el navegador)

`pnpm test:visual` (`tools/visual-qa.mjs`) abre cada página pública (y
`/admin/login`) en escritorio y móvil contra el build de producción y verifica
en vivo: color `#a53a0c` exacto en todo `text-accent-deep`, contraste ≥ 4.5:1
sobre el fondo EFECTIVO del elemento, chip de filtro activo de `/proyectos`,
errores de validación de `/contacto` y ausencia de overflow horizontal. Guarda
screenshots completos en `test-results/visual-qa/`.

Con `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` añade la **fase admin**: login real
contra Supabase Auth y recorrido por dashboard, listados, formularios "nuevo",
bandeja y contenido con las mismas comprobaciones. Intercepta solo la lectura
de `profiles` (devuelve rol admin) para cuando el proyecto Supabase aún no
tiene el esquema aplicado — el resto va a la red real y es de solo lectura:

```bash
E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... pnpm test:visual
```

Este QA destapó un **bug silencioso de CSS**: la regla `a { color: inherit }`
en `styles.css` estaba sin `@layer`, así que al ser CSS sin capa ganaba sobre
TODAS las utilities de Tailwind y anulaba `text-accent`/`text-accent-deep` (y
cualquier clase de color) sobre `<a>` — los enlaces nunca pintaban su color.
Se movió a `@layer base` y ahora las utilities ganan como corresponde.

> **Nota de build (Tailwind v4)**: Angular 19 solo carga la config de PostCSS desde **`.postcssrc.json`** (no `postcss.config.mjs`), y la detección automática de contenido falla en rutas con espacios/OneDrive — por eso `src/styles.css` declara `@source "./src"` explícitamente. Si los estilos no se generan, revisa esos dos puntos.

## Marca y favicon

El logo oficial vive en `public/logo/logo.png` y se usa en header, footer, favicon y Open Graph. El set de favicons (`public/favicon.ico` multi-tamaño, `favicon-16/32.png`, `apple-touch-icon.png`, `icon-192/512.png`) y el `site.webmanifest` se generaron desde ese logo con los colores de la marca (`#171717` / `#f25623`). Si cambias el logo, regenera los favicons a las mismas medidas.

## Despliegue (Vercel)

El repo incluye `vercel.json` (SPA: `outputDirectory` = `dist/ingesocc-web/browser`, URLs limpias y rewrites a `index.html` para las rutas profundas de `/proyectos/:slug`).

```bash
pnpm build
npx vercel --prod
```

**Antes de desplegar a producción**:

1. **Dominio real**: reemplazar el placeholder `https://ingesocc.com` en `src/app/core/seo.service.ts` (constante `SITE_URL`), `src/index.html` (canonical, og:image, JSON-LD) y `public/sitemap.xml` / `public/robots.txt`.
2. **Datos reales** (plan 1.7): teléfono, email, dirección y redes de la empresa; nombres/roles del equipo — hoy son placeholders editables desde el panel (toggle "Modo edición" con sesión admin) o directamente en `supabase/seed.sql` antes de aplicarlo.
3. **Aplicar el esquema**: `supabase/schema.sql` + `supabase/seed.sql`, crear el usuario admin y asignar `role='admin'` en `profiles` (ver sección Supabase).

## Supabase

El proyecto ya está conectado: `@supabase/supabase-js` con URL y clave publishable en `src/environments/`. Los servicios de `data-access/` (`content-blocks`, `projects`, `services`) consultan las tablas reales y mantienen sus seeds estáticos como respaldo si la tabla no existe o está vacía (los componentes no cambian). `AuthService` usa `supabase.auth` con rol desde `profiles`.

Pendiente en el panel de Supabase:

1. Ejecutar `supabase/schema.sql` y luego `supabase/seed.sql` en el SQL Editor
2. Crear el usuario admin: Authentication → Users → Add user
3. Asignar rol: `update public.profiles set role = 'admin' where id = '<user id>';`

Buckets de storage creados por el esquema: `project-images`, `service-images`, `content-images` (lectura pública, escritura solo admin).

## Estructura

```
src/app/
  core/                  # supabase.service.ts (wrapper único; SDK con import() diferido)
  layouts/
    public-layout/       # header (nav + CTA global) + footer (redes desde content_blocks)
  features/
    content-blocks/      # data-access/ (modelo + servicio) + EditModeService + EditableText/EditableImage + toggle
    projects/            # data-access/ (modelo + servicio) + public/ (card, listado, detalle)
    services/            # data-access/ (modelo + servicio) + public/ (card, página)
    auth/                # AuthService (data-access/), authGuard.ts, LoginComponent
    admin/               # dashboard + placeholders de módulos
    home/ about/ contact/ # páginas públicas
  layouts/
    public-layout/       # sitio público
    admin-layout/        # panel admin
  app.routes.ts          # rutas públicas + /admin (con authGuard)
src/environments/        # credenciales Supabase (placeholders)
supabase/                # schema.sql + seed.sql
```