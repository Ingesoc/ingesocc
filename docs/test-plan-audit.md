# Auditoría: plan maestro de pruebas vs. código real

Fecha: 2026-09-03 · Rama: `main` · Base: el "Plan maestro de pruebas — Ingesocc" enviado por el usuario.

Método: lectura completa de `src/app` (40 TS + plantillas), `supabase/schema.sql`, `supabase/seed.sql`, `angular.json`, `vercel.json`, assets SEO, y verificación empírica de build y runner de tests.

```bash
pnpm build                # ✅ OK — bundle de producción sin errores (~5.5 s)
pnpm ng test --watch=false  # ❌ Falla: TS18003 "No inputs were found ... tsconfig.spec.json"
                            #    (no existe ningún *.spec.ts en src/)
```

---

## 1. Resumen ejecutivo

1. **Las funcionalidades que el plan asume SÍ existen** y en su mayoría coinciden con lo descrito: rutas públicas y admin con `authGuard`, CRUD de proyectos/servicios contra Supabase, modo edición in-place de `content_blocks`, formulario de contacto, bandeja de mensajes, SEO básico por ruta, RLS y buckets de storage en `schema.sql`.
2. **No hay una sola línea de tests**: `ng test` está roto (0 specs; faltan además `karma.conf.js` y `src/test.ts`, y los schematics tienen `skipTests: true`). No hay Playwright, ni CI (no existe `.github/`), ni script de lint.
3. **La auditoría encontró 2 bugs de seguridad reales en `schema.sql`** (P0), ambos exactamente en el área que el plan marca como prioritaria:
   - Elevación de privilegios: cualquier usuario autenticado puede auto-promoverse a `admin` (§ 4.1).
   - Falta la política `DELETE` en `contact_messages`: el botón "eliminar" del inbox no persiste (§ 4.2).
4. **Divergencias de alcance del plan** que conviene corregir antes de escribir pruebas:
   - Los `content_blocks` NO tienen CRUD admin: la edición es in-place (toggle flotante solo-admin) y `/admin/contenido` es un placeholder informativo (intencional, ver README).
   - Solo hay ambientes `development`/`production` y **ambos apuntan al mismo proyecto Supabase real**; el plan asume un ambiente de pruebas que no existe.
   - El seed de DB deja `project_images` vacía y `value_image_path = null` en `content_blocks` (las imágenes se suben por el panel), así que un E2E visual sobre DB sembrada verá tarjetas sin foto.
5. **Ajustes al backlog**: ver § 5 con suites concretas, por archivo, y en el orden en que son ejecutables hoy.

---

## 2. Verificación por sección del plan

Leyenda: ✅ implementado y verificable · ⚠️ parcial o con matiz · ❌ no implementado · n/a no aplica a este repo.

