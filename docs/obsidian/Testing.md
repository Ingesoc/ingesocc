---
title: Testing
tags:
  - ingesocc
  - testing
  - e2e
  - unit
  - api
fecha: 2026-09-03
estado: activo
---

# Testing

Cuatro suites + una herramienta de QA visual. Estado actual: **unit 164/164 · API 33/33 · E2E 30/33 (3 admin omitidos sin credenciales) · QA visual 28/28 screenshots · Lighthouse A11y 95** (post-rediseño; ver [[Performance y Lighthouse]]).

## Lint (ESLint)

`pnpm lint` → **0 problemas** (flat config estándar Angular 19: TS + Angular + plantillas + a11y). Se añadió junto con la limpieza de código muerto (knip) en el nº 23 de [[Auditoría y Correcciones]]; `knip.json` documenta los 2 falsos positivos (`src/styles.css`, `tools/serve-dist.mjs`).

> [!note] `angular-doctor`
> El scan ESLint de `angular-doctor` v1.3.0 es incompatible con cualquier `eslint.config.js` estándar ("Cannot redefine plugin @typescript-eslint", limitación upstream) — usar `npx angular-doctor --no-lint` para dead-code/score (100/100).

## Unit (Jasmine + Karma, sin red)

`pnpm test:ci` → **164/164 SUCCESS** (ChromeHeadlessNoSandbox). No requieren credenciales ni DB: los servicios de datos se prueban con un cliente Supabase simulado y `fetch` con spies.

Specs en `src/app/**/*.spec.ts`: `slugify`, `project.model`, `service-icons`, `image-utils`, `supabase.service`, `auth.guard`, `projects.service` (incluye los tests del **payload exacto** de insert/update — regresión de la capa snake_case, nº 17 de [[Auditoría y Correcciones]]), `content-blocks.service` (éxito / error RLS → rechazo sin cambio local / 42P01 → aplica en memoria), `auth.service` (restauración de sesión, **expiración de sesión** → limpia usuario, desactiva el modo edición y permite re-login — CU-19 de [[Casos de Uso]] —, y **recuperación de contraseña** CU-18: envío del correo, propagación de errores y `updatePassword` con/sin sesión de recuperación), y otros.

Añadidos recientes: `projects-page` (**filtro de categorías sincronizado con `?categoria=`**: deep-link, slug con acentos, reset de paginación, `categoria: null` al volver a "Todos"), `login.component` (credenciales inválidas / **cuenta sin rol admin → mensaje claro + logout + focus** / admin OK), `contact-messages.service` (`load()` **lanza** el error en vez de tragárselo), `admin-dashboard.component` (contadores + **estado de error explícito** al fallar la carga de mensajes — nº 13 del plan maestro), `cloudinary-urls` (detección de URL, extracción de `public_id`, transform idempotente), `cloudinary.service` (firma + multipart + JWT, degradación a Storage, 401/403 sin degradar, delete idempotente, entrega) y `service-form.component` (**revocación del object URL local al reemplazar/quitar la foto y al destruir el formulario; nunca se revocan URLs remotas ya guardadas**) — ver [[Cloudinary y Media]].

> **De la fase de contenido ([[Inicio|slices 3.1–3.5]])**: `services.service.spec` (mapeo `scope`/`deliverables`/`faq` y respaldo por descripción), `service-form.component.spec` (**deliverables/FAQ como listas editables**, validación y guardado), `contact.component.spec` (nuevos selects de lead + honeypot oculto siempre vacío en el payload), `contact-messages.service.spec` (metadatos de lead, `status`/`is_spam` en la bandeja), `projects.service.spec` (caso de estudio: `key_figures` normalizado y **payload exacto de la RPC de 13 parámetros**), `about.component.spec` y `content-blocks.catalog.spec` (labels de certificaciones), `home.component.spec` (sección de testimonios oculta sin publicados) y el módulo nuevo `testimonials`: `testimonials.service.spec` (publicado/borrador, orden, CRUD con columnas reales) y `testimonial-form.component.spec` (validación autor/cita, valoración y estado).

## API (node:test, sin red)

`pnpm test:api` → **33/33**. Cubre `api/cloudinary/signature.ts` y `api/cloudinary/destroy.ts` más los helpers de `api/_lib/`:

- método no permitido, sin `Authorization`, JWT inválido, rol que no es admin, perfil inexistente;
- carpeta fuera de la lista blanca y `entityId` con formato inválido;
- **la firma se valida contra el hash de ejemplo de la documentación oficial** de Cloudinary (si el algoritmo cambia, el test falla);
- `public_id` fuera del árbol permitido al destruir (no se puede borrar un asset ajeno con una firma válida);
- entorno sin `CLOUDINARY_*` o sin `SUPABASE_*` → 503 con mensaje claro;
- error de Cloudinary → 502 sin filtrar detalle interno; la respuesta nunca es cacheable.

> [!note] Cómo corren
> `tsconfig.api-test.json` compila `api/` a CommonJS en `out-tsc/api-test/` y `node --test` los ejecuta. `pnpm typecheck:api` hace el typecheck sin emitir. Los helpers viven en `api/_lib/test-support.ts` (request/response falsos).

