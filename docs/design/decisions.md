# Decisiones de diseño — Ingesocc

Registro de decisiones ambiguas resueltas durante el rediseño, con foco en
**sobriedad** y **accesibilidad**. Cada decisión indica contexto, elección y
justificación verificable. Fases 03 (Cimientos), 06 (Home), 07 (Portafolio), 08 (Catálogo y
Trayectoria) y 09 (Puente) · 2026-10-15.

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

## D-11 · Sin barras de "Capacidad" ni divisores blueprint (Home, Fase 06)

- **Contexto:** el plan (§6.5) contempla barras de capacidad animadas con `scaleX` y
  divisores tipo blueprint que se "dibujan" al entrar en viewport.
- **Decisión:** **no** implementarlos. La sección de Home comunica capacidades con
  contenido real, no con proporciones.
- **Justificación:** no existen datos de capacidades respaldados por el cliente; el plan
  prohíbe inventar métricas (regla de sobriedad). Añadir barras o líneas decorativas
  sería ruido visual sin información.

## D-12 · Kinetic type por bloque, no por palabra (Home, Fase 06)

- **Contexto:** el plan (§6.1) pide entrada "kinetic type" por líneas/palabras con máscara
  + `translateY` y stagger ~70 ms.
- **Decisión:** la entrada escalonada se aplica **por bloque** (eyebrow → h1 → subtítulo →
  acciones), con `opacity`+`translateY` y stagger 60/160/260/360 ms; el titular permanece
  como **un único `<h1>`** (sin dividir en `<span>` por palabra/línea).
- **Justificación:** dividir el titular en fragmentos animados complica el DOM y la lectura
  de accesibilidad/selección de texto sin una ganancia perceptible frente al stagger por
  bloque. El requisito de "texto en el DOM de inmediato y legible sin JS" se cumple porque
  la animación es **CSS pura** (sin estado `opacity:0` dependiente de JS) y se anula con
  `prefers-reduced-motion: reduce`.
- **Verificación:** texto visible sin JS; select/zoom no roto; Lighthouse conserva accesibilidad.
- **Estado:** Adoptado · 2026-10-15.

## D-13 · Chips unificados (Portafolio, Fase 07)

- **Contexto:** `/proyectos` tenía botones inline con `rounded-full` y estilos duplicados.
- **Decisión:** `FilterChipComponent` con `tone: 'primary' | 'accent'`, `aria-pressed`, teclado.
- **Impacto:** `.chips-row` (scroll-snap móvil, wrap ≥768 px), selector de `visual-qa.mjs` unificado.
- **Verificación:** accent `#f25623`, sin overflow horizontal.
- **Estado:** Adoptado · 2026-10-15.

## D-14 · Lightbox único reutilizado (Portafolio, Fase 07)

- **Contexto:** detalle duplicaba foco/índice en lugar de usar el `LightboxComponent` (Fase 05).
- **Decisión:** delegar en `<app-lightbox>` (focus trap, swipe, precarga, `aria-label` "Imagen X de N: alt").
- **Impacto:** menor superficie de código, a11y consistente.
- **Verificación:** Tab, Esc, aria-label, swipe.
- **Estado:** Adoptado · 2026-10-15.

## D-15 · Navegación y relacionados (Portafolio, Fase 07)

- **Contexto:** sin anterior/siguiente ni relacionados en `/proyectos/:slug`.
- **Decisión:** anterior/siguiente según orden publicado; relacionados = hasta 3 misma primera categoría, excluye el actual (usa `ProjectCardComponent`).
- **Impacto:** descubrimiento sin inventar taxonomías.
- **Verificación:** condicionales correctos, sin repetición.
- **Estado:** Adoptado · 2026-10-15.

## D-16 · Servicios en filas editoriales, no grid de cajas (Catálogo, Fase 08)

- **Contexto:** el plan (§8.1) habla de "grid de los 6 servicios"; el moodboard advierte
  "no convertir todo el sitio en cuadrícula de cajas con sombra".
- **Decisión:** conservar el **layout editorial en filas** de `/servicios` (texto + foto/icono
  por fila), con entrada escalonada y badge de flecha que se rellena en accent al hover/focus.
- **Justificación:** respeta la dirección del moodboard y evita "card soup"; mejora la lectura
  del catálogo sin perder la foto real o el icono de respaldo.
- **Verificación:** 6 filas + 6 badges, sin overflow, sin `reveal-pending` tras scroll.
- **Estado:** Adoptado · 2026-10-15.

## D-17 · Timeline scroll-driven con fallback IO (Trayectoria, Fase 08)

- **Contexto:** el plan (§8.2) pide una línea vertical que se dibuje con el scroll, hitos
  alternados en escritorio y una columna en móvil.
- **Decisión:** `LineDrawDirective` (`[appLineDraw]`) con mejora progresiva — con
  `animation-timeline: view()` usa CSS scroll-driven (`line-scroll`); sin soporte usa
  `IntersectionObserver` (`line-drawn`); `prefers-reduced-motion` dibuja la línea completa de
  inmediato. El layout alternado/una-columna se resuelve en CSS (`≥768px`).
