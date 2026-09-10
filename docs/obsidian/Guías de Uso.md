---
title: Guías de Uso
tags:
  - ingesocc
  - guias
  - manual
  - operacion
fecha: 2026-09-07
estado: activo
---

# Guías de Uso

Manual operativo completo del proyecto: cómo navegar el sitio público, cómo operar el panel de administración (login, CRUD de proyectos y servicios, edición de contenido in-place y bandeja de mensajes), cómo correr el proyecto en desarrollo, cómo aplicar el esquema y el seed de Supabase, y cómo desplegar a producción. Para la descripción formal de cada flujo con actores, precondiciones y postcondiciones ver [[Casos de Uso]].

## 1. Sitio público (visitante)

El sitio público no requiere sesión. Todo el contenido se sirve desde Supabase si el esquema está aplicado, y cae a los seeds estáticos si la tabla no existe o no hay credenciales.

### 1.1 Páginas

| Ruta | Qué se ve |
|---|---|
| `/` | Hero con título/subtítulo editables, banda de stats, proyectos destacados (mosaico), servicios numerados y CTA final |
| `/quienes-somos` | Historia, timeline, misión/visión/valores y equipo (nombres y fotos editables) |
| `/servicios` | Los 6 servicios; cada uno con foto o ícono de respaldo |
| `/proyectos` | Grid con filtros de categoría y paginación "Cargar Más" (bloques de 8) |
| `/proyectos/:slug` | Detalle: descripción, valor en salarios mínimos y galería con lightbox |
| `/contacto` | Formulario que guarda en `contact_messages` + datos de contacto editables |

### 1.2 Cómo filtrar proyectos

1. Entra a `/proyectos`.
2. Usa los chips de categoría (Edificaciones, Estructuras Metálicas, Puentes, Proyectos Especiales) o "Todos".
3. El grid se reordena al cambiar de filtro y el contador "Cargar Más" se reinicia.
4. Solo aparecen proyectos con `status = 'published'`: los borradores son invisibles al público.

### 1.3 Cómo ver la galería de un proyecto

1. Entra al detalle de un proyecto publicado.
2. Haz clic en cualquier imagen de la galería.
3. El lightbox a pantalla completa permite navegar con las flechas, con las teclas direccionales y con `ESC` para cerrar. La navegación es circular y muestra el contador de imágenes.

### 1.4 Cómo enviar un mensaje de contacto

1. Entra a `/contacto`.
2. Completa los campos obligatorios: nombre (mínimo 2 caracteres), email (formato válido) y mensaje (mínimo 10 caracteres). Teléfono y asunto son opcionales.
3. Envía el formulario. El botón se deshabilita mientras se procesa para evitar envíos dobles.
4. Si todo es correcto, verás la confirmación de éxito y el mensaje queda guardado en la tabla `contact_messages` (el admin lo verá en la bandeja).

## 2. Panel de administración

### 2.1 Primer acceso (crear el usuario admin)

1. En el panel de Supabase abre **Authentication → Users** y crea el usuario con su email y contraseña.
2. En el **SQL Editor** ejecuta (reemplaza el email):

```sql
insert into public.profiles (id, email)
select id, email from auth.users where email = 'admin@ejemplo.com'
on conflict (id) do nothing;

update public.profiles set role = 'admin' where email = 'admin@ejemplo.com';
```

El trigger `handle_new_user()` ya crea la fila en `profiles` al registrarse; este SQL solo asegura el rol.

### 2.2 Iniciar sesión

1. Ve a `/admin/login`.
2. Ingresa email y contraseña.
3. Si el usuario no tiene rol admin, se cierra la sesión y se muestra un mensaje claro.
4. Con rol admin entrarás al dashboard `/admin`.

> [!note] Sesión persistida
> La sesión se guarda en el navegador y se restaura al recargar. Si recargas una ruta `/admin/*` con sesión válida, el guard espera la restauración antes de decidir (deep-link sin rechazos).

### 2.3 Dashboard (`/admin`)

Muestra tarjetas con los contadores: proyectos publicados (y cuántos están destacados en el Home), servicios, bloques de contenido y mensajes de contacto (totales y sin leer). Cada tarjeta enlaza a su módulo.

### 2.4 CRUD de proyectos

