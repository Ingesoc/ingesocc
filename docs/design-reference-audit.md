# Auditoría de referencias de diseño — Ingesocc

Fecha: 2026-10-13 · Rama: `feature/redesign` (rediseño ya integrado en `560f4f0`, `9614d77`)

Referencias objetivo: [ui.live](https://ui.live/), [prompt-motion.com](https://prompt-motion.com/),
[itshover.com](https://www.itshover.com/).

## Método y límites

- Referencias consultadas vía `WebFetch`.
- **Firecrawl no está disponible** en este entorno, por lo que **no se pudo rastrear**
  el sitio de la obra de referencia (`laholanda.ingesocc.com`). Todo lo evaluado se
  apoya en recursos ya presentes en el repositorio (capturas en `test-results/audit/`,
  datos reales seed/CMS) y en medición programática del DOM.
- **El modelo no puede leer imágenes**, así que las capturas de
  `test-results/audit/*.png` no se analizaron visualmente; la geometría se verificó
  con Playwright (ver `docs/visual-qa-report.md`).

## Qué aporta cada referencia

### ui.live — galería de "design drops"
Plataforma de descubrimiento con ranking por tendencia (semana/mes/todas). El patrón
transversal es un **mosaico editorial de alta densidad** donde la pieza destaca por
composición y jerarquía tipográfica, no por ornamentación.

Adaptado a Ingesocc:

- Mosaico del Home (`home.component.html`) con tarjetas `overlay` sobre fotografía
  real de obra y jerarquía tipográfica fuerte (kicker + titular + metadato).
- Rejilla de categorías en `/proyectos` como sistema de filtrado con estado activo
  visible (`aria-pressed`).
- Sin cambios de contenido: se reutiliza la fotografía y los datos reales del CMS.

### prompt-motion.com — biblioteca de motion
Colección de piezas con sus prompts, filtradas por tipo (Product UI, Charts,
Diagrams, Kinetic type, Shapes…). Idea central: **el movimiento se documenta y se
elige como un componente más**, no se improvisa pieza a pieza.

Adaptado a Ingesocc (sin dependencias nuevas):

- Tokens de motion en `styles.css`: `--duration-fast/normal/slow` y
  `--ease-out-quad/cubic`.
- Movimiento discreto y con intención: underline animado del nav, morph ☰↔✕
  (`morph-icon.component`), zoom editorial de imagen (`.media-zoom`, `scale(1.035)`
  a 0.7 s), transiciones de color en botones.
- Regla obligatoria: todo se anula bajo `prefers-reduced-motion: reduce`.

### itshover.com — iconos animados "motion-first"
Librería open source de iconos SVG editables con movimiento integrado ("icons that
move with intent"). El valor está en que **cada icono comunica una acción**.

Adaptado a Ingesocc (traducido a SVG/CSS, sin portar React):

- Iconos Lucide (`@lucide/angular`) + el morph icon propio para el menú.
- El pie de las tarjetas y CTAs combinan icono + texto en mayúsculas espaciadas;
  el detalle de proyecto usa `ArrowUpRight` como affordance de navegación.
- Microinteracción de flecha en hover (`translate` sutil) coherente con el
  vocabulario existente, y no iconos meramente decorativos.

## Conclusiones para el sistema

1. El rediseño vigente **ya fusiona** los tres aportes: mosaico editorial (ui.live),
   motion tokenizado y discreto (prompt-motion) e iconografía con intención (itshover).
2. No se introdujeron dependencias para replicar las referencias.
3. Las adaptaciones se apoyan en datos y activos reales; no se inventó contenido,
   cifras, testimonios ni capturas.
4. Pendiente recomendado: rastreo del sitio de obra de referencia cuando haya acceso
   de red (Firecrawl o curl) para contrastar el tono editorial con el material real.
