# Lenguaje de movimiento — INGESOCC S.A.S.

Fecha: 2026-10-14 · Fase 02 (alineado Fase 04)

## 1. Estética

Movimiento mínimo, con propósito, sin sobrecarga. Inspirado en movimientos de piezas constructivas y arquitectura de precisión.

- **Objetivo:** comunicar estado, navegación y énfasis, no distracción.
- **Velocidad:** microinteracciones de 120–200 ms; revelados moderados; hero reservado a < 900 ms.
- **Masa y offset:** desplazamientos ≤ 20 px; siempre `opacity` + `transform`.
- **Sobriedad:** sin 3D, partículas, morphing de personajes ni vídeo generativo de fondo.

## 2. Tokens de movimiento

Los tokens se centralizan en `@theme` / `:root` de `src/styles.css` (Fase 04). Nombres y valores canónicos del plan (§4.1).

| Token (canónico, Fase 04) | Valor | Uso | Token actual |
|---|---|---|---|
| `--motion-fast` | 150 ms | Microinteracciones (hover de iconos, underline, links, botones). | `--duration-fast: 200ms` |
| `--motion-base` | 300 ms | Cambios de componente (chip, menú móvil, lightbox). | `--duration-normal: 300ms` |
| `--motion-slow` | 600 ms | Entradas de sección, revelado de foto. | `--duration-slow: 500ms` |
| `--motion-hero` | 900 ms | Solo hero/caso de estudio, si se justifica. | — |
| `--ease-out` | cubic-bezier(.22, 1, .36, 1) | Entradas y casi todo el sistema. | `--ease-out-quad` / `--ease-out-cubic` |
| `--ease-in-out` | cubic-bezier(.65, 0, .35, 1) | Movimientos de ida y vuelta. | — |
| `--ease-spring-soft` | cubic-bezier(0.34, 1.56, 0.64, 1) | Entrada del hero (única, enfática). | — |
| `--motion-stagger` | 60–90 ms | Retardo entre ítems de un grupo revelado (máx. 8; el resto entra junto). | — |
| `--motion-distance` | 16–24 px (nunca > 40 px) | Desplazamiento de entrada (siempre con opacidad). | — |
| `--motion-scale-hover` | 1.04 | Zoom editorial de imagen (`.media-zoom`). | 1.035 (a 0.7 s) |

Regla: microinteracciones `--motion-fast`; cambios `--motion-base`; revelados `--motion-slow`; hero hasta `--motion-hero`.

## 3. Contrato de movimiento (obligatorio)

1. Bajo `prefers-reduced-motion: reduce`, todo se anula.
2. Solo se animan `transform` y `opacity` (excepciones justificadas: `clip-path`/`stroke-dashoffset` puntuales).
3. Sin animaciones que retrasen el hero ni oculten foco, errores o botones.
4. Sin scroll hijacking; sin parallax obligatorio en móvil.
5. Movimiento una vez al entrar en viewport, no en bucle.
6. Si el JS falla, el contenido se muestra igualmente.
7. En móvil, efectos más discretos.

## 4. Referencia → implementación web

| Referencia (prompt-motion) | Decisión | Implementación planeada | Componente / ruta | Límite |
|---|---|---|---|---|
| Revelado progresivo de fotografías | Adoptar con moderación | `appReveal` (IntersectionObserver): opacity 0→1 + `translateY(var(--motion-distance))`, `--motion-slow`, una vez | Galería, cards destacadas, hero secundario | Una animación por entrada; contenido visible si falla JS |
| Aparición escalonada de grupos | Adoptar con moderación | `appReveal` + `revealIndex`: delay = index*--motion-stagger (máx. 8) | Listas de servicios/proyectos | Máx. ~8 ítems |
| Kinetic typography | Adaptar mínimo | Hero: opacity+`translateY` con `--ease-spring-soft` (fallback `--ease-out`) | Home (h1) | No letra por letra |
| Desplazamiento / parallax | Opcional y mínimo | `translateY` muy leve solo desktop; deshabilitado en móvil/reduced-motion | Home | Sin hijack |
| Transiciones entre estados | Adoptar | `--motion-fast` en `background`/color/border/transform | Botones, nav, chips, menú móvil | — |
| Iconos animados | Adoptar selectivo | `appIconMotion` (nudge-x,nudge-up,pop,rotate,shake,pulse,draw); `iconTrigger='parent'` activa desde tarjeta/botón | CTA, contactos, mobile bar | Solo si comunica acción/estado |
| Contadores | Adoptar | `appCounter` (rAF); reduced-motion → valor final | Bloques de cifras | Solo cifras reales |
| View Transitions API | Adopción cautelosa | `withViewTransitions()` con CSS reducido para reduced-motion | Navegación | — |
| 3D/partículas/morphing/showreels | Descartar | — | — | No permitido |
| Animación en bucle | Descartar | — | — | Única: spinner de loading real |

## 5. Inventario de movimiento existente (a conservar/ajustar)

| Elemento | Actual | Ajuste Fase 04 |
|---|---|---|
| Underline de nav en hover | transición de color | Estandarizar a `--motion-fast` |
| Morph ☰ ↔ ✕ (morph-icon.component) | cambio de icono | Mantener; alinear a `--motion-base` |
| `.media-zoom` | scale(1.035) a 0.7 s | Reducir a `--motion-slow` (600 ms) y usar `var(--motion-scale-hover)` |
| Botones `.btn` | `transition ... 0.2s ease` | Migrar a tokens canónicos |
