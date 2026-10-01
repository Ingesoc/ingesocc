---
title: Pendientes Manuales
tags:
  - ingesocc
  - operacion
  - pendiente
fecha: 2026-09-03
estado: activo
---

# Pendientes Manuales

Lo que queda para producción y **requiere intervención humana** (no se puede resolver desde el código). El proyecto está completo, compila y pasa todas las suites — estos son los pasos operativos.

> [!warning] Orden sugerido
> Dominio → datos reales → esquema en producción → regresión RLS → variables de Cloudinary.

## 1. Dominio real (SEO)

Reemplazar el placeholder `https://ingesocc.com` en:
- `core/seo.service.ts` (constante `SITE_URL`)
- `src/index.html` (canonical, og:image, JSON-LD)
- `public/sitemap.xml` · `public/robots.txt`

Ver [[SEO]].

## 2. Datos reales de empresa

Teléfono, email, dirección, redes y equipo son **placeholders** (nombres de ejemplo en `content_blocks`). Se editan desde el panel admin (modo edición, ver [[Content Blocks]]) o directamente en `supabase/seed.sql` antes de aplicarlo a producción. Los 10 proyectos del seed son ilustrativos — cargar el portafolio real vía el CRUD admin.

## 3. Aplicar el esquema al proyecto de producción

> [!danger] `supabase/schema.sql` ya no es la fuente de verdad
> Es un stub que apunta a `supabase/migrations/`. Aplicar solo ese archivo (o el
> `seed.sql` sin migraciones) deja la base **sin funciones**: es lo que produjo
> el error **PGRST202** (`public.admin_save_project` no encontrada) en el panel
> de proyectos.

La fuente de verdad son las migraciones versionadas:

1. `supabase link --project-ref <ref>` (una vez) → 2. `supabase db push`
   (aplica TODAS las pendientes, incluidas las funciones) → 3. usuario admin + rol:

```sql
insert into public.profiles (id, email)
select id, email from auth.users where email = 'ADMIN@EMAIL'
on conflict (id) do nothing;

update public.profiles set role = 'admin' where email = 'ADMIN@EMAIL';
```

Verificar: `select count(*) from pg_catalog.pg_tables where schemaname = 'public';` → **8**, y los counts de [[Seeds]].

Además, para el guardado de proyectos:

4. Correr `supabase/verify-admin-save-project.sql` (SQL Editor, proyecto de pruebas) → todas las filas en `PASS`. Comprueba que `public.admin_save_project` existe **con la firma exacta** que llama el panel, sus permisos y el comportamiento transaccional.
5. Si la llamada sigue dando PGRST202 después de aplicar el DDL: `notify pgrst, 'reload schema';` (Supabase ya refresca el schema cache solo, el NOTIFY es para el caso raro de una conexión con el cache viejo).

> [!note] Estado del proyecto de pruebas `ietjikoddwpdybarcwfk`
> Tablas y buckets presentes; `admin_save_project` **no** estaba aplicada (verificado
> por PGRST202 contra `/rest/v1/rpc/admin_save_project`). Pendiente: `supabase db push`.


## 4. Regresión RLS

Ejecutar `supabase/rls-checks.sql` contra el proyecto de **pruebas** (no producción) para validar la matriz anon/user/admin (ver [[Row Level Security]]).

## 5. Recuperación de contraseña (configuración)

La UI de recuperación está implementada (CU-18): enlace "¿Olvidaste tu contraseña?" en `/admin/login`, pantalla de solicitud `/admin/recuperar` y pantalla de contraseña nueva `/admin/nueva-contrasena`. El cliente pide el enlace con `redirectTo: <origin>/admin/nueva-contrasena`.

> [!warning] Pendiente operativo
> En el dashboard de Supabase (proyecto de producción), añadir el origen del sitio a **Authentication → URL Configuration → Redirect URLs** (p. ej. `https://<dominio>/admin/nueva-contrasena`); sin esto, el enlace del correo no aterrizará en la app. Ver [[Casos de Uso]] CU-18.

## 6. Rotar credenciales compartidas

> [!danger] Seguridad
> El password admin se compartió en el chat durante la sesión de QA. Rotarlo cuando sea conveniente — solo se lee de variables de entorno en runtime (`E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`), nada se guarda en el repo.

## 7. Configurar Cloudinary

Las imágenes nuevas requieren una cuenta de Cloudinary y las 5 variables en el proyecto de **Vercel** (ver [[Cloudinary y Media]] y [[Despliegue Vercel]]):

1. Crear el cloud en Cloudinary (plan gratuito sirve) y copiar `cloud name`, `api key` y `api secret`.
2. Definir `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `SUPABASE_URL` y `SUPABASE_ANON_KEY` en **Vercel → Project → Settings → Environment Variables** (Production y Preview).
3. `SUPABASE_URL` y `SUPABASE_ANON_KEY` deben apuntar al **mismo** proyecto que `src/environments/`: son los que validan el JWT del admin.
4. Desplegar y probar una subida real desde `/admin/proyectos`: confirmar que la `secure_url` guardada empieza por `res.cloudinary.com` y que el `<img>` público ya sale por el CDN con la transformación.
5. Opcional: en Cloudinary, revisar la quota y activar el plan de pago cuando el volumen lo pida (`maxDuration: 10` en `vercel.json` cubre la firma; el upload va directo del navegador a Cloudinary, no pasa por la Function).

> [!note] Sin estos pasos el sitio funciona igual
> Las subidas caen al bucket legacy de Supabase (ver [[Cloudinary y Media]]). Los assets ya guardados no se migran: eso es una fase aparte, con su propia decisión sobre URLs compartidas.

## 8. (Opcional) Migración física de imágenes

Copiar los assets de `project-images`/`service-images`/`content-images` a Cloudinary y vaciar los buckets. **No** es parte del despliegue actual: hay que decidir qué pasa con las URLs ya compartidas y reescribir las filas solo después de verificar cada asset.

## Ver también

- [[Inicio]] · [[Despliegue Vercel]] · [[Cloudinary y Media]] · [[Auditoría y Correcciones]]