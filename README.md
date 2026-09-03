# Ingesocc SAS — Sitio Corporativo

Sitio corporativo de Ingesocc S.A.S. construido con **Angular 19** (standalone components) + **Tailwind CSS v4** y **Supabase** como backend (Postgres + Auth + Storage + RLS).

Migrado desde el sitio Next.js original (diseño actual preservado como lenguaje visual del sitio). Sigue el plan técnico del proyecto: dos capas de contenido (CRUD total para Proyectos/Servicios, edición in-place para `content_blocks`).

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
- [ ] **Fase 6** — Modo edición de `content_blocks` (EditableText/EditableImage + EditModeService)
- [x] **Fase 7** — Formulario de contacto guardando en `contact_messages` (insert público por RLS, validación plan 1.5) + bandeja admin con leído/no leído y eliminación
- [ ] **Fase 8** — Proyectos destacados en Home (ya implementado con `featured`, 1.2.2) + filtros (ya implementados)
- [ ] **Fase 9** — Datos reales, SEO, QA, despliegue

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
| `/admin/contenido` | Editor de `content_blocks` (Fase 6) |
| `/admin/mensajes` | Bandeja de `contact_messages` (leído/no leído, eliminar) |

**Acceso admin**: crea el usuario en Supabase (Authentication → Users) y asigna `role = 'admin'` en la tabla `profiles` (ver abajo).

## Desarrollo

```bash
pnpm install
pnpm start      # http://localhost:4200
pnpm build      # build de producción en dist/ingesocc-web
```

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
  core/                  # supabase.service.ts (wrapper único, pendiente de credenciales)
  layouts/
    public-layout/       # header (nav + CTA global) + footer (redes desde content_blocks)
  features/
    content-blocks/      # data-access/ (modelo + servicio de content_blocks)
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