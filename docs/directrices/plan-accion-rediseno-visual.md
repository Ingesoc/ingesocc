?# Plan de acción — Rediseño visual y de movimiento de INGESOCC S.A.S.

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
| 00 | Brújula (preservación y línea base) | Hecho (2026-10-14) | `docs/design/baseline/` | A Fase A · B Fase 0 |
| 01 | Radiografía (auditoría funcional y visual) | Hecho (2026-10-14) | `docs/ui-audit.md` | A Paso 2 · B Fase 0 |
| 02 | Moodboard (referencias y dirección) | Hecho (2026-10-14) | `docs/design-reference-audit.md`, `docs/design/moodboard.md`, `docs/design/motion-language.md`, `docs/design/icons.md` | A Paso 3 · B Fase 0 |
| 03 | Cimientos (sistema de diseño) | Hecho (2026-10-14) | `docs/design-system.md`, `docs/design/decisions.md` | A Paso 4 · B Fase 1 |
| 04 | Cinética (movimiento e iconos) | Hecho (2026-10-14) | `docs/design/motion-language.md`, `docs/design/icons.md`, `THIRD_PARTY.md` | A Paso 3.2/3.3 A · B Fase 1 + §7 |
| 05 | Andamios (componentes globales) | Hecho (2026-10-14) | `docs/design-system.md` (sección componentes) | A Paso 4.4 + Fase E · B Fase 1.2 |
| 06 | Escaparate (Home) | Hecho (2026-10-15) | `docs/visual-qa-report.md` | A Paso 5.2 + Fase F · B §6.2–6.5 |
| 07 | Portafolio (Proyectos + detalle + La Holanda) | Hecho (2026-10-15) | `docs/visual-qa-report.md` | A Paso 5.5/5.6 + Fase F · B §6.8–6.9 |
| 08 | Catálogo y Trayectoria (Servicios + Quiénes Somos) | Hecho (2026-10-15) | `docs/visual-qa-report.md` | A Paso 5.3/5.4 · B §6.6–6.7 |
| 09 | Puente (Contacto + Footer + transversales) | Hecho (2026-10-15) | `docs/visual-qa-report.md` | A Paso 5.7/5.8 · B §6.10–6.12 |
| 10 | Bastidores (Admin sobrio) | Hecho (2026-10-18) | `docs/visual-qa-report.md` | A Paso 5.9 · B §6.13 |
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
- **Estado:** Hecho
- **Fecha:** 2026-10-14
- **Rama y HEAD:** feature/redesign @ 357a11c (limpio; el plan menciona feat/visual-upgrade pero la rama real es feature/redesign)
- **Archivos creados/modificados:**
  - `docs/design/baseline/README.md` (nuevo)
  - `docs/design/baseline/baseline-metrics.json` (nuevo)
  - `docs/design/baseline/screenshots/` (21 PNG: 7 rutas × 390/820/1440)
  - `tools/baseline-shots.mjs` (nuevo, captura reproducible)
  - `docs/directrices/plan-accion-rediseno-visual.md` (estado + este handoff)
- **Comandos ejecutados y resultado:**
  - `pnpm install --frozen-lockfile` → OK (up to date)
  - `pnpm build` → OK · 689.70 kB inicial / 146.99 kB transfer
  - `pnpm test:ci` → 164/164 SUCCESS
  - `pnpm test:e2e` → 69 passed · 3 skipped · 1 failed (password-recovery; ver bloqueos)
  - `pnpm test:visual` → 0 FAIL · 0 WARN
  - `pnpm test:perf` → todos los presupuestos nivel "error" OK
  - `node tools/baseline-shots.mjs` → 21 capturas · 0 overflow horizontal
- **Entregables producidos:** `docs/design/baseline/` (README + metrics + screenshots)
- **Decisiones tomadas:** usar la medición real de hoy como línea base (Accessibility 95, no el 100 histórico); aislar fallos de entorno sin corregirlos.
- **Bloqueos / pendientes:**
  - Supabase local (`127.0.0.1:64321`) no corriendo → fallo e2e de password-recovery + REST 400/404. Requiere levantar Supabase o apuntar a un proyecto de pruebas.
  - Sin `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` → `/admin/*` autenticado no recorrido (3 e2e skipped; QA visual admin omitida).
- **Siguiente fase debe saber:** Línea base en `docs/design/baseline/`; el modelo no ve imágenes (comparar con métricas y revisión humana). Hay déficit de accesibilidad (95 vs objetivo 100) y páginas muy largas en móvil (Quiénes Somos 17.195 px, Home 8.681 px @390).

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

**Estado:** Hecho (2026-10-14). **Entregable:** `docs/ui-audit.md` (actualizado).

**Qué se hizo**
- Se re-ejecutaron los comandos de la Fase 00 y se amplió la radiografía con
  **mediciones programáticas del DOM** (Playwright headless) sobre las 6 rutas
  públicas × 390/1440, más la lectura del baseline (`docs/design/baseline/`).
- Se documentó en `docs/ui-audit.md`: título actualizado, **mapa técnico** (stack,
  rutas, layouts, `data-access`, imágenes/Cloudinary, SEO, móvil), **inventario de
  componentes reutilizables** (a consolidar en Fase 05), **mapa de experiencia por
  ruta** y **diagnóstico de entornos**.
- Tabla de hallazgos reformateada al esquema del plan
  (`ID | Página/componente | Problema | Impacto | Prioridad P0–P3 | Solución | Verificación`)
  con **18 hallazgos**.

