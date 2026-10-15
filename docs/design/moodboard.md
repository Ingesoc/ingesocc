# Moodboard — Dirección visual de INGESOCC S.A.S.

Fecha: 2026-10-14 · Fase 02 · Rama: `feature/redesign`

> Documento de decisión. Traduce las tres referencias (`ui.live`, `prompt-motion.com`,
> `itshover.com`) a **principios aplicables** y a la **matriz de adopción**. No es un
> tablero de imágenes: el modelo no lee imágenes y el rediseño no copia shots; se
> eligen principios de composición, jerarquía, color, movimiento y estados.
> Base comparativa: `docs/design-reference-audit.md` y `docs/design/baseline/`.

## 1. Objetivo de la dirección

Proyectar a INGESOCC como **constructora/desarrolladora técnica, sólida y transparente**
(la obra *La Holanda* es evidencia, no la marca). La sensación buscada:
**técnica, sólida, transparente, contemporánea y confiable**. Fotografía auténtica de
obra, abundante espacio, tipografía técnica clara y movimiento discreto que ayuda a
entender, no a impresionar.

## 2. Principios concretos (11)

| # | Principio | Qué significa en la práctica | Dónde aplica |
|---|---|---|---|
| 1 | **Fotografía de obra como protagonista** | La foto real ocupa el plano principal; el texto se apoya sobre ella con degradado de legibilidad. Nada decorativo compite con la obra. | Hero, mosaico Home, fichas de proyecto, galerías, operaciones. |
| 2 | **Espacio en blanco arquitectónico** | Ritmo vertical fluido (`clamp`); secciones separadas generosamente; el vacío comunica solidez, no relleno. | Todas las páginas (`/`, `/servicios`, `/quienes-somos`). |
| 3 | **Jerarquía por escala y peso, no por color** | Titular > intro > encabezado > label > cuerpo, con la grotesca `Archivo` (tracking negativo en titulares). El color no es el principal diferenciador. | Tipografía global. |
| 4 | **Marcador de sección (kicker)** | Etiqueta minúscula en mayúsculas espaciadas que abre cada sección; da ritmo sin añadir adornos. | Toda página pública. |
| 5 | **Mosaico editorial asimétrico** | Una pieza protagonista + piezas de apoyo; no cuadrícula uniforme de "cajas con sombra". | Home (destacados), `/proyectos`. |
| 6 | **Paleta restringida y disciplinada** | Ink `#171717` + acento `#f25623` + neutros cálidos; el naranja solo en acciones/estados; texto naranja sobre claro siempre `accent-deep`. | Botones, links, estados, chips. |
| 7 | **Superficies sólidas, borde fino, radio sobrio** | Bordes 1 px, radios 2 px, sombra solo cuando hay elevación real (menús, modales). Sin glassmorphism ni transparencias decorativas. | Cards, panels, menús. |
| 8 | **Un CTA principal por contexto** | Acciones secundarias subordinadas y con affordance de flecha; nunca todo relleno. | Hero, cards, formularios, footer. |
| 9 | **Estados previsibles y visibles** | hover/focus/active/disabled/loading/success/error consistentes; foco `2px accent-deep` con offset. | Sistema de componentes. |
| 10 | **Datos reales como diseño** | Cifras/indicadores con contador discreto; sin métricas sintéticas ni gráficos decorativos. | Home (cifras), Quiénes Somos. |
| 11 | **Movimiento al servicio de la comprensión** | Entradas por opacidad/transform una sola vez; nada en bucle; transiciones cortas con significado. | Global (ver `motion-language.md`). |
| 12 | **Trazabilidad y confianza** | Ubicación, año, cliente/rol y estado visibles donde existen; nada inventado. | Fichas de proyecto, contacto. |

## 2.1 Principios rectores de composición (resumen operativo)