| Sección del plan | Estado | Evidencia / matiz |
|---|---|---|
| §4 Smoke — rutas públicas y admin | ✅ | `src/app/app.routes.ts`: todas las rutas listadas existen; `**` → `/`. Admin bajo `canActivate: [authGuard]` |
| §5 Home — hero, stats, destacados | ✅ | `home.component.ts`: hero desde `content_blocks`, `featuredProjects = projects.featured` (solo `published && featured`), stats numéricas |
| §6 Quiénes Somos | ✅ | `about.component.ts` (timeline/equipo = slots fijos editables, por diseño del plan 1.4) |
| §7 Servicios | ✅ | `services.service.ts` (`published` filtra `status`); fallback icono por `icon_name` en `service-icons.ts`; foto nullable |
| §8 Proyectos — filtros y "Cargar Más" | ⚠️ | Paginación en bloques de 8 ✅ (`projects-page.component.ts`: `PAGE_SIZE = 8`, `hasMore`, `loadMore`, reset al filtrar). **El filtro no se refleja en la URL** (estado local `signal`), el plan pide "URL/estado consistente" ❌ |
| §8 — filtro por categorías | ⚠️ | Usa la **constante** `PROJECT_CATEGORIES` (4 fijas), no la tabla `categories` de DB → categorías nuevas/renombradas en DB no aparecen en el filtro público (solo bajo "Todos") |
| §9 Detalle de proyecto | ✅ | `project-detail.component.ts` + HTML: slug publicado ok; draft/inexistente → "Proyecto no encontrado"; SEO dinámico vía `SeoService`; valor en salarios mínimos; galería |
| §10 Contacto — validación y submit | ⚠️ | `contact.component.ts`: `name` req+min2, `email` req+email, `message` req+min10; `phone`/`subject` opcionales. **Sin `maxLength`** en ningún campo. Estados `submitting/submitted/submitError` ✅ |
| §11 Autenticación | ✅ | `auth.service.ts`: login/logout, restaura sesión (`getSession`), rol desde `profiles`, fallback `'user'` si no hay tabla |
| §12 Autorización | ✅/❌ | `authGuard` cumple la matriz (anon/no-admin → `/admin/login`). **Pero la capa RLS está comprometida por el bug § 4.1** |
| §12 — login de usuario sin rol admin | ⚠️ | Tras login exitoso navega a `/admin` → guard devuelve a login sin mensaje de "no tienes rol admin" (UX ambigua; probar que no hay loop) |
| §13 Dashboard | ⚠️ | Contadores (publicados/destacados/servicios/bloques/mensajes) + `loading`. **Sin estado de error explícito** si `messages.load()` falla (solo console) |
| §14 CRUD proyectos | ✅ | Listado con borradores, crear/editar/eliminar con confirm, slug auto desde título, estados, featured, orden. Unicidad de slug: solo la valida DB (`unique`) → el error de Supabase se muestra crudo en el form ⚠️ |
| §15 Imágenes de proyectos | ⚠️ | Upload con compresión (`browser-image-compression`, ≤2 MB / 2000 px), cover, galería, delete, replace — ✅. **No se valida tipo MIME/archivo** (el input usa `accept="image/*"`, el servicio sube lo que reciba) |
| §16 CRUD servicios | ⚠️ | Igual que proyectos; foto/ícono/borrador ✅; sin validación de tipo de archivo ⚠️ |
| §17 Content blocks | ⚠️ | Toggle flotante solo-admin ✅ (`edit-mode-toggle.component.html` con `@if (canEdit())`), `EditableText`/`EditableImage` con guardar/cancelar/validación ✅. **No es CRUD admin**: `/admin/contenido` es placeholder (documentado). Ver bug § 4.3 (persistencia enmascara errores) |
| §18 Mensajes admin | ⚠️ | Listar/marcar leído/eliminar en UI ✅. **Delete roto por RLS**: no existe policy `DELETE` (§ 4.2). Empty state ✅ ("No hay mensajes todavía") |
| §19 Supabase/Postgres | ⚠️ | `schema.sql` define PK/FK/NOT NULL/UNIQUE/defaults/checks/triggers `updated_at`/cascades ✅. **No es re-ejecutable**: `create policy`/`create function` sin `drop if exists` (a diferencia de `seed.sql`, que sí es idempotente) |
| §20 RLS (matriz) | ❌/✅ | La matriz del plan coincide con `schema.sql` salvo los 2 bugs P0 (§ 4.1 y 4.2). `is_admin()` correcta (security definer) |
| §21 Storage | ✅ | 3 buckets públicos con lectura anónima y escritura solo admin (`storage_*` policies). Coincide con la matriz del plan |
| §22 XSS/injection | ✅ (postura) | **0 usos** de `innerHTML`/`bypassSecurityTrust*`/`DomSanitizer` en todo `src/app` → todo render es interpolación escapada por Angular |
| §23 Routing/deep links | ✅ | Catch-all + `vercel.json` con rewrite a `index.html` (rutas profundas) |
| §24 Responsive | ❌ (harness) | No hay Playwright ni checks de overflow; los viewports del plan no se prueban en ningún lado |
| §25 Accesibilidad | ⚠️ | Labels con `for` y `aria-label` en formularios/header ✅ (evidencia parcial, no automatizada). Sin axe, sin tests de teclado |
| §26 SEO | ⚠️ | `seo.service.ts` actualiza title/description/OG/canonical por ruta ✅. **JSON-LD solo estático** (Organization) en `index.html` — no por página ❌. `sitemap.xml` estático **sin slugs de proyectos** ⚠️. Placeholder `https://ingesocc.com` presente y documentado como pendiente (README, `seo.service.ts` `SITE_URL`, `index.html`, `sitemap.xml`, `robots.txt`) |
| §27 Performance | ❌ (harness) | Sin Lighthouse. Build ok y bundles por lazy route visibles en el output de `pnpm build` |
| §28 Network failures | ⚠️ | Loading/empty/error existen en varios componentes (listados admin, inbox, detalle, filtro sin resultados); **no es uniforme**: dashboard sin error, servicios con fallback seed silencioso (console.warn) |
| §29 Empty states | ⚠️ | "No hay proyectos publicados en esta categoría", "Todavía no hay proyectos/servicios", "No hay mensajes todavía", "Proyecto no encontrado" ✅. Galería de detalle sin imágenes: no tiene estado propio (sección vacía) |
| §30 Browser compat / §31 E2E / §34 CI | ❌ | No existe ninguno de los harnesses |
| §35 Estructura sugerida | ⚠️ | Válida; adaptada en § 5 |