- **Justificación:** efecto sin JavaScript obligatorio, sin bloquear la lectura y accesible;
  funciona igual si el script no carga.
- **Verificación:** línea centrada y hitos alternados en escritorio; una columna y línea a la
  izquierda en móvil; sin overflow.
- **Estado:** Adoptado · 2026-10-15.

## D-18 · Misión/visión/valores como tarjetas con icono intencional (Fase 08)

- **Contexto:** la sección de propósito usaba columnas divididas sin icono.
- **Decisión:** tarjetas (`panel`) con un icono animado con intención —
  `lucideTarget` (misión), `lucideEye` (visión), `lucideShieldCheck` (valores) — y
  `appIconMotion="pop"` al hover/focus del grupo.
- **Justificación:** el icono refuerza el significado (no es decoración) y mantiene la sobriedad
  (sin sombras; solo borde). Nombre/cargo del equipo siempre visibles, sin contadores inventados.
- **Verificación:** los tres iconos presentes; QA visual sin regresiones de contraste.
- **Estado:** Adoptado · 2026-10-15.

## D-19 · Accesibilidad de formulario sin tocar la lógica de contacto (Puente, Fase 09)

- **Contexto:** el formulario de `/contacto` guardaba en `contact_messages` (con RLS) pero no
  exponía estados accesibles: sin `aria-describedby`/`aria-invalid` ni foco al primer error, y el
  estado de envío no se anunciaba.
- **Decisión:** mantener intactos validación, honeypot y guardado; cambiar solo presentación.
  Añadir `aria-required` en obligatorios, `aria-invalid` + `aria-describedby` a cada campo con su
  `<p id="*-error">`, **foco al primer campo inválido**, región `role="status" aria-live="polite"`
  para "Enviando…" y `role="alert"` para el error recuperable.
- **Justificación:** el estado nunca depende solo del color (D-09) y el flujo de lead no se altera.
- **Verificación:** specs de Fase 09 (foco/aria-invalid/aria-describedby/aria-live/error) +
  runtime 20/20; guardado en `contact_messages` cubierto por el spec existente (`insert` intacto).
- **Estado:** Adoptado · 2026-10-15.

## D-20 · Transversales CSS puros con degradación elegante (Fase 09)

- **Contexto:** la mejora 9.3 pide crossfade de View Transitions, barra de progreso de scroll y
  polish de 404 sin coste de rendimiento ni dependencia de JS.
- **Decisión:** crossfade explícito en `::view-transition-old/new(root)` (220/260 ms, anulado con
  `prefers-reduced-motion`); barra `.scroll-progress` con `animation-timeline: scroll(root)` (solo
  si hay soporte; oculta sin él y con reduced-motion); 404 con reveal + numeral decorativo
  `aria-hidden` + micro-movimiento en iconos.
- **Justificación:** progreso visual sin JS; si el navegador no soporta scroll-driven animations la
  barra simplemente no aparece (nunca un elemento desincronizado).
- **Verificación:** runtime — `scaleX≈1.00` al final del scroll, `pagereveal=1` al navegar, 404 con
  numeral oculto a AT y 2 iconos animados.
- **Estado:** Adoptado · 2026-10-15.

## D-21 · Estados del panel con primitivas compartidas y guardado por query param (Fase 10)

- **Contexto:** el admin mezclaba mensajes de error ad-hoc (`border-accent/40 bg-accent-soft…`),
  esqueletos sin anunciar y no había feedback de guardado al volver al listado.
- **Decisión:** sin tocar arquitectura ni el sistema de botones/campos:
  1. todos los errores de campo → primitiva `.field-error` (idéntico valor visual) y todos los
     errores de carga/guardado → `role="alert" class="alert alert-error"`; esqueletos con
     `role="status"` + `sr-only`; vacíos con `.empty-state` (incluido el CMS).
  2. feedback de guardado sin estado global: el formulario navega con `?guardado=1` y el listado
     muestra `role="status" class="alert alert-success alert-enter"` durante 6 s, limpiando el
     query param con `replaceUrl`; el aterrizaje es idempotente en recarga.
  3. micro-movimiento solo en acciones (`pop` guardar, `nudge-up` subir imagen, `shake` eliminar),
     nunca decorativo; iconos decorativos con `aria-hidden`.
- **Justificación:** un único lugar de verdad para el estilo de estado (y su contraste, ya
  auditado en `--accent-deep`), anunciado a lectores de pantalla (D-09) y sin memoria nueva en
  servicios ni efectos cruzados entre rutas.
- **Verificación:** 5 specs nuevos (banner + timer de 6 s + `role="alert"` + navegación con
  `guardado=1`), runtime temporal 10/10 PASS en auth/contacto, `visual-qa` 0 warn · 0 FAIL.
- **Estado:** Adoptado · 2026-10-18.
