# Ingesocc SAS — Sitio Corporativo

Sitio corporativo de Ingesocc S.A.S. construido con **Angular 19** (standalone components) + **Tailwind CSS v4** y **Supabase** como backend (Postgres + Auth + Storage + RLS).

Migrado desde el sitio Next.js original (diseño actual preservado como lenguaje visual del sitio). Sigue el plan técnico del proyecto: sitio público **estrictamente de solo lectura** y todo el CMS (CRUD de Proyectos/Servicios y edición de `content_blocks`) concentrado en `/admin`.

## Documentación (vault Obsidian)

La documentación técnica del proyecto vive también como un **vault de Obsidian** en
`docs/obsidian/` — 25 notas interconectadas (wikilinks, frontmatter, mapas de
contenido) que cubren arquitectura, Supabase/RLS/storage, los CRUD, auth,
content blocks, SEO, performance, testing, los pendientes operativos y los
manuales de uso ([[Guías de Uso]] y [[Casos de Uso]]).

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
| Imágenes | Cloudinary (upload firmado vía Vercel Functions) + Supabase Storage legacy |
| Functions | Vercel (`api/cloudinary/*`, TypeScript sin framework) |
| Estado/datos | Signals + servicios en `data-access/` (por feature) |

## Estado por fases

- [x] **Fase 0** — Repo Angular 19 + Tailwind v4, tokens de diseño del sitio actual
- [x] **Fase 1** — Esquema Supabase (`supabase/schema.sql` + `supabase/seed.sql`): tablas, RLS, buckets, seed
- [x] **Fase 2** — Las 5 páginas públicas (Home, Quiénes Somos, Servicios, Proyectos, Contacto + detalle de proyecto) con nav/CTA/footer unificados (plan 1.1), leyendo de seeds estáticos con el mismo contrato que las tablas de Supabase
- [x] **Fase 3** — Login admin + `authGuard` (`CanActivateFn`) + layout admin (auth real vía Supabase Auth, rol desde `profiles`)
- [x] **Fase 4** — CRUD Proyectos contra Supabase: listar (con borradores), crear, editar, eliminar, subir imágenes al bucket con compresión y portada, asignar categorías, destacar y estado draft/published (la paginación pública "Cargar Más" ya estaba en Fase 2, 1.2.3)
- [x] **Fase 5** — CRUD Servicios contra Supabase: listar (con borradores), crear, editar, eliminar, subir/quitar foto al bucket, ícono de respaldo y estado draft/published
- [x] **Fase 6** — CMS de `content_blocks` en `/admin/contenido`: pestañas por página (Inicio / Quiénes somos / Contacto / Global), edición por tipo de bloque (texto, texto enriquecido, número, imagen con subida a Storage) y estados guardando/guardado/error. El sitio público no tiene ningún control de edición (arquitectura de solo lectura)
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
| `/admin/contenido` | CMS de contenido del sitio (pestañas por página, bloques por tipo, subida de imágenes) |
| `/admin/mensajes` | Bandeja de `contact_messages` (leído/no leído, eliminar) |

**Acceso admin**: crea el usuario en Supabase (Authentication → Users) y asigna `role = 'admin'` en la tabla `profiles` (ver abajo).

## Desarrollo

```bash
pnpm install
pnpm start      # http://localhost:4200
pnpm build      # build de producción en dist/ingesocc-web
pnpm test       # tests unitarios (Karma + Chrome)
pnpm test:ci    # tests unitarios en una sola pasada (headless)
pnpm test:api   # tests de las funciones de Cloudinary (node:test)
pnpm typecheck:api # typecheck de api/ sin emitir
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
>
> **Matriz de navegadores** (plan §30): por defecto solo corre Chromium (rápido).
> Con `E2E_BROWSERS=all` añade **Firefox, WebKit (Safari), Pixel 7 (Android
> Chrome) e iPhone 14 (iOS Safari)** — requiere `pnpm exec playwright install
> firefox webkit` la primera vez:
>
> ```bash
> E2E_BROWSERS=all pnpm test:e2e    # 5 proyectos × los mismos flujos (65 tests)
> ```

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

## Imágenes (Cloudinary)

Cloudinary es el **proveedor principal** de imágenes. Supabase Storage queda
como *legacy*: las imágenes ya guardadas se siguen leyendo desde
`project-images`, `service-images` y `content-images`, y no se borran.

### Cómo funciona

El navegador **nunca** ve `CLOUDINARY_API_SECRET`. El upload es firmado por
funciones serverless que validan la sesión y el rol del admin:

```
Angular → POST /api/cloudinary/signature     (Bearer = JWT de Supabase)
        → valida sesión, rol admin y carpeta contra lista blanca
        → { timestamp, signature, cloudName, apiKey, folder, publicId }