---

## 3. Datasets / ambiente (plan §3)

| Afirmación del plan | Realidad |
|---|---|
| Tres ambientes dev → staging → prod | ❌ Solo `environment.ts`/`environment.prod.ts` (file replacement), **mismos valores Supabase** en ambos: `https://ietjikoddwpdybarcwfk.supabase.co` + `sb_publishable_…`. Cualquier E2E destructiva tocaría el proyecto real |
| `admin@test.com` / `nonadmin@test.com` | No existen como fixtures; se crean a mano en Supabase (Auth → Users) + `role` en `profiles` |
| Datasets `project-draft/published/featured/…` | No hay fixtures versionados. El estado se crea vía CRUD admin. `seed.sql` solo siembra `published` (3 featured) y **no siembra imágenes** (`project_images` vacía, `value_image_path = null`) |
| Buckets `project-images` / `service-images` / `content-images` | ✅ Creados por `schema.sql` (con `on conflict do nothing`) |

Consecuencia para E2E: crear un **proyecto Supabase dedicado de pruebas**, aplicar `schema.sql` + `seed.sql`, y sembrar imágenes vía la API de storage antes de correr suites visuales.

---

## 4. Hallazgos (bugs y riesgos reales encontrados en el código)

### 4.1 🔴 P0 — Elevación de privilegios: auto-promoción a `admin`

> ✅ **Corregido en `supabase/schema.sql`** (policy `profiles_update_own` con `with check (role = 'user')`, bloque `drop + create` re-aplicable). Pendiente: ejecutar ese bloque en los proyectos Supabase existentes.

`supabase/schema.sql` (versión original):

```sql
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());
```

En Postgres, si una policy `FOR UPDATE` omite `WITH CHECK`, este equivale a la expresión `USING`. El único freno de columna es `check (role in ('user','admin'))`, así que **cualquier usuario autenticado puede ejecutar**:

```sql
update public.profiles set role = 'admin' where id = auth.uid();
```

y obtiene acceso total (CRUD, storage, mensajes, edición de contenido). El trigger `handle_new_user` crea el perfil, por lo que basta con que el registro público esté habilitado en Supabase.

Fix propuesto (aplicar en el proyecto de pruebas y luego a staging):

```sql
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = 'user');
```

