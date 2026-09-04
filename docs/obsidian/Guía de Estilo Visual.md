---
title: Guía de Estilo Visual
tags:
  - ingesocc
  - ux
  - diseño
  - tailwind
  - rediseño
fecha: 2026-09-04
estado: activo
---

# Guía de Estilo Visual

Diseño corporativo premium de ingeniería y construcción, rediseñado integralmente
(ver registro completo en [[Auditoría y Correcciones]] nº 21). Principio rector:
**la interfaz desaparece y el contenido manda** — 80% claridad y contenido, 15%
identidad visual, 5% efectos. Fotografía de proyectos protagonista; nada de
gradientes, glassmorphism, sombras pesadas o cards uniformes.

Identidad de marca **inalterable**: `#171717` (negro) y `#f25623` (naranja) se
mantienen; el resto es escala neutral cálida ("papel/obra") construida alrededor.

## Tipografía: Archivo variable (autoalojada)

- Fuente **Archivo variable 100–900** en `public/fonts/` (latin + latin-ext
  woff2, ~35 KB cada una), `font-display: swap`, **preload** en `index.html`.
- Una sola grotesca técnica/editorial para todo el sistema: titulares display
  con tracking negativo (hero de Home a **92 px** en xl), cuerpo legible con
  line-height generoso, labels y `kicker` en mayúsculas espaciadas.
- Sustituye a Arial en público y admin. Fallback: `ui-sans-serif, system-ui`.

## Tokens (Tailwind v4, `src/styles.css`)

| Token | Valor | Uso |
|---|---|---|
| `--background` | `#f3f1ec` | Fondo general "papel" cálido |
| `--foreground` | `#171717` | Texto principal |
| `--surface` | `#ffffff` | Paneles, tarjetas, formularios, tablas |
| `--primary` | `#171717` | CTAs oscuros, héroes, footer |
| `--primary-foreground` | `#f6f5f1` | Texto sobre `--primary` |
| `--secondary` | `#e7e4dc` | Bandas alternas (con texto oscuro) |
| `--muted` / `--muted-foreground` | `#dedbd2` / `#57544d` | Superficies y texto de apoyo |
| `--accent` | **`#f25623`** | **Naranja de marca** (fills, héroes oscuros, chips sobre fotos, indicadores) |
| `--accent-foreground` | `#171717` | Texto sobre `bg-accent` (oscuro, pasa AA) |
| `--accent-deep` | **`#a53a0c`** | **Texto accent sobre fondos claros** (AA 4.5:1) |
| `--accent-soft` | `#f9e5dc` | Fondo suave de chips/badges accent |
| `--border` | `#d9d5ca` | Hairlines y bordes |
| `--success` / `--success-soft` | `#116b32` / `#e7f1e9` | Estados positivos |
| `--radius` | `0.125rem` | Radius mínimo, editorial |

> [!warning] Regla de contraste (crítica)
> `--accent` #f25623 sobre superficies claras da **3.17:1** (falla AA 4.5:1);
> sobre oscuro da **5.23:1** (pasa).
> - **Texto accent pequeño sobre fondo claro** → `text-accent-deep` (#a53a0c:
>   6.05:1 sobre `--background`, 4.86:1 sobre `--secondary`).
> - **`bg-accent` (fill naranja)** con texto claro falla → usar `text-primary`
>   (oscuro), como los demás CTAs.
> - El naranja de marca se conserva donde sí cumple: héroes oscuros, footer,
>   sidebar admin, chips sobre fotos, íconos, `bg-accent`.
> El QA visual ([[Testing]]) verifica el color exacto y el contraste ≥ 4.5:1
> contra el fondo efectivo de cada elemento.

## Vocabulario compartido (`styles.css`)

Clases globales reutilizadas en público **y** admin (misma altura, mismo radius,
misma tipografía, mismos estados — consistencia estricta):

- `.wrap` — container editorial: `max-width` (~1280 px) + padding responsive
  (1.25 rem móvil → 3 rem desktop).
