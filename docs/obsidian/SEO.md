---
title: SEO
tags:
  - ingesocc
  - seo
fecha: 2026-09-03
estado: activo
---

# SEO

SEO básico por ruta vía `SeoService` (`core/seo.service.ts`), que actualiza `title`, `meta description`, Open Graph y canonical en cada navegación.

## Qué hay

- **Por ruta**: título + descripción + OG + canonical (rutas públicas; el detalle de proyecto también publica `og:image` con la portada).
- **Base en `src/index.html`**: `og:locale`, `twitter:title/description/image`, `twitter:card=summary_large_image` (nº 11 de [[Auditoría y Correcciones]]).
- **JSON-LD estático** (Organization) en `index.html` — no por página (documentado como alcance: presencia estática, no JSON-LD dinámico).
- **`public/sitemap.xml`** y **`public/robots.txt`** estáticos.
- **URLs y slugs**: `/proyectos/:slug` es la URL pública canónica de cada proyecto; slug único en DB.

## Pendiente (requiere dominio real)

> [!warning] Placeholder `https://ingesocc.com`
> Reemplazar `SITE_URL` en `core/seo.service.ts`, canonical/og:image/JSON-LD en `index.html`, y `public/sitemap.xml` / `public/robots.txt` cuando exista el dominio de producción. El sitemap es estático (sin slugs de proyectos dinámicos). Ver [[Pendientes Manuales]].

## Notas

- SSR/prerender mejoraría el SEO (contenido indexable por crawlers sin JS) — **recomendación documentada, no migrada** (ver [[Performance y Lighthouse]]).
- Score Lighthouse SEO: **1.00** en las 4 corridas (ver [[Performance y Lighthouse]]).

## Ver también

- [[CRUD Proyectos]] (og:image del detalle) · [[Performance y Lighthouse]] · [[Pendientes Manuales]]