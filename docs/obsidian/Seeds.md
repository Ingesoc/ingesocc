---
title: Seeds
tags:
  - ingesocc
  - supabase
  - base-de-datos
fecha: 2026-09-03
estado: activo
---

# Seeds

Dos archivos SQL en `supabase/`, **idempotentes** (se pueden re-aplicar sin romper):

| Archivo | Contenido | Orden |
|---|---|---|
| `schema.sql` | 8 tablas + funciones + triggers + RLS + buckets | **Primero** |
| `seed.sql` | categorías, servicios, `content_blocks`, proyectos + imágenes | Después |

Verificación tras aplicar (contra el proyecto de pruebas):

```sql
select count(*) from pg_catalog.pg_tables where schemaname = 'public';  -- → 8
select 'projects' as t, count(*) from public.projects
union all select 'services', count(*) from public.services
union all select 'content_blocks', count(*) from public.content_blocks
union all select 'project_images', count(*) from public.project_images;
-- → 10 proyectos · 6 servicios · 53 content_blocks · 17 project_images
```

## Contenido del seed

- **4 categorías** — Edificaciones, Estructuras Metálicas, Puentes, Proyectos Especiales.
- **6 servicios** publicados — `sort_order` prioriza infraestructura/hospitalario/industrial sobre vivienda.
- **53 `content_blocks`** — inventario completo por página (`global`, `home`, `about`, `contact`): textos, richtext, números (stats, años de timeline) y 6 imágenes.
- **10 proyectos** publicados (3 destacados) con **17 filas en `project_images`** (portadas + galería). ⚠️ Son **ilustrativos** — el portafolio real se carga vía el panel admin.

## Paridad con los seeds estáticos (regla §22 del plan)

La app mantiene seeds estáticos en memoria (`content-blocks.service.ts`, `projects.service.ts`, `services.service.ts`) como fallback. **Con la DB aplicada, el sitio confía en las filas reales** — por eso el seed de DB debe verse igual que el fallback estático:

- Mismas URLs de Unsplash en `content_blocks` (hero, historia, equipo), `photo_path` de servicios y portadas de proyectos.
- Verificado programáticamente: 53 claves de `content_blocks` idénticas DB↔estático, URLs de imagen idénticas, portadas idénticas.

## Bugs de primer-apply corregidos

- **Aridad**: el insert de `content_blocks` declaraba 6 columnas pero las filas de texto daban 5 valores → se dividió en dos inserts (texto/número e imágenes). Verificado con un checker de aridad (nº 15 de [[Auditoría y Correcciones]]).
- **Imágenes faltantes**: sin URLs, la DB aplicada mostraba cajas grises vacías donde el fallback estático tenía fotos → se espejaron las URLs (nº 16).
- **Idempotencia de `project_images`**: sin clave natural, el insert se guarda con `NOT EXISTS` por proyecto para que re-aplicar el seed no duplique filas.

## Ver también

- [[Esquema de Base de Datos]] · [[Supabase]] · [[Content Blocks]] · [[Pendientes Manuales]]