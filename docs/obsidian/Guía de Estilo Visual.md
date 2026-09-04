---
title: Guía de Estilo Visual
tags:
  - ingesocc
  - ux
  - diseño
  - tailwind
fecha: 2026-09-03
estado: activo
---

# Guía de Estilo Visual

Diseño corporativo premium de ingeniería y construcción. Identidad de marca **inalterable** (regla del plan): no cambiar colores arbitrariamente, mantener jerarquía, whitespace y consistencia.

## Tokens (Tailwind v4, `src/styles.css`)

| Token | Valor | Uso |
|---|---|---|
| `--background` | `#ffffff` | Fondos claros |
| `--foreground` | `#171717` | Texto principal / fondos oscuros |
| `--primary` | `#171717` | CTAs oscuros, texto sobre naranja |
| `--primary-foreground` | `#ffffff` | Texto sobre `--primary` |
| `--accent` | **`#f25623`** | **Naranja de marca** (fills, héroes oscuros, íconos, chips sobre fotos) |
| `--accent-deep` | **`#a53a0c`** | Rust de la misma familia para **texto accent sobre fondos claros** |
| `--secondary` | `#f5f5f4` | Superficies secundarias |

## Regla de contraste (crítica)

`--accent` #f25623 sobre superficies claras da **3.17:1** (falla AA 4.5:1); sobre oscuro da **5.23:1** (pasa).

- **Texto accent sobre fondo claro** → `text-accent-deep` (#a53a0c: 6.05:1 sobre `--background`, 4.86:1 sobre `--secondary`).
- **`bg-accent` (fill naranja)** con texto claro falla (3.4:1) → usar `text-primary` (oscuro) como los demás CTAs.
- El naranja de marca se conserva donde sí cumple: héroes oscuros, footer, sidebar admin, chips sobre fotos, íconos, `bg-accent`.

> [!warning] Bug de capas CSS (corregido)
> La regla base `a { color: inherit; text-decoration: none }` debe vivir dentro de **`@layer base`**. Sin capa, el CSS gana sobre TODAS las utilities de Tailwind y anula `text-accent`/`text-accent-deep` (y cualquier clase de color) sobre `<a>` — los enlaces no pintan su clase. Verificado por el QA visual ([[Testing]]).

## Jerarquía y semántica

- **`h1`** único por página → secciones con **`h2`** → tarjetas con **`h2`** (títulos de card). Nunca saltar de `h1` a `h3` directamente (auditoría `heading-order`, ver [[Auditoría y Correcciones]] nº 8).
- Botones: `<button>` reales (nada de `<div>` clickeables), focus states visibles, labels con `for`/`aria-label`.
- Estados siempre presentes: loading · empty · error · éxito — nunca spinners infinitos ni errores silenciosos.
- Evitar: interfaces saturadas, sombras/bordes innecesarios, colores arbitrarios, overflow horizontal (verificado por [[Testing]]).

## Ver también

- [[Stack Tecnológico]] · [[Auditoría y Correcciones]] (QA visual, CSS layer) · [[Performance y Lighthouse]] (A11y 100)