La app nunca actualiza el rol desde el cliente; el cambio de rol sigue siendo operación manual (SQL con rol `postgres`/dashboard). Alternativa complementaria: `revoke update on public.profiles from authenticated;` y re-crear una policy que solo permita editar columnas no sensibles vía column-level grants.

**Test RLS obligatorio (P0):** usuario no-admin no puede cambiar su propio `role`; el update debe devolver 0 filas/error.

### 4.2 🔴 P0 — Falta política `DELETE` en `contact_messages`

> ✅ **Corregido en `supabase/schema.sql`** (nueva policy `contact_messages_admin_delete` con bloque `drop + create` re-aplicable). Pendiente: ejecutar ese bloque en los proyectos Supabase existentes.

`schema.sql` (versión original) define `insert_public`, `admin_select`, `admin_update`… **y ninguna policy de delete**. Sin policy, `DELETE` de un rol no propietario afecta 0 filas (sin error). Resultado: en `messages-inbox.component.ts` → `ContactMessagesService.remove()` no lanza, la UI quita el mensaje de su señal (optimista)… y **el mensaje reaparece al recargar**.

Fix propuesto:

```sql
drop policy if exists "contact_messages_admin_delete" on public.contact_messages;
create policy "contact_messages_admin_delete" on public.contact_messages
  for delete using (public.is_admin());
```

**Test RLS obligatorio (P0):** admin puede borrar; anónimo y usuario no-admin no pueden.

### 4.3 🟠 P1 — `ContentBlocksService.updateBlock` enmascara errores reales de persistencia
`updateBlock()` ante **cualquier** error de Supabase hace `console.warn` y aplica el cambio en memoria ("cambio en memoria"). Eso está pensado para el caso "tabla aún no aplicada", pero también se traga errores reales (red caída, RLS, timeout): el admin ve el texto cambiado, guarda "exitosamente" y el cambio desaparece al refrescar. `EditableText.save()` nunca ve un error, así que el estado de error de la UI no se dispara.

Sugerencia: distinguir el caso "relación inexistente" (código Postgres `42P01`) para el fallback local y **re-lanzar** cualquier otro error (o exponer `environment`/`supabase.ready` para decidir). Impacta el test "Error de persistencia" del plan §17.

### 4.4 🟠 P1 — Filtro público con categorías fijas
`projects-page.component.ts` arma los chips desde la constante `PROJECT_CATEGORIES` (módulo), no desde `projects.categories` (que sí se carga de la tabla `categories`). Si mañana se agrega/renombra una categoría en DB, el sitio público no puede filtrar por ella. Alinear: exponer un `computed` de categorías desde `ProjectsService` y usarlo en el filtro.

### 4.5 🟠 P1 — Formularios admin: sin validación de unicidad ni de tipo de archivo
- Slug duplicado / inválido: no hay validador client; el error de la constraint `unique` de DB llega crudo (mensaje de Supabase, en inglés) al campo `error` del form. Aceptable a corto plazo; los tests deben cubrirlo como "el error se muestra y no hay estado inconsistente".
- Uploads: no se valida MIME/`type` antes de subir (`project-form`, `service-form`, `editable-image`). El input restringe con `accept="image/*"`, pero un archivo renombrado pasa. Validar `file.type.startsWith('image/')` y extensión.

### 4.6 🟡 P2 — Higiene del esquema y del repo
- `schema.sql` no es re-ejecutable (`create policy`/`create function`/`create trigger` sin `drop if exists`). Convertirlo en migración idempotente o versionarlo.
- `profiles` permite a un admin editar su propia fila (email) pero no hay nada más; no crítico.
- Schematics con `skipTests: true` en `angular.json`: cualquier `ng generate` futuro no creará `.spec.ts`.
- Sin script de typecheck ni lint en `package.json` (solo `build` cubre el typecheck del app).
- `deleteProject`/`removeProjectImage` borran primero el objeto de storage y luego la fila: si el delete de DB falla, queda un objeto huérfano en el bucket (menor; no limpiado).
- Logs `console.warn/info` en servicios de data-access (ruido en prod; candidatos a remover o gatear).

