---
title: Despliegue Vercel
tags:
  - ingesocc
  - vercel
  - despliegue
fecha: 2026-09-03
estado: activo
---

# Despliegue Vercel

SPA Angular servida por Vercel con `vercel.json`, **más** dos Vercel Functions para el upload firmado de imágenes (ver [[Cloudinary y Media]]):

```json
{
  "outputDirectory": "dist/ingesocc-web/browser",
  "cleanUrls": true,
  "trailingSlash": false,
  "functions": { "api/cloudinary/*.ts": { "maxDuration": 10 } },
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }]
}
```

- URLs limpias (sin `.html`).
- Rewrite a `index.html` para que las **rutas profundas funcionen directo**: `/proyectos/:slug`, `/admin/...`, etc. (no solo tras navegar desde `/`).
- El look-ahead `(?!\api/)` es obligatorio: sin él el rewrite de la SPA se comería `/api/cloudinary/signature` y la Function nunca se invocaría (el admin caería al fallback de Storage sin saberlo).

## Variables de entorno

Definir en **Vercel → Project → Settings → Environment Variables** (las 5, para Production y Preview):

| Variable | Secreto |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | no |
| `CLOUDINARY_API_KEY` | no |
| `CLOUDINARY_API_SECRET` | **sí** |
| `SUPABASE_URL` | no |
| `SUPABASE_ANON_KEY` | no (publishable + RLS) |

> [!danger] `CLOUDINARY_API_SECRET` solo en el proyecto de Vercel
> Nunca en variables `NEXT_PUBLIC_*`/build, nunca en `src/environments/`, nunca en el repo. El frontend no lee variables de entorno: sus credenciales de Supabase viven en `src/environments/`. Si el secret llegara al bundle, cualquiera con DevTools podría firmar subidas y borrar assets.

Sin estas variables el sitio **sigue funcionando**: las subidas caen al bucket legacy de Supabase (ver [[Cloudinary y Media]]).

## Desarrollo local

Las functions no existen en `ng serve`; hace falta el CLI de Vercel:

```bash
vercel dev        # terminal 1 → http://localhost:3000 (sirve las functions)
pnpm start        # terminal 2 → http://localhost:4200 (proxy.conf.json reenvía /api)
```

## Comandos

```bash
pnpm build
npx vercel --prod
```

## Checklist pre-producción

> [!warning] Antes de desplegar a producción

1. **Dominio real**: reemplazar el placeholder `https://ingesocc.com` (ver [[SEO]]).
2. **Datos reales de empresa**: teléfono, email, dirección, redes y equipo — hoy son placeholders editables desde el panel (modo edición) o en `supabase/seed.sql`.
3. **Aplicar el esquema** en el proyecto de **producción**: `supabase link --project-ref <ref>` → `supabase db push` (las migraciones de `supabase/migrations/`, no `schema.sql`: es un stub) → `supabase/seed.sql` → crear usuario admin → `role='admin'` en `profiles` (ver [[Pendientes Manuales]]).
4. Ejecutar `supabase/rls-checks.sql` y `supabase/verify-admin-save-project.sql` contra el proyecto de pruebas (regresión RLS y RPC del guardado de proyectos).
5. **Variables de Cloudinary** definidas en el proyecto de Vercel y prueba manual de una subida desde `/admin/proyectos` (verificar que el `<img>` público salga por `res.cloudinary.com`).

## Ver también

- [[Cloudinary y Media]] · [[Rutas y Navegación]] · [[SEO]] · [[Pendientes Manuales]] · [[Arquitectura]]