> [!warning] Los E2E de escritura no cubren Cloudinary
> Los flujos admin de `e2e/` ejercitan el flujo de subida, pero sin `vercel dev` la Function no existe y el upload cae al bucket legacy (ver [[Cloudinary y Media]]). Para probar el camino real hay que levantar `vercel dev` con las variables definidas.

## E2E (Playwright, `e2e/`)

`playwright.config.ts` levanta el dev server solo. `pnpm test:e2e` corre los flujos públicos (solo lectura); con credenciales añade los flujos admin:

**Matriz de navegadores** (plan §30): por defecto solo Chromium (**33 tests**: 30 públicos verdes · 3 admin omitidos sin credenciales); con `E2E_BROWSERS=all` se añaden Firefox, WebKit (Safari), Pixel 7 y iPhone 14 (5 proyectos × 33 tests = 165; requiere `pnpm exec playwright install firefox webkit`). La spec de responsive (`responsive-overflow.spec.ts`) se verificó en verde en los 5 proyectos: **90 passed** (18 tests × 5). La navegación pública usa el helper `navigateTo` (`e2e/helpers.ts`), que elige el nav de desktop o el menú móvil según el viewport.

```bash
E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... pnpm test:e2e
```

| Spec | Flujo | Requiere credenciales |
|---|---|---|
| `public-flows.spec.ts` | Home → navegación → Proyectos → detalle → 404 propio → sin overflow móvil → **filtro `?categoria=` sincronizado con la URL y persistente al reload** | — |
| `responsive-overflow.spec.ts` | **Matriz de viewports (320 → 1440)** × rutas públicas (+, con credenciales, el panel admin): `documentElement`/`body` sin scroll horizontal y sin elementos visibles fuera de la ventana (incluye filtro activo, errores de validación de `/contacto` y menú móvil abierto) | — (admin opcional) |
| `password-recovery.spec.ts` | CU-18: enlace del login → solicitud con confirmación genérica → `redirect_to` de `POST /auth/v1/recover` apunta a `/admin/nueva-contrasena` → enlace inválido (`otp_expired`) ofrece pedir otro → pantalla sin sesión muestra el estado inválido | — |
| `admin-projects.spec.ts` | Login → crear → editar → publicar → verificar público → eliminar | Sí |
| `admin-services.spec.ts` | Login → crear (ícono + foto) → verificar público → editar → quitar foto → verificar fallback de ícono → eliminar | Sí |
| `contact-inbox.spec.ts` | Formulario de contacto → bandeja admin → marcar leído → eliminar | Sí |

> [!danger] Escriben datos reales
> Los flujos admin/bandeja **crean y borran datos reales** (un proyecto, un servicio con foto, un mensaje) y se limpian solos. Apuntarlos a un **proyecto Supabase de pruebas** (schema+seed aplicados), nunca a producción. La suite verificada contra `ietjikoddwpdybarcwfk` deja la DB intacta: 10 proyectos · 6 servicios · 0 mensajes · 0 fotos huérfanas.

Los E2E contra la DB real destaparon 3 bugs reales: camelCase en insert/update (nº 17), embed to-one de categorías (nº 18) y la carrera foto/guardar (nº 20) — ver [[Auditoría y Correcciones]].

La spec de responsive destapó **2 desbordamientos de layout reales** en el footer (`site-footer.component.html`): la fila de redes no envolvía a 320 px y la columna de Contacto no dejaba encoger `email`/`teléfono`/dirección en la ventana 1024–1279 px — ambos corregidos con `flex-wrap` + `min-w-0`/`break-words`, verificados en verde en los 5 proyectos.

## QA visual (`pnpm test:visual`, `tools/visual-qa.mjs`)

Verifica en vivo contra el build de producción: color exacto `#a53a0c` en todo `text-accent-deep`, contraste ≥ 4.5:1 contra el **fondo efectivo** del elemento, chip de filtro activo de `/proyectos`, errores de validación de `/contacto` y ausencia de overflow horizontal. Screenshots en `test-results/visual-qa/`. Tras el rediseño: **28 capturas (14 rutas × desktop/mobile) · 0 FAIL** — también confirma que la fuente Archivo está activa y la jerarquía `h1→h3` sin saltos.

Con credenciales añade la **fase admin** (login real + dashboard, listados, formularios, bandeja, contenido). Intercepta solo la lectura de `profiles` (→ rol admin) para cuando el esquema no está aplicado; el resto va a la red real, de solo lectura.

Destapó el **bug de CSS sin capa** (`a { color: inherit }` anulaba las utilities de Tailwind sobre enlaces) — ver [[Guía de Estilo Visual]].

## Lighthouse

`pnpm test:perf` — presupuestos de rendimiento/a11y en dos modos. Ver [[Performance y Lighthouse]].

## Ver también

- [[Cloudinary y Media]] · [[Performance y Lighthouse]] · [[Auditoría y Correcciones]] · [[Pendientes Manuales]]