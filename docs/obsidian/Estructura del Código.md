---
title: Estructura del Código
tags:
  - ingesocc
  - angular
  - arquitectura
fecha: 2026-09-03
estado: activo
---

# Estructura del Código

## Árbol de `src/app/`

```text
api/                         # Vercel Functions (upload firmado de Cloudinary)
  cloudinary/
    signature.ts             # POST /api/cloudinary/signature
    destroy.ts               # POST /api/cloudinary/destroy
  _lib/
    auth.ts                  # JWT de Supabase + rol admin (sin service_role)
    cloudinary.ts            # lista blanca de carpetas, firma SHA-1, config
    http.ts                  # helpers request/response + errores
    test-support.ts          # dobles de req/res para node:test
src/app/
  core/
    supabase.service.ts        # wrapper único del cliente (SDK con import() diferido)
    seo.service.ts             # title/description/OG/canonical por ruta
    cloudinary.service.ts      # ÚNICO punto de entrada a media (upload/delete/optimizar)
    cloudinary-urls.ts         # helpers puros: transforms, public_id, detección de URL
    cloudinary.model.ts        # MediaFolder, MediaUploadResult, MediaApiError
    supabase-storage.service.ts # proveedor legacy (buckets, rutas, resolvePublicUrl)
    image-utils.ts             # validateImageFile (MIME + extensión + tamaño)
    slugify.ts                 # slug desde título (acentos NFD, etc.)
    morph-icon.component.ts    # app-morph-icon: morph de iconos con estado (morphicons/dom, reducedMotion=user)
  layouts/
    public-layout/             # header editorial (menú móvil fullscreen) + footer (redes desde content_blocks)
    admin-layout/              # panel admin (sidebar fija + topbar sticky + nav móvil)
  features/
    content-blocks/
      data-access/             # modelo + ContentBlocksService
      edit-mode.service.ts     # toggle de edición solo-admin
      editable-text/           # EditableText
      editable-image/          # EditableImage (upload + fetchpriority/lazy)
      edit-mode-toggle/        # botón flotante (solo visible con sesión admin)
    projects/
      data-access/             # Project model + ProjectsService (selects/insert/update/map)
      public/                  # project-card, projects-page (filtros + "Cargar Más"), project-detail
      admin/                   # projects-admin-page, project-form
    services/
      data-access/             # Service model + ServicesService + service-icons.ts
      public/                  # service-card, services-page
      admin/                   # services-admin-page, service-form
    auth/
      data-access/             # AuthService (login/logout/sesión/rol)
      auth.guard.ts            # CanActivateFn (espera whenReady, valida rol)
      login.component.*        # /admin/login
    admin/                     # dashboard + admin pages
    home/ about/ contact/      # páginas públicas
  app.routes.ts                # rutas públicas + /admin bajo authGuard
  app.config.ts
src/environments/              # environment.ts / environment.prod.ts (URL + anon key Supabase)
```

## Raíz del repo

```text
e2e/                 # specs Playwright (public-flows, admin-projects, admin-services, contact-inbox)
tools/               # lighthouse-ci.mjs · visual-qa.mjs · serve-dist.mjs
supabase/            # schema.sql · seed.sql · rls-checks.sql
public/              # logo/, favicons, site.webmanifest, sitemap.xml, robots.txt, fonts/ (Archivo variable latin + latin-ext)
.env.example         # plantilla de las 5 variables de servidor (el frontend no lee env)
proxy.conf.json      # /api → localhost:3000 para que ng serve hable con vercel dev
tsconfig.api.json    # typecheck de api/ sin emitir
tsconfig.api-test.json # compila api/ a CommonJS para node:test
```

## Convenciones

- **`data-access/` por feature**: modelo + servicio juntos; los componentes consumen señales, no queries.
- **Signals** para todo el estado (listados, loading, errores, filtros); sin NgRx ni librerías de estado.
- **Rutas standalone** en `app.routes.ts`; el admin completo cuelga de un solo guard (ver [[Rutas y Navegación]]).
- **Sin `innerHTML`/`bypassSecurityTrust*`** en todo `src/app` — el render es interpolación escapada por Angular (postura anti-XSS, ver [[Row Level Security]]).
- **Media solo por `core/cloudinary.service.ts`**: los helpers de URL (`cloudinary-urls.ts`) son puros y sin DI, para que los componentes optimicen la URL sin inyectar nada (ver [[Cloudinary y Media]]).

## Ver también

- [[Arquitectura]] · [[Rutas y Navegación]] · [[CRUD Proyectos]] · [[CRUD Servicios]] · [[Cloudinary y Media]]