1. **Foto primero**: si un bloque no aporta foto, dato o texto real, no existe.
2. **Aire antes que relleno**: preferir separación a densidad.
3. **Tipografía como arquitectura**: escala y peso construyen jerarquía.
4. **Un foco por sección**: un titular, no tres compitiendo.
5. **Acento con moderación**: el naranja señala, no decora.
6. **Superficies limpias**: sólidas, borde fino, sombra justificada.
7. **Estados siempre visibles**: foco/hover/error perceptibles y accesibles.
8. **Movimiento contenido**: corto, una vez, comprensible.
9. **Veracidad**: cifras, obras y datos proceden del CMS o del seed; nunca inventados.
10. **Consistencia público/admin**: un mismo vocabulario de componentes.

## 3. Matriz de adopción — UI.live (patrones de interfaz)

Referencia: `https://ui.live/components` (galería de *design drops*, no librería/código).
Criterio: **calidad de interacción, estados claros, consistencia y responsive**; no
adopción indiscriminada de tendencias.

| Patrón | Decisión | Aplicación concreta en INGESOCC | Límites |
|---|---|---|---|
| Cards | **Adoptar** | Tarjetas editoriales de proyectos y servicios; imagen protagonista, título claro, categoría discreta, acceso evidente al detalle. | No convertir todo el sitio en cuadrícula de cajas con sombra. |
| Navigation / menus | **Adoptar** | Header simple, estado activo reconocible, menú móvil usable, CTA de contacto sin competir con el logo. | Evitar megamenús o navegación tipo dashboard. |
| Typography | **Adoptar** | Jerarquía titular/intro/encabezado/label/cuerpo con `Archivo`. | Sin display cinética que perjudique lectura corporativa. |
| Buttons / links | **Adoptar** | Un CTA principal y acciones secundarias subordinadas; estados hover/focus/active/disabled. | No presentar cada enlace como botón relleno. |
| Responsive | **Adoptar (obligatorio)** | Navegación, cards, galerías, espaciado, formularios e imágenes en móvil/tablet/escritorio. | Verificar lectura, foco, recorte y objetivo táctil, no solo columnas. |
| Filters / tags | **Adoptar** | Chips de categoría/ubicación en `/proyectos`; activo perceptible + teclado. | No mostrar categorías inexistentes ni filtros vacíos. |
| Forms / inputs | **Adoptar** | Contacto y admin: etiquetas persistentes, ayudas, errores asociados, carga y confirmación. | No depender solo de placeholder/color/icono para el error. |
| Toasts / notifications | **Adaptar** | Feedback discreto en CMS; en formularios críticos, mensaje persistente. | No convertir cada interacción pública en notificación flotante. |
| Tabs / steps | **Condicional** | Solo si el contenido lo justifica (no hay caso hoy). | No convertir la web corporativa en asistente multipaso. |
| Dark mode | **No añadir** | Mantener identidad actual. | No es objetivo de negocio; duplica contraste y pruebas. |
| Dashboard / charts / tables / chat | **Descartar en público** | Conservar solo lo funcional del panel admin. | Sin gráficos, métricas sintéticas, chat falso ni estética B2B. |
| Glassmorphism / partículas / decoraciones | **No usar** | Superficies sólidas, foto auténtica, tipografía y espacio. | Evitar desenfoques pesados y transparencias decorativas. |

## 4. Lo que se conserva del sitio actual

- Sistema de componentes único en `src/styles.css` (`.btn`, `.field`, `.badge`, `.kicker`, `.panel`, `.media-zoom`, `.wrap`).
- Mosaico del Home con tarjetas `overlay` sobre fotografía real.
- Tokens de marca (`#171717`, `#f25623`, `accent-deep`) y `Archivo` autoalojada.
- `prefers-reduced-motion` neutralizando animaciones y `:focus-visible` global.

## 5. Criterio de salida

Decisiones justificadas y con límites; se evidencia elección intencional (no copia):
- patrón UI → decisión → aplicación → límite (tabla §3);
- principio → zona de aplicación (§2);
- movimiento → tokens e implementación (`docs/design/motion-language.md`);
- iconos → movimiento → razón (`docs/design/icons.md`, borrador).
