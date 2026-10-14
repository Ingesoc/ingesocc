# Plan de acción — Rediseño visual y de movimiento de INGESOCC S.A.S.

> **Documento de memoria del proyecto.** Cada fase está pensada para ejecutarse en una
> sesión independiente del agente. Antes de empezar una fase: lee este archivo completo,
> toma la primera fase `Pendiente` (o la `En curso`) y su bloque **Handoff** para retomar
> el contexto exacto de la sesión anterior. Al terminar una fase: actualiza estado,
> archivos tocados, comandos, resultados y pendientes, y escribe el **Handoff**.
>
> **Fuentes de este plan (uso literal, sección por sección):**
> - `PROMPT_REDISENO_VISUAL_INGESOCC.md` → referido como **[A]** (fases A–I, secciones 0–15).
> - `prompt-agente-visual-ingesocc.md` → referido como **[B]** (Fase 0/1/2, secciones 0–13).
>
> Ambos archivos están en `.gitignore` (material de trabajo local). Si no están en disco,
> pídelos antes de continuar: este plan fue derivado letra por letra de ellos.

---

## 0. Tabla de fases (estado vivo)

Actualiza la columna **Estado** (`Pendiente` / `En curso` / `Hecho` / `Bloqueado`) y la
fecha al cerrar cada sesión.

| # | Fase | Estado | Entregables principales | Fuente |
|---|---|---|---|---|
| 00 | Brújula (preservación y línea base) | Pendiente | `docs/design/baseline/` | A Fase A · B Fase 0 |
| 01 | Radiografía (auditoría funcional y visual) | Pendiente | `docs/ui-audit.md` | A Paso 2 · B Fase 0 |
| 02 | Moodboard (referencias y dirección) | Pendiente | `docs/design-reference-audit.md`, `docs/design/moodboard.md`, `docs/design/motion-language.md` | A Paso 3 · B Fase 0 |
| 03 | Cimientos (sistema de diseño) | Pendiente | `docs/design-system.md` | A Paso 4 · B Fase 1 |
| 04 | Cinética (movimiento e iconos) | Pendiente | `docs/design/motion-language.md`, `docs/design/icons.md`, `THIRD_PARTY.md` | A Paso 3.2/3.3 · B Fase 1 + §7 |
| 05 | Andamios (componentes globales) | Pendiente | `docs/design-system.md` (sección componentes) | A Paso 4.4 + Fase E · B Fase 1.2 |
| 06 | Escaparate (Home) | Pendiente | `docs/visual-qa-report.md` | A Paso 5.2 + Fase F · B §6.2–6.5 |
| 07 | Portafolio (Proyectos + detalle + La Holanda) | Pendiente | `docs/visual-qa-report.md` | A Paso 5.5/5.6 + Fase F · B §6.8–6.9 |
| 08 | Catálogo y Trayectoria (Servicios + Quiénes Somos) | Pendiente | `docs/visual-qa-report.md` | A Paso 5.3/5.4 · B §6.6–6.7 |
| 09 | Puente (Contacto + Footer + transversales) | Pendiente | `docs/visual-qa-report.md` | A Paso 5.7/5.8 · B §6.10–6.12 |
| 10 | Bastidores (Admin sobrio) | Pendiente | `docs/visual-qa-report.md` | A Paso 5.9 · B §6.13 |
| 11 | Control de Calidad (responsive, a11y, tests, rendimiento) | Pendiente | `docs/visual-qa-report.md` | A Pasos 6–9 + Fase H · B §8–10 |
| 12 | Entrega (revisión final y reporte) | Pendiente | reporte final + docs actualizados | A Fase I + §15 · B §12 |

---

## 1. Reglas innegociables (aplican a TODAS las fases)

Extraídas literalmente de la sección 1 de [A] y la sección 3 de [B].

### 1.1 Arquitectura y código
1. Stack fijo: **Angular 19** (standalone components, signals, CSR) + **Tailwind CSS v4**.
   Config PostCSS solo por `.postcssrc.json`; `@source "./src"` declarado en `src/styles.css`.
2. **No migrar** Angular a React, Next.js, Vue ni otro framework. **No** introducir React,
   Shadcn, `motion/react` ni dependencias adicionales sin justificación escrita.
3. TypeScript estricto; **no usar `any`** para acelerar cambios visuales. Conservar tipos de dominio.
4. Aplicar SOLID con pragmatismo: responsabilidades claras, dependencias explícitas,
   componentes cohesivos; un componente de presentación no debe acceder directamente a varias fuentes de datos.
5. Conservar el contrato de modelos y servicios de proyectos, servicios y `content_blocks`.
   Usar la fuente de datos existente, no duplicar contenido en arrays dentro de componentes.
6. No añadir SSR, prerender ni migración técnica mayor como parte incidental del rediseño.
   Si la auditoría demuestra que hace falta, documentar beneficios/riesgos/alternativa y **no ampliar alcance sin aprobación**.
7. No actualizar dependencias masivamente. No cambiar configuración de Vercel, rutas,
   credenciales ni políticas de acceso por una necesidad cosmética.
8. No romper los fallbacks estáticos previstos para los servicios que consultan Supabase.

### 1.2 Datos, seguridad y contenido
9. **Sitio público estrictamente de solo lectura**; todo el CMS vive en `/admin`.
10. No cambiar el esquema de Supabase, políticas RLS, autenticación, servicios de
    `data-access/`, funciones `api/cloudinary/*` ni migraciones para resolver un problema visual.
    Si algo visual exige un cambio de datos, **detente y repórtalo**.
11. No poner secretos en frontend, documentación, commits ni logs.
12. No cambiar rutas públicas/privadas ni contratos de servicios de datos sin necesidad demostrada.
13. No inventar obras, clientes, certificaciones, años de experiencia, superficies,
    presupuestos, ubicaciones, cifras, equipo, testimonios, premios ni datos de contacto.
14. No usar fotografías de stock como si fueran obras de INGESOCC. Priorizar medios auténticos existentes.
15. No eliminar ni alterar contenido existente sin comprobar su origen y uso en el CMS.
16. Jerarquía de marca: **INGESOCC → empresa constructora/desarrolladora → portafolio → La Holanda**
    (La Holanda es evidencia, no la marca principal).

### 1.3 Marca y estilos
17. Identidad intacta: `#171717` (ink), `#f25623` (accent), `text-accent-deep` = `#a53a0c`
    (rust con contraste AA para texto naranja sobre fondo claro), logo `public/logo/logo.png`.
18. Texto naranja sobre fondos claros **siempre** con `text-accent-deep`; contraste ≥ 4.5:1
    sobre el fondo efectivo.
19. Todo CSS global nuevo va en `@layer base/components/utilities`. Regla aprendida: estilos
    globales sin `@layer` ganan sobre las utilities de Tailwind (bug previo con `a { color: inherit }`);
    no reintroducir un conflicto equivalente.
20. Imágenes: seguir usando `cloudinary-urls.ts` (contextos `cover`, `gallery`, `hero`,
    `service`, `thumbnail`, todos `q_auto,f_auto`) y `EditableImage`; no hardcodear URLs.
    Conservar `fetchpriority="high"` en el LCP del hero y `loading="lazy"` bajo el fold.

### 1.4 Movimiento y accesibilidad
21. `prefers-reduced-motion: reduce` es obligatorio: toda animación no esencial se
    desactiva o se reduce a fade ≤150 ms. Sin parpadeos, sin parallax, sin autoplay con movimiento.
22. Animar solo `transform` y `opacity` (y `clip-path`/`stroke-dashoffset` puntuales).
    Prohibido animar `width/height/top/left/margin`. Cero CLS: reservar `aspect-ratio` en toda imagen.
