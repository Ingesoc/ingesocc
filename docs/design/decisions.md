# Decisiones de diseño — Ingesocc

Registro de decisiones ambiguas resueltas durante el rediseño, con foco en
**sobriedad** y **accesibilidad**. Cada decisión indica contexto, elección y
justificación verificable. Fase 03 (Cimientos) · 2026-10-14.

## D-01 · El naranja brillante no es texto sobre claro

- **Contexto:** `--accent` `#f25623` es el color de marca; se usaba como acento.
- **Decisión:** reservar `#f25623` para superficies/acentos grandes y para texto
  sobre fondos oscuros. Para texto/enlace sobre claro, usar `--accent-deep`
  `#a53a0c`.
- **Evidencia:** contraste WCAG — `#f25623` sobre blanco = **3.43:1** (no AA para
  texto normal); `#a53a0c` sobre blanco = **6.54:1** (AA).

## D-02 · Eliminar tokens muertos de `:root` (hallazgo #17)

- **Contexto:** `:root` duplicaba `--spacing-*`, `--text-*` y `--shadow-*` que
  Tailwind v4 ya genera y que **no** se referenciaban en el código (búsqueda global
  = 0 usos de `var(--text-*)`, `var(--spacing-*)`, `var(--shadow-*)`).
- **Decisión:** eliminarlos; la escala de espaciado es la de Tailwind v4.
- **Evidencia:** `pnpm build` + `pnpm test:ci` (164/164) sin regresiones.

## D-03 · Escala de neutros cálida, sin paleta arcoíris

- **Contexto:** se pedían neutros adicionales derivados del lenguaje existente.
- **Decisión:** definir `--neutral-50` … `--neutral-950` (50 `#faf9f6` → 950
  `#171717`) alrededor del "papel" cálido; **sin** colores de estado usados como
  decoración.
- **Justificación:** mantener la fotografía de obra como protagonista y la
  sobriedad del sistema.

## D-04 · Elevación y radios sobrios

- **Decisión:** 3 niveles de elevación (`--elevation-1/2/3`, sombras suaves de baja
  opacidad), bordes finos de 1 px y `--radius: 0.125rem` (2px). No toda tarjeta
  lleva sombra; la sombra comunica elevación real (header al hacer scroll, overlays).
- **Justificación:** lenguaje recto y técnico; evitar "card soup" y esquinas
  exageradas.

## D-05 · Tema oscuro fuera de alcance

- **Contexto:** se evaluó un modo oscuro.
- **Decisión:** descartado en el rediseño. El lenguaje es claro ("papel"); las
  bandas invertidas se logran con `--primary`/`--surface-inverse`.
- **Justificación:** coste alto (revisar contraste de todos los estados) y no estaba
  en el brief.

## D-06 · `--on-dark-muted` para texto bajo prioridad sobre oscuro

- **Contexto:** el footer usaba `text-white/40` sobre `bg-primary` = **3.83:1**
  (hallazgo #13), por debajo de AA.
- **Decisión:** añadir `--on-dark-muted` `#b9b4a8` (**8.67:1** sobre `#171717`) como
  token para texto secundario sobre superficies oscuras. Su **aplicación** en el
  footer/bandas se hará en la fase de páginas correspondiente.
- **Justificación:** da una alternativa AA sin tocar la identidad.

## D-07 · Tokens de movimiento: Fase 04, no Fase 03

- **Contexto:** `docs/design/motion-language.md` (Fase 02) propuso nombres de token
  distintos a los del plan (§4.1).
- **Decisión:** los nombres **canónicos** son los del plan —
  `--motion-fast/base/slow/hero`, `--ease-out`, `--ease-in-out`, `--ease-spring-soft`,
  `--motion-stagger`, `--motion-distance`. Se migran e implementan en la **Fase 04**.
  El doc de motion se alineó a estos nombres.
- **Justificación:** una sola fuente de verdad; evita duplicar escalas de duración.

## D-08 · Una sola familia tipográfica

- **Decisión:** mantener **Archivo** (autoalojada, variable 100–900); no añadir una
  segunda familia. Display y texto comparten familia con pesos y tamaños distintos.
- **Justificación:** rendimiento (LCP) y coherencia; no hay justificación demostrable
  para una segunda fuente.

## D-09 · Estado nunca solo por color

- **Decisión:** success/warning/error/info se acompañan siempre de texto e icono,
  además del color. Todos los tokens de estado superan AA sobre su `*-soft` y sobre
  blanco.
- **Justificación:** WCAG 1.4.1 (uso del color) y daltonismo.

## D-10 · `text-wrap: balance`/`pretty` globales

- **Decisión:** `h1–h3` usan `text-wrap: balance` y `p` usa `text-wrap: pretty`.
- **Justificación:** mejora la lectura y evita líneas huérfanas sin forzar saltos de
  línea ni afectar el layout (verificado con QA visual). Los navegadores sin soporte
  lo ignoran de forma segura.
