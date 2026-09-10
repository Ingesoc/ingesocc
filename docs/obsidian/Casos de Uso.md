---
title: Casos de Uso
tags:
  - ingesocc
  - casos-de-uso
  - funcional
fecha: 2026-09-07
estado: activo
---

# Casos de Uso

Catálogo completo de los casos de uso del sistema, con actores, precondiciones, flujo principal, flujos alternos y postcondiciones. Complementa a [[Guías de Uso]] (el manual paso a paso) y a las notas funcionales ([[CRUD Proyectos]], [[CRUD Servicios]], [[Content Blocks]], [[Contacto y Mensajes]], [[Autenticación y Autorización]]).

## Actores

| Actor | Descripción |
|---|---|
| Visitante | Cualquier persona sin sesión. Navega el sitio público y envía el formulario de contacto. |
| Admin | Usuario autenticado con rol `admin` en `profiles`. Gestiona proyectos, servicios, contenido y mensajes. |
| Sistema | Supabase (Postgres + Auth + Storage + RLS) y la SPA Angular. |

## CU-01 Ver la página de inicio

- **Actor**: Visitante
- **Precondiciones**: el sitio está desplegado o el dev server está corriendo.
- **Flujo principal**:
  1. El visitante abre la raíz del sitio (`/`).
  2. El sistema muestra el header con la navegación, el hero con título/subtítulo editables y el CTA.
  3. El sistema muestra la banda de stats (años de experiencia, proyectos ejecutados, sectores) y los proyectos destacados.
  4. El sistema muestra los servicios numerados y el CTA final.
- **Flujos alternos**:
  - Sin tabla `content_blocks` o sin credenciales: el sistema usa los seeds estáticos en memoria (mismo contrato visual).
  - Tabla existente pero vacía: se muestra el estado vacío real, no el seed (nº 8 de [[Auditoría y Correcciones]]).
- **Postcondiciones**: el visitante puede navegar a cualquier sección del sitio.

## CU-02 Navegar entre páginas públicas

- **Actor**: Visitante
- **Precondiciones**: el sitio carga correctamente.
- **Flujo principal**:
  1. El visitante usa la navegación principal (Inicio, Quiénes Somos, Servicios, Proyectos, Contacto) o el CTA "Solicitar Cotización".
  2. El sistema navega a la ruta correspondiente y actualiza título, descripción, Open Graph y canonical ([[SEO]]).
  3. En móvil, el menú se abre a pantalla completa con el morph de icono (hamburguesa ↔ cerrar).
- **Flujos alternos**:
  - Ruta inexistente: el catch-all redirige a `/`.
  - Deep link directo (recargar `/proyectos/:slug`): Vercel reescribe a `index.html` y la SPA resuelve la ruta.
- **Postcondiciones**: la página destino se muestra con su layout público completo (header + footer).

## CU-03 Ver el listado de proyectos con filtros

- **Actor**: Visitante
- **Precondiciones**: hay proyectos publicados en la tabla (o seed estático).
- **Flujo principal**:
  1. El visitante entra a `/proyectos`.
  2. El sistema muestra el grid con los proyectos publicados en bloques de 8 y los chips de categoría.
  3. El visitante hace clic en "Cargar Más" y el sistema añade el siguiente bloque mientras `hasMore` sea verdadero.
  4. El visitante selecciona un chip de categoría y el sistema filtra la lista y reinicia la paginación.
- **Flujos alternos**:
  - Sin proyectos publicados en una categoría: mensaje "No hay proyectos publicados en esta categoría".
  - Sin proyectos en absoluto: mensaje "No hay proyectos…" / "Todavía no hay proyectos".
  - Error de carga: el listado muestra un estado de error.
- **Postcondiciones**: el visitante puede entrar al detalle de cualquier proyecto visible.

## CU-04 Ver el detalle de un proyecto

- **Actor**: Visitante
- **Precondiciones**: el proyecto existe y tiene `status = 'published'`.
- **Flujo principal**:
  1. El visitante hace clic en una tarjeta de proyecto (o entra directo a `/proyectos/:slug`).
  2. El sistema muestra la portada (con `fetchpriority="high"`), título, descripción, valor en salarios mínimos y la galería.
  3. El sistema publica `og:image` con la portada para compartir el enlace.
  4. El visitante abre la galería en lightbox (prev/next con flechas y teclado, navegación circular, contador, `ESC` para cerrar).