- `.kicker` — label de sección en mayúsculas, espaciado y tracking.
- `.btn` — base de botón (inline-flex, altura y radius fijos, transición
  150–400 ms) + variantes `.btn-solid` (oscuro), `.btn-accent` (naranja con
  texto oscuro), `.btn-outline`, `.btn-sm`; estados `:hover/:active/:disabled`
  y `:focus-visible` en anillo.
- `.field` / `.field-label` / `.field-joined` — sistema único de inputs
  (height, borde, `:hover`, `:focus` con ring accent, placeholder, estados de
  error). Todos los formularios del sitio usan el mismo sistema.
- `.badge` — estados: `.badge-ok` (published/leído), `.badge-neutral` (draft),
  `.badge-accent`, `.badge-dark`. Sin colores arbitrarios por componente.
- `.panel` — superficie `--surface` con hairline para tarjetas/forms admin.
- `.media-zoom` — hover editorial de imágenes (zoom 1.02–1.04 + overlay sutil).

## Composición y componentes (rediseño)

- **Grid**: container único; héroes a sangre con overlay discreto; secciones
  separadas con hairlines, no con cards.
- **Header**: barra editorial compacta (sticky), logo izquierda, nav con
  subrayado animado, CTA outline "Contactar"; **menú móvil fullscreen numerado**
  (01–05). Ver [[Rutas y Navegación]].
- **Footer**: 3 columnas (marca + redes, navegación, contacto con bloques
  editables) + barra legal. Las redes sociales son enlaces de texto elegantes
  (v1.39 de `@lucide/angular` no exporta iconos de marcas).
- **Home**: hero display + banda de stats con hairlines + mosaico editorial
  **alterno** de destacados (bloques apaisado 7×2+5/5 ↔ vertical 4×2×3; resto 1
  → banda 12×2, resto 2 → mitades 6×2) + servicios numerados + CTA final oscuro.
- **Proyectos**: tarjetas **panel** (imagen dominante, metadata debajo,
  hairline, hover editorial) y filtros pill; **detalle** con portada a sangre,
  ficha lateral y **galería mosaico con lightbox fullscreen** (prev/next/ESC,
  navegación circular, contador).
- **Servicios**: listado editorial numerado (01/02, nombre display, foto o
  ícono de respaldo).
- **Admin**: shell enterprise — sidebar fija con indicador naranja activo,
  topbar sticky con breadcrumb, tablas limpias, formularios en paneles
  numerados, skeletons, bandeja con no-leídos resaltados.

## Jerarquía y semántica

- **`h1`** único por página → secciones con **`h2`** → tarjetas con **`h2`**.
  Nunca saltar de `h1` a `h3` directamente (auditoría `heading-order`, ver
  [[Auditoría y Correcciones]] nº 8; verificada por DOM tras el rediseño).
- Botones: `<button>` reales, focus states visibles, labels con `for`/`aria-label`.
- Estados siempre presentes: loading · empty · error · éxito — skeletons en
  lugar de textos sueltos; nunca spinners infinitos ni errores silenciosos.
- Touch targets ≥ 44 px en móvil; sin overflow horizontal (QA visual lo
  verifica, ver [[Testing]]).
- **Morph de iconos** ([[Stack Tecnológico]] nº 24): solo para iconos que cambian
  de identidad según estado (☰↔✕ del menú móvil, ✎↔✕ del toggle de edición),
  vía `app-morph-icon` con `reducedMotion="user"` (respeta
  `prefers-reduced-motion`). Los iconos estáticos siguen en `@lucide/angular`;
  nunca animar iconos decorativos.

> [!warning] Bug de capas CSS (corregido)
> La regla base `a { color: inherit; text-decoration: none }` debe vivir dentro
> de **`@layer base`**. Sin capa, el CSS gana sobre TODAS las utilities de
> Tailwind y anula `text-accent`/`text-accent-deep` (y cualquier clase de
> color) sobre `<a>` — los enlaces no pintan su clase.

## Ver también

- [[Stack Tecnológico]] · [[Auditoría y Correcciones]] (nº 21 rediseño, QA
  visual, CSS layer) · [[Performance y Lighthouse]] (A11y 95)