---

## 5. Backlog corregido y priorizado

Orden pensado para que cada fase deje algo ejecutable y verificado. **No** intentar el plan completo de una vez.

### Fase 0 — Arreglar lo que ya está roto (½–1 día)
1. Fixes P0 del § 4.1 y § 4.2 + nota de idempotencia en `schema.sql`; aplicar en proyecto Supabase de pruebas.
2. Restaurar el runner unitario:
   - Crear `karma.conf.js` y `src/test.ts` (los genera `ng new` por defecto; hoy no existen).
   - Agregar un primer `.spec.ts` trivial y verificar `pnpm test --watch=false` en verde.
   - (Opcional) quitar `skipTests: true` de los schematics que interesan.
3. Crear Supabase de pruebas dedicado (schema + seed + usuario admin y no-admin) para no tocar datos reales.
4. `src/environments/environment.staging.ts` + file replacement, o env vars por `NG_APP_*`; documentar.

### Fase 1 — Unit + component tests (Jasmine/Karma, sin red, corren hoy)
Mockear `SupabaseService` (stub del `client`) con `TestBed.provide`; ninguna suite depende de credenciales.

| Archivo de test propuesto | Qué cubre (mapeo a secciones del plan) |
|---|---|
| `core/slugify.spec.ts` | Acentos/NFD, mayúsculas, caracteres especiales, vacío, guiones (base de slugs en toda la app) |
| `features/auth/auth.guard.spec.ts` | Admin → `true`; anónimo/no-admin → `UrlTree` a `/admin/login` (§12) |
| `features/auth/data-access/auth.service.spec.ts` | login ok/error, logout, `restoreSession`, rol desde `profiles`, sin tabla → `'user'` (§11) |
| `core/seo.service.spec.ts` | Title/description/OG/canonical tras navegación; comportamiento con `data` de ruta y sin él (§26) |
| `core/supabase.service.spec.ts` | `ready`, `resolvePublicUrl` (URL absoluta vs storage path) |
| `projects/data-access/projects.service.spec.ts` | `published` solo `status='published'`, orden por `sortOrder`, `featured` ⊂ published, `bySlug`, fallback a seed si la tabla falla, `loadAll` (borradores) (§5/§8/§14) |
| `projects/public/projects-page.component.spec.ts` | Filtros (Todos/categoría), reset de paginación al filtrar, batches de 8 (8/9/16/17…), `hasMore`, sin duplicados (§8) |
| `projects/public/project-detail.component.spec.ts` | Slug publicado vs draft/inexistente ("Proyecto no encontrado"), cover por `isCover`, SEO por proyecto (§9) |
| `projects/public/project-card.component.spec.ts` + `model` | `projectCoverUrl`: isCover > primera > '' (§5) |
| `projects/admin/project-form.component.spec.ts` | Auto-slug desde título (y no pisa si el admin lo editó), required/minLength, `parseNumber`, guardado llama a `create`/`update` (§14) |
| `services/data-access/services.service.spec.ts` + `service-icons.spec.ts` | `published`, orden editorial, mapeo `icon_name` → componente, desconocido → null (§7) |
| `contact/contact.component.spec.ts` | Validaciones (vacíos, email inválido, minLength), submit ok → insert + `submitted`, error de servicio → mensaje, `submitting` (§10) |
| `content-blocks/edit-mode.service.spec.ts` | Toggle solo con `isAdmin`, logout sale del modo, anónimo no activa (§17) |
| `content-blocks/editable-text.component.spec.ts` | Editar/guardar/cancelar, validación de número y texto vacío, error en pantalla (§17) |
| `content-blocks/editable-image.component.spec.ts` | Upload llama a storage + `updateBlock`; error visible (§17) |
| `contact/data-access/contact-messages.service.spec.ts` | `setRead`/`remove` actualizan señal; comportamiento cuando RLS niega (§18) |
| `contact/admin/messages-inbox.component.spec.ts` | Listar, marcar leído/no leído, eliminar con confirm, empty/error (§18) |
| `features/admin/admin-dashboard.component.spec.ts` | Contadores, `loadingMessages`, fallo de carga sin crash (§13) |