- **Flujos alternos**:
  - Proyecto borrador o inexistente: el sistema muestra "Proyecto no encontrado" (estado 404 propio, sin fallar).
- **Postcondiciones**: el visitante puede volver al listado con "Volver a proyectos".

## CU-05 Enviar un mensaje de contacto

- **Actor**: Visitante
- **Precondiciones**: el formulario de `/contacto` está visible.
- **Flujo principal**:
  1. El visitante completa nombre (mín. 2), email (formato válido) y mensaje (mín. 10); teléfono y asunto son opcionales.
  2. El visitante envía el formulario.
  3. El sistema valida, deshabilita el botón mientras procesa (anti doble submit) e inserta la fila en `contact_messages` (RLS permite insert público).
  4. El sistema muestra el estado de éxito.
- **Flujos alternos**:
  - Validación fallida: errores en vivo por campo (incluidos `maxLength`: 80/254/30/200/5000).
  - Error de inserción: estado `submitError` visible con el mensaje.
  - Intento de doble submit: bloqueado por el estado `submitting`.
- **Postcondiciones**: el mensaje queda en la bandeja admin como no leído.

## CU-06 Iniciar sesión como administrador

- **Actor**: Admin
- **Precondiciones**: el usuario existe en Supabase Auth y tiene `role = 'admin'` en `profiles`.
- **Flujo principal**:
  1. El admin entra a `/admin/login`.
  2. Ingresa email y contraseña y presiona "Ingresar".
  3. El sistema autentica contra Supabase Auth, lee el rol desde `profiles` y navega a `/admin`.
- **Flujos alternos**:
  - Credenciales inválidas: mensaje en español "Credenciales inválidas…".
  - Email sin confirmar: mensaje "Confirma tu correo electrónico…".
  - Rate limit: "Demasiados intentos…".
  - Usuario autenticado sin rol admin: se cierra la sesión y se muestra "Tu usuario no tiene permisos de administración…".
  - Sesión ya activa al entrar a login: redirección directa al panel.
  - Deep-link a `/admin/*` con sesión persistida: el guard espera `whenReady()` y deja pasar al admin (nº 2 de [[Auditoría y Correcciones]]).
- **Postcondiciones**: el admin tiene sesión persistida y puede usar el panel.

## CU-07 Ver el dashboard

- **Actor**: Admin
- **Precondiciones**: sesión admin activa.
- **Flujo principal**:
  1. El admin entra a `/admin` (o tras el login).
  2. El sistema muestra tarjetas con: proyectos publicados (+ destacados en Home), servicios, bloques de contenido y mensajes de contacto (sin leer / total).
  3. Cada tarjeta enlaza a su módulo.
- **Flujos alternos**: error al cargar mensajes no bloquea el dashboard (los contadores de proyectos/servicios/bloques ya están en señales).
- **Postcondiciones**: el admin navega a cualquiera de los módulos.

## CU-08 Crear un proyecto

- **Actor**: Admin
- **Precondiciones**: sesión admin activa; tabla `projects` creada (o fallback estático solo para lectura).
- **Flujo principal**:
  1. El admin entra a `/admin/proyectos` y pulsa "Nuevo proyecto".
  2. Completa título (min. 3), slug (autogenerado desde el título, editable), descripción (min. 10), valor en salarios mínimos (opcional), estado, destacado, orden y categorías.
  3. Sube imágenes: se validan (MIME/extensión), se comprimen (≤2 MB / 2000 px) y se marcan portada/orden.
  4. Guarda: el sistema inserta la fila en `projects`, sube las imágenes a `project-images`, registra `project_images`, sincroniza portada/orden, reemplaza `project_categories` y refresca señales.
  5. El sistema navega al listado admin.
- **Flujos alternos**:
  - Slug duplicado (23505): mensaje "Ya existe un proyecto con ese slug (URL)…".
  - Imagen no válida: mensaje con los formatos aceptados; el archivo se descarta.
  - Error de red/RLS: banner de error en el formulario; no se navega.
  - Formulario inválido: se marcan todos los campos como tocados.
