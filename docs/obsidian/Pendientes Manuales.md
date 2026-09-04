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
> Dominio → datos reales → esquema en producción → regresión RLS.

## 1. Dominio real (SEO)

Reemplazar el placeholder `https://ingesocc.com` en:
- `core/seo.service.ts` (constante `SITE_URL`)
- `src/index.html` (canonical, og:image, JSON-LD)
- `public/sitemap.xml` · `public/robots.txt`

Ver [[SEO]].

## 2. Datos reales de empresa

Teléfono, email, dirección, redes y equipo son **placeholders** (nombres de ejemplo en `content_blocks`). Se editan desde el panel admin (modo edición, ver [[Content Blocks]]) o directamente en `supabase/seed.sql` antes de aplicarlo a producción. Los 10 proyectos del seed son ilustrativos — cargar el portafolio real vía el CRUD admin.

## 3. Aplicar el esquema al proyecto de producción

En el proyecto de **pruebas** (`ietjikoddwpdybarcwfk`) ya está aplicado y verificado. Para producción:

1. `supabase/schema.sql` → 2. `supabase/seed.sql` → 3. usuario admin + rol:

```sql
insert into public.profiles (id, email)
select id, email from auth.users where email = 'ADMIN@EMAIL'
on conflict (id) do nothing;

update public.profiles set role = 'admin' where email = 'ADMIN@EMAIL';
```

Verificar: `select count(*) from pg_catalog.pg_tables where schemaname = 'public';` → **8**, y los counts de [[Seeds]].

## 4. Regresión RLS

Ejecutar `supabase/rls-checks.sql` contra el proyecto de **pruebas** (no producción) para validar la matriz anon/user/admin (ver [[Row Level Security]]).

## 5. Rotar credenciales compartidas

> [!danger] Seguridad
> El password admin se compartió en el chat durante la sesión de QA. Rotarlo cuando sea conveniente — solo se lee de variables de entorno en runtime (`E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`), nada se guarda en el repo.

## Ver también

- [[Inicio]] · [[Despliegue Vercel]] · [[Auditoría y Correcciones]]