#### Listado (`/admin/proyectos`)
- Muestra **todos** los proyectos, incluidos los borradores (a diferencia del sitio público).
- Cada fila tiene portada, título, categorías, estado y acciones: editar (lápiz) y eliminar (papelera, con confirmación).
- Botón "Nuevo proyecto" para crear.

#### Crear (`/admin/proyectos/nuevo`)
1. **Título** (obligatorio, mínimo 3 caracteres). El slug se autogenera desde el título mientras no lo edites a mano.
2. **Slug** (obligatorio). Debe ser único: si ya existe, el guardado falla con un mensaje en español.
3. **Descripción** (obligatoria, mínimo 10 caracteres).
4. **Valor en salarios mínimos** (opcional).
5. **Estado**: `draft` (no aparece en público) o `published`.
6. **Destacado** (`featured`): si está activo, el proyecto aparece en la sección destacada del Home.
7. **Orden** (`sort_order`): controla la posición en el listado público.
8. **Categorías**: selecciona una o varias de las disponibles.
9. **Imágenes**: sube una o más; la primera subida se marca como portada automáticamente. Puedes cambiar la portada con la estrella, reordenar y quitar imágenes. Las imágenes se comprimen en el cliente (máximo 2 MB / 2000 px).
10. **Guardar**: crea el proyecto, sube las imágenes al bucket `project-images`, sincroniza orden/portada, asigna categorías y vuelve al listado.

#### Editar (`/admin/proyectos/:id`)
- Misma pantalla precargada. Puedes cambiar cualquier campo, subir nuevas imágenes, quitar existentes (borra objeto de storage y fila), cambiar portada y estado.

#### Eliminar
- Confirmación "¿Eliminar...? Esta acción no se puede deshacer."
- Borra las imágenes del bucket `project-images` y la fila (las relaciones `project_images` y `project_categories` se eliminan en cascada).

### 2.5 CRUD de servicios

#### Listado (`/admin/servicios`)
- Muestra todos los servicios (incluidos borradores) con su foto o ícono de respaldo y acciones editar/eliminar.

#### Crear (`/admin/servicios/nuevo`)
1. **Nombre** (obligatorio, mínimo 3 caracteres). El slug se autogenera.
2. **Slug** (obligatorio, único).
3. **Descripción** (obligatoria, mínimo 10 caracteres).
4. **Ícono de respaldo** (`icon_name`): se muestra si el servicio no tiene foto.
5. **Foto** (opcional): se valida tipo (MIME y extensión), se comprime (máximo 2 MB / 1600 px) y se sube al bucket `service-images`. Mientras la foto se procesa, el botón de guardar queda deshabilitado ("Procesando foto…") para no guardar sin ella.
6. **Estado** (`draft`/`published`) y **orden**.
7. **Guardar**: crea el servicio y, si hay foto, la sube y actualiza `photo_path`.

#### Editar (`/admin/servicios/:id`)
- Puedes reemplazar la foto (la anterior se borra del storage) o quitarla para volver al ícono de respaldo.

### 2.6 Edición de contenido in-place (`content_blocks`)

No es un CRUD: `/admin/contenido` es una página informativa. La edición se hace directamente sobre las páginas públicas.

1. Con sesión admin, ve a cualquier página pública (Home, Quiénes Somos, Contacto).
2. Activa el botón flotante **"Modo edición"** (solo visible para admin).
3. En modo edición cada bloque editable muestra controles: lápiz para textos (con guardar/cancelar y validación) y reemplazo para imágenes.
4. Guarda el cambio: se persiste en `content_blocks` (clave única `page + section_key`).
5. El público ve el cambio de inmediato. Si la tabla no existe aún, el cambio se aplica solo en memoria (se perderá al recargar) — es el comportamiento reservado para entorno sin esquema.

Los bloques editables cubren: header/footer global (CTA, redes sociales), Home (hero, stats, capacidad, CTA), Quiénes Somos (historia, misión/visión/valores, equipo) y Contacto (título, subtítulo, teléfono, email, dirección).

> [!tip] Cómo cambiar los datos de la empresa
> Teléfono, email, dirección y redes son placeholders editables: entra al modo edición sobre `/contacto` o el footer y modifica el bloque correspondiente.

### 2.7 Bandeja de mensajes (`/admin/mensajes`)

