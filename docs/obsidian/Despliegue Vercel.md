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

SPA Angular servida por Vercel con `vercel.json`:

```json
{
  "outputDirectory": "dist/ingesocc-web/browser",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- URLs limpias (sin `.html`).
- Rewrite a `index.html` para que las **rutas profundas funcionen directo**: `/proyectos/:slug`, `/admin/...`, etc. (no solo tras navegar desde `/`).

## Comandos

```bash
pnpm build
npx vercel --prod
```

## Checklist pre-producción

> [!warning] Antes de desplegar a producción

1. **Dominio real**: reemplazar el placeholder `https://ingesocc.com` (ver [[SEO]]).
2. **Datos reales de empresa**: teléfono, email, dirección, redes y equipo — hoy son placeholders editables desde el panel (modo edición) o en `supabase/seed.sql`.
3. **Aplicar el esquema** en el proyecto de **producción**: `supabase/schema.sql` → `supabase/seed.sql` → crear usuario admin → `role='admin'` en `profiles` (en el proyecto de pruebas ya está aplicado y verificado — ver [[Pendientes Manuales]]).
4. Ejecutar `supabase/rls-checks.sql` contra el proyecto de pruebas (regresión RLS).

## Ver también

- [[Rutas y Navegación]] · [[SEO]] · [[Pendientes Manuales]] · [[Arquitectura]]