- **Postcondiciones**: el proyecto existe en DB (borrador o publicado según estado) y aparece en el listado admin; si está publicado, aparece en el sitio público.

## CU-09 Editar un proyecto

- **Actor**: Admin
- **Precondiciones**: el proyecto existe; sesión admin activa.
- **Flujo principal**:
  1. El admin entra a `/admin/proyectos/:id` (o pulsa editar en el listado).
  2. El sistema precarga todos los campos, categorías e imágenes.
  3. El admin modifica datos, sube/elimina/reordena imágenes y cambia portada, categorías o estado.
  4. Guarda: el sistema actualiza la fila, aplica altas/bajas de imágenes (storage + filas), sincroniza portada/orden y categorías, y refresca.
- **Flujos alternos**: mismo manejo de errores que CU-08 (slug duplicado, validación, red).
- **Postcondiciones**: los cambios son visibles en el panel y, si está publicado, en el sitio público.

## CU-10 Eliminar un proyecto

- **Actor**: Admin
- **Precondiciones**: el proyecto existe; sesión admin activa.
- **Flujo principal**:
  1. El admin pulsa la papelera en el listado.
  2. El sistema pide confirmación ("¿Eliminar…? Esta acción no se puede deshacer.").
  3. Al confirmar, borra las imágenes del bucket `project-images` y la fila (cascade a imágenes y categorías).
  4. El sistema refresca el listado.
- **Flujos alternos**: cancelar la confirmación no borra nada; error de borrado muestra mensaje.
- **Postcondiciones**: el proyecto desaparece del panel y del sitio público; los objetos de storage se intentan eliminar (resultado ignorado si falla, riesgo menor de objetos huérfanos, ver [[Storage]]).

## CU-11 Crear un servicio

- **Actor**: Admin
- **Precondiciones**: sesión admin activa.
- **Flujo principal**:
  1. El admin entra a `/admin/servicios` y pulsa "Nuevo servicio".
  2. Completa nombre (min. 3), slug (autogenerado, editable), descripción (min. 10), ícono de respaldo, estado y orden.
  3. Opcionalmente selecciona una foto: se valida, se comprime (≤2 MB / 1600 px) y se muestra preview.
  4. Guarda: inserta el servicio; si hay foto, la sube a `service-images` y actualiza `photo_path`.
- **Flujos alternos**:
  - Carrera foto/guardar: el botón queda deshabilitado ("Procesando foto…") mientras la foto se comprime, para no guardar sin ella (nº 20 de [[Auditoría y Correcciones]]).
  - Slug duplicado (23505): mensaje "Ya existe un servicio con ese slug…".
  - Foto no válida: mensaje con los formatos aceptados.
- **Postcondiciones**: el servicio existe (publicado o borrador) y aparece en el listado admin; si está publicado, en `/servicios` con foto o ícono.

## CU-12 Editar un servicio

- **Actor**: Admin
- **Precondiciones**: el servicio existe; sesión admin activa.
- **Flujo principal**:
  1. El admin entra a `/admin/servicios/:id`.
  2. El sistema precarga los campos y la foto actual (si existe).
  3. El admin modifica datos, reemplaza la foto (la anterior se borra del storage), o la quita para volver al ícono de respaldo.
  4. Guarda: actualiza la fila y aplica los cambios de foto.
- **Flujos alternos**: mismo manejo de errores que CU-11.
- **Postcondiciones**: los cambios se reflejan en el panel y en `/servicios`.

## CU-13 Eliminar un servicio

- **Actor**: Admin
- **Precondiciones**: el servicio existe; sesión admin activa.
- **Flujo principal**:
  1. El admin pulsa la papelera en el listado de servicios.
  2. El sistema pide confirmación.
  3. Al confirmar, borra la foto del bucket `service-images` (si existe) y la fila.
- **Postcondiciones**: el servicio desaparece del panel y de `/servicios`.

## CU-14 Editar contenido in-place (content blocks)

