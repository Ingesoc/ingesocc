# Sistema de diseño — Ingesocc

Fecha: 2026-10-14 · Fuente única: `src/styles.css` (Tailwind v4, `@import 'tailwindcss'`).

Los tokens viven en `:root` y se exponen a Tailwind vía `@theme inline`
(`--color-*`, `--shadow-elevation-*`, `--text-display-*`). Contraste WCAG verificado.

## Principios

1. La foto y el negro mandan. El 80 % usa neutros cálidos y fotografía de obra; el naranja es solo acento (CTA, estados, detalles), nunca fondo dominante.
2. Un solo vocabulario para público y panel: mismos botones, campos, badges y contenedores.
3. Movimiento con intención y anulable. Respeta `prefers-reduced-motion` (Fase 04).
4. Tolerancia tipográfica. Texto y zoom al 150 % sin desbordar.

## Tipografía

- Archivo (variable 100–900), autoalojada con `font-display: swap`, subsets latin+latin-ext.
- Tracking negativo en titulares; `.kicker` con `letter-spacing: .22em`.
- Escala fluida display `--text-display-1…4`, `--leading-*`, `--tracking-display`.
- Ancho lectura `--measure: 68ch`. `h1–h3 { text-wrap: balance }`, `p { text-wrap: pretty }`.

## Color (tokens)

### Base
| Token | Valor | Uso |
|---|---|---|
| `--ink` | `#171717` | núcleo oscuro |
| `--background` | `#f3f1ec` | lienzo cálido |
| `--foreground` | `#171717` | texto principal |
| `--muted-foreground` | `#57544d` | texto secundario (AA 7.55:1 sobre blanco) |
| `--on-dark-muted` | `#b9b4a8` | texto sobre oscuro (AA 8.67:1) |
| `--border` | `#d9d5ca` | bordes finos 1px |

### Superficies
| Token | Valor | Uso |
|---|---|---|
| `--surface` | `#ffffff` | paneles/tarjetas |
| `--surface-raised` | `#ffffff` | flotantes |
| `--surface-inverse` | `#171717` | bandas invertidas |
| `--primary` / `--primary-foreground` | `#171717` / `#f6f5f1` | bandas y header |
| `--secondary` / `--muted` | `#e7e4dc` / `#dedbd2` | bandas alternas |

### Marca
| Token | Valor | Uso |
|---|---|---|
| `--accent` | `#f25623` | acento/superficie grande o sobre oscuro (3.43:1 sobre blanco; no texto pequeño) |
| `--accent-deep` | `#a53a0c` | texto/enlace sobre claro (AA 6.54:1) |
| `--accent-soft` | `#f9e5dc` | fondo `badge-accent` |

### Estado (AA sobre `*-soft` y sobre blanco)
| Token | Valor | `-soft` | Uso |
|---|---|---|---|
| `--success` | `#116b32` | `#e7f1e9` | OK |
| `--warning` | `#8a4b00` | `#fdf0dc` | advertencia |
| `--error` | `#b3261e` | `#fbe3e1` | error |
| `--info` | `#1f4e79` | `#e4eef6` | información |

Estado nunca solo por color: texto e icono.

