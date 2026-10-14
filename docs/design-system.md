# Sistema de diseño — Ingesocc

Fecha: 2026-10-13 · Fuente única: `src/styles.css` (Tailwind v4, `@import 'tailwindcss'`)

## Principios

1. **La foto y el negro mandan.** El 80 % de la interfaz usa neutros cálidos y
   fotografía de obra; el naranja es solo acento (CTA, estados, detalles), nunca
   fondo dominante.
2. **Un solo vocabulario** para público y panel: mismos botones, campos, badges y
   contenedores.
3. **Movimiento con intención y anulable.** Todo efecto respeta
   `prefers-reduced-motion`.
4. **Tolerancia tipográfica.** Texto y zoom al 150 % no deben desbordar.

## Tipografía

- Única familia: **Archivo** (variable 100–900), autoalojada en `/fonts` con
  `font-display: swap` y preload de los subsets latin + latin-ext.
- Titulares con tracking negativo; etiquetas en mayúsculas espaciadas
  (`.kicker`: 11px, peso 700, `letter-spacing: .22em`).
- Escala tipográfica expuesta en `:root` (`--text-xs` … `--text-7xl`).

## Color (tokens `:root`)

| Token | Valor | Uso |
|---|---|---|
| `--background` | `#f3f1ec` | lienzo cálido "papel" |
| `--foreground` | `#171717` | texto y `btn-solid` |
| `--surface` | `#ffffff` | paneles/tarjetas |
| `--primary` | `#171717` | bandas invertidas, header sólido |
| `--primary-foreground` | `#f6f5f1` | texto sobre primario |
| `--secondary` / `--muted` | `#e7e4dc` / `#dedbd2` | bandas alternas |
| `--muted-foreground` | `#57544d` | texto secundario |
| `--accent` | `#f25623` | acento de marca (sobre fondos oscuros) |
| `--accent-deep` | `#a53a0c` | acento AA 4.5:1 sobre fondos claros |
| `--accent-soft` | `#f9e5dc` | fondo de `badge-accent` |
| `--border` | `#d9d5ca` | bordes |
| `--success` / `--success-soft` | `#116b32` / `#e7f1e9` | estados OK |

Los tokens de color se exponen a Tailwind vía `@theme inline` (`--color-*`), por lo
que se usan como utilidades (`bg-primary`, `text-accent-deep`, `border-border`…).

Regla de contraste: texto pequeño sobre claro → `--accent-deep`; sobre oscuro → `--accent`.

## Espaciado, radios y sombras

- Escala de espaciado alineada con Tailwind (`--spacing-0..32`).
- `--radius: 0.125rem` (2px) — lenguaje recto y técnico.
- `--shadow-sm..xl` para elevaciones puntuales (header al hacer scroll, overlays).

## Motion

- Duraciones: `--duration-fast` 200ms · `--duration-normal` 300ms · `--duration-slow` 500ms.
- Curvas: `--ease-out-quad`, `--ease-out-cubic`.
- Patrones: underline de nav (`scale-x` en `after`), morph ☰↔✕, `.media-zoom`
  (`scale(1.035)` en 0.7s), transición de color/`translateY(1px)` en botones.

## Componentes (capa `@layer components`)

- `.wrap` — contenedor editorial (máx. 88rem, gutter 1.25/2/3rem por breakpoint).
- `.kicker` — micro-etiqueta de sección.
- `.btn` + variantes `.btn-solid`, `.btn-accent`, `.btn-outline`, tamaño `.btn-sm`.
- `.field` / `.field-label` / `.field-joined` — formularios (incluye `select` con chevron SVG).
- `.badge` + `.badge-ok`, `.badge-neutral`, `.badge-accent`, `.badge-dark`.
- `.panel` — superficie clara con borde.
- `.media-zoom` — recorte + zoom sutil de imagen.

## Accesibilidad (reglas del sistema)

- `:focus-visible` global: `outline: 2px solid var(--accent-deep); offset: 2px`.
- `prefers-reduced-motion: reduce` fuerza duraciones ~0 y desactiva scroll suave.
- `body { overflow-wrap: anywhere }` para zoom 150 %.
- Los `a` heredan color dentro de `@layer base` para no pisar utilidades
  `text-accent`/`text-accent-deep`.

## Do / Don't

- **Do**: reutilizar `.btn*`, `.field`, `.badge*`, `.panel`; usar tokens `--color-*`;
  añadir `aria-label` a botones icono; respetar reduced-motion.
- **Don't**: introducir dependencias para animar; duplicar un segundo set de botones;
  fijar `auto-rows` en rejillas con tarjetas de contenido variable; usar `--accent`
  para texto pequeño sobre fondo claro.