- **Actor**: Admin
- **Precondiciones**: sesión admin activa; el admin está en una página pública (Home, Quiénes Somos, Contacto).
- **Flujo principal**:
  1. El admin activa el botón flotante "Modo edición".
  2. Los bloques editables muestran controles (lápiz para texto, reemplazo para imagen).
  3. El admin edita el texto (con validación: número, texto vacío) o reemplaza la imagen (upload a `content-images`).
  4. Guarda: el sistema persiste en `content_blocks` (clave única `page + section_key`) y actualiza la señal local.
  5. El público ve el cambio de inmediato.
- **Flujos alternos**:
  - Tabla inexistente (42P01/PGRST205) o sin credenciales: el cambio se aplica solo en memoria y se pierde al recargar (reservado para entorno sin esquema).
  - Cualquier otro error real (RLS, red): se re-lanza y la UI lo muestra (nº 4 de [[Auditoría y Correcciones]]).
  - Cerrar sesión o perder rol admin: el modo edición se desactiva automáticamente.
- **Postcondiciones**: el bloque queda actualizado en DB y visible en público.

## CU-15 Gestionar la bandeja de mensajes

- **Actor**: Admin
- **Precondiciones**: sesión admin activa; hay mensajes en `contact_messages` (RLS: lectura solo admin).
- **Flujo principal**:
  1. El admin entra a `/admin/mensajes`.
  2. El sistema lista los mensajes del más reciente al más antiguo, con los no leídos resaltados.
  3. El admin marca un mensaje como leído o no leído (persiste).
  4. El admin elimina un mensaje con confirmación (persiste gracias a la política `contact_messages_admin_delete`).
- **Flujos alternos**: bandeja vacía muestra "No hay mensajes todavía"; errores de actualización/eliminación muestran mensaje.
- **Postcondiciones**: el estado de la bandeja refleja los cambios tras recargar.

## CU-16 Cerrar sesión

- **Actor**: Admin
- **Precondiciones**: sesión admin activa.
- **Flujo principal**:
  1. El admin pulsa "Cerrar sesión" en el layout admin.
  2. El sistema llama a `supabase.auth.signOut()`, limpia la señal de usuario y desactiva el modo edición.
  3. El sistema redirige a la ruta pública.
- **Flujos alternos**: sesión expirada por el servidor: `onAuthStateChange` limpia el usuario y el guard redirige a `/admin/login`.
- **Postcondiciones**: el admin vuelve a ser visitante; el panel queda protegido.

## CU-17 Recargar la página admin (deep-link)

- **Actor**: Admin
- **Precondiciones**: sesión persistida en el navegador; ruta `/admin/*` cargada directo (refresh o enlace externo).
- **Flujo principal**:
  1. El navegador recarga `/admin/proyectos` (o similar).
  2. El guard espera a que `AuthService.whenReady()` termine de restaurar la sesión.
  3. Con rol admin, la navegación continúa; sin sesión o rol, redirige a `/admin/login`.
- **Flujos alternos**: proyecto/servicio solicitado no existe en el form de edición → "Proyecto no encontrado"/"Servicio no encontrado".
- **Postcondiciones**: el admin recupera el estado del panel sin reintroducir credenciales.

## CU-18 Recuperar la contraseña (Supabase Auth)

- **Actor**: Admin (o cualquier usuario con cuenta en Supabase Auth)
- **Precondiciones**: el usuario tiene una cuenta creada en Supabase Auth (Authentication → Users); el proveedor de email está habilitado y las plantillas de correo de Supabase están configuradas.
- **Flujo principal** (mecanismo de Supabase Auth):
  1. El usuario solicita la recuperación desde `/admin/recuperar` (el cliente llama a `auth.resetPasswordForEmail(email, { redirectTo: '<origin>/admin/nueva-contrasena' })`).
  2. Supabase envía un correo con un enlace de recuperación que aterriza en `/admin/nueva-contrasena`.
  3. El usuario abre el enlace: el token viaja en el hash de la URL.
  4. El cliente supabase-js lo detecta con `detectSessionInUrl: true` y establece una sesión con el evento `PASSWORD_RECOVERY`.
  5. En `/admin/nueva-contrasena` el usuario define la contraseña nueva (Supabase la actualiza vía `auth.updateUser`).
  6. Con la sesión restaurada, el flujo continúa como CU-06/CU-17: se lee el rol desde `profiles` y el guard decide (con rol admin → `/admin`; sin rol → logout y `/admin/login`).
