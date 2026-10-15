# Auditoría de referencias de diseño — Ingesocc

Fecha: 2026-10-14 · Fase 02 · Rama: `feature/redesign`

Referencias objetivo: [ui.live](https://ui.live/), [prompt-motion.com](https://prompt-motion.com/),
[itshover.com](https://www.itshover.com/).

Documentos derivados: `docs/design/moodboard.md`, `docs/design/motion-language.md`,
`docs/design/icons.md`.

## Método y límites

- Referencias consultadas vía `WebFetch`.
- **El modelo no puede leer imágenes**: no se analizaron shots ni capturas; se extraen
  **principios** (composición, jerarquía, estados, movimiento), no se copian piezas.
- Licencia de `itshover` verificada vía API de GitHub: **Apache-2.0** (usable/modificable
  con atribución).
- No se rastreó el sitio de la obra de referencia (`laholanda.ingesocc.com`); todo se
  apoya en activos y datos reales del repositorio/CMS.

## Qué aporta cada referencia

- **ui.live** — galería de *design drops*: mosaico editorial de alta densidad donde la
  pieza destaca por composición y jerarquía tipográfica, no por ornamentación.
- **prompt-motion.com** — biblioteca de motion: el movimiento se documenta y se elige
  como un componente más (tokens), no se improvisa pieza a pieza.
- **itshover.com** — iconos "que se mueven con intención": cada icono comunica una acción.

## Matriz de decisiones

| Recurso | Patrón evaluado | Elegido / Adaptado / Descartado | Página o componente | Razón de negocio/UX | Coste/riesgo técnico | Evidencia o prueba |
|---|---|---|---|---|---|---|
| ui.live | Mosaico editorial (una pieza protagonista + apoyo) | Elegido | Home (destacados), `/proyectos` | Prioriza la obra real y da jerarquía sin ruido | Bajo: se reutiliza la rejilla y fotos actuales | `docs/design/moodboard.md` §2/3; `docs/design/baseline/screenshots/` |
| ui.live | Cards editoriales (imagen + título + categoría) | Elegido | `app-project-card`, `app-service-card` | Escaneabilidad del portafolio | Bajo: ya existen, se unifican hover/foco | Home, `/servicios`, `/proyectos` |
| ui.live | Nav clara + estado activo + menú móvil usable | Elegido | `site-header` | Orientación y acceso en móvil | Bajo: ya corregido (a11y menú) | `e2e/public-flows.spec.ts` |
| ui.live | Chips de filtro con estado activo | Adaptado | `/proyectos` | Filtrar sin ambigüedad; requiere ≥44 px (#15) | Bajo/medio: ampliar objetivo táctil | `docs/ui-audit.md` #15 |
| ui.live | Tipografía con escala/jerarquía | Elegido | Global | Lectura corporativa | Bajo: `Archivo` ya cargada | `src/styles.css` |
| ui.live | Dashboard / charts / chat | Descartado (en público) | — | No aporta a una constructora; evita estética B2B | Nulo | `docs/design/moodboard.md` §3 |
| ui.live | Glassmorphism / partículas | Descartado | — | Rompe sobriedad y contraste | Nulo | `docs/design/moodboard.md` §3 |
| prompt-motion | Revelado progresivo de fotos | Adaptado | Galería, cards destacadas | Ritmo editorial sin coste perceptivo | Medio: `Reveal` + `IntersectionObserver` (Fase 04) | `docs/design/motion-language.md` §4 |
| prompt-motion | Aparición escalonada de grupos | Adaptado | Listas de servicios/proyectos, cifras | Ordena la lectura | Bajo: `transition-delay` por token | `docs/design/motion-language.md` §4 |
| prompt-motion | Kinetic typography | Adaptado (mínimo) | Hero (h1) | Entrada suave del titular, sin protagonismo | Bajo/medio | `docs/design/motion-language.md` §4 |
| prompt-motion | Parallax | Condicional (desktop) | Hero fotográfico | Profundidad muy leve; opcional | Medio: omitir en móvil/reduced-motion | `docs/design/motion-language.md` §3 |
| prompt-motion | Transiciones entre estados | Elegido | Botones, nav, chips, menú, lightbox | Previsibilidad y feedback | Bajo: tokens de duración | `src/styles.css` tokens |
| prompt-motion | 3D / partículas / morphing / showreel | Descartado | — | No se necesita para confiar | Nulo | `docs/design/moodboard.md` §1 |
| prompt-motion | Animación en bucle | Descartado (salvo spinner de `loading`) | Botones con `loading` | Evita movimiento que compita con contenido | Bajo | `docs/design/motion-language.md` §4 |
| itshover | Iconos con movimiento por acción | Adaptado | Menú, CTAs, formulario, galería | Cada icono comunica una acción | Bajo: solo CSS/SVG sobre `@lucide/angular` | `docs/design/icons.md` §6 |
| itshover | Flecha que avanza en hover | Adaptado | CTAs "Ver proyecto" | Affordance de avance | Bajo | `docs/design/icons.md` §6 |
| itshover | Iconos decorativos animados | Descartado | — | Movimiento sin significado distrae | Nulo | `docs/design/moodboard.md` §2 (principio 11) |

## Conclusiones

1. Se adopta el **mosaico editorial** (ui.live), el **movimiento tokenizado y contenido**
   (prompt-motion) y la **iconografía con intención** (itshover), sin copiar piezas.
- 2. **No se introducen dependencias** para replicar las referencias (`itshover` es React;
  se recrea con SVG/CSS sobre Lucide, con atribución si aplicara).
- 3. Las adaptaciones se apoyan en datos y activos reales; no se inventó contenido,
  cifras, testimonios ni capturas.
- 4. Pendiente recomendado: rastrear el sitio de obra de referencia cuando haya acceso de
  red, para contrastar el tono editorial con material real.
