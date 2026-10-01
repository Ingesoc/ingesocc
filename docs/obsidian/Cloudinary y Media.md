---
title: Cloudinary y Media
tags:
  - ingesocc
  - cloudinary
  - media
  - seguridad
  - vercel
fecha: 2026-09-25
estado: activo
---

# Cloudinary y Media

Cloudinary es el **proveedor principal** de imágenes del sitio (desde 2026-09-25). Supabase Storage queda como *legacy*: se sigue leyendo y solo se escribe si Cloudinary no está disponible. Ver [[Storage]] para el detalle de los buckets antiguos.

> [!info] Fuente de verdad
> El código de `api/` y de `src/app/core/cloudinary*` manda sobre esta nota. Si algo no coincide, el código gana.

## Por qué upload firmado y no credenciales en el cliente

Poner `api_key`/`api_secret` en el bundle de Angular los publica a cualquiera que abra las DevTools. Con **upload firmado**:

- El navegador nunca ve `CLOUDINARY_API_SECRET` (solo existe en el runtime de las funciones).
- La función solo firma si el llamante es un admin autenticado.
- La carpeta y el `public_id` los decide el servidor, no el cliente: nadie sube donde quiere.

`cloudName` y `apiKey` no son secretos y llegan al navegador **dentro de la respuesta de la firma**; por eso el código Angular no tiene ninguna constante de Cloudinary.

## Flujo de subida

```text
1. Angular  → POST /api/cloudinary/signature   (Authorization: Bearer <JWT de Supabase>)
              body: { folder, entityId? }
2. Función  → valida JWT en GET {SUPABASE_URL}/auth/v1/user
            → valida folder contra lista blanca
            → comprueba profiles.role = 'admin' (con el JWT del llamante, vía RLS)
            → { timestamp, signature, cloudName, apiKey, folder, publicId }
3. Angular  → POST https://api.cloudinary.com/v1_1/<cloudName>/image/upload
              multipart: file, api_key, timestamp, signature, folder, public_id
4. Cloudinary → { secure_url, public_id, width, height, bytes }
5. Angular  → guarda la secure_url en Supabase (project_images.storage_path,
               services.photo_path o content_blocks.value_image_path)
```

La firma es **SHA-1** sobre los params firmados ordenados + `api_secret`, tal como documenta la API de Cloudinary (`api/_lib/cloudinary.ts`). Se valida en tests contra el ejemplo oficial.

## Endpoints

| Endpoint | Método | Body | Devuelve |
|---|---|---|---|
| `/api/cloudinary/signature` | POST | `{ folder, entityId? }` | `timestamp`, `signature`, `cloudName`, `apiKey`, `folder`, `publicId` |
| `/api/cloudinary/destroy` | POST | `{ publicId }` | 200 o error mapeado |

`folder` es una **clave**, no una ruta: `projects`, `services`, `content`, `team`, `general`. El servidor la normaliza a `ingesocc/<folder>[/<entityId>]`.

## Autorización de las funciones

`api/_lib/auth.ts`:

1. Extrae el JWT del header `Authorization: Bearer`.
2. Lo valida contra `GET {SUPABASE_URL}/auth/v1/user` con la `SUPABASE_ANON_KEY`.
3. Lee el rol con `GET /rest/v1/profiles?id=eq.<uid>&select=role` **usando el mismo JWT del llamante** (RLS `profiles_select_own`).
4. Exige `role = 'admin'`.

> [!danger] Nunca `service_role`
> Las funciones no usan la `service_role` key: consultarían el rol saltándose RLS y una Function compromise firmaría para cualquiera. Un JWT inválido o un rol que no sea admin se rechaza **antes** de firmar.

`CLOUDINARY_API_SECRET` solo se usa para firmar y para llamar a la API de destroy. Los errores de Cloudinary se traducen a mensajes accionables sin filtrar detalle interno (502), y la respuesta nunca es cacheable.

## Carpetas y `public_id`

- Raíz: `ingesocc/`.
- `public_id`: UUID generado por el servidor, sin extensión (Cloudinary la añade).
- `destroy` solo valida `public_id` que empiece por `ingesocc/<carpeta permitida>`; cualquier otra cosa se rechaza, para que una firma válida no sirva para borrar un asset ajeno.
- Estructura: `ingesocc/projects/<projectId>/<uuid>`, `ingesocc/services/<serviceId>/<uuid>`, `ingesocc/content/<uuid>`.

> [!note] Sin migración física
> Los assets ya guardados en Supabase Storage **no se migran** en esta fase. Se siguen leyendo tal cual y solo se borran si el admin reemplaza la imagen. La migración de assets es una fase aparte.

