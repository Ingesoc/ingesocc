# Lenguaje de movimiento — INGESOCC S.A.S.

Fecha: 2026-10-14 · Fase 02 · Rama: `feature/redesign`

> Referencia: `https://prompt-motion.com/` (videos + prompts; **no** componentes web).
> Este documento define **tokens de movimiento** y una tabla
> **referencia → implementación web**. La implementación de tokens y componentes es de
> las Fases 03/04; aquí se decide y se fijan límites.

## 1. Estética elegida

**Editorial, arquitectónica, contenida y rápida.** El movimiento explica y da ritmo,
nunca espectáculo. Preferencia por `transform` y `opacity`; sin bucles permanentes;
sin 3D, partículas, morphing de personajes ni vídeo generativo de fondo.

## 2. Tokens de movimiento

Los tokens se centralizan en `@theme` de `src/styles.css` en la **Fase 04** (no en la
Fase 03). Nombres y valores **canónicos del plan** (§4.1); la columna "actual" refleja
lo existente hoy (Fase 03), que se migrará al cerrar la Fase 04.

| Token (canónico, Fase 04) | Valor | Uso | Token actual |
|---|---|---|---|
| `--motion-fast` | 150 ms | Microinteracciones (hover de iconos, underline, links, botones). | `--duration-fast: 200ms` |
| `--motion-base` | 300 ms | Cambios de componente (chip, menú móvil, lightbox). | `--duration-normal: 300ms` |
| `--motion-slow` | 600 ms | Entradas de sección, revelado de foto. | `--duration-slow: 500ms` |
| `--motion-hero` | 900 ms | Solo hero/caso de estudio, si se justifica. | — |
| `--ease-out` | `cubic-bezier(.22, 1, .36, 1)` | Entradas y casi todo el sistema. | `--ease-out-quad` / `--ease-out-cubic` |
| `--ease-in-out` | `cubic-bezier(.65, 0, .35, 1)` | Movimientos de ida y vuelta. | — |
| `--ease-spring-soft` | `linear(...)` (aprox.; fallback `--ease-out`) | Entrada del hero (única, enfática). | — |
| `--motion-stagger` | 60–90 ms | Retardo entre ítems de un grupo revelado (máx. 8; el resto entra junto). | — |
| `--motion-distance` | 16–24 px (nunca > 40 px) | Desplazamiento de entrada (siempre con opacidad). | — |
| `--motion-scale-hover` | `1.035` | Zoom editorial de imagen (`.media-zoom`). | `1.035` (a 0.7 s) |

**Regla de tiempos:** microinteracciones **150 ms** (`--motion-fast`); cambios de
componentes **300 ms** (`--motion-base`); revelados de sección **600 ms** (`--motion-slow`);
hero hasta **900 ms** (`--motion-hero`). Revisar si el rendimiento lo exige.

## 3. Contrato de movimiento (obligatorio)

1. Bajo `prefers-reduced-motion: reduce`, **todo se anula** (contenido visible sin animación).
   Regla ya presente en `styles.css` (media query global).
2. Solo se animan `transform` y `opacity` (excepciones justificadas: máscara/clip).
3. Sin animaciones que **retrasen el hero** ni oculten foco, errores o botones.
4. Sin scroll hijacking; sin parallax obligatorio en móvil.
5. Movimiento **una vez** al entrar en viewport, no en bucle.
6. Si el JS falla, el contenido se muestra igualmente (progressive enhancement).
7. En móvil, efectos más discretos (menos distancia y sin parallax).

## 4. Referencia → implementación web

| Referencia (prompt-motion) | Decisión | Implementación planeada | Componente / ruta | Límite |
|---|---|---|---|---|
| Revelado progresivo de fotografías | Adoptar con moderación | `Reveal` (directiva/`IntersectionObserver`): `opacity 0→1` + `translateY(var(--motion-distance))`, `--motion-slow`, una vez | Galería, cards destacadas, hero secundario | Una animación por entrada; contenido visible si falla el JS |
| Aparición escalonada de grupos | Adoptar con moderación | `transition-delay: n * var(--motion-stagger)` en hijos | Listas de servicios/proyectos, cifras | Máx. ~5 ítems; evitar cascadas largas |
| Kinetic typography | Adaptar mínimo | Titular del hero: entrada `opacity`+`translateY` con `--ease-spring-soft` (fallback `--ease-out`) | Home (h1) | No animar letra por letra en toda la web |
| Desplazamiento / parallax | Opcional y mínimo | `translateY` muy leve de la imagen de fondo del hero (solo desktop) | Home / detalle proyecto | Sin hijack; sin parallax en móvil ni con reduced-motion |
| Transiciones entre estados | Adoptar | `160–220 ms` en `background/color/border/transform` | Botones, nav (underline), chips, menú móvil, lightbox | No interrumpir navegación, validación ni lectura |
| Cámara 3D, partículas, morphing, showreels | Descartar global | — | — | Sin motor 3D, canvas pesado ni vídeo generativo de fondo |
| Animación en bucle | Descartar por defecto | — | — | Excepción única: spinner mientras `loading` real |

## 5. Inventario de movimiento existente (a conservar/ajustar)

| Elemento | Actual | Ajuste Fase 03/04 |
|---|---|---|
| Underline de nav en hover | transición de color | Estandarizar a `--motion-fast` |
| Morph ☰ ↔ ✕ (`morph-icon.component`) | cambio de icono | Mantener; alinear a `--motion-base` |
| `.media-zoom` | `scale(1.035)` a `0.7 s` | Reducir a `--motion-slow` (600 ms) |
| Botones `.btn` | `transition ... 0.2s ease` | Migrar a tokens de duración/easing |
| `prefers-reduced-motion` global | presente | Mantener como contrato |