Angular → POST api.cloudinary.com/v1_1/<cloud>/image/upload
        (multipart con api_key, timestamp, signature, folder, public_id)
        → secure_url

Angular → guarda la secure_url en Supabase
          (project_images.storage_path / services.photo_path /
           content_blocks.value_image_path)
```

No se crea la columna `provider` ni se toca el schema: las columnas de texto
aceptan la ruta legacy o la URL de Cloudinary indistintamente.

### Endpoints

| Endpoint | Método | Qué hace |
|---|---|---|
| `/api/cloudinary/signature` | POST | Firma de upload. Body: `{ folder, entityId? }`. `folder` ∈ `projects`, `services`, `content`, `team`, `general`. |
| `/api/cloudinary/destroy` | POST | Borra un asset. Body: `{ publicId }`. Solo borra bajo `ingesocc/`. |

La autenticación usa `GET {SUPABASE_URL}/auth/v1/user` con el JWT del
llamante y lee el rol de `profiles` con ese mismo JWT (RLS). No usa
`service_role`: un JWT inválido o un rol distinto de `admin` se rechaza antes
de firmar nada.

### Variables de entorno

Ver `.env.example`. En Vercel hay que definir las cinco:

| Variable | Dónde se usa | Secreto |
|---|---|---|
| `SUPABASE_URL` | solo functions | no |
| `SUPABASE_ANON_KEY` | solo functions | no (publishable, con RLS) |
| `CLOUDINARY_CLOUD_NAME` | solo functions | no |
| `CLOUDINARY_API_KEY` | solo functions | no |
| `CLOUDINARY_API_SECRET` | solo functions | **sí** |

El frontend **no lee variables de entorno**: sus credenciales de Supabase
están en `src/environments/environment.ts` y `environment.prod.ts`. Las dos
variables `SUPABASE_*` de arriba son para las funciones, que validan el JWT
contra el Auth server; deben apuntar al mismo proyecto que
`src/environments/`.

### Desarrollo local

Las funciones necesitan `vercel dev` (no `ng serve` a secas): el proxy de
Angular reenvía `/api` a `http://localhost:3000` (`proxy.conf.json`).

```bash
vercel dev        # terminal 1 (puerto 3000)
pnpm start        # terminal 2 (puerto 4200)
```

Si `vercel dev` no está corriendo, `CloudinaryService` degrada a Supabase
Storage (ver abajo) y el panel sigue funcionando.

### Entrega optimizada

Las URLs de Cloudinary se sirven por su CDN con transformaciones por
contexto (`src/app/core/cloudinary-urls.ts`): `cover` 960×720, `gallery`
1200×900, `hero` 1600×1000, `service` 800×600, `thumbnail` 400×400, todas con
`q_auto,f_auto`. Las imágenes legacy o de CDN externo se devuelven **intactas**
en el mismo `<img>`, que es lo que permite servir ambos proveedores a la vez.

### Degradación documentada a Supabase Storage

Si la API propia responde "no disponible" (404/405/5xx o no hay red), la
subida cae al bucket legacy y se avisa por consola, para que el admin no
pierda el trabajo. Un 401/403 **no** degrada: son errores reales de sesión o
de configuración y llegan al admin. `resetAvailability()` fuerza un reintento.