23. Objetivo de accesibilidad **WCAG 2.2 AA**; Lighthouse Accessibility = 100 en `/` y `/proyectos`.
24. Mobile-first: diseñar 360–412 px primero; luego tablet y escritorio ≥1440. Objetivos táctiles ≥44×44 px.
25. Navegadores: Chromium, Firefox, WebKit (Safari), Pixel 7 / iPhone 14. Toda API moderna
    (scroll-driven animations, View Transitions) debe tener fallback con `@supports` o detección.
26. No usar cursor/efectos de mouse (no suman, penalizan táctil y accesibilidad).

### 1.5 Rendimiento
27. Presupuestos `tools/lighthouse-ci.mjs`: Desktop Perf ≥0.90 objetivo / ≥0.80 mínimo;
    Mobile Perf ≥0.60 objetivo / ≥0.50 mínimo.
28. No cargar librerías de animación pesadas en el bundle inicial (usar `import()` diferido o CSS nativo).
    Evitar GSAP/Lottie/three.js salvo justificación escrita. Reportar delta de bytes de `pnpm build`.
29. Mantener LCP del hero (imagen priorizada, fuentes con `preload` mínimo, sin JS bloqueante).

### 1.6 Proceso y Git
30. Rama de trabajo: `feat/visual-upgrade`. Un commit por zona/componente con mensajes
    convencionales (`feat(home): …`, `feat(ui): …`, `perf: …`, `a11y: …`).
31. No ejecutar operaciones destructivas de Git, no descartar cambios locales, **no hacer push
    ni deploy a producción sin autorización explícita**. Respetar cambios ajenos o sin confirmar.
32. Registrar fallos preexistentes por separado; no atribuirlos a la implementación nueva.
33. Decisiones ambiguas: elegir la opción **más sobria y más accesible**, anotarla en
    `docs/design/decisions.md` y continuar (no bloquear el trabajo con preguntas menores).
34. Si se descubre un bloqueo real (ruta inexistente, medios inaccesibles, prueba que exige
    credenciales de producción) no improvisar ni usar datos reales para pruebas destructivas:
    documentar el bloqueo y continuar con lo verificable.
35. Los flujos E2E que escriben datos requieren un proyecto de pruebas; **no ejecutar CRUD real
    contra producción** para generar evidencia visual.

---

## 2. Contexto técnico verificado (leer del repo, no asumir)

- **Repo:** `https://github.com/Ingesoc/ingesocc` (rama de trabajo actual: `feature/redesign`).
- **Producción/preview:** `https://ingesocc.vercel.app/`.
- **Idioma UI:** español (es_CO). Código/commits/nombres técnicos: inglés o estilo existente.
- **Backend:** Supabase (Postgres + Auth + Storage + RLS). Imágenes: Cloudinary + Storage legacy.
- **Deploy:** Vercel (SPA, `vercel.json`, funciones en `api/`).
- **Estructura relevante:**
  - `src/styles.css` (tokens, `@source "./src"`, `@layer`).
  - `src/app/app.routes.ts`; rutas públicas `/`, `/quienes-somos`, `/servicios`,
    `/proyectos`, `/proyectos/:slug`, `/contacto`; admin `/admin/*` con `authGuard`.
  - `src/app/layouts/public-layout/` y `src/app/layouts/admin-layout/`.
  - `src/app/features/{home,about,contact,projects,services,auth,admin,content-blocks,not-found,testimonials}`.
  - `src/app/core/cloudinary-urls.ts`, `src/app/core/seo.service.ts`.
  - `public/logo/`, favicons, Open Graph, `src/index.html`, `sitemap.xml`, `robots.txt`.
  - **No existe todavía `src/app/shared/`**: la Fase 04 lo crea (`src/app/shared/icons/`, directivas).
- **Calidad existente:** `pnpm test`, `test:ci`, `test:e2e` (Playwright), `test:perf`
  (Lighthouse con presupuestos `tools/lighthouse-ci.mjs`), `test:visual`
  (contraste/overflow/screenshots en `test-results/visual-qa/`, `tools/visual-qa.mjs`).
- **Nota clave:** es una **SPA**; hacer fetch al HTML solo devuelve el shell. Hay que
  **correr el proyecto localmente y navegar cada ruta con un navegador real** para auditar lo visual.
- **Línea base de rendimiento documentada (2026-09):** Desktop ~95–97, Mobile ~65–66,
  Accessibility 100 en Home y Proyectos. Usar como referencia histórica y **volver a medir**.

### Comandos oficiales (usar los reales de `package.json`)

```bash
pnpm install
pnpm start
pnpm build
pnpm test
pnpm test:ci
pnpm test:api
pnpm typecheck:api
pnpm test:e2e
pnpm test:perf
pnpm test:visual
pnpm lint
```

No ejecutar comandos que no existan sin comprobar antes `package.json`. No instalar ni
ejecutar scripts que puedan modificar datos reales sin revisar su alcance.

---

## 3. Plantilla de handoff (copiar al cierre de cada fase)

```markdown
### Handoff — Fase NN (Nombre)
- **Estado:** Hecho / En curso / Bloqueado
- **Fecha:** AAAA-MM-DD
- **Rama y HEAD:** feat/visual-upgrade @ <hash corto>
- **Archivos creados/modificados:** (lista)
- **Comandos ejecutados y resultado:** (comando → PASS/FAIL/detalle)
- **Entregables producidos:** (rutas de docs/capturas)
- **Decisiones tomadas:** (y enlace a docs/design/decisions.md)
- **Bloqueos / pendientes:** (qué impide continuar y qué se necesita)
- **Siguiente fase debe saber:** (contexto mínimo para retomar)
```

---

## FASE 00 — Brújula (preservación y línea base)

**Objetivo:** fotografiar el estado real antes de tocar nada y proteger el trabajo existente.

**Prerrequisitos:** repo clonado, dependencias instalables.

### Instrucciones detalladas
1. Comprobar rama actual, `git status`, cambios locales y commits recientes.
   **No borrar ni sobrescribir cambios no relacionados.** Identificar cambios ajenos o sin confirmar.
2. `pnpm install && pnpm start`; recorrer **todas** las rutas públicas y `/admin/*` en 3 anchos:
   **390, 820 y 1440 px**.
3. Ejecutar las pruebas de referencia que no sean destructivas:
   - `pnpm test:visual` y `pnpm test:perf` (guardar resultados como **línea base**).
   - `pnpm test:ci` y `pnpm test:e2e`.
4. Registrar fallos preexistentes por separado (no atribuirlos al rediseño).
5. Capturar screenshots "antes" de las rutas principales en escritorio y móvil.

**Entregables:**
- `docs/design/baseline/` con: métricas Lighthouse (desktop/móvil), bytes de bundle inicial
  (`pnpm build`), screenshots "antes", comandos y resultados, fallos previos aislados.

**Verificación / criterio de salida:**
- Línea base documentada y reproducible; fallos preexistentes distinguidos de los nuevos.

**Origen:** [A] Fase A (sección 12) · [B] Fase 0 (sección 4).

### Handoff — Fase 00
> (escribir aquí)

---

## FASE 01 — Radiografía (auditoría funcional y visual)

**Objetivo:** construir un mapa real y priorizado del estado actual, con evidencia.

**Prerrequisitos:** Fase 00 cerrada; proyecto corriendo en local.

### 1. Inspección técnica (mínimo)
- `README.md`, `package.json`, config de Angular, Tailwind y PostCSS.
- `src/styles.css`: estilos globales, tokens existentes, tipografías, reglas de `@layer` y
  utilities personalizadas. **Listar tokens existentes** (color, tipografía, radios, sombras,
  espaciados) y detectar valores sueltos/duplicados.
