# Sistema de diseño — Ingesocc

Fecha: 2026-10-14 · Fuente única: `src/styles.css` (Tailwind v4, `@import 'tailwindcss'`)

Los tokens viven en `:root` y se exponen a Tailwind vía `@theme inline`
(`--color-*`, `--shadow-elevation-*`, `--text-display-*`), por lo que se usan como
utilidades (`bg-surface`, `text-accent-deep`, `shadow-elevation-2`, `text-display-2`).
Contraste WCAG verificado (ver §Color y `docs/design/decisions.md`).

## Principios

1. **La foto y el negro mandan.** El 80 % de la interfaz usa neutros cálidos y
   fotografía de obra; el naranja es solo acento (CTA, estados, detalles), nunca
   fondo dominante.
2. **Un solo vocabulario** para público y panel: mismos botones, campos, badges y
   contenedores.
3. **Movimiento con intención y anulable.** Todo efecto respeta
   `prefers-reduced-motion` (tokens de movimiento en Fase 04).
4. **Tolerancia tipográfica.** Texto y zoom al 150 % no deben desbordar.

## Tipografía

- Única familia: **Archivo** (variable 100–900), autoalojada en `/fonts` con
  `font-display: swap` y preload de los subsets latin + latin-ext.
- Titulares con tracking negativo (`--tracking-display: -0.02em`); etiquetas en
  mayúsculas espaciadas (`.kicker`: 11px, peso 700, `letter-spacing: .22em`).
- Escala **fluida** con `clamp()` para display (en `@theme`):
  `--text-display-1` … `--text-display-4`, con `--leading-display/-heading/-body`.
  Se adopta por componente en las fases de páginas.
- Ancho de lectura: `--measure: 68ch` (65–75 ch). Base:
  `h1–h3 { text-wrap: balance }`, `p { text-wrap: pretty }`.

## Color (tokens `:root`)

### Base
| Token | Valor | Uso |
|---|---|---|
| `--ink` | `#171717` | núcleo oscuro (texto, bandas) |
| `--background` | `#f3f1ec` | lienzo cálido "papel" |
| `--foreground` | `#171717` | texto principal |
| `--muted-foreground` | `#57544d` | texto secundario · AA 7.55:1 sobre blanco |
| `--on-dark-muted` | `#b9b4a8` | texto bajo prioridad sobre oscuro · AA 8.67:1 |
| `--border` | `#d9d5ca` | bordes finos 1 px |

### Superficies
| Token | Valor | Uso |
|---|---|---|
| `--surface` | `#ffffff` | paneles/tarjetas |
| `--surface-raised` | `#ffffff` | flotantes (popover, menú, modal) |
| `--surface-inverse` | `#171717` | bandas invertidas |
| `--primary` / `--primary-foreground` | `#171717` / `#f6f5f1` | bandas y header sólidos |
| `--secondary` / `--muted` | `#e7e4dc` / `#dedbd2` | bandas alternas |

### Marca
| Token | Valor | Uso |
|---|---|---|
| `--accent` | `#f25623` | acento de marca (superficies/acento grande; sobre oscuro) |
| `--accent-deep` | `#a53a0c` | texto/enlace sobre claro · AA 6.54:1 |
| `--accent-soft` | `#f9e5dc` | fondo de `badge-accent` |

`#f25623` sobre blanco = **3.43:1**: nunca como texto pequeño. Usar `--accent-deep`.

### Estado (texto AA sobre su `*-soft` y sobre blanco)
| Token | Valor | `-soft` | Uso |
|---|---|---|---|
| `--success` | `#116b32` | `#e7f1e9` | OK (AA 6.62:1) |
| `--warning` | `#8a4b00` | `#fdf0dc` | advertencia (AA 6.80:1) |
| `--error` | `#b3261e` | `#fbe3e1` | error (AA 6.54:1) |
| `--info` | `#1f4e79` | `#e4eef6` | información (AA 8.66:1) |

El estado **nunca** se comunica solo por color: siempre texto e icono.

### Neutros (`--neutral-50` … `--neutral-950`)
Escala cálida derivada del lenguaje existente (50 `#faf9f6` → 950 `#171717`).
Disponible como `bg-neutral-*`/`text-neutral-*`. Sin paleta arcoíris ni colores de
estado como decoración.

## Espaciado, contenedor, radios y elevación

- Escala de espaciado: la de Tailwind v4 (base `--spacing: 0.25rem`). Los tokens
  `--spacing-*`, `--text-*` y `--shadow-*` que `:root` duplicaba se eliminaron (eran
  código muerto; ver hallazgo #17 en `docs/ui-audit.md`).
- Contenedor: `.wrap` usa `--content-max` (88rem) y `--gutter`
  (1.25 / 2 / 3rem por breakpoint, vía `@media` sobre `:root`).
- `--radius: 0.125rem` (2px) — lenguaje recto y técnico; usado por `.btn` y `.field`.
- Elevación en 3 niveles: `--elevation-1/2/3` (utilidades `shadow-elevation-1/2/3`).
  Sombras suaves de baja opacidad; no toda tarjeta necesita sombra.

## Estados (§3.4)

- **focus**: `:focus-visible` global → `outline: 2px solid var(--accent-deep)`,
  `offset: 2px`, `border-radius: var(--radius)`.
- **hover / active / disabled / loading**: patrones de componentes existentes
  (`.btn`, `.field`, chips) sobre los tokens de color; el spinner en `loading` es la
  única animación en bucle permitida.
- **success / error / warning / info**: tokens semánticos de estado (§Color), con
  texto e icono además del color.

## Motion

- Duraciones (Fase 03): `--duration-fast` 200ms · `--duration-normal` 300ms ·
  `--duration-slow` 500ms. La **Fase 04** migra a los tokens canónicos
  `--motion-fast/base/slow/hero` (ver `docs/design/motion-language.md`).
- Curvas: `--ease-out-quad`, `--ease-out-cubic`.
- Patrones: underline de nav (`scale-x` en `after`), morph ☰↔✕, `.media-zoom`
  (`scale(1.035)` en 0.7s), transición de color/`translateY(1px)` en botones.

## Componentes (capa `@layer components`)

- `.wrap` — contenedor editorial (tokens `--content-max` / `--gutter`).
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
  para texto pequeño sobre fondo claro (usar `--accent-deep`).