### Fase 2 — SQL/RLS (ejecutar contra el Supabase de pruebas, no prod)

> Implementación inicial de las regresiones P0 + matriz anon/user/admin: **`supabase/rls-checks.sql`** (auto-promoción a admin bloqueada, delete de `contact_messages` admin/no-admin/anónimo, lectura published-vs-draft por rol, CRUD de `projects`/`services`/`content_blocks` bloqueado para anon/user y completo para admin, y storage con lectura pública + escritura solo admin; crea y limpia sus propios fixtures; correr en el SQL Editor de un proyecto de pruebas).

Suite de aserciones SQL por rol (anon / authenticated no-admin / admin) sobre: `projects`, `services`, `content_blocks`, `contact_messages`, `profiles`, y storage (`insert/update/delete` de objetos en los 3 buckets). Incluir SIEMPRE las regresiones P0:
- no-admin no puede `update profiles set role='admin'`;
- admin puede `delete` de `contact_messages`;
- anónimo puede `insert` en `contact_messages` pero no leer la bandeja;
- anónimo/no-admin solo ve `status='published'` en `projects`/`services`;
- solo admin escribe en las 3 tablas de contenido y en storage.

En el SQL Editor se simulan roles con:
```sql
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '<user-id-no-admin>')::text, true);
```
(verificar contra la versión de Supabase en uso; alternativa: cliente con la sesión real de cada usuario).

### Fase 3 — E2E Playwright (los 15 flujos del plan, ajustados)
1. Instalar `@playwright/test`; `playwright.config.ts` con `webServer: pnpm start` y base URL `http://localhost:4200`.
2. Apuntar el build de E2E al Supabase de pruebas (Fase 0.3). Fixtures por test con limpieza vía API (service-role key **solo en CI**).
3. Mantener E2E-001..015 del plan; añadir: E2E-016 "no-admin no entra a /admin y no hay loop de redirección"; E2E-017 "login con rol user muestra mensaje/UX consistente".
4. Datos mínimos por suite: proyectos `draft`/`published`/`featured`, proyecto y servicio sin imagen (fallback ícono), mensajes leído/no leído, un bloque de contenido modificado.

### Fase 4 — Calidad y CI
1. `package.json`: scripts `typecheck` (`tsc -p tsconfig.app.json --noEmit` o vía `ng build`), `test:ci` (`ng test --watch=false --browsers=ChromeHeadless`).
2. GitHub Actions: `install (pnpm) → typecheck → test:ci → build` en PR; job separado (opcional) que corre las aserciones SQL de la Fase 2 contra el proyecto de pruebas; smoke E2E post-deploy.
3. Lighthouse/axe: aditivos sobre previews, no bloqueantes al inicio.

---

## 6. Prioridades corregidas (vs. §32 del plan)

| Prioridad | Cambio respecto al plan |
|---|---|
| 🔴 P0 Auth + RLS | **Primero los fixes § 4.1/4.2**, después las suites; el plan asumía RLS correcto |
| 🔴 P0 CRUD/Contact/Routing | Sin cambios; los unit tests de la Fase 1 los cubren sin red |
| 🟠 P1 Content blocks | Reescribir los tests como "edición in-place", no CRUD; incluir el caso del § 4.3 (error de persistencia) |
| 🟠 P1 SEO | Bajar "JSON-LD por página" a feature pendiente o test de presencia estática; sitemap dinámico queda fuera de alcance |
| 🟡 P2 Visual/perf/browser | Depende de tener Supabase de pruebas + imágenes sembradas (Fase 0.3) |