- `src/app/app.routes.ts` y componentes de cada ruta pública y administrativa.
- `src/app/layouts/public-layout/` y el layout administrativo.
- Componentes de header, footer, CTA, cards, botones, formulario, galería, filtros y paginación.
- `src/app/features/home/`, `about/`, `services/`, `projects/`, `contact/` (modelos, servicios, componentes).
- Servicios y modelos en `data-access/`, carga de `content_blocks`, datos estáticos de respaldo y flujo de imágenes.
- `src/app/core/cloudinary-urls.ts`, servicio que resuelve imágenes y transformaciones
  disponibles (`cover`, `gallery`, `hero`, `service`, `thumbnail`).
- `public/logo/`, favicons, Open Graph, `src/index.html`, `seo.service.ts`, `sitemap.xml`/`robots.txt`.
- Pruebas unitarias, E2E, QA visual, presupuestos Lighthouse y documentación en `docs/obsidian/`.

> No adivinar nombres de archivo: si una ruta difiere, localizar el equivalente. Usar la
> documentación del repo como punto de partida, pero confirmar que siga siendo cierta.

### 2. Mapa de experiencia (auditar estas rutas)

| Ruta | Aspectos a evaluar |
|---|---|
| `/` | Hero, propuesta de valor, indicadores reales, proyectos destacados, servicios, capacidades y CTA. |
| `/quienes-somos` | Presentación, historia, misión/visión/valores, timeline y equipo si hay contenido válido. |
| `/servicios` | Jerarquía, claridad de servicios, imágenes/iconos, escaneabilidad y CTA. |
| `/proyectos` | Portafolio, filtros, tarjetas, carga progresiva, estados sin resultados y consistencia de imágenes. |
| `/proyectos/:slug` | Imagen principal, descripción, galería, metadatos disponibles, navegación a otros proyectos y contacto. |
| `/contacto` | Formulario, instrucciones, validación, estados de envío, información confirmada y errores. |

Comprobar por separado el panel admin (`/admin/login`, dashboard, proyectos, servicios,
contenido, mensajes). El objetivo prioritario es el sitio público; el panel solo recibe
ajustes de consistencia cuando sean útiles, sin convertirlo en reescritura independiente.

### 3. Auditoría visual (con ejemplos concretos)
Registrar:
- Problemas de jerarquía y orden de lectura.
- Secciones demasiado densas, vacías, repetitivas o desconectadas.
- Diferencias de espaciado, bordes, radios, sombras, iconos, tamaños de texto y estados hover/focus.
- Problemas de recorte, resolución, proporciones o carga de fotografías.
- Menús poco claros, CTAs compitiendo, filtros difíciles de percibir, formularios confusos.
- Elementos que parecen plantilla genérica y no transmiten identidad constructora.
- Desbordamiento horizontal, texto pequeño y problemas de navegación en móvil.
- Componentes que ya funcionan bien y deben conservarse.

### 4. Registro de hallazgos
Crear/actualizar `docs/ui-audit.md` con la tabla:

| ID | Página/componente | Problema comprobado | Impacto para el usuario | Prioridad | Solución propuesta | Forma de verificar |
|---|---|---|---|---|---|---|

Clasificar cada hallazgo: **P0 crítico / P1 alto / P2 medio / P3 bajo**. P0 incluye regresiones
funcionales, accesibilidad básica rota, errores de carga o exposición de datos. No marcar algo
como problema sin poder señalar la evidencia.

**Verificación / criterio de salida:** mapa técnico y de rutas, capturas iniciales, lista
priorizada de hallazgos y diagnóstico de componentes reutilizables. **Continuar sin esperar
aprobación salvo bloqueo real.**

**Origen:** [A] Paso 2 (secciones 2.1–2.4) · [B] Fase 0 (sección 4).

### Handoff — Fase 01
> (escribir aquí)

---

## FASE 02 — Moodboard (referencias y dirección visual/movimiento)

**Objetivo:** decidir con intención qué patrones se adoptan, adaptan o descartan de las tres
referencias, y dejar la dirección de arte registrada.

**Prerrequisitos:** Fase 01 cerrada.

### 2.1 UI.live — patrones de interfaz
Referencia: `https://ui.live/components` (galería de "design drops", **no es librería ni da código**).
Construir un **moodboard escrito** explorando Explore/Trending (composición corporativa,
arquitectura, construcción, real estate, portafolios). Extraer **principios**, no copiar shots.

Matriz de decisión (de [A] 3.1):

| Patrón | Decisión | Aplicación concreta en INGESOCC | Límites |
|---|---|---|---|
| **Cards** | Adoptar | Tarjetas editoriales de proyectos y servicios; imagen protagonista, título claro, categoría discreta, acceso evidente al detalle. | No convertir todo el sitio en cuadrícula de cajas con sombra. |
| **Navigation / menus** | Adoptar | Header simple, jerarquía clara, estado activo reconocible, menú móvil usable, CTA de contacto sin competir con el logo. | Evitar megamenús o navegación tipo dashboard sin justificación. |
| **Typography** | Adoptar | Jerarquía consistente: titular, texto intro, encabezados, etiquetas, cuerpo. | Sin tipografía cinética ni display que perjudique lectura corporativa. |
| **Buttons / links** | Adoptar | Un CTA principal y acciones secundarias subordinadas; estados hover/focus/active/disabled coherentes. | No presentar cada enlace como botón relleno. |
| **Responsive** | Adoptar (obligatorio) | Navegación, cards, galerías, espaciado, formularios, imágenes y CTA en móvil/tablet/escritorio. | No limitarse a cambiar columnas: verificar lectura, foco, recorte y usabilidad táctil. |
| **Filters / tags** | Adoptar | Chips accesibles para categorías; selección activa perceptible; teclado. | No mostrar categorías inexistentes ni filtros vacíos. |
| **Forms / inputs** | Adoptar | Etiquetas persistentes, ayudas, errores asociados, carga y confirmación. | No depender solo de placeholders/color/iconos para errores. |
| **Toasts / notifications** | Adaptar | Feedback discreto, sobre todo en CMS; en formularios críticos mantener mensaje persistente. | No convertir cada interacción pública en notificación flotante. |
| **Tabs / steps** | Condicional | Solo si el contenido se beneficia de pestañas/pasos. | No convertir la sección corporativa en asistente multipaso. |
| **Dark mode** | No añadir | Mantener identidad actual. | No es objetivo de negocio; duplica contraste y pruebas. |
| **Dashboard / charts / tables / chat** | Descartar en público | Conservar solo donde ya sean funcionales en el panel. | Sin gráficos, métricas sintéticas, chat falso ni estética B2B. |
| **Glassmorphism / partículas / decoraciones** | No usar como dirección | Preferir superficies sólidas, foto auténtica, tipografía y espacio. | Evitar desenfoques pesados y transparencias decorativas. |

**Criterio de UI.live:** calidad de interacción, estados claros, consistencia y responsive;
**no** adopción indiscriminada de tendencias.

### 2.2 Prompt Motion — movimiento narrativo
Referencia: `https://prompt-motion.com/` (**videos y prompts, no componentes web**).
Seleccionar estética **editorial, arquitectónica, contenida y rápida**. Categorías: Product UI,
Phone, Charts, Diagrams, Kinetic type, Shapes, Particles, Characters, Photos, Music, Code.

| Patrón de motion | Decisión | Uso previsto | Límites |
|---|---|---|---|
| **Revelado progresivo de fotografías** | Adoptar con moderación | Máscaras simples/aparición por opacidad al entrar galería en viewport. | Una animación por entrada; contenido visible si falla el script. |
| **Aparición escalonada de grupos** | Adoptar con moderación | Título+descripción de sección y luego tarjetas, retrasos pequeños. | No animar cada elemento; evitar cascadas largas. |
| **Kinetic typography** | Adaptar mínimo | Entrada suave de un titular clave del hero. | No animar letra por letra en toda la web. |
| **Desplazamiento/parallax** | Opcional y mínimo | Diferencia muy pequeña de profundidad en hero fotográfico. | Sin scroll hijacking; sin parallax obligatorio en móvil. |
| **Transiciones entre estados** | Adoptar | Filtros, expansión de galería, estados de botones, menú móvil. | No interrumpir navegación, validación ni lectura. |
| **Cámara 3D, partículas, morphing, showreels** | Descartar global | No se necesitan para una constructora confiable. | Sin motor 3D, canvas pesado ni vídeo generativo de fondo. |
| **Animación en bucle** | Descartar por defecto | Ninguna animación permanente para la base. | Evitar movimiento continuo que compita con foto/texto/a11y. |