**Hallazgos nuevos de esta sesión (además de #1–#11 previos)**
- #12 **P1** Lighthouse Accessibility = **95** (objetivo 100): `color-contrast` +
  `label-content-name-mismatch` en las 4 corridas.
- #13 **P2** Contraste: footer `text-white/40` sobre `bg-primary` = 3.83:1;
  `/proyectos` `text-muted-foreground/70` claro = 3.34:1 (< 4.5:1).
- #14 **P2** `aria-label` del logo no incluye el texto visible (2 por página).
- #15 **P2** Chips de filtro de `/proyectos` = 37–39px (< 44px).
- #16 **P2** Páginas muy largas en móvil: `/quienes-somos` 17195px, `/` 8681px @390.
- #17 **P3** Duplicidad de tokens en `styles.css` (`--text-*`, `--spacing-*`,
  `--shadow-*`, `--radius`) frente a Tailwind v4.
- #18 **P1 (contenido, no código)** `/contacto` renderiza `juankos0714@gmail.com`
  desde el **CMS remoto** (`environment.prod.ts` → `…ietjikoddwpdybarcwfk.supabase.co`),
  no el `gerencia.ingesocc@gmail.com` verificado en el repo.

**Evidencia clave**
- `docs/ui-audit.md` (#1–#18), `.lighthouseci/*.json`, `docs/design/baseline/baseline-metrics.json`.
- Fortalezas confirmadas: 1 `h1` por página, sin `img` sin `alt`, sin `id` duplicados,
  sin controles sin nombre accesible, 0 overflow horizontal en 390/820/1440.

**Comandos / resultados**
```
pnpm build            # 689.70 kB inicial / 146.99 kB transfer (dist/ingesocc-web/browser)
node tools/serve-dist.mjs  (PORT=4175)   # sirve la build de producción para el audit DOM
node <script Playwright temporal>        # h1/alt/ids/nombres/tap-targets por ruta×viewport
```

**Bloqueos / notas para la Fase 02**
- **Entorno dev**: Supabase local `http://127.0.0.1:64321` no corriendo → e2e
  `password-recovery.spec.ts:46` falla y hay REST 400/404. **No corregir la UI por esto.**
- **Admin no auditable** sin `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` (#4–#7 quedan pendientes).
- La build de producción lee **Supabase remoto**; contiene contenido (p. ej. #18) que no
  está en el repo → no confundir contenido del CMS con código.
- Los hallazgos #12–#15 deben **cerrarse en Fase 11** (control de calidad), no antes.
- #18 requiere acción sobre **datos del CMS** (fuera del rediseño): reportar al cliente.

**Siguiente (Fase 02):** moodboard escrito (UI.live), contrato de motion
(prompt-motion) y política de iconos (itshover con licencia), con la matriz de decisiones
de `docs/directrices/plan-accion-rediseno-visual.md` §2.1–2.4.

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

**Estado:** Hecho (2026-10-14).

**Entregables creados/actualizados**
- `docs/design/moodboard.md` — 12 principios concretos + matriz UI.live (patrón →
  decisión → aplicación → límite) + qué se conserva.
- `docs/design/motion-language.md` — estética elegida, **tokens de movimiento**
  (duración/easing/stagger/distancia), contrato de movimiento y tabla
  **referencia (prompt-motion) → implementación web**.
- `docs/design/icons.md` (borrador) — política de iconos + tabla icono → movimiento → razón.
- `docs/design-reference-audit.md` — reescrito con la **matriz del plan**
  (`Recurso | Patrón | Elegido/Adaptado/Descartado | Página/componente | Razón | Coste/riesgo | Evidencia`).

**Decisiones clave**
- Adoptar: mosaico editorial (ui.live), motion tokenizado y contenido (prompt-motion),
  iconos con intención (itshover). Descartar en público: dark mode, dashboards/charts,
  glassmorphism/partículas, 3D y animaciones en bucle.
- Movimiento: solo `transform`/`opacity`, una vez, sin bucle (salvo spinner de `loading`);
  todo se anula con `prefers-reduced-motion`.
- **Licencia itshover verificada: Apache-2.0** → permite uso/modificación con atribución;
  se decide **recrear** iconos desde geometría Lucide (sin portar React), con atribución
  en `THIRD_PARTY.md` (Fase 04) solo si se portara algún patrón.

**Tokens propuestos (a implementar en Fase 03, ver `motion-language.md`)**
- Duraciones: `--motion-duration-instant/fast/base/slow/slower` (100/160/220/360/560 ms).
- Easings: `--motion-ease-out`, `--motion-ease-in-out`, `--motion-ease-emphasis`.
- Soporte: `--motion-stagger` (60 ms), `--motion-distance-sm/md` (8/16 px).
- Nota: los tokens actuales (`--duration-fast/normal/slow` = 200/300/500 ms) se migran
  en Fase 03; el `.media-zoom` a 0.7 s se reduce a `--motion-duration-slow`.

**Verificación / criterio de salida**
- Decisiones justificadas y con límites; se evidencia elección intencional (no copia),
  en las cuatro matrices.

**Bloqueos/observaciones**
- El modelo no lee imágenes: el moodboard es de **principios**, no de shots. Revisión
  visual humana recomendada sobre `docs/design/baseline/screenshots/`.
- Sin rastreo del sitio de obra (`laholanda.ingesocc.com`); no bloquea Fases 03+.

**Siguiente (Fase 03 — Cimientos):** consolidar tokens en `@theme` (`src/styles.css`),
resolver duplicados/tokens (#17), tipografía fluida, espaciado y estados. Prerrequisito:
Fase 02 cerrada (lo está).

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

**Estado:** Hecho (2026-10-14).

**Objetivo:** centralizar y documentar el sistema de diseño como base reusable antes
de rediseñar páginas.

**Qué se hizo**
- `src/styles.css`: reescritos los bloques `@theme inline` y `:root` a un set de
  **tokens semánticos** documentado. Nuevos: `--ink`, `--surface-raised`,
  `--surface-inverse`, `--on-dark-muted`, estado `--warning/-soft`, `--error/-soft`,
  `--info/-soft`, escala `--neutral-50…950`, `--content-max`, `--gutter`, `--measure`,
  `--elevation-1/2/3`, escala display fluida `--text-display-1…4` + `--leading-*` +
  `--tracking-display`. Se **eliminaron** los tokens muertos `--spacing-*`, `--text-*`
  y `--shadow-*` (hallazgo #17).
- `@theme inline`: expuestas las utilidades nuevas (`bg-neutral-*`, `text-warning`,
  `shadow-elevation-2`, `text-display-2`…). Se conservaron intactos los nombres
  existentes (`bg-background`, `text-foreground`, `bg-primary`, `border-border`…):
  **0 cambios en plantillas**.
- `.wrap` ahora usa `--content-max` / `--gutter` (mismos valores 1.25/2/3rem);
  `.btn`, `.field` y `:focus-visible` usan `var(--radius)`.
- Base: `h1–h3 { text-wrap: balance }`, `p { text-wrap: pretty }`.
- Motion: sin cambios (se migra en Fase 04); `docs/design/motion-language.md` se
  alineó a los nombres canónicos del plan (`--motion-fast/base/slow/hero`, etc.).

**Entregables**
- `docs/design-system.md` — reescrito: tipografía fluida, y tablas de color
  (base/superficies/marca/estado/neutros) con ratios de contraste, espaciado/layout/
  radios/elevación, estados (§3.4), motion, componentes, accesibilidad.
- `docs/design/decisions.md` — **nuevo**: 10 decisiones ambiguas resueltas
  (sobriedad/accesibilidad) con evidencia.

**Verificación**
- Contraste WCAG calculado con script: `#f25623` sobre blanco **3.43:1** (solo
  acento/superficie; nunca texto pequeño) vs `#accent-deep` **6.54:1**; estado
  success/warning/error/info **≥ 6.5:1** sobre su `*-soft` y sobre blanco;
  `--on-dark-muted` **8.67:1** sobre ink.
- `pnpm build` OK (styles 65.34 kB raw / 9.57 kB transfer; initial 689.71 kB / 147.04 kB).
- `pnpm test:ci` → **164/164 SUCCESS**.
- `pnpm test:visual` → 0 warn · 0 FAIL (sin regresiones de layout).
- Sin cambios de plantillas: los nombres de tokens/utilities previos se mantienen.

**Riesgos / notas**
- Los tokens nuevos (neutros, estado, display fluida, elevación) están disponibles
  pero **aún no se aplican** en componentes/páginas: se consumen en Fases 05–10.
- Pendientes de a11y derivados de tokens (aplicación en fase de página): footer
  `text-white/40` → `--on-dark-muted` (#13), `aria-label` del logo (#14), chips
  < 44 px (#15).
- Entorno: e2e con 1 fallo por Supabase local caído y 3 skipped por falta de
  `E2E_ADMIN_*`; ambientales, no defectos de UI.

**Siguiente (Fase 04 — Cinética):** implementar tokens de movimiento canónicos,
directiva `Reveal`, sistema de iconos animados y `THIRD_PARTY.md`.

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
**Estado:** Hecho (2026-10-14). Fases 03 y 04 cerradas.

**Archivos tocados**
- `src/styles.css`: tokens de movimiento canónicos en `:root` (`--motion-fast/base/slow/hero`,
  `--ease-out`, `--ease-in-out`, `--ease-spring-soft`, `--motion-stagger/distance/scale-hover`);
  aliases heredados `--duration-*`/`--ease-out-quad/cubic`. Nota: **no** van en `@theme inline`
  (ahí solo se permiten custom properties/`@keyframes`; un `:root` anidado rompe el build).
  Transiciones migradas: `.btn`, `.field`, `.media-zoom`. Utilidades `.reveal-pending`/
  `.reveal-visible`, reglas `[data-icon-motion]` + `@keyframes icon-nudge-x/-up/pop/rotate/shake/pulse`,
  `@media (prefers-reduced-motion: reduce)` para `::view-transition-old/new(root)`.
- `src/app/shared/icons/`: `icon-motion.directive.ts` (`appIconMotion`, triggers hover/focus/parent/inview),
  `reveal.directive.ts` (`appReveal`, IntersectionObserver singleton + stagger),
  `counter.directive.ts` (`appCounter`, rAF + `Intl.NumberFormat('es-CO')`), `index.ts`.
  Specs: `*.directive.spec.ts` (3).
- `src/app/app.config.ts`: `withViewTransitions()`.
- `src/app/layouts/public-layout/site-footer.component.{ts,html}` (`appIconMotion="nudge-x"`, 3 enlaces),
  `mobile-action-bar.component.{ts,html}` (`appIconMotion="pop"`, 2 botones).
- `THIRD_PARTY.md` (Lucide ISC, itshover Apache-2.0, morphicons MIT).
- Docs: `docs/design/motion-language.md`, `docs/design/icons.md`, `docs/design-system.md`.

**Comandos y resultados**
- `pnpm build` → OK (styles ~65 kB raw / ~9.6 kB transfer).
- `pnpm lint` → limpio.
- `pnpm test:ci` → **167/167 SUCCESS** (antes 164; +3 specs de directivas).
- `node tools/visual-qa.mjs` → 0 OK · 0 warn · 0 FAIL (sin dist previo se requiere `pnpm build`).

**Incidencias resueltas**
- Un `edit` reemplazó por error el import `ServicesService` en `site-footer.component.ts`; restaurado.
- PowerShell corrompió codificación UTF-8 de `docs/` con here-strings (doble-encoding) y consumió
  backticks (escapes `` `a/`b/`f/`n/`r/`t ``); se restauró el plan desde git y se reescribieron
  `design-system.md`, `motion-language.md`, `icons.md` con la herramienta de escritura.
- `src/styles.css` se restauró desde HEAD (Fase 03 ya commiteada) y se reaplicó Fase 04 limpio.

**Pendientes / bloqueos**
- Bloqueos ambientales sin resolver (no de UI): Supabase local caído (REST 400/404 + 1 e2e),
  sin `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` (3 e2e skipped, `/admin/*` autenticado sin auditar).
- Hallazgo #18 (contenido CMS remoto en build de producción) pendiente de reporte al cliente.

**Siguiente (Fase 05)**
- Auditar componentes globales existentes, refactor incremental y documentar su inventario
  (API/estados/uso) en `docs/design-system.md`. No introducir abstracciones para un solo caso.

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
**Estado:** Hecho (2026-10-15). Fases 03–06 cerradas.

**Qué se hizo**
- Hero cinético **CSS-only** (contenido indexable sin JS): clases `.hero-reveal` + `.hero-reveal-1..4`
  en `src/styles.css` (stagger 60/160/260/360 ms, anima `transform`+`opacity`), aplicadas en
  `home.component.html` a eyebrow → h1 → subtítulo → acciones. Indicador de scroll `.scroll-cue`
  (solo `transform`, bucle suave). Ambas se anulan con `prefers-reduced-motion: reduce`.
- `CounterDirective` (`src/app/shared/icons/counter.directive.ts`): ahora cuenta **al entrar en
  viewport** (`IntersectionObserver`, threshold 0.4); renderiza `0` y anima por rAF con
  `Intl.NumberFormat('es-CO')`; `ngOnDestroy` desconecta el observer y cancela el rAF;
  reduced-motion / sin `IntersectionObserver` → valor final directo. Home: `15+ / 120+ / 8+`
  (años, proyectos ejecutados, sectores atendidos) con `tabular-nums`.
- Entrada escalonada con `appReveal` (`RevealDirective`, Fase 04): stats y cards de proyectos
  destacados (`[revealIndex]`).
- Icono animado por hover del contenedor: flecha "servicios" con `appIconMotion="nudge-x"`
  (`trigger: parent` de Fase 04).
- `home.component.ts`: importa/registra `CounterDirective`, `IconMotionDirective`, `RevealDirective`
  desde `../../shared/icons`.

**Verificación runtime** (scripts temporales, ya borrados): hero con opacity final 1; contadores
`15+/120+/8+`; cards conservan spans del masonry + `reveal-visible` (el binding `[class]` del host
no borra las clases del directive); `reduce` desactiva reveals/counters; iconos
`data-icon-motion="nudge-x"`; **0 pageerror**.

**Comandos y resultados**
- `pnpm build` → OK.
- `pnpm lint` → limpio.
- `pnpm test:ci` → **170/170 SUCCESS**.
- `pnpm test:perf` (Lighthouse local): Desktop Home **89 (WARN, mínimo ≥80)**, Desktop Proyectos 91,
  Mobile Home/Proyectos 63; A11y 95, Best Practices 96, SEO 100. Presupuestos de nivel *error* OK.
- `node tools/visual-qa.mjs` → 0 warn · 0 FAIL (igual que la línea base).

**Decisiones**
- El elemento **LCP del Home es la imagen del hero** (`img.absolute`, alt "Obra de Ingesocc S.A.S."),
  no el texto: la entrada cinética no lo afecta. El descenso de Performance (baseline 2026-09 = 97 →
  89) proviene de introducir la fotografía de hero en el rediseño (pre-existente a esta fase), no de
  la Fase 06. Se difiere a la Fase 11 (rendimiento).
- §6.5 "Capacidad" con barras y divisores blueprint: **no aplican** (no hay datos de capacidades
  respaldados); se documenta y no se inventan métricas.
- Kinetic type resuelto por **bloque** con stagger (eyebrow/h1/subtítulo/acciones), no palabra por
  palabra: el titular sigue siendo un único `<h1>` indexable; el stagger por línea exigiría partir
  el texto (peor SEO/a11y) sin ganancia clara.
- Se reutilizan los primitivos de Fases 04/05; sin refactor transversal adicional.

**Pendientes / bloqueos (ambientales, no de UI)**
- Sin `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` → `/admin/*` autenticado sin auditar.
- Supabase local caído (REST 400/404). Hallazgo #18 (CMS remoto en `/contacto`) sin reportar.
- Performance Desktop Home 89 (< objetivo 90) por la imagen LCP del hero → revisar en Fase 11.

**Siguiente (Fase 07 — Portafolio)**
- `/proyectos`, detalle y La Holanda: chips de filtro con indicador deslizante, "Cargar más" con
  skeletons + stagger, transición de cambio de filtro y lightbox de galería.

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
**Estado:** Hecho (2026-10-15). Fases 03–07 cerradas.

**Qué se hizo**
- **Listado `/proyectos`** (`projects-page.component.{ts,html}`):
  - Chips extraídos a componente reutilizable `FilterChipComponent`
    (`src/app/shared/components/filter-chip.component.{ts,html,spec.ts}`) con `aria-pressed`,
    teclado y `tone` (`'primary' | 'accent'`); categorías en tono `accent`, ubicaciones en `primary`.
  - Fila de filtros `.chips-row` (`src/styles.css`): scroll horizontal con `scroll-snap` y
    scrollbar oculta en móvil, `flex-wrap` en ≥768 px; `role="group"` + `aria-label` por fila.
  - Anuncio accesible `aria-live="polite"` (`announcement` signal) que se resetea al cambiar de
    filtro y se actualiza en `loadMore()`.
  - Cards con entrada `appReveal [revealIndex]="i % 8"`; estado vacío con `.empty-state`.
  - Se **conserva** la lógica previa de filtros, query params, bloques de 8 y "Cargar más".
- **Card de proyecto** (`project-card.component.{ts,html}`): `view-transition-name` único
  (`project-cover-<slug>`) en ambas imágenes de portada; flechas con `appIconMotion="nudge-up"`
  (`trigger: parent`, Fase 04).
- **Detalle `/proyectos/:slug`** (`project-detail.component.{ts,html}`):
  - Cabecera con `view-transition-name` (transición compartida card → detalle con
    `withViewTransitions()` ya activo en `app.config.ts`).
  - "Valor en salarios mínimos" con `CounterDirective` (`[appCounter]`), solo si existe.
  - Galería delega en el **lightbox compartido**; se eliminó el lightbox inline
    (`ElementRef`/`HostListener`/`viewChild`) y el estado de índice duplicado.
  - **Navegación "proyecto anterior / siguiente"** (`previousProject`/`nextProject` sobre el orden
    publicado) y **proyectos relacionados** (`relatedProjects`, hasta 3 de la misma categoría,
    excluyendo el actual) renderizados con `ProjectCardComponent`; CTA de contacto conservado.
- **Lightbox compartido** (`src/app/shared/components/lightbox.component.ts`): foco atrapado
  (Tab/Shift+Tab), swipe en móvil (`onTouchStart`/`onTouchEnd`, umbral 40 px), precarga de
  vecinas, `aria-label` "Imagen X de N: alt" (`imageLabel`), restaura foco al cerrar.
- **La Holanda:** ficha real de Supabase con enlace a su micrositio
  (`laholanda.ingesocc.com`); sin métricas inventadas.

**Verificación runtime** (script temporal, ya borrado): chip activo con fondo accent `#f25623`;
filtro reduce el listado (11 → 4 cards) sin overflow horizontal; cards con `reveal-visible`;
detalle con "Proyectos relacionados" + nav anterior/siguiente; lightbox abre con
`aria-label` "Imagen X de N", atrapa el foco con Tab y cierra con Esc; La Holanda enlaza a su
micrositio; `reduced-motion` sin `reveal-pending`; **0 pageerror**. Nota: el texto de los chips se
muestra en mayúsculas por CSS (diseño), no es un cambio de contenido.

**Comandos y resultados**
- `pnpm build` → OK.
- `pnpm lint` → limpio.
- `pnpm test:ci` → **179/179 SUCCESS** (+9 specs nuevos: lightbox a11y/swipe/foco,
  `FilterChipComponent`, navegación/relacionados del detalle, anuncio de "Cargar más").
- `node tools/visual-qa.mjs` → 0 warn · 0 FAIL (localizador de chips actualizado a `button.chip`).

**Decisiones**
- Chips como componente compartido con `tone` en vez de estilos ad-hoc por página.
- Lightbox único (Fase 05) reutilizado por el detalle; se eliminó la implementación inline.
- Transición compartida vía `view-transition-name` por slug (fallback: sin transición si el
  navegador no la soporta; no rompe la navegación).
- Relacionados = misma primera categoría, máximo 3; no se inventan taxonomías.

**Pendientes / bloqueos (ambientales, no de UI)**
- Sin `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` → `/admin/*` autenticado sin auditar.
- Supabase local caído (REST 400/404). Hallazgo #18 (CMS remoto en `/contacto`) sin reportar.
- Performance Desktop Home 89 (< objetivo 90) por la imagen LCP del hero → revisar en Fase 11.

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
**Estado:** Hecho (2026-10-15). Fases 03–08 cerradas.

**Qué se hizo**
- **Servicios `/servicios`** (`service-card.component.{ts,html}`): se **conserva el layout
  editorial en filas** (moodboard: "no convertir todo el sitio en cuadrícula de cajas con
  sombra"). Se añade entrada escalonada `appReveal [revealIndex]="index()"` y la flecha de
  acción pasa a un badge circular (`h-9 w-9 rounded-full border`) que se rellena en accent al
  hover/focus, con `appIconMotion="nudge-x" iconTrigger="parent"` (patrón de las cards de Home).
  La fuente de datos (CMS con seed) no cambió; foto real o icono de respaldo coherente más la
  alternativa de foto por Cloudinary se mantienen.
- **Nueva directiva `LineDrawDirective`** (`src/app/shared/icons/line-draw.directive.ts`, selector
  `[appLineDraw]`): mejora progresiva para dibujar la línea del timeline —
  `prefers-reduced-motion` → línea completa; con `CSS.supports('animation-timeline: view()')` →
  clase `line-scroll` (CSS guiado por scroll); sin soporte → `IntersectionObserver` (umbral 0.15)
  añade `line-drawn`; sin IO → inmediato. Exportada desde `shared/icons/index.ts`.
- **CSS del timeline/line-draw** (`src/styles.css`): `.line-draw::after` con relleno accent
  (`transform-origin: top`), fallback IO (`.line-drawn` → `scaleY(1)`), bloque
  `@supports (animation-timeline: view())` con `@keyframes line-draw-grow` y
  `animation-range: cover`, y layout mobile-first (`.timeline`, `.timeline-line`, `.timeline-list`,
  `.timeline-item`, `.timeline-dot`, `.timeline-card`) que pasa a línea centrada e hitos alternados
  en `≥768px`. `prefers-reduced-motion` fuerza la línea completa.
- **Quiénes Somos `/quienes-somos`** (`about.component.{ts,html}`):
  - **Timeline** reescrito a vertical scroll-drawn (4 hitos con `appLineDraw` + `appReveal`),
    alternado en escritorio y una sola columna en móvil. Años tomados del CMS (seed verificado).
  - **Misión/visión/valores** como tarjetas (`panel`) con icono animado con intención
    (`lucideTarget` / `lucideEye` / `lucideShieldCheck`) y `appIconMotion="pop"`.
  - **Equipo** con `appReveal` y hover sobrio (`media-zoom`, `aspect-square`); nombre/cargo
    siempre visibles. Sin contadores ni datos inventados.
  - **Lightbox inline eliminado**; la galería de operaciones usa el `<app-lightbox>` compartido
    (`lightboxImages` mapeado a `LightboxImage`).
  - **Enlaces narrativos** a `/proyectos` y `/servicios` (banda nueva) sin repetir textos de Home.

**Verificación runtime** (script temporal, ya borrado): `/servicios` 6 filas editoriales + 6 badges
de flecha sin `reveal-pending` tras scroll; `/quienes-somos` timeline de 4 hitos/4 dots con
`line-draw`, línea **centrada (±0.0px)** y alternado izq/der en escritorio, **una columna (Δ0.0px)**
con línea a la izquierda (+5px) en móvil; iconos de propósito presentes; lightbox compartido abre
("Imagen 1 de 43: …") y cierra con Esc; enlaces a proyectos/servicios; **0 pageerror**;
sin overflow horizontal. **29/29 PASS**.

**Comandos y resultados**
- `pnpm build` → OK.
- `pnpm lint` → limpio.
- `pnpm test:ci` → **185/185 SUCCESS** (+6 specs nuevos: `LineDrawDirective` y
  timeline/galería de `AboutComponent`).
- `node tools/visual-qa.mjs` → 0 warn · 0 FAIL.

**Decisiones**
- Servicios se mantienen en filas editoriales (no grid de cajas con sombra), según moodboard.
- Timeline con línea scroll-driven y fallback IO (mejora progresiva; funciona sin JS/navegadores
  antiguos).
- Lightbox de operaciones unificado en el componente compartido (continúa D-14).

**Pendientes / bloqueos (ambientales, no de UI)**
- Sin `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` → `/admin/*` autenticado sin auditar.
- Supabase local caído (REST 400/404). Hallazgo #18 (CMS remoto en `/contacto`) sin reportar.
- Performance Desktop Home 89 (< objetivo 90) por la imagen LCP del hero → revisar en Fase 11.
- Equipo y certificaciones siguen con datos placeholder del seed ("NO es el equipo real");
  es tarea de contenido del cliente (editar desde `/admin`), no bloquea las fases de UI.

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
> **Estado:** Hecho (2026-10-15). Fase 10 es la siguiente.
>
> **Archivos tocados**
> - `src/app/features/contact/contact.component.ts|html` + `contact.component.spec.ts`
> - `src/app/layouts/public-layout/site-footer.component.ts|html` + `site-footer.component.spec.ts` (nuevo)
> - `src/app/layouts/public-layout/public-layout.component.html`
> - `src/app/features/not-found/not-found.component.ts|html` + `not-found.component.spec.ts` (nuevo)
> - `src/styles.css`
> - `docs/design/decisions.md`, `docs/visual-qa-report.md`, este plan.
>
> **Qué se hizo**
> - **9.1 Contacto:** se conserva validación y guardado (`contact_messages`/RLS) sin cambios;
>   solo presentación. Se añadió `aria-required` en `name/email/message`, `aria-invalid` +
>   `aria-describedby` (ids `*-error`) en todos los campos, **foco al primer error** al enviar
>   inválido, región `p[role="status"][aria-live="polite"]` para "Enviando su mensaje…", el
>   error de envío con `role="alert"` y `aria-busy` en form/botón. Iconos de información con
>   `appIconMotion="pop"` (hover de la fila vía `group`); botón enviar con `lucideSend`.
> - **9.2 Footer:** línea superior blueprint (`footer > div.bg-accent`), botón "volver arriba"
>   accesible (`scrollToTop()` respeta `prefers-reduced-motion`), textos `text-white/40` → token
>   `text-on-dark-muted` (AA), `aria-hidden` en iconos decorativos.
> - **9.3 Transversales:** crossfade View Transitions explícito (`::view-transition-old/new(root)`,
>   220/260 ms, desactivado con reduced-motion), barra de progreso de scroll CSS puro
>   (`.scroll-progress` + `animation-timeline: scroll(root)`, oculta sin soporte/reduced-motion),
>   polish 404 (reveal, iconos con micro-movimiento, numeral decorativo `aria-hidden`).
>
> **Resultados**
> - `pnpm build` OK · `pnpm lint` limpio · `pnpm test:ci` **195/195** (185 + 10 nuevos).
> - `node tools/visual-qa.mjs` → 0 warn · 0 FAIL.
> - Runtime temporal `tools/_phase09-verify.mjs` (creado, ejecutado, **borrado**) **20/20 PASS**:
>   contacto (aria-required, foco/aria-invalid/error, aria-live, iconos), footer (línea, token,
>   volver arriba, sin `text-white/40`), progreso (`scaleX≈1.00` al fondo), View Transition
>   (`pagereveal=1`), 404 (numeral + 2 iconos), 0 `pageerror`.
>
> **Pendientes / bloqueos (ambientales, no de UI)**
> - Sin `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` → `/admin/*` autenticado sin auditar.
> - Supabase local caído (REST 400/404). Hallazgo #18 (CMS remoto en `/contacto`) sin reportar.
> - Performance Desktop Home 89 (< objetivo 90) por imagen LCP del hero → Fase 11.
> - Equipo/certificaciones siguen con placeholder del seed; reemplazo real es tarea de contenido
>   del cliente (no bloquea Fase 10).
>
> **Siguiente (Fase 10 — Bastidores):** consistencia/estados del admin sin cambiar arquitectura.

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
> **Estado:** Hecho (2026-10-18). Fase 11 es la siguiente (prerrequisitos 06–10 cumplidos).
>
> **Archivos tocados**
> - `src/styles.css` (solo `.alert-enter` + `@keyframes` + anulación con reduced-motion)
> - Listados: `projects-admin-page`, `services-admin-page`, `testimonials-admin-page`
>   (`.ts` + `.html`) y `projects-admin-page.component.spec.ts` (nuevo)
> - Formularios: `project-form`, `service-form`, `testimonial-form` (`.ts` + `.html`) y
>   `testimonial-form.component.spec.ts`
> - `messages-inbox.component.html`, `content-cms-page.component.ts|html`,
>   `admin-dashboard.component.html`
> - Auth (entrada del panel): `login.component.html`, `recovery-request.component.html`,
>   `new-password.component.html`
> - `contact.component.html` (solo errores de campo → `.field-error`), `tools/visual-qa.mjs`
> - `docs/visual-qa-report.md`, `docs/design/decisions.md` (D-21), este plan.
>
> **Qué se hizo**
> - **10.1 Estados anunciados:** todo mensaje de campo inválido en admin y auth usa la primitiva
>   `.field-error` (mismo valor visual `accent-deep`, sin cambios de contraste); todo error de
>   carga/guardado usa `role="alert" class="alert alert-error"` (listados, formularios, bandeja,
>   CMS, dashboard, login/recuperar/nueva-contraseña); skeletons con `role="status"` + texto
>   `sr-only`; vacíos con la primitiva `.empty-state` (también el del CMS, antes `panel` ad-hoc).
>   Fix incluido: `service-form` usaba `lucideCheck` sin importar `LucideCheck` (icono inerte).
> - **10.2 Feedback de guardado:** los formularios navegan al listado con `?guardado=1`
>   (`router.navigate([...], { queryParams: { guardado: '1' } })`); el listado muestra un banner
>   `role="status" class="alert alert-success alert-enter"` (entrance 240 ms, anulado con
>   `prefers-reduced-motion`) y lo oculta a los 6 s limpiando el query param (`replaceUrl`).
>   Errores de guardado: `role="alert"` + texto de estado "Guardando…/Se guardó".
> - **10.3 Tablas en móvil:** etiquetas por celda en `<span class="sm:hidden">` (Categorías/Valor/
>   Orden/Estado/Testimonio/Estrellas) sin romper la tabla semántica desktop.
> - **10.4 Iconos en acciones (solo micro-movimiento funcional):** `appIconMotion="pop"` en guardar,
>   `"nudge-up"` en subir imagen, `"shake"` en eliminar; enlaces "Editar" sin animación; iconos
>   decorativos con `aria-hidden="true"`. Sin animaciones decorativas nuevas en el panel.
> - **Sin cambios de sistema:** no se modificó `.btn`/`.field`/`.badge`/espaciado (solo se añadió
>   `.alert-enter`), por lo que no hubo que revalidar las pantallas administrativas por regla de la
>   fase; alturas intactas (`.btn` 44 px, `.btn-sm` 36 px ≥ 24 px de WCAG 2.2 AA).
>
> **Resultados**
> - `pnpm build` OK → `pnpm lint` 0 errores → `pnpm test:ci` **200/200** (195 + 5 nuevos:
>   4 del listado de proyectos —banner, timer de 6 s, error `role="alert"`, ausencia del aviso— y
>   1 en `testimonial-form` —navega con `?guardado=1`—).
> - `node tools/visual-qa.mjs` → **0 warn · 0 FAIL** (incluye `/admin/login`; selector de errores
>   de contacto actualizado a `.field-error` en la propia herramienta).
> - Runtime temporal `tools/_phase10-verify.mjs` (creado, ejecutado, **borrado**) **10/10 PASS**:
>   login y recuperación con `.field-error` en `rgb(165,58,12)` y botón de 44 px, enlace caducado
>   de nueva contraseña con `role="alert" alert-error`, contacto con 3/3 errores vinculados por
>   `aria-describedby` + `aria-invalid`, 0 `pageerror`.
> - `pnpm build` = **729.46 kB inicial / 153.86 kB transfer** (la última cifra registrada en
>   `docs/visual-qa-report.md`, 689.83 kB, es de la Fase 04; el crecimiento acumulado pertenece a
>   las Fases 05–09 —componentes lazy nuevos—, no a la Fase 10, que solo tocó plantillas y unas
>   pocas líneas de TS sin dependencias nuevas).
>
> **Pendientes / bloqueos (ambientales, no de UI)**
> - Sin `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` → el panel **autenticado** (listados, formularios,
>   CMS, bandeja, dashboard) se verificó por specs + build, no en navegador. El criterio de salida
>   "CMS continúa editable con permisos correctos" queda verificado solo a nivel de código.
> - Supabase local caído (REST 400/404). Hallazgo #18 (CMS remoto en `/contacto`) sin reportar.
> - Performance Desktop Home 89 (< objetivo 90) por imagen LCP del hero → Fase 11.
> - Equipo/certificaciones siguen con placeholder del seed (tarea de contenido del cliente).
>
> **Siguiente (Fase 11 — Control de Calidad):** responsive 320–1440, checklist a11y por componente,
> contraste `text-accent-deep`/utilities, presupuestos Lighthouse (subir Home de 89 a ≥ 90) y
> cierre de los hallazgos #12–#15.

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
- **Estado:** Hecho (2026-10-18)
- **Fecha:** 2026-10-18
- **Rama y HEAD:** feature/redesign @ 357a11c
- **Archivos modificados:** `src/app/layouts/public-layout/site-header.component.html`, `src/app/layouts/public-layout/site-footer.component.html`, `src/app/shared/components/lightbox.component.html`, `src/app/features/projects/public/projects-page.component.html`, `src/app/features/content-blocks/admin/content-cms-page.component.html`, `docs/visual-qa-report.md`
- **Comandos ejecutados y resultado:** `pnpm build` → OK; `pnpm lint` → limpio; `pnpm test:ci` → 200/200 SUCCESS; `pnpm test:visual` → 0 warn/0 FAIL; `pnpm test:perf` → presupuestos de nivel error OK (Desktop Home 0.87, Proyectos 0.89, A11y 1.00 en todas las corridas)
- **Entregables producidos:** `.lighthouseci/*.json` actualizados, `docs/visual-qa-report.md` actualizado
- **Decisiones tomadas:** #12 (em-dash → guion), #13/#15 (contrastes) → A11y 100; Perf Desktop Home < 0.90 documentado (imagen LCP del hero)
- **Bloqueos / pendientes:** Supabase local caído (REST 400/404); sin `E2E_ADMIN_*` (panel autenticado verificado por specs); Hallazgo #18 (contenido CMS remoto en `/contacto`) pendiente de reporte al cliente
- **Siguiente fase debe saber:** Fase 12 — revisión final y reporte (verificar checklist final, comparar capturas, revisar diff, redactar reporte).

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


### Handoff — Fase 05
**Estado:** Hecho (2026-10-15). Fases 03–05 cerradas.

**Qué se hizo (recuperado y saneado)**
- La sesión previa dejó la Fase 05 a medio escribir, sin verificar y con errores:
  `lightbox.component.ts` no compilaba (`emit()()`), `contact.component.html` perdió
  acentos (`�`), y `project-detail.component.html` quedó malformado (doble `@if`,
  `<app-lightbox>` huérfano y lightbox antiguo duplicado). Se **revirtieron** esas
  ediciones de features (`git checkout --`) y se conservó solo lo sólido.
- Primitivos compartidos nuevos y verificados:
  - `src/app/shared/components/section-heading.component.{ts,html}`
  - `src/app/shared/components/filter-chip.component.{ts,html}`
  - `src/app/shared/components/lightbox.component.{ts,html}`
  - `src/app/shared/components/index.ts` (barrel)
  - `src/app/shared/components/lightbox.component.spec.ts` (nuevo, 3 specs)
- `src/styles.css`: clases compartidas en `@layer components` (`.alert[-error/-success]`,
  `.field-error`, `.field-help`, `.empty-state`, `.skeleton`, `.chip`, `.chip-active`,
  `.divider-blueprint[-vertical]`) + `@keyframes pulse`.
- `src/app/core/app-skeleton.component.ts`: mojibake corregido y JSDoc restaurado.
- Specs de iconos: `.createComponent(Host)` → `.createComponent(HostComponent)`.
- `docs/design-system.md`: sección "Primitivos compartidos (Fase 05)".

**Correcciones de defectos durante la verificación**
- `LightboxComponent.closeLightbox()` emitía `lightboxClose` dos veces al pulsar el botón
  (burbujeo al backdrop). Corregido con `stop($event)` en el botón; cubierto por test.

**Comandos y resultados**
- `pnpm build` → OK (styles ~65 kB raw / ~9.6 kB transfer).
- `pnpm lint` → limpio.
- `pnpm test:ci` → **170/170 SUCCESS** (antes 167; +3 specs de Lightbox).
- `node tools/visual-qa.mjs` → 0 warn · 0 FAIL (igual que la línea base de Fase 04).

**Decisiones**
- La adopción de primitivos en páginas se difiere a las fases de página (06–10) para no
  mezclar refactor transversal con rediseño de cada zona. Esto evita regresiones como las
  de esta sesión.

**Pendientes / bloqueos (ambientales, no de UI)**
- Sin `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` → `/admin/*` autenticado sin auditar.
- Supabase local caído (REST 400/404; `password-recovery` e2e). No corregir UI por esto.
- Hallazgo #18 (contenido CMS remoto en `/contacto`) pendiente de reporte al cliente.

**Siguiente (Fase 06 — Escaparate Home)**
- Aplicar el rediseño de Home conforme al plan (hero kinetic, destacados, servicios,
  cifras), reutilizando los primitivos de esta fase cuando aporten.

---