La **migración física** de assets ya guardados (Supabase → Cloudinary) es una
fase aparte y no forma parte de este despliegue.

## Despliegue (Vercel)

El repo incluye `vercel.json` (SPA: `outputDirectory` = `dist/ingesocc-web/browser`, URLs limpias y rewrites a `index.html` para las rutas profundas de `/proyectos/:slug`, con `/api/*` excluido del rewrite para que lo sirvan las funciones).

```bash
pnpm build
npx vercel --prod
```

**Antes de desplegar a producción**:

1. **Dominio real**: reemplazar el placeholder `https://ingesocc.com` en `src/app/core/seo.service.ts` (constante `SITE_URL`), `src/index.html` (canonical, og:image, JSON-LD) y `public/sitemap.xml` / `public/robots.txt`.
2. **Datos reales** (plan 1.7): teléfono, email, dirección y redes de la empresa; nombres/roles del equipo — hoy son placeholders editables desde `/admin/contenido` o directamente en `supabase/seed.sql` antes de aplicarlo.
3. **Aplicar el esquema**: `supabase db push` (migraciones versionadas) + `supabase/seed.sql`, crear el usuario admin y asignar `role='admin'` en `profiles` (ver sección Supabase).
4. **Variables de Cloudinary** en el proyecto de Vercel (ver sección Imágenes). Sin ellas el sitio sigue publicando, pero las subidas nuevas caen a Supabase Storage.

## Supabase

El proyecto ya está conectado: `@supabase/supabase-js` con URL y clave publishable en `src/environments/`. Los servicios de `data-access/` (`content-blocks`, `projects`, `services`) consultan las tablas reales y mantienen sus seeds estáticos como respaldo si la tabla no existe o está vacía (los componentes no cambian). `AuthService` usa `supabase.auth` con rol desde `profiles`.

Pendiente en el panel de Supabase:

1. Aplicar las migraciones versionadas: `supabase link --project-ref <ref>` y luego `supabase db push` (el historial vive en `supabase/migrations/`; para desarrollo local con Docker: `supabase db reset`, que aplica migraciones + `seed.sql` automáticamente)
2. Cargar la semilla de datos (`supabase/seed.sql`) desde el SQL Editor si el proyecto remoto aún no la tiene
3. Crear el usuario admin: Authentication → Users → Add user
4. Asignar rol: `update public.profiles set role = 'admin' where id = '<user id>';`

Buckets de storage creados por el esquema: `project-images`, `service-images`, `content-images` (lectura pública, escritura solo admin; límites de tamaño y MIME por bucket en la migración `20260917000003` — 2 MB para proyectos/servicios, 5 MB para el CMS). Con Cloudinary estos buckets quedan en modo *legacy*: solo se leen y solo se escriben si Cloudinary no está disponible.

## Estructura

```
api/                      # Vercel Functions (upload firmado de Cloudinary)
  cloudinary/
    signature.ts          # POST /api/cloudinary/signature
    destroy.ts            # POST /api/cloudinary/destroy
  _lib/
    auth.ts               # JWT de Supabase + rol admin (sin service_role)
    cloudinary.ts         # lista blanca de carpetas, firma SHA-1, config
    http.ts               # helpers de request/response y errores
src/app/
  core/                  # supabase.service.ts (wrapper único; SDK con import() diferido)
    cloudinary.service.ts   # ÚNICO punto de entrada a media (upload/delete/optimizar)
    cloudinary-urls.ts      # helpers puros: transforms, public_id, detección de URL
    cloudinary.model.ts     # MediaFolder, MediaUploadResult, MediaApiError
    supabase-storage.service.ts  # proveedor legacy (buckets, rutas, resolvePublicUrl)
  layouts/
    public-layout/       # header (nav + CTA global) + footer (redes desde content_blocks)
  features/
    content-blocks/      # data-access/ (modelo + servicio + catálogo de etiquetas) + admin/ (CMS de contenido)
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
supabase/                # migrations/ (esquema versionado) + seed.sql
```