**Contrato de movimiento (rangos iniciales, no rígidos):** microinteracciones **120–180 ms**;
cambios de componentes **180–280 ms**; revelados de sección **250–450 ms**. Preferir `transform`
y `opacity`. Respetar `prefers-reduced-motion`; contenido legible sin animación; en móvil
efectos más discretos; sin animaciones que retrasen el hero; el movimiento no debe ocultar
focus, errores ni botones.

### 2.3 ItsHover — iconos con propósito
Referencias: `https://www.itshover.com/` y `https://github.com/itshover/itshover`
(componentes React + Motion; **no se pueden instalar tal cual en Angular**).
Antes de portar código: **revisar licencia**; si permite uso/modificación, conservar atribución
en `THIRD_PARTY.md`; si hay duda, **recrear desde cero** (mismo concepto, SVG propio sobre geometría Lucide).

Adaptar: flecha que avanza en hover sobre "Ver proyecto"; icono de menú que cambia abrir/cerrar;
chevron que acompaña una expansión real; icono de envío con feedback breve; transición corta en
iconos de contacto/navegación con acción real.

Reglas técnicas: mantener `@lucide/angular` como base; implementar solo lo necesario con
CSS/SVG/APIs nativas; movimiento de trazo, desplazamiento corto o rotación pequeña con
significado; decorativos con `aria-hidden="true"`; no crear catálogo de cientos de iconos;
no instalar `motion/react`, React, Shadcn ni dependencias solo para hover; si no comunica estado, dejar estático.

### 2.4 Dirección de arte elegida para INGESOCC
- **Base:** editorial corporativo, limpio y arquitectónico, con fotografía de obra de alta
  calidad y abundante espacio en blanco.
- **UI:** componentes claros, estados previsibles, filtros legibles, CTA de alto contraste.
- **Motion:** microinteracciones rápidas y revelados discretos; ningún espectáculo constante.
- **Iconos:** Lucide coherente con animaciones selectivas.
- **Sensación:** técnica, sólida, transparente, contemporánea y confiable.

### 2.5 Entregables
- `docs/design-reference-audit.md` con la matriz:

  | Recurso | Patrón evaluado | Elegido / Adaptado / Descartado | Página o componente | Razón de negocio/UX | Coste/riesgo técnico | Evidencia o prueba |
  |---|---|---|---|---|---|---|

- `docs/design/moodboard.md` con **8–12 principios concretos** y a qué zona aplican.
- `docs/design/motion-language.md` con tokens de movimiento + tabla "referencia → implementación web".
- `docs/design/icons.md` (borrador) con el mapeo icono → movimiento → razón.

**Verificación / criterio de salida:** decisiones visuales justificadas y límites técnicos claros;
se evidencia que se eligió intencionalmente (no se copiaron todas las características).

**Origen:** [A] Paso 3 (3.1–3.5) · [B] Fase 0 §4.5 + sección 2.

### Handoff — Fase 02
> (escribir aquí)

---

## FASE 03 — Cimientos (sistema de diseño)

**Objetivo:** consolidar una base visual reusable antes de rediseñar página por página.
Trabajar con variables/utilidades/componentes existentes; consolidar lo duplicado en vez de
crear otra capa paralela.

**Prerrequisitos:** Fase 02 cerrada.

