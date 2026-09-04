---
title: Cómo usar este vault
tags:
  - ingesocc
  - documentacion
fecha: 2026-09-03
estado: activo
---

# Cómo usar este vault

## Abrir el vault

1. Abre **Obsidian**.
2. *Open folder as vault* → selecciona la carpeta `docs/obsidian/` del repo.
3. Empieza por [[Inicio]] (el mapa del vault).

No requiere plugins: usa solo enlaces `[[wikilinks]]`, frontmatter YAML, tags y callouts nativos de Obsidian.

## Convenciones

| Elemento | Convención |
|---|---|
| **Mapa de contenido** | [[Inicio]] es el MOC principal; cada cluster (arquitectura, supabase, funcionalidades, calidad) tiene su propia nota hub |
| **Frontmatter** | `title`, `tags`, `fecha`, `estado` (`activo` / `pendiente` / `obsoleto`) en todas las notas |
| **Enlaces** | `[[Nombre de la Nota]]` para notas; `code` para rutas de archivo del repo (`src/app/...`) |
| **Callouts** | `> [!note]`, `> [!warning]`, `> [!tip]`, `> [!danger]` para avisos |
| **Idioma** | Español, como el resto de la documentación del repo |

## Relación con el resto de la documentación

Este vault **complementa** (no reemplaza) los documentos existentes en `docs/`:

- `docs/cambios-auditoria-final.md` — registro cronológico de bugs corregidos (la nota [[Auditoría y Correcciones]] lo resume y enlaza).
- `docs/test-plan-audit.md` — auditoría del plan maestro de pruebas vs. código real.
- `README.md` — guía rápida de desarrollo en la raíz del repo.

> [!note] Fuente de verdad
> El **código** y los **archivos SQL** (`supabase/schema.sql`, `supabase/seed.sql`) son la fuente de verdad. Esta documentación describe su estado actual y puede quedar desactualizada si cambian.