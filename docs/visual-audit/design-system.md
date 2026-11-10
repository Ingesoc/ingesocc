# Sistema de diseño y responsive (estado actual)

Fuente de verdad: `src/styles.css` (Tailwind v4 con `@source "./src"`), plantillas standalone.
No hay `tailwind.config.js`; los tokens se declaran en `@theme inline` y `:root`.

## Color

| Token | Valor | Uso |
| --- | --- | --- |
| `--primary` | `#171717` | bandas oscuras, header/footer, texto fuerte |
| `--background` | `#f3f1ec` | lienzo cálido |
| `--surface` | `#ffffff` | paneles/tarjetas |
| `--secondary` | `#e7e4dc` | bandas alternas |
| `--accent` | `#f25623` | CTA/acento (no texto pequeño sobre claro) |
| `--accent-deep` | `#a53a0c` | texto naranja AA sobre claro |
| `--accent-soft` | `#f9e5dc` | fondos de badge |
| `--muted-foreground` | `#57544d` | texto secundario (AA) |
| `--on-dark-muted` | `#b9b4a8` | texto secundario sobre oscuro |
| `--border` | `#d9d5ca` | bordes finos |
| Estado | `success #116b32`, `warning #8a4b00`, `error #b3261e`, `info #1f4e79` | AA sobre su `*-soft` |

Regla vigente: `--accent` (#f25623) sobre blanco = 3,43:1, **solo** superficie/acento grande;
texto pequeño naranja siempre `--accent-deep`.

## Tipografía

- Familia única: **Archivo** variable (100–900), autoalojada en `/fonts`, `font-display: swap`,
  subset latin + latin-ext.
- Escala display centralizada pero **poco usada** en componentes:
  `--text-display-1: clamp(2.75rem, 1.6rem + 5.2vw, 6rem)` … `--text-display-4`.
- En la práctica las páginas usan utilidades fijas: `text-4xl` (36 px), `text-5xl` (48 px),
  `text-7xl` (72 px), `text-[2.7rem]` (hero), con `md:` para escalar.
- `text-wrap: balance` en `h1–h3` y `pretty` en `p` (`styles.css:252-257`).
- `overflow-wrap: anywhere` en `body` (`styles.css:246-248`) para emails/slugs/cifras.

Oportunidad: adoptar `--text-display-*`/`clamp()` en hero y titulares para reducir los saltos
`text-4xl → md:text-6xl` y bajar la altura en 320 px sin tocar desktop.

## Layout y espaciado

| Token | Valor | Uso |
| --- | --- | --- |
| `--content-max` | `88rem` (1408 px) | `.wrap` |
| `--gutter` | `1.25rem` → `2rem` (≥640) → `3rem` (≥1024) | `.wrap` |
| `--measure` | `68ch` | lectura (poco usado) |
| `--radius` | `0.125rem` (2 px) | botones, campos, paneles |
| `--elevation-1/2/3` | sombras suaves | utilidades `shadow-elevation-*` |

**No existe un token de ritmo vertical de sección.** Las secciones usan valores sueltos:
`py-16`, `py-20`, `py-24`, `py-32`, `py-36` (96–144 px). En móvil, `py-24` = 192 px por sección.
Esto es la causa medible de VIS-05.

Oportunidad: crear `--section-y: clamp(3rem, 8vw, 9rem)` y una clase `.section` (o
`py-[var(--section-y)]`) para reemplazar los `py-24 md:py-36` repetidos.

## Breakpoints y comportamiento

- Tailwind v4 por defecto: `sm` 640, `md` 768, `lg` 1024, `xl` 1280.
- Header: nav desktop `lg:flex`; botón móvil `lg:hidden`.
- Barra inferior: `lg:hidden`; spacer `lg:hidden`.
- Admin: sidebar `md:flex`; menú móvil del panel `md:hidden`.
- Chips: scroll+snap <768; wrap ≥768 (`styles.css:688-701`).
- Galerías Quiénes Somos: 1 col <640, 2 col ≥640, 3 col ≥768.
- Grid del formulario de contacto: `auto-fit minmax(220px,1fr)` (sin breakpoint explícito).

## Componentes compartidos

| Clase | Archivo | Notas responsive |
| --- | --- | --- |
| `.wrap` | `styles.css:279-284` | max 1408 px + gutters |
| `.kicker` | `:287-295` | 11 px, tracking 0.22em |
| `.btn` / `.btn-solid` / `.btn-accent` / `.btn-outline` / `.btn-sm` | `:298-371` | `min-height: 2.75rem`; `white-space: normal` |
| `.field` / `.field-label` / `.field-error` | `:374-423`, `:732-742` | `min-width: 0`, `width: 100%` |
| `.badge` | `:426-454` | `white-space: nowrap` |
| `.panel` | `:457-460` | superficie + borde |
| `.media-zoom` | `:463-471` | zoom hover 1.04 |
| `.empty-state` | `:619-628` | — |
| `.chip` | `:639-670` | 44×44 mínimo; **sin `max-width`** |
| `.chips-row` | `:673-701` | móvil `flex: 0 0 auto` → chip a `max-content` (VIS-06) |
| `.alert` | `:712-729` | — |
| `.timeline` | `:804-890` | 1 col móvil, alternado ≥768 |
| `.scroll-progress` | `:968-1002` | fixed, oculto con reduced-motion |

## Movimiento

- Tokens en `:root` (`styles.css:97-115`): `--motion-fast 150ms`, `--motion-base 300ms`,
  `--motion-slow 600ms`, `--motion-hero 900ms`, easings `--ease-out`, `--ease-in-out`.
- Solo `transform`/`opacity`; `will-change` únicamente durante la animación
  (`[data-icon-motion].is-animating`, `styles.css:493-495`).
- `prefers-reduced-motion: reduce` desactiva hero, scroll-cue, progreso, timeline y transiciones
  (`styles.css:208-222, 586-615, 771-775, 911-917, 956-965, 998-1002`).
- View Transitions con crossfade 220/260 ms.

## Accesibilidad estructural

- `:focus-visible` global 2 px `--accent-deep` + offset (`styles.css:259-264`).
- Un solo `<main>` por ruta **excepto Home** (VIS-10).
- Menú móvil: `aria-expanded`, `aria-controls`, Esc, bloqueo de scroll; foco inicial y trap
  implementados (VIS-09, `FIXED`).
- Chips con `aria-pressed`; filtros con `aria-live` para el anuncio.
- Lightbox con `role="dialog"`, `aria-modal`, Esc y swipe.

## Brechas del sistema a resolver en las correcciones

1. Ritmo vertical de sección sin token (VIS-05) — `OPEN`.
2. `.chips-row > *` en móvil forzaba `max-content` (VIS-06) — `FIXED`.
3. Altura de la barra inferior duplicada y safe-area inerte (VIS-01) — `FIXED` conservador.
4. Menú móvil sin `overflow-y-auto` ni foco atrapado (VIS-08/09) — `FIXED`.
5. Home con `<main>` anidado y `overflow-hidden` en la raíz (VIS-10) — `FIXED`.
6. Galerías móviles en 1 columna con altura fija (VIS-07) — `FIXED` (2 col × 140 px).
7. `minmax(220px,1fr)` sin `min()`/`minmax(0,1fr)` para paneles estrechos (VIS-03) — `FIXED`.