### 3.1 Tokens de diseño (Tailwind v4 `@theme`)
Centralizar en `@theme` y documentar:
- **Color:** `--color-ink` (#171717), `--color-accent` (#f25623),
  `--color-accent-deep` (#a53a0c), escala de neutros (50→950), superficies
  (`surface`, `surface-raised`, `surface-inverse`), semánticos (success/warn/error con
  contraste AA), overlay/gradientes para legibilidad de texto sobre foto.
- Definir/documentar tokens semánticos: fondo de página, superficie, superficie secundaria,
  bordes, texto principal/secundario/baja prioridad, marca, acento accesible, hover/active/focus,
  éxito/advertencia/error (con texto e iconos además del color), radios, sombras, ancho de
  contenido, gutters y escala de espaciado.
- No reemplazar ni multiplicar los colores de marca. **Confirmar los tokens reales en
  `src/styles.css` y su contraste.** Mantener la distinción: naranja brillante para superficies/
  acentos donde el contraste lo permita y `accent-deep` para texto pequeño sobre fondos claros.
  **No usar `#f25623` como texto sobre blanco si no supera contraste.**
- Neutros adicionales derivados del lenguaje existente, comprobados; sin paleta arcoíris ni
  colores de estado como decoración.

### 3.2 Tipografía
1. Inspeccionar familias cargadas, licencia, pesos y rendimiento.
2. Reutilizar la familia actual si es apropiada; no añadir fuentes externas ni múltiples
   familias sin razón demostrable.
3. Definir **una** display (carácter fuerte de ingeniería/arquitectura: sans geométrica/grotesk,
   peso 600–800) + **una** de texto (muy legible) si hace falta; autoalojadas
   (`font-display: swap`, subset latin + latin-ext, `preload` solo de la crítica) para no afectar LCP.
4. Escala fluida con `clamp()` (hero, h1–h4, body, small, eyebrow); `text-wrap: balance` en
   titulares y `pretty` en párrafos.
5. Limitar ancho de lectura; controlar longitud de línea e interlineado.
6. Hero contundente sin dominar toda la pantalla ni forzar saltos de línea.
7. Evitar mayúsculas extensas, tracking excesivo, titulares estrechos o cuerpo reducido.

### 3.3 Espaciado, contenedor y composición
- Escala coherente basada en tokens existentes (base 4/8 px); secciones con padding vertical fluido (`clamp`).
- Ancho máximo de contenido y gutters responsive en todas las páginas.
- Suficiente separación entre secciones.
- Retícula consistente, permitiendo composición editorial en hero, capacidades y galería.
- Evitar cards anidadas, contenedores dentro de contenedores y bordes redundantes.
- Radios consistentes (sobriedad, no esquinas exageradas). Sombras discretas con razón visual
  (no toda tarjeta necesita sombra). 3 niveles de elevación; bordes finos 1 px; sombras suaves de baja opacidad.

### 3.4 Estados
`focus` ring visible y consistente (`:focus-visible`, 2 px accent con offset), hover, active,
disabled, loading, success, error.

### 3.5 Entregables
- `docs/design-system.md` con tokens, reglas tipográficas, decisiones de componentes, estados
  y capturas de referencia.
- `docs/design/decisions.md` con decisiones ambiguas resueltas (sobriedad/accesibilidad).

**Verificación / criterio de salida:** tokens aplicados y documentados; contraste verificado
(sobre todo textos y enlaces de acento); base de estilos reusable antes de rediseñar páginas.

**Origen:** [A] Paso 4 (4.1–4.3) · [B] Fase 1 §5.1.

### Handoff — Fase 03
> (escribir aquí)

---

## FASE 04 — Cinética (sistema de movimiento e iconos)

**Objetivo:** implementar el lenguaje de movimiento y el sistema de iconos animados con
intención, accesibles y sin coste de rendimiento.

**Prerrequisitos:** Fase 03 cerrada.

### 4.1 Tokens de movimiento
- Duraciones: `--motion-fast: 150ms`, `--motion-base: 300ms`, `--motion-slow: 600ms`,
  `--motion-hero: 900ms`.
- Easings: `--ease-out: cubic-bezier(.22,1,.36,1)` (entradas),
  `--ease-in-out: cubic-bezier(.65,0,.35,1)` (transiciones),
  `--ease-spring-soft` aproximado con `linear()` si hay soporte.
- Stagger: 60–90 ms entre hermanos, máximo 8 elementos escalonados (el resto entra junto).
- Distancias: entradas de 16–24 px (nunca >40 px) + opacidad.

### 4.2 Elección de herramienta por necesidad (en este orden)
1. **CSS puro** (transitions, `@keyframes`, `:hover`/`:focus-visible`) para microinteracciones.
2. **CSS scroll-driven** (`animation-timeline: view()`/`scroll()`) con `@supports` para reveals y parallax sutil.
3. **`IntersectionObserver`** vía directiva `Reveal` como fallback universal (una sola instancia
   compartida, `unobserve` tras revelar).
4. **View Transitions API** para navegación entre rutas (Angular `withViewTransitions()`) con fallback.
5. **Web Animations API / librería ligera** (p. ej. `motion` de motion.dev, carga `import()` diferido)
   solo para secuencias complejas (hero, contadores). Evitar GSAP/Lottie/three.js salvo justificación.
6. **Angular Animations** (`@angular/animations`): no usar si el CSS cubre el caso.

### 4.3 Sistema de iconos animados (detalle)
1. Crear `src/app/shared/icons/` con directiva `appIconMotion`
   (inputs: `motion = 'rotate' | 'nudge-x' | 'nudge-up' | 'pop' | 'draw' | 'shake' | 'pulse'`,
   `trigger = 'hover' | 'focus' | 'parent' | 'inview'`).
2. Cada movimiento con `@keyframes` en CSS, disparado por clases/atributos `data-*`;
   `trigger: parent` permite que la tarjeta/botón completo active el icono.
3. Mapeo sugerido (ajustar tras auditoría): engranaje→`rotate`; enviar→`nudge-x`+despegue;
   flecha CTA→`nudge-x`; mensaje→`pop`; campana→`shake`; candado/escudo→`draw`/cierre;
   check de éxito→`draw` (stroke).
4. Reduced-motion: sin animación (icono estático).
5. Documentar en `docs/design/icons.md` qué icono usa qué movimiento y por qué. Si se portó
   código de itshover: `THIRD_PARTY.md` con licencia y atribución.
6. Peso: sin dependencias nuevas; CSS de iconos mínimo y compartido.

### 4.4 Entregables
- `docs/design/motion-language.md` (tokens definitivos + tabla referencia → implementación).
- `docs/design/icons.md` (mapeo completo).
- `src/app/shared/icons/` (directiva `appIconMotion`, `Reveal`, `Counter`).
- `THIRD_PARTY.md` (si aplica).

**Verificación / criterio de salida:**
- Directivas funcionan en hover/focus/parent/inview; respetan `prefers-reduced-motion`.
- Sin CLS; solo se animan `transform`/`opacity` (+ `clip-path`/`stroke-dashoffset` puntuales).

**Origen:** [A] Paso 3.2/3.3 + Fase G · [B] Fase 1 §5.3 + §7.

### Handoff — Fase 04
> (escribir aquí)

---

## FASE 05 — Andamios (componentes globales)

**Objetivo:** primitivos compartidos consistentes, accesibles y sin regresión funcional.

**Prerrequisitos:** Fases 03 y 04 cerradas.

### Instrucciones detalladas
Auditar primero qué componentes ya existen y refactorizar de forma incremental:
1. Header público y navegación móvil.
2. Footer y bloque de contacto global.
3. Botón primario, secundario, enlaces de texto y CTA.
4. Encabezado de sección (`SectionHeading`: eyebrow + título + descripción) y etiqueta editorial.
5. Card de proyecto y card de servicio.
6. Chip de filtro y estado activo.
7. Galería, imagen de portada, miniatura y `Lightbox` (si ya existe o es necesario).
8. Campo de formulario, mensaje de ayuda, error y confirmación.
9. `Skeleton`, empty state y mensaje de fallo.
10. `Reveal` (directiva), `Counter` (directiva), `AnimatedIcon`, `Divider` (línea blueprint), `Marquee` (si se usa).

Cada componente: responsabilidad clara, API sencilla, tipado adecuado, estados accesibles y
estilos compartidos. No abstracciones excesivas para un único caso; evitar copiar/pegar bloques
de estilo por página.

### Entregable
- Sección de componentes de `docs/design-system.md` (API, estados, uso).

**Verificación / criterio de salida:** componentes consistentes sin regresión funcional;
inventario documentado y dónde se usan.

**Origen:** [A] Paso 4.4 + Fase E · [B] Fase 1 §5.2.

### Handoff — Fase 05
> (escribir aquí)

---

## FASE 06 — Escaparate (Home)

**Objetivo:** portada corporativa que responda rápido: quién es INGESOCC, qué hace, qué
proyectos demuestran su capacidad y cómo contactar.

**Prerrequisitos:** Fase 05 cerrada.

### 6.1 Hero
- Fotografía real y relevante de una obra/proyecto (calidad y derechos confirmados). La imagen
  aporta contexto, no compite con el titular. Texto con contraste comprobado en todos los recortes.
- Usar contexto `hero` de Cloudinary, **LCP priorizado** (`fetchpriority="high"`, no
  `loading="lazy"`). Overlay degradado para legibilidad. **Cero movimiento que afecte el LCP.**
- Titular claro sobre la actividad real; no inventar eslogan factual ni promesas absolutas.
  Si el contenido actual del CMS es correcto, conservarlo o mejorarlo sin cambiar el significado.
- Titular con **entrada tipo kinetic type** por líneas/palabras (máscara `overflow:hidden` +
  `translateY`, stagger ~70 ms). **El texto debe existir en el DOM de inmediato** (legible/indexable sin JS).
- Secuencia: titular → subtítulo → CTAs → indicador de scroll. Subtítulo breve y acción primaria
  clara hacia proyectos/contacto; segunda acción solo si se justifica.
- Detalle de marca opcional: línea tipo plano/blueprint (SVG `stroke-dashoffset`) o retícula sutil, **muy discreta**.
- Indicador de scroll animado (solo `transform`; se oculta con reduced-motion).
- **Evitar** sliders automáticos, carruseles de hero y vídeos pesados de fondo.

### 6.2 Secciones siguientes (orden recomendado, sujeto a contenido real)
1. Breve presentación de INGESOCC.
2. Proyectos destacados como evidencia visual.
3. Servicios con jerarquía escaneable.
4. Capacidades/proceso/diferenciadores solo si hay contenido auténtico.
5. CTA final de contacto directo y sin exageraciones.

No convertir la página en lista interminable de cards; combinar zonas fotográficas amplias,
bloques de texto cortos y espacio en blanco con ritmo editorial.

### 6.3 Estadísticas
- Contadores que cuentan desde 0 al entrar en viewport (`Counter`, 1.2–1.6 s, `ease-out`,
  `font-variant-numeric: tabular-nums`). Con reduced-motion: mostrar el valor final directo.
- Grid con separadores finos; número grande (display) + etiqueta pequeña. Valores desde `content_blocks`.
- No inventar métricas; si no hay datos respaldados, no mostrar contador.

### 6.4 Proyectos destacados
- Cards con imagen (`aspect-ratio` fijo), título, categoría (chip). Hover: zoom suave
  (`scale` 1.04, ~500 ms) + elevación + flecha animada; overlay de información en foco/hover con
  equivalente táctil.
- Entrada escalonada (`Reveal`). Layout **bento/asimétrico** en escritorio (1 destacado grande +
  secundarios), 1 columna en móvil.
- Enlace "Ver todos los proyectos" con icono animado.

### 6.5 Servicios y "Capacidad"
- Tarjetas de servicio con **icono animado** que se activa en hover/focus de **toda la tarjeta**
  (`trigger: parent`), no solo del icono.
- "Capacidad": visualización clara; si hay barras/proporciones, animar con `scaleX` desde el
  origen (no `width`).
- Divisores de sección tipo blueprint que se "dibujan" al entrar en viewport.

**Verificación / criterio de salida:** escritorio y móvil OK; LCP sin regresión; sin overflow;
contenido del hero legible sin JS.

**Origen:** [A] Paso 5.2 + Fase F.1 · [B] §6.2–6.5.

### Handoff — Fase 06
> (escribir aquí)

---

## FASE 07 — Portafolio (Proyectos + detalle + La Holanda)

**Objetivo:** presentar el portafolio como prueba de capacidad, con fotografía protagonista.
Es una de las secciones prioritarias.

**Prerrequisitos:** Fase 06 cerrada.

### 7.1 Listado `/proyectos`
- Imágenes protagonistas, proporciones coherentes y recorte cuidadoso.
- Cada tarjeta: título claro, categoría solo si existe en los datos, invitación inequívoca a explorar.
- Retícula editorial equilibrada, alineaciones consistentes, suficiente espacio. No forzar
  asimetría solo por parecer moderna.
- **Barra de filtros por categoría como chips**: chip activo con transición de fondo/posición
  (indicador deslizante), `aria-pressed`, navegable con teclado, scroll horizontal con snap en móvil.
- Conservar categorías y lógica de filtros existente; opción activa visible; foco de teclado.
- **Cambio de filtro:** transición de cards (fade/reordenamiento con View Transitions o `FLIP`
  ligero; fallback: fade simple). Sin saltos de layout.
- **"Cargar más" (bloques de 8):** botón con estado loading, **skeletons** durante la carga,
  cards nuevas con stagger; mover foco al primer elemento nuevo o anunciar con `aria-live="polite"`.
- Respetar la paginación/"Cargar más" actual (incluidos bloques de ocho); no alterar la lógica.
- Estados: carga (skeleton), vacío (ilustrado y sobrio), error y fin de resultados.
- No alterar el significado de `featured`, `draft`, `published` ni permisos de visibilidad.
  La información publicada procede de Supabase o de los datos de respaldo; el público es solo lectura.

### 7.2 Detalle `/proyectos/:slug`
Debe sentirse como reportaje de proyecto, no ficha genérica.
- Cabecera con imagen principal (`cover`/`hero`), título, categorías, y metadatos reales
  (categoría, ubicación, periodo, dimensiones o valor, solo si existen).
- "Valor en salarios mínimos" presentado como dato destacado (con `Counter` si aplica), solo si existe.
- Descripción legible con buena jerarquía, ancho de lectura y separación de párrafos.
- **Galería** (contexto `gallery` 1200×900): grid + **Lightbox** accesible (foco atrapado,
  flechas/Esc, swipe en móvil, precarga de la siguiente imagen, `aria-label` "imagen X de N",
  transición con `transform/opacity`).
- Navegación "proyecto anterior / siguiente" y proyectos relacionados al final.
- Camino obvio al listado y CTA de contacto.
- Transición compartida de imagen desde la card del listado (View Transitions con
  `view-transition-name` único por slug) con fallback.
- Gestionar: imágenes ausentes, slug inválido, proyecto no publicado y estados de carga.
- **No renderizar datos privados ni borradores al público.**
- Aprovechar `cloudinary-urls.ts` y sus transformaciones (`hero`, `cover`, `gallery`, `thumbnail`).

### 7.3 Tratamiento de La Holanda
Jerarquía **INGESOCC → Proyectos → La Holanda** (no reemplaza ni es la marca principal).
- Si ya existe en Supabase/seeds/contenido verificable, usar datos y medios reales.
- Si no existe ficha completa, **no inventar** datos: documentar faltantes y usar solo material auténtico.
- Priorizar fotografías reales de obra y descripciones detalladas. Organizar la galería por
  contenido cuando lo permitan las descripciones, sin inventar etapas cronológicas.
- No mezclar imágenes de distintos proyectos sin identificarlas.
- No afirmar porcentajes de avance, cantidades, metrajes, fechas ni estado si no están documentados.

**Verificación / criterio de salida:** filtros/paginación intactos; sin regresiones; datos
públicos reales; estados de error/vacío/carga resueltos; Lightbox accesible.

**Origen:** [A] Paso 5.5/5.6 + Fase F.2/F.3 · [B] §6.8–6.9.

### Handoff — Fase 07
> (escribir aquí)

---

## FASE 08 — Catálogo y Trayectoria (Servicios + Quiénes Somos)

**Objetivo:** servicios escaneables y narrativa corporativa sin contenido inventado.

**Prerrequisitos:** Fase 07 cerrada.

### 8.1 Servicios `/servicios`
- Grid de los 6 servicios: foto (contexto `service` 800×600) o icono de respaldo **coherente
  visualmente en ambos casos** (que no se vea "roto" cuando falta la foto).
- Que se entiendan con lectura rápida: nombre, descripción corta, imagen/icono apropiado y
  acción asociada cuando corresponda.
- Usar fotografías auténticas del servicio si existen; si no, iconos consistentes en lugar de
  stock presentado como trabajo real.
- Hover/focus consistente con las tarjetas de Home. Entrada escalonada.
- Evitar iconos de estilos distintos, ilustraciones aleatorias y tarjetas con alturas/alineaciones
  incoherentes.
- Conservar la fuente de información actual (CMS/servicio); no duplicar manualmente textos.

### 8.2 Quiénes Somos `/quienes-somos`
- Jerarquía editorial, sin grandes bloques difíciles de recorrer.
- **Timeline** (historia): línea vertical que se dibuja con el scroll (scroll-driven con fallback
  IO), hitos alternados en escritorio y una sola columna en móvil. **Solo si las fechas e hitos
  están verificados**; si no, presentar la historia sin fechas inventadas.
- Misión/visión/valores: los existentes o validados por el contenido; nunca inventados. Tarjetas
  con icono animado con intención (p. ej. bulb, star, lock/escudo).
- Equipo: solo con datos e imágenes reales y autorizadas; fotos con recorte consistente
  (`aspect-ratio`), hover sobrio, nombre/cargo siempre visibles (no solo en hover).
- Evitar contadores animados o estadísticas sin fuente real.
- Conectar la narrativa con proyectos y servicios sin repetir párrafos de Home.

**Verificación / criterio de salida:** sin textos/datos inventados; layouts responsive correctos;
timeline con h y fallback funcional.

**Origen:** [A] Paso 5.3/5.4 · [B] §6.6–6.7.

### Handoff — Fase 08
> (escribir aquí)

---

## FASE 09 — Puente (Contacto + Footer + transversales)

**Objetivo:** camino de contacto claro y accesible; cierre global coherente.

**Prerrequisitos:** Fase 08 cerrada.

### 9.1 Contacto `/contacto`
- Formulario fácil de localizar y completar: etiquetas visibles/persistentes, agrupación lógica,
  errores inline con `aria-describedby`, foco al primer error.
- Indicar qué es requerido y por qué; no solicitar datos innecesarios.
- Estados `enviando / éxito / error` con icono animado (enviar → check) y mensaje en
  `aria-live`. Prevenir dobles envíos; error recuperable cuando falle.
- Mensajes de estado accesibles, no dependen solo del color ni de un toast fugaz.
- Panel de información (teléfono, email, dirección, redes) con iconos con micro-movimiento en
  hover/focus. Enlaces `tel:` y `mailto:`. **Usar datos solo si están verificados** (la
  documentación advierte que algunos son placeholders: no convertirlos en reales por intuición).
- **Mantener la validación existente y el guardado en `contact_messages` y RLS: solo cambia la presentación.**

### 9.2 Footer
- Estructura clara y compacta: marca, navegación útil, contacto confirmado y enlaces legales/
  sociales que existan. Conservar la fuente de datos (`content_blocks`) para redes y contenido global.
- Iconos de redes con micro-animación, línea superior blueprint, botón "volver arriba" accesible.
- No convertirlo en megasección con columnas irrelevantes.

### 9.3 Transversales
- **Transiciones de página** (View Transitions) discretas: crossfade 200–300 ms; sin bloquear navegación.
- **404** y estados de error con diseño de marca (`src/app/features/not-found/`).
- **Skeletons** en todo lo que dependa de Supabase.
- **Barra de progreso de scroll** opcional y sutil (solo si no afecta rendimiento).
- **Cursor/efectos de mouse:** no usar.

**Verificación / criterio de salida:** validación y estados accesibles; datos placeholder no
convertidos en reales; guardado en `contact_messages` intacto; flujos E2E de contacto en verde.

**Origen:** [A] Paso 5.7/5.8 · [B] §6.10–6.12.

### Handoff — Fase 09
> (escribir aquí)

---

## FASE 10 — Bastidores (Admin sobrio)

**Objetivo:** consistencia y accesibilidad del panel sin reescribir su arquitectura.

**Prerrequisitos:** Fase 09 cerrada.

### Instrucciones detalladas
- **Sobrio:** solo consistencia con tokens, mejor jerarquía, estados vacío/carga/error, feedback
  de guardado ("guardando/guardado/error") con micro-animación breve, y tablas legibles en móvil.
- **Sin animaciones decorativas.** Iconos animados únicamente en acciones (guardar, eliminar, subir imagen).
- No cambiar la arquitectura ni los flujos de gestión de contenido.
- Si se modifica el sistema de botones/campos/mensajes/espaciado global, verificar todas las
  pantallas administrativas.
- No hacer un cambio visual global que provoque pérdida de contraste/visibilidad en el panel.
- Mantener separados los patrones de la web pública y del dashboard aunque compartan tokens.

**Verificación / criterio de salida:** admin funcionalmente intacto; contraste preservado;
CMS continúa editable con permisos correctos.

**Origen:** [A] Paso 5.9 + Fase F.7 · [B] §6.13.

### Handoff — Fase 10
> (escribir aquí)

---

## FASE 11 — Control de Calidad (responsive, a11y, pruebas, rendimiento)

**Objetivo:** cerrar regresiones y validar calidad técnica antes de la entrega.

**Prerrequisitos:** Fases 06–10 aplicadas.

### 11.1 Responsive y móvil primero
Comprobar al menos: **320, 375, 390, 412, 768, 1024, 1280 y 1440 px**, con al menos una prueba
en viewport estrecho y zoom del navegador. En cada ruta verificar:
- Sin overflow horizontal.
- Titular con saltos de línea naturales.
- Navegación móvil con teclado y toque.
- Zonas táctiles ~44×44 px cuando el contexto lo permita.
- Cards que cambian de columnas sin comprimir texto/imágenes.
- Filtros utilizables en pantallas estrechas; sin ocultar opciones.
- Formularios sin zoom involuntario ni campos minúsculos en móvil.
- Imágenes recortadas conservando el sujeto principal; altura que no consuma toda la pantalla.
- Animaciones más discretas en dispositivos modestos; respeto de reduced motion.
- Menú sticky, CTA flotantes y footer sin tapar contenido.
- Páginas recorribles completas, no solo el primer viewport.

No usar breakpoints como solución automática: decidir el layout según el contenido y verificar
estados reales.

### 11.2 Accesibilidad (WCAG 2.2 AA, checklist por componente)
- Semántica HTML correcta y jerarquía de encabezados coherente; un único H1 descriptivo por página.
- Contraste de texto normal ≥4.5:1 y texto grande ≥3:1 (salvo excepciones de la norma).
  Comprobar expresamente `text-accent-deep` y utilities de color en enlaces.
- Todos los controles con teclado y foco visible; no eliminar outline sin sustituto contrastado.
- Imágenes informativas con `alt` pertinente; decorativas con `alt=""`/`aria-hidden`.
- Formularios: etiquetas, instrucciones, errores asociados al campo y estados anunciables.
- No comunicar éxito/error/disponibilidad/selección solo con color.
- Sin animaciones que parpadeen/distraigan; respetar `prefers-reduced-motion`, `prefers-contrast`.
- Sin cambios bruscos de foco; sin capturar el scroll.
- Nombres accesibles para iconos dentro de botones/enlaces/controles.
- Revisar menú, filtros, galería, paginación, formulario, mensajes y desplegables.
- Objetivos táctiles ≥44×44 px; zoom 200 % sin pérdida de funcionalidad.

### 11.3 SEO y rendimiento
- Conservar títulos, descripciones, canonical, Open Graph, sitemap, robots y JSON-LD existentes.
- Comprobar títulos/descripción por ruta; detalles de proyecto con metadatos correctos cuando haya datos.
- Un único H1 descriptivo; enlaces internos claros entre Home/Servicios/Proyectos/detalle/Contacto.
- Sin keywords artificiales ni afirmaciones no confirmadas. Verificar rutas profundas y fallback SPA.
- No cambiar el dominio canónico placeholder sin confirmación (registrar el pendiente).
- Rendimiento: evitar librerías pesadas, vídeos de fondo, canvas 3D; priorizar imagen LCP con
  tamaño adecuado; lazy bajo el fold, no en hero LCP; dimensiones explícitas para CLS; evitar
  hidratar/ejecutar lógica innecesaria; medir desktop y móvil con scripts/budgets existentes.
  Si empeoran LCP/CLS/INP o presupuestos, identificar causa y corregir antes de cerrar.

### 11.4 Pruebas (usar scripts reales)
1. Ampliar `pnpm test:visual` para cubrir lo nuevo (contrastes, overflow horizontal, screenshots
   en escritorio y móvil, estado con `prefers-reduced-motion: reduce` emulado).
2. `pnpm test:e2e` (Playwright): confirmar Home → Proyectos → Detalle, filtros, "Cargar más" y
   Contacto; **añadir pruebas de lightbox (teclado/Esc) y de menú móvil**.
3. Prueba manual en Chrome, Firefox, Safari (WebKit), iPhone 14, Pixel 7 (`E2E_BROWSERS=all` cuando sea posible).
4. Verificar sin errores de consola, sin warnings de hidratación/animación, sin CLS visible.
5. `pnpm test:ci`, `pnpm typecheck:api` y `pnpm lint` deben pasar.
6. Lighthouse/`test:perf`: comparar con la línea base de Fase 00.

### 11.5 Matriz mínima de validación

| Área | Prueba mínima | Criterio de aceptación |
|---|---|---|
| Build | Build de producción | Sin errores de compilación. |
| Tipos | Typecheck y validaciones | Sin errores nuevos de tipos. |
| Unidades | Tests unitarios | Sin regresiones introducidas. |
| Home | Abrir `/` directamente | Carga, secciones y CTA funcionan. |
| Navegación | Home → internas → volver | Enlaces y estados activos correctos. |
| Proyectos | Filtros, tarjetas, "Cargar más" | Resultados correctos; contrato de datos intacto. |
| Detalle | Slug válido e inválido | Datos correctos; estado no encontrado resuelto. |
| CMS/datos | Contenido y medios | Lectura pública intacta; CMS editable con permisos. |
| Contacto | Válidos, inválidos, error recuperable | Validación y feedback accesibles. |
| Responsive | 320 a 1440 px | Sin overflow; layouts y controles utilizables. |
| Accesibilidad | Teclado, contraste, foco, etiquetas, reduced motion | Sin barreras básicas; documentar límites de herramientas. |
| Imágenes | LCP, tamaños, lazy, alt | Sin LCP diferido ni CLS evitable. |
| Visual | Capturas antes/después | Mejoras sin regresiones de color/contraste/recorte. |
| SEO | Títulos, descripción, canonical, sitemap, rutas | Metadatos preservados; sin dominio ficticio. |
| Seguridad | Inspección de diff/config | Sin secretos ni cambios de RLS/auth no solicitados. |

**Verificación / criterio de salida:** matriz en verde; budgets de rendimiento respetados;
regresiones corregidas y pruebas relevantes reejecutadas.

**Origen:** [A] Pasos 6–9 + Fase H + sección 13 · [B] §8–10.

### Handoff — Fase 11
> (escribir aquí)

---

## FASE 12 — Entrega (revisión final y reporte)

**Objetivo:** cierre verificable, honesto y documentado.

**Prerrequisitos:** Fase 11 en verde.

### Instrucciones detalladas
1. Comparar capturas antes/después a los mismos viewports.
2. Recargar cada ruta **directamente**, no solo navegando desde Home.
3. Revisar estados: contenido largo, imagen ausente, filtro activo, formulario inválido y error
   de red (si es seguro simularlo).
4. Actualizar `docs/visual-qa-report.md` con capturas y pruebas.
5. Comprobar el diff para detectar cambios accidentales de configuración, datos, secretos o
   archivos ajenos al diseño.
6. Producir el reporte final (formato abajo).
7. Actualizar este plan (estados + handoff final).

### Formato obligatorio del reporte final (en español)
1. **Resumen ejecutivo:** qué mejoró y qué problemas principales resolvió.
2. **Cambios por página:** Home, Quiénes Somos, Servicios, Proyectos, detalle/La Holanda,
   Contacto y panel admin si aplica.
3. **Decisiones visuales:** qué se tomó de UI.live, qué motion de Prompt Motion, qué iconos de
   ItsHover y qué se descartó.
4. **Archivos principales modificados:** lista breve con la razón de cada grupo.
5. **Validación:** comandos ejecutados y resultado real; separar ejecutados de no ejecutados.
6. **Comparación visual:** viewports probados, capturas y regresiones detectadas/corregidas.
7. **Rendimiento y accesibilidad:** resultados medidos, diferencias vs. línea base y limitaciones.
8. **Riesgos o pendientes:** datos faltantes, decisiones de negocio, tests bloqueados.
9. **Estado de Git:** rama, cambios locales respetados y si se creó algún commit.
   **No hacer push ni deploy sin autorización.**

No presentar recomendaciones hipotéticas como cambios realizados. No decir "todo pasa" si no
se ejecutaron las pruebas o hay fallos sin resolver.

**Origen:** [A] Fase I + sección 15 · [B] §12.

### Handoff — Fase 12
> (escribir aquí)

---

## Anexo A — Criterios de aceptación finales (Definition of Done)

### Diseño y marca
- [ ] INGESOCC sigue siendo la marca principal; jerarquía hacia proyectos y La Holanda clara.
- [ ] Identidad de marca y logo oficial se mantienen.
- [ ] Jerarquía tipográfica reconocible y consistente.
- [ ] Ritmo visual y espacio en blanco suficientes.
- [ ] Proyectos con fotografía auténtica, buen recorte y metadatos reales.
- [ ] Un CTA principal reconocible sin que cada bloque compita.
- [ ] Patrones adoptados identificados en `docs/design-reference-audit.md` y justificados por UX.
- [ ] Tendencias que no encajan/restan accesibilidad o rendimiento descartadas conscientemente.

### Interacción y responsive
- [ ] Navegación, filtros, tarjetas, galería y formularios funcionan en móvil y escritorio.
- [ ] Sin overflow horizontal en los viewports verificados.
- [ ] Animaciones sutiles, semánticas, rápidas y reducibles/desactivables.
- [ ] El contenido principal funciona sin depender del movimiento.
- [ ] Controles interactivos con foco y nombres accesibles.

### Integridad técnica
- [ ] Sigue en Angular 19, TypeScript y Tailwind CSS v4.
- [ ] Sin React ni dependencia de motion pesada sin justificación.
- [ ] Supabase, RLS, auth, CMS, Cloudinary y rutas mantienen sus contratos.
- [ ] Sin contenidos, contacto, métricas ni proyectos inventados.
- [ ] SEO y optimizaciones de imágenes conservados.
- [ ] Pruebas ejecutadas y resultados documentados.
- [ ] Diff revisado; sin cambios accidentales ni secretos.

### Checklist de cierre de [B] (§12)
- [ ] Todas las zonas de la sección 6 tienen su tratamiento (o justificación escrita).
- [ ] Accessibility Lighthouse = 100 en `/` y `/proyectos`; `test:visual` sin fallos de contraste/overflow.
- [ ] Performance dentro de presupuestos; sin regresión de LCP/CLS.
- [ ] `prefers-reduced-motion` verificado en cada animación.
- [ ] Sitio público solo lectura; admin intacto funcionalmente.
- [ ] Tests unitarios, e2e y typecheck en verde.
- [ ] Documentación `docs/design/` completa.

---

## Anexo B — Documentación y entregables del proyecto

Crear solo lo que no tenga un equivalente mantenido; enlazar o ampliar lo existente. Documentos existentes
en el repo: `docs/ui-audit.md`, `docs/design-reference-audit.md`, `docs/design-system.md`,
`docs/visual-qa-report.md`, `docs/cambios-auditoria-final.md`, `docs/test-plan-audit.md`.

Entregables a mantener/crear:
- `docs/design/baseline/` — métricas y screenshots "antes".
- `docs/design/audit.md` — **alternativa/insumo** de `docs/ui-audit.md` (usar el existente).
- `docs/ui-audit.md` — diagnóstico inicial y prioridades.
- `docs/design/moodboard.md` — 8–12 principios y sus zonas.
- `docs/design/motion-language.md` — tokens de movimiento + tabla referencia → implementación.
- `docs/design/icons.md` — icono → movimiento → razón.
- `docs/design/decisions.md` — decisiones ambiguas resueltas (sobriedad/accesibilidad).
- `docs/design-reference-audit.md` — matriz de decisión de patrones.
- `docs/design-system.md` — tokens, tipografía, componentes y estados.
- `docs/visual-qa-report.md` — pruebas, viewports, capturas y regresiones.
- `THIRD_PARTY.md` — licencia y atribución si se portó código de terceros (itshover).
- Reporte final de la Fase 12.

---

## Anexo C — Supuestos a confirmar (decidir con criterio si no hay respuesta)

1. ¿Hay manual de marca o tipografías corporativas? (si no: elegir según Fase 03 y documentarlo).
2. ¿Existen fotos reales de obra en buena calidad? (si no: diseñar estados que funcionen con
   imágenes irregulares: overlays, recortes consistentes).
3. ¿Se acepta **una** librería de animación ligera con carga diferida, o solo CSS nativo?
   (por defecto: CSS nativo + `motion` diferida solo si hace falta).
4. ¿Se migra a SSR/prerender más adelante? (por ahora no; no asumir SSR en ninguna decisión).

---

## Anexo D — Prioridad de la instrucción final

Ordenar el trabajo por esta prioridad ([A], instrucción final):
**claridad corporativa → portafolio y fotografía real → navegación y responsive → consistencia
del sistema de diseño → accesibilidad → movimiento sutil → refinamiento visual.**

La meta no es más animaciones ni parecerse a una plantilla de moda, sino que un potencial
cliente entienda qué hace la empresa, encuentre proyectos relevantes, explore La Holanda dentro
del portafolio corporativo y sepa cómo contactar; todo con un diseño profesional, auténtico,
accesible y técnicamente sostenible.