1. Lista los mensajes de `contact_messages` del más reciente al más antiguo; los no leídos aparecen resaltados.
2. Marca un mensaje como leído o no leído (persiste tras recargar).
3. Elimina con confirmación (persiste: existe política RLS de delete para admin).

## 3. Desarrollo local

### 3.1 Instalación y arranque

```bash
pnpm install
pnpm start        # dev server en http://localhost:4200
```

Requisitos: Node + pnpm. El proyecto usa pnpm (ver `package.json` y `angular.json` cli.packageManager).

### 3.2 Comandos principales

| Comando | Qué hace |
|---|---|
| `pnpm build` | Build de producción en `dist/ingesocc-web` |
| `pnpm test` | Tests unitarios (Karma, watch) |
| `pnpm test:ci` | Tests unitarios en una pasada (headless, sin red) |
| `pnpm lint` | ESLint (flat config) |
| `pnpm test:e2e` | Tests E2E de Playwright (flujos públicos; admin con credenciales) |
| `pnpm test:perf` | Build + auditoría Lighthouse con presupuestos |
| `pnpm test:visual` | Build + QA visual (paleta, contraste, overflow, screenshots) |

### 3.3 Tests E2E con credenciales

```bash
E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... pnpm test:e2e
```

> [!warning] Escriben datos reales
> Los flujos admin y de bandeja crean y borran datos reales (proyecto, servicio con foto, mensaje). Apúntalos a un **proyecto Supabase de pruebas**, nunca a producción.

### 3.4 Variables de entorno

Las credenciales de Supabase viven en `src/environments/environment.ts` y `environment.prod.ts` (misma URL y anon key). `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` se leen solo desde variables de entorno en runtime; no se guardan en el repo.

## 4. Base de datos (Supabase)

### 4.1 Aplicar el esquema

En el SQL Editor del proyecto Supabase, ejecuta **en este orden**:

1. `supabase/schema.sql` — 8 tablas, funciones, triggers, políticas RLS y 3 buckets de storage.
2. `supabase/seed.sql` — categorías, servicios, 53 content_blocks y 10 proyectos de ejemplo con imágenes.

Ambos son idempotentes (se pueden re-aplicar).

### 4.2 Verificar

```sql
select count(*) from pg_catalog.pg_tables where schemaname = 'public';  -- 8
select 'projects' as t, count(*) from public.projects
union all select 'services', count(*) from public.services
union all select 'content_blocks', count(*) from public.content_blocks
union all select 'project_images', count(*) from public.project_images;
-- 10 proyectos · 6 servicios · 53 content_blocks · 17 project_images
```

### 4.3 Buckets de storage

Creados por el esquema: `project-images`, `service-images`, `content-images`. Lectura pública, escritura solo admin (ver [[Storage]]).

### 4.4 Regresión RLS

Ejecuta `supabase/rls-checks.sql` contra el proyecto de pruebas para validar la matriz anon/user/admin (ver [[Row Level Security]]).

## 5. Despliegue (Vercel)

### 5.1 Publicar

```bash
pnpm build
npx vercel --prod
```

`vercel.json` sirve `dist/ingesocc-web/browser` con rewrite a `index.html`, de modo que las rutas profundas (`/proyectos/:slug`, `/admin/...`) funcionan al entrar directo.

### 5.2 Checklist pre-producción

1. Reemplazar el placeholder `https://ingesocc.com` (dominio real) en `core/seo.service.ts`, `src/index.html`, `public/sitemap.xml` y `public/robots.txt` (ver [[SEO]]).
2. Cargar los datos reales de la empresa (contacto, redes, equipo) vía el modo edición o `supabase/seed.sql`.
3. Aplicar el esquema al proyecto de **producción** y crear el usuario admin con rol `admin`.
4. Ejecutar la regresión RLS (`supabase/rls-checks.sql`) contra pruebas.

Ver [[Despliegue Vercel]] y [[Pendientes Manuales]].

## Ver también

- [[Casos de Uso]] — la versión formal de cada flujo con actores y postcondiciones
- [[Inicio]] — mapa del vault · [[Estructura del Código]] · [[Rutas y Navegación]]
- [[CRUD Proyectos]] · [[CRUD Servicios]] · [[Content Blocks]] · [[Contacto y Mensajes]]
- [[Testing]] · [[Despliegue Vercel]] · [[Pendientes Manuales]]