## Entrega optimizada

`core/cloudinary-urls.ts` expone transforms por contexto (todos con `q_auto,f_auto`):

| Contexto | Transform | Uso |
|---|---|---|
| `cover` | `c_fill,g_auto,w_960,h_720` | portada en cards y mosaico de Home |
| `gallery` | `c_fill,g_auto,w_1200,h_900` | galería y lightbox del detalle de proyecto |
| `hero` | `c_fill,g_auto,w_1600,h_1000` | hero de Home y de la página quiénes somos |
| `service` | `c_fill,g_auto,w_800,h_600` | foto de servicio |
| `thumbnail` | `c_fill,g_auto,w_400,h_400` | listados del panel y fotos de equipo |

`withCloudinaryTransform()` inserta o **reemplaza** la transformación usando la versión (`v123...`) como ancla, y devuelve intactas las URLs que no son de Cloudinary. Eso es lo que permite que un mismo `<img>` sirva una imagen legacy de Supabase y una de Cloudinary sin condicionales.

## Comportamiento ante fallos

`core/cloudinary.service.ts` es el **único** punto de entrada a media (`ProjectsService`, `ServicesService` y `ContentBlocksService` no llaman a Storage ni a fetch por su cuenta).

| Situación | Resultado |
|---|---|
| API propia 404/405/5xx o sin red | **degrada** a Supabase Storage y avisa por consola |
| Cloudinary 5xx al subir | degrada a Storage |
| Cloudinary 401/403 | **error real**, no degrada (es configuración del servidor: `api_key`/`secret`/`cloud_name`) |
| Firma expirada o imagen muy grande | error accionable, no degrada |
| Fallo al borrar un asset | se ignora y se avisa por consola: el cambio principal ya está guardado |

> [!warning] La degradación es deliberada
> Si el servidor no tiene las variables de Cloudinary (o `vercel dev` no está corriendo), el admin **no** se queda sin función: la imagen se guarda en el bucket legacy. El estado "caído" se cachea en memoria; `resetAvailability()` fuerza el reintento.

Como los 401/403 no degradan, una `api_key` mal configurada se ve de inmediato en vez de esconder imágenes en el bucket equivocado.

## Compensación de assets huérfanos

Storage no es transaccional, así que cada subida se limpia si el guardado de la DB falla:

- **Proyecto**: el form sube las imágenes nuevas, luego llama a la RPC `admin_save_project` (una sola transacción). Si la RPC falla, borra los assets nuevos; si acierta, borra las imágenes que el RPC devolvió en `orphan_storage_paths`.
- **Servicio**: al reemplazar la foto, si el `update` de DB falla se borra la foto nueva; la anterior se borra best-effort tras guardar.
- **CMS**: si `updateBlock` falla tras subir, se borra la imagen nueva; la anterior se limpia solo después de guardar.

## Validación de archivos

`core/image-utils.ts` es la fuente única (la usan el admin **y** el servicio):

- MIME **y** extensión coherentes: JPEG, PNG, WebP, AVIF (`gif` y `svg` fuera a propósito).
- 2 MB para proyectos y servicios, 5 MB para el CMS.
- `MAX_IMAGE_EDGE_PX = 2000` como máximo tras comprimir.
- El `accept` del input es solo una ayuda: un archivo renombrado pasa igual, por eso el servicio valida de nuevo antes de subir.

## Variables de entorno

Solo del servidor (Vercel → Project → Settings → Environment Variables, y `.env.local` para `vercel dev`):

| Variable | Secreto |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | no |
| `CLOUDINARY_API_KEY` | no |
| `CLOUDINARY_API_SECRET` | **sí** |
| `SUPABASE_URL` | no |
| `SUPABASE_ANON_KEY` | no (publishable + RLS) |

El **frontend no lee variables de entorno**: sus credenciales de Supabase están en `src/environments/environment.ts` y `environment.prod.ts`. Ver `.env.example` y [[Despliegue Vercel]].

## Desarrollo local

Las funciones necesitan `vercel dev`; `ng serve` a secas no tiene `/api`:

```bash
vercel dev        # terminal 1 → http://localhost:3000
pnpm start        # terminal 2 → http://localhost:4200 (proxy.conf.json reenvía /api)
```

## Ver también

- [[Storage]] — buckets legacy y por qué siguen existiendo
- [[Autenticación y Autorización]] — el mismo JWT que usan las funciones
- [[Arquitectura]] · [[Estructura del Código]] · [[Despliegue Vercel]] · [[Testing]]
- [[CRUD Proyectos]] · [[CRUD Servicios]] · [[Content Blocks]]
