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

Cuatro suites + una herramienta de QA visual. Estado actual: **unit 105/105 · API 33/33 · E2E 13/13 · QA visual 28/28 screenshots · Lighthouse A11y 95** (post-rediseño; ver [[Performance y Lighthouse]]).

## Lint (ESLint)

`pnpm lint` → **0 problemas** (flat config estándar Angular 19: TS + Angular + plantillas + a11y). Se añadió junto con la limpieza de código muerto (knip) en el nº 23 de [[Auditoría y Correcciones]]; `knip.json` documenta los 2 falsos positivos (`src/styles.css`, `tools/serve-dist.mjs`).

> [!note] `angular-doctor`
> El scan ESLint de `angular-doctor` v1.3.0 es incompatible con cualquier `eslint.config.js` estándar ("Cannot redefine plugin @typescript-eslint", limitación upstream) — usar `npx angular-doctor --no-lint` para dead-code/score (100/100).

## Unit (Jasmine + Karma, sin red)

`pnpm test:ci` → **105/105 SUCCESS** (ChromeHeadlessNoSandbox). No requieren credenciales ni DB: los servicios de datos se prueban con un cliente Supabase simulado y `fetch` con spies.

Specs en `src/app/**/*.spec.ts`: `slugify`, `project.model`, `service-icons`, `image-utils`, `supabase.service`, `auth.guard`, `projects.service` (incluye los tests del **payload exacto** de insert/update — regresión de la capa snake_case, nº 17 de [[Auditoría y Correcciones]]), `content-blocks.service` (éxito / error RLS → rechazo sin cambio local / 42P01 → aplica en memoria), `auth.service` (restauración de sesión, **expiración de sesión** → limpia usuario, desactiva el modo edición y permite re-login — CU-19 de [[Casos de Uso]] —, y **recuperación de contraseña** CU-18: envío del correo, propagación de errores y `updatePassword` con/sin sesión de recuperación), y otros.

Añadidos recientes: `projects-page` (**filtro de categorías sincronizado con `?categoria=`**: deep-link, slug con acentos, reset de paginación, `categoria: null` al volver a "Todos"), `login.component` (credenciales inválidas / **cuenta sin rol admin → mensaje claro + logout + focus** / admin OK), `contact-messages.service` (`load()` **lanza** el error en vez de tragárselo), `admin-dashboard.component` (contadores + **estado de error explícito** al fallar la carga de mensajes — nº 13 del plan maestro), `cloudinary-urls` (detección de URL, extracción de `public_id`, transform idempotente), `cloudinary.service` (firma + multipart + JWT, degradación a Storage, 401/403 sin degradar, delete idempotente, entrega) y `service-form.component` (**revocación del object URL local al reemplazar/quitar la foto y al destruir el formulario; nunca se revocan URLs remotas ya guardadas**) — ver [[Cloudinary y Media]].

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

**Matriz de navegadores** (plan §30): por defecto solo Chromium; con `E2E_BROWSERS=all` se añaden Firefox, WebKit (Safari), Pixel 7 y iPhone 14 (5 proyectos × 13 tests = 65; requiere `pnpm exec playwright install firefox webkit`). Verificada en verde: **50 passed · 15 skipped** (admin sin credenciales × 5). La navegación pública usa el helper `navigateTo` (`e2e/helpers.ts`), que elige el nav de desktop o el menú móvil según el viewport.

```bash
E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... pnpm test:e2e
```

| Spec | Flujo | Requiere credenciales |
|---|---|---|
| `public-flows.spec.ts` | Home → navegación → Proyectos → detalle → 404 propio → sin overflow móvil → **filtro `?categoria=` sincronizado con la URL y persistente al reload** | — |
| `password-recovery.spec.ts` | CU-18: enlace del login → solicitud con confirmación genérica → `redirect_to` de `POST /auth/v1/recover` apunta a `/admin/nueva-contrasena` → enlace inválido (`otp_expired`) ofrece pedir otro → pantalla sin sesión muestra el estado inválido | — |
| `admin-projects.spec.ts` | Login → crear → editar → publicar → verificar público → eliminar | Sí |
| `admin-services.spec.ts` | Login → crear (ícono + foto) → verificar público → editar → quitar foto → verificar fallback de ícono → eliminar | Sí |
| `contact-inbox.spec.ts` | Formulario de contacto → bandeja admin → marcar leído → eliminar | Sí |

> [!danger] Escriben datos reales
> Los flujos admin/bandeja **crean y borran datos reales** (un proyecto, un servicio con foto, un mensaje) y se limpian solos. Apuntarlos a un **proyecto Supabase de pruebas** (schema+seed aplicados), nunca a producción. La suite verificada contra `ietjikoddwpdybarcwfk` deja la DB intacta: 10 proyectos · 6 servicios · 0 mensajes · 0 fotos huérfanas.

Los E2E contra la DB real destaparon 3 bugs reales: camelCase en insert/update (nº 17), embed to-one de categorías (nº 18) y la carrera foto/guardar (nº 20) — ver [[Auditoría y Correcciones]].

## QA visual (`pnpm test:visual`, `tools/visual-qa.mjs`)

Verifica en vivo contra el build de producción: color exacto `#a53a0c` en todo `text-accent-deep`, contraste ≥ 4.5:1 contra el **fondo efectivo** del elemento, chip de filtro activo de `/proyectos`, errores de validación de `/contacto` y ausencia de overflow horizontal. Screenshots en `test-results/visual-qa/`. Tras el rediseño: **28 capturas (14 rutas × desktop/mobile) · 0 FAIL** — también confirma que la fuente Archivo está activa y la jerarquía `h1→h3` sin saltos.

Con credenciales añade la **fase admin** (login real + dashboard, listados, formularios, bandeja, contenido). Intercepta solo la lectura de `profiles` (→ rol admin) para cuando el esquema no está aplicado; el resto va a la red real, de solo lectura.

Destapó el **bug de CSS sin capa** (`a { color: inherit }` anulaba las utilities de Tailwind sobre enlaces) — ver [[Guía de Estilo Visual]].

## Lighthouse

`pnpm test:perf` — presupuestos de rendimiento/a11y en dos modos. Ver [[Performance y Lighthouse]].

## Ver también

- [[Cloudinary y Media]] · [[Performance y Lighthouse]] · [[Auditoría y Correcciones]] · [[Pendientes Manuales]]