- **Flujos alternos**:
  - Email inexistente: Supabase no revela si la cuenta existe (por seguridad); la respuesta es la misma para cuentas válidas e inválidas.
  - Token expirado o ya usado: el enlace deja de ser válido; el usuario debe solicitar uno nuevo.
  - La contraseña nueva no cumple la política de Supabase: el cambio se rechaza y se muestra el error.
- **Postcondiciones**: la contraseña queda actualizada en Supabase Auth; la sesión (si estaba activa) puede verse invalidada en otros dispositivos.

> [!info] Implementación en la app (CU-18)
> El login (`/admin/login`) expone el enlace "¿Olvidaste tu contraseña?" hacia `/admin/recuperar`, y la pantalla `/admin/nueva-contrasena` define la contraseña nueva (con detección de enlace expirado/usado: ofrece pedir otro). Requisito operativo: el origen del sitio debe estar en **Authentication → URL Configuration → Redirect URLs** del dashboard de Supabase (ver [[Pendientes Manuales]]). Cubierto por unit tests en `auth.service.spec.ts` y por el spec E2E `password-recovery.spec.ts` (ver [[Testing]]).

## CU-19 Expiración de la sesión (Supabase Auth)

- **Actor**: Admin
- **Precondiciones**: sesión admin activa con `persistSession: true`, `autoRefreshToken: true` y `detectSessionInUrl: true` (configuración de `SupabaseService`).
- **Flujo principal**:
  1. El admin trabaja en el panel con una sesión activa.
  2. Mientras el refresh token sigue siendo válido, supabase-js renueva el access token en segundo plano (`onAuthStateChange` con `TOKEN_REFRESHED`/`SIGNED_IN`) y el admin ni lo nota.
  3. Cuando el refresh token expira o es revocado (p. ej. cambio de contraseña en otro dispositivo, token revocado en Supabase, tiempo de vida máximo alcanzado), el refresco automático falla.
  4. `onAuthStateChange` emite la sesión como `null`, `AuthService` limpia la señal de usuario y `EditModeService` desactiva el modo edición (pierde `isAdmin()`).
  5. En la siguiente navegación a `/admin/*`, el `authGuard` redirige a `/admin/login`.
  6. El admin vuelve a ingresar con CU-06.
- **Flujos alternos**:
  - El admin estaba en una ruta pública: el panel queda inaccesible pero el sitio público sigue funcionando sin sesión.
  - El modo edición estaba activo: se desactiva al perder el rol admin (efecto de `EditModeService`), impidiendo cambios de contenido no autorizados.
  - El refresh falla por red temporal: supabase-js reintenta el refresco; la sesión no se descarta hasta que el intento falla de forma definitiva.
- **Postcondiciones**: la sesión queda invalidada en el cliente; el panel vuelve a estar protegido y el contenido público no se ve afectado.

## Matriz de trazabilidad

| Caso de uso | Ruta(s) | Feature | Nota relacionada |
|---|---|---|---|
| CU-01 a CU-04 | `/`, `/proyectos`, `/proyectos/:slug` | proyectos + content blocks | [[CRUD Proyectos]] · [[Content Blocks]] |
| CU-05 | `/contacto` | contacto | [[Contacto y Mensajes]] |
| CU-06, CU-16 a CU-19 | `/admin/login`, `/admin/*` | auth | [[Autenticación y Autorización]] · [[Rutas y Navegación]] |
| CU-07 | `/admin` | admin | [[Estructura del Código]] |
| CU-08 a CU-10 | `/admin/proyectos` | proyectos | [[CRUD Proyectos]] |
| CU-11 a CU-13 | `/admin/servicios` | servicios | [[CRUD Servicios]] |
| CU-14 | páginas públicas en modo edición | content blocks | [[Content Blocks]] |
| CU-15 | `/admin/mensajes` | contacto | [[Contacto y Mensajes]] |

## Ver también

- [[Guías de Uso]] — el manual paso a paso de cada uno de estos flujos
- [[Testing]] — cómo estos casos de uso están cubiertos por unit, E2E y QA visual
- [[Inicio]] · [[Auditoría y Correcciones]] · [[Pendientes Manuales]]