### Neutros
`--neutral-50` (#faf9f6) … `--neutral-950` (#171717).

## Espaciado, contenedor, radios y elevación
- Escala Tailwind v4; `.wrap` usa `--content-max` 88rem y `--gutter` 1.25/2/3rem.
- `--radius: 0.125rem` (2px).
- Elevación 3 niveles `--elevation-1/2/3` (utilidades `shadow-elevation-1/2/3`).

## Estados (§3.4)
- `:focus-visible`: 2px `--accent-deep`, offset 2px, radius `--radius`.
- `hover/active/disabled/loading` según componentes; único bucle permitido: spinner de loading.
- Estados acompañados de texto e icono.

## Motion (Fase 04)
- Tokens: `--motion-fast/150`, `--motion-base/300`, `--motion-slow/600`, `--motion-hero/900`, `--ease-out`, `--ease-in-out`, `--ease-spring-soft`, `--motion-stagger/70`, `--motion-distance/20`, `--motion-scale-hover/1.04`.
- Componentes: `.btn`, `.field`, `.media-zoom` migrados a tokens.
- `prefers-reduced-motion` anula animaciones; `withViewTransitions()` con CSS seguro.
- Directivas: `appReveal`, `appCounter`, `appIconMotion`. Componente: `app-morph-icon`.

## Componentes (capa `@layer components`)
- `.wrap`, `.kicker`, `.btn*`, `.field*`, `.badge*`, `.panel`, `.media-zoom`.

## Componentes transversales (Fase 04)
| Componente | Ubicación | API | Estados accesibles | Notas |
|---|---|---|---|---|
| `appReveal` | `src/app/shared/icons/reveal.directive.ts` | `revealIndex` (int, 0), `revealDelay` (ms), `revealOnce` (bool, true) | Visible sin JS; respeta `prefers-reduced-motion` | `opacity`+`translateY` con `--motion-slow`; stagger `--motion-stagger`. |
| `appCounter` | `src/app/shared/icons/counter.directive.ts` | `appCounter` (number), `counterDuration` (ms, 1400), `counterSuffix`, `counterPrefix` | Valor final estable; reducido → valor final | rAF, formato `es-CO`, números tabulares. |
| `appIconMotion` | `src/app/shared/icons/icon-motion.directive.ts` | `appIconMotion` (`nudge-x`\|`nudge-up`\|`pop`\|`rotate`\|`shake`\|`pulse`\|`draw`), `iconTrigger` (`hover`\|`focus`\|`parent`\|`inview`) | Respeta `prefers-reduced-motion`; decorativos con `aria-hidden="true"` | Solo acciones/estados; `trigger: parent` anima desde tarjeta/botón. |
| `app-morph-icon` | `src/app/core/morph-icon.component.ts` | `icon` (path d), `reducedMotion` (`user`\|`always`\|`never`) | Respeta `prefers-reduced-motion` | Morph Menu↔X (morphicons/dom), trazados alineados a Lucide 24×24. |

## Accesibilidad (reglas del sistema)
- `:focus-visible` global: outline 2px `--accent-deep`, offset 2px, radius `--radius`.
- `prefers-reduced-motion: reduce`: desactiva efectos.
- `body { overflow-wrap: anywhere }` para zoom 150 %.
- `a` hereda color (no pisar utilidades).

## Do / Don't
- Do: reutilizar `.btn*`, `.field`, `.badge*`, `.panel`; usar tokens `--color-*`; `aria-label` a botones icono; respetar reduced-motion.
- Don't: dependencias para animar; segundo set de botones; `auto-rows` fijo con contenido variable; usar `--accent` para texto pequeño sobre claro (usar `--accent-deep`).

## Primitivos compartidos (Fase 05)

Los componentes y clases compartidos permiten unificar patrones repetidos sin regresiones.

### CSS compartido (añadido)

| Clase | Propósito | Notas |
|---|---|---|
| .alert, .alert-error, .alert-success | Banners de estado | Usa tokens de estado (--error-soft, --success-soft, etc.) |
| .field-error, .field-help | Mensajes bajo campos | Texto claro y legible |
| .empty-state | Estado vacío | Centrado, con borde y texto secundario |
| .skeleton | Placeholder de carga genérico | Usa nimation: pulse (ya definida) |
| .chip, .chip-active | Filtros | Altura mínima 44x44 para accesibilidad táctil |
| .divider-blueprint, .divider-blueprint-vertical | Separadores blueprint | Usa --foreground |

### Componentes

| Componente | Ubicación | API | Estados accesibles | Notas |
|---|---|---|---|---|
| pp-section-heading | src/app/shared/components/section-heading.component.ts | eyebrow, 	itle, description, lign (left\|center), id | Usa .kicker; respeta jerarquía | Unifica patrón kicker + h2 (+p) |
| pp-filter-chip | src/app/shared/components/filter-chip.component.ts | ctive, label, riaLabel | ria-pressed; altura 44x44 | Emite clicked |
| pp-lightbox | src/app/shared/components/lightbox.component.ts | images (LightboxImage[]), openIndex | Diálogo con ole="dialog" ria-modal, Escape/←/→, click fuera cierra, bloqueo de scroll, focus inicial | Acepta {url\|src, alt\|title, title?, description?, category?}; calcula posición interna |

### Directivas existentes (Fase 04, sin uso forzado)

ppReveal y ppCounter existen en src/app/shared/icons/ pero aún no se adoptan en plantillas (creadas en Fase 04; adopción en fases posteriores).

### Notas de adopción

- AppSkeletonComponent existe en src/app/core/ pero no se usa actualmente; se mantiene para adopción incremental.
- La adopción en esta fase es mínima (solo se usa SectionHeadingComponent en contact.component.html y se refactoriza el lightbox de project-detail para usar el componente compartido).
