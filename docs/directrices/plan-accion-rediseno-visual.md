# Plan de acciÃ³n â€” RediseÃ±o visual y de movimiento de INGESOCC S.A.S.

> **Documento de memoria del proyecto.** Cada fase estÃ¡ pensada para ejecutarse en una
> sesiÃ³n independiente del agente. Antes de empezar una fase: lee este archivo completo,
> toma la primera fase `Pendiente` (o la `En curso`) y su bloque **Handoff** para retomar
> el contexto exacto de la sesiÃ³n anterior. Al terminar una fase: actualiza estado,
> archivos tocados, comandos, resultados y pendientes, y escribe el **Handoff**.
>
> **Fuentes de este plan (uso literal, secciÃ³n por secciÃ³n):**
> - `PROMPT_REDISENO_VISUAL_INGESOCC.md` â†’ referido como **[A]** (fases Aâ€“I, secciones 0â€“15).
> - `prompt-agente-visual-ingesocc.md` â†’ referido como **[B]** (Fase 0/1/2, secciones 0â€“13).
>
> Ambos archivos estÃ¡n en `.gitignore` (material de trabajo local). Si no estÃ¡n en disco,
> pÃ­delos antes de continuar: este plan fue derivado letra por letra de ellos.

---

## 0. Tabla de fases (estado vivo)

Actualiza la columna **Estado** (`Pendiente` / `En curso` / `Hecho` / `Bloqueado`) y la
fecha al cerrar cada sesiÃ³n.

| # | Fase | Estado | Entregables principales | Fuente |
|---|---|---|---|---|
| 00 | BrÃºjula (preservaciÃ³n y lÃ­nea base) | Hecho (2026-10-14) | `docs/design/baseline/` | A Fase A Â· B Fase 0 |
| 01 | RadiografÃ­a (auditorÃ­a funcional y visual) | Hecho (2026-10-14) | `docs/ui-audit.md` | A Paso 2 Â· B Fase 0 |
| 02 | Moodboard (referencias y direcciÃ³n) | Hecho (2026-10-14) | `docs/design-reference-audit.md`, `docs/design/moodboard.md`, `docs/design/motion-language.md`, `docs/design/icons.md` | A Paso 3 Â· B Fase 0 |
| 03 | Cimientos (sistema de diseÃ±o) | Hecho (2026-10-14) | `docs/design-system.md`, `docs/design/decisions.md` | A Paso 4 Â· B Fase 1 |
| 04 | Cinética (movimiento e iconos) | Hecho (2026-10-14) | `docs/design/motion-language.md`, `docs/design/icons.md`, `THIRD_PARTY.md` | A Paso 3.2/3.3 A– B Fase 1 + A-7 |
| 05 | Andamios (componentes globales) | Pendiente | `docs/design-system.md` (secciÃ³n componentes) | A Paso 4.4 + Fase E Â· B Fase 1.2 |
| 06 | Escaparate (Home) | Pendiente | `docs/visual-qa-report.md` | A Paso 5.2 + Fase F Â· B Â§6.2â€“6.5 |
| 07 | Portafolio (Proyectos + detalle + La Holanda) | Pendiente | `docs/visual-qa-report.md` | A Paso 5.5/5.6 + Fase F Â· B Â§6.8â€“6.9 |
| 08 | CatÃ¡logo y Trayectoria (Servicios + QuiÃ©nes Somos) | Pendiente | `docs/visual-qa-report.md` | A Paso 5.3/5.4 Â· B Â§6.6â€“6.7 |
| 09 | Puente (Contacto + Footer + transversales) | Pendiente | `docs/visual-qa-report.md` | A Paso 5.7/5.8 Â· B Â§6.10â€“6.12 |
| 10 | Bastidores (Admin sobrio) | Pendiente | `docs/visual-qa-report.md` | A Paso 5.9 Â· B Â§6.13 |
| 11 | Control de Calidad (responsive, a11y, tests, rendimiento) | Pendiente | `docs/visual-qa-report.md` | A Pasos 6â€“9 + Fase H Â· B Â§8â€“10 |
| 12 | Entrega (revisiÃ³n final y reporte) | Pendiente | reporte final + docs actualizados | A Fase I + Â§15 Â· B Â§12 |

---

## 1. Reglas innegociables (aplican a TODAS las fases)

ExtraÃ­das literalmente de la secciÃ³n 1 de [A] y la secciÃ³n 3 de [B].

### 1.1 Arquitectura y cÃ³digo
1. Stack fijo: **Angular 19** (standalone components, signals, CSR) + **Tailwind CSS v4**.
   Config PostCSS solo por `.postcssrc.json`; `@source "./src"` declarado en `src/styles.css`.
2. **No migrar** Angular a React, Next.js, Vue ni otro framework. **No** introducir React,
   Shadcn, `motion/react` ni dependencias adicionales sin justificaciÃ³n escrita.
3. TypeScript estricto; **no usar `any`** para acelerar cambios visuales. Conservar tipos de dominio.
4. Aplicar SOLID con pragmatismo: responsabilidades claras, dependencias explÃ­citas,
   componentes cohesivos; un componente de presentaciÃ³n no debe acceder directamente a varias fuentes de datos.
5. Conservar el contrato de modelos y servicios de proyectos, servicios y `content_blocks`.
   Usar la fuente de datos existente, no duplicar contenido en arrays dentro de componentes.
6. No aÃ±adir SSR, prerender ni migraciÃ³n tÃ©cnica mayor como parte incidental del rediseÃ±o.
   Si la auditorÃ­a demuestra que hace falta, documentar beneficios/riesgos/alternativa y **no ampliar alcance sin aprobaciÃ³n**.
7. No actualizar dependencias masivamente. No cambiar configuraciÃ³n de Vercel, rutas,
   credenciales ni polÃ­ticas de acceso por una necesidad cosmÃ©tica.
8. No romper los fallbacks estÃ¡ticos previstos para los servicios que consultan Supabase.

### 1.2 Datos, seguridad y contenido
9. **Sitio pÃºblico estrictamente de solo lectura**; todo el CMS vive en `/admin`.
10. No cambiar el esquema de Supabase, polÃ­ticas RLS, autenticaciÃ³n, servicios de
    `data-access/`, funciones `api/cloudinary/*` ni migraciones para resolver un problema visual.
    Si algo visual exige un cambio de datos, **detente y repÃ³rtalo**.
11. No poner secretos en frontend, documentaciÃ³n, commits ni logs.
12. No cambiar rutas pÃºblicas/privadas ni contratos de servicios de datos sin necesidad demostrada.
13. No inventar obras, clientes, certificaciones, aÃ±os de experiencia, superficies,
    presupuestos, ubicaciones, cifras, equipo, testimonios, premios ni datos de contacto.
14. No usar fotografÃ­as de stock como si fueran obras de INGESOCC. Priorizar medios autÃ©nticos existentes.
15. No eliminar ni alterar contenido existente sin comprobar su origen y uso en el CMS.
16. JerarquÃ­a de marca: **INGESOCC â†’ empresa constructora/desarrolladora â†’ portafolio â†’ La Holanda**
    (La Holanda es evidencia, no la marca principal).

### 1.3 Marca y estilos
17. Identidad intacta: `#171717` (ink), `#f25623` (accent), `text-accent-deep` = `#a53a0c`
    (rust con contraste AA para texto naranja sobre fondo claro), logo `public/logo/logo.png`.
18. Texto naranja sobre fondos claros **siempre** con `text-accent-deep`; contraste â‰¥ 4.5:1
    sobre el fondo efectivo.
19. Todo CSS global nuevo va en `@layer base/components/utilities`. Regla aprendida: estilos
    globales sin `@layer` ganan sobre las utilities de Tailwind (bug previo con `a { color: inherit }`);
    no reintroducir un conflicto equivalente.
20. ImÃ¡genes: seguir usando `cloudinary-urls.ts` (contextos `cover`, `gallery`, `hero`,
    `service`, `thumbnail`, todos `q_auto,f_auto`) y `EditableImage`; no hardcodear URLs.
    Conservar `fetchpriority="high"` en el LCP del hero y `loading="lazy"` bajo el fold.

### 1.4 Movimiento y accesibilidad
21. `prefers-reduced-motion: reduce` es obligatorio: toda animaciÃ³n no esencial se
    desactiva o se reduce a fade â‰¤150 ms. Sin parpadeos, sin parallax, sin autoplay con movimiento.
22. Animar solo `transform` y `opacity` (y `clip-path`/`stroke-dashoffset` puntuales).
    Prohibido animar `width/height/top/left/margin`. Cero CLS: reservar `aspect-ratio` en toda imagen.
23. Objetivo de accesibilidad **WCAG 2.2 AA**; Lighthouse Accessibility = 100 en `/` y `/proyectos`.
24. Mobile-first: diseÃ±ar 360â€“412 px primero; luego tablet y escritorio â‰¥1440. Objetivos tÃ¡ctiles â‰¥44Ã—44 px.
25. Navegadores: Chromium, Firefox, WebKit (Safari), Pixel 7 / iPhone 14. Toda API moderna
    (scroll-driven animations, View Transitions) debe tener fallback con `@supports` o detecciÃ³n.
26. No usar cursor/efectos de mouse (no suman, penalizan tÃ¡ctil y accesibilidad).

### 1.5 Rendimiento
27. Presupuestos `tools/lighthouse-ci.mjs`: Desktop Perf â‰¥0.90 objetivo / â‰¥0.80 mÃ­nimo;
    Mobile Perf â‰¥0.60 objetivo / â‰¥0.50 mÃ­nimo.
28. No cargar librerÃ­as de animaciÃ³n pesadas en el bundle inicial (usar `import()` diferido o CSS nativo).
    Evitar GSAP/Lottie/three.js salvo justificaciÃ³n escrita. Reportar delta de bytes de `pnpm build`.
29. Mantener LCP del hero (imagen priorizada, fuentes con `preload` mÃ­nimo, sin JS bloqueante).

### 1.6 Proceso y Git
30. Rama de trabajo: `feat/visual-upgrade`. Un commit por zona/componente con mensajes
    convencionales (`feat(home): â€¦`, `feat(ui): â€¦`, `perf: â€¦`, `a11y: â€¦`).
31. No ejecutar operaciones destructivas de Git, no descartar cambios locales, **no hacer push
    ni deploy a producciÃ³n sin autorizaciÃ³n explÃ­cita**. Respetar cambios ajenos o sin confirmar.
32. Registrar fallos preexistentes por separado; no atribuirlos a la implementaciÃ³n nueva.
33. Decisiones ambiguas: elegir la opciÃ³n **mÃ¡s sobria y mÃ¡s accesible**, anotarla en
    `docs/design/decisions.md` y continuar (no bloquear el trabajo con preguntas menores).
34. Si se descubre un bloqueo real (ruta inexistente, medios inaccesibles, prueba que exige
    credenciales de producciÃ³n) no improvisar ni usar datos reales para pruebas destructivas:
    documentar el bloqueo y continuar con lo verificable.
35. Los flujos E2E que escriben datos requieren un proyecto de pruebas; **no ejecutar CRUD real
    contra producciÃ³n** para generar evidencia visual.

---

## 2. Contexto tÃ©cnico verificado (leer del repo, no asumir)

- **Repo:** `https://github.com/Ingesoc/ingesocc` (rama de trabajo actual: `feature/redesign`).
- **ProducciÃ³n/preview:** `https://ingesocc.vercel.app/`.
- **Idioma UI:** espaÃ±ol (es_CO). CÃ³digo/commits/nombres tÃ©cnicos: inglÃ©s o estilo existente.
- **Backend:** Supabase (Postgres + Auth + Storage + RLS). ImÃ¡genes: Cloudinary + Storage legacy.
- **Deploy:** Vercel (SPA, `vercel.json`, funciones en `api/`).
- **Estructura relevante:**
  - `src/styles.css` (tokens, `@source "./src"`, `@layer`).
  - `src/app/app.routes.ts`; rutas pÃºblicas `/`, `/quienes-somos`, `/servicios`,
    `/proyectos`, `/proyectos/:slug`, `/contacto`; admin `/admin/*` con `authGuard`.
  - `src/app/layouts/public-layout/` y `src/app/layouts/admin-layout/`.
  - `src/app/features/{home,about,contact,projects,services,auth,admin,content-blocks,not-found,testimonials}`.
  - `src/app/core/cloudinary-urls.ts`, `src/app/core/seo.service.ts`.
  - `public/logo/`, favicons, Open Graph, `src/index.html`, `sitemap.xml`, `robots.txt`.
  - **No existe todavÃ­a `src/app/shared/`**: la Fase 04 lo crea (`src/app/shared/icons/`, directivas).
- **Calidad existente:** `pnpm test`, `test:ci`, `test:e2e` (Playwright), `test:perf`
  (Lighthouse con presupuestos `tools/lighthouse-ci.mjs`), `test:visual`
  (contraste/overflow/screenshots en `test-results/visual-qa/`, `tools/visual-qa.mjs`).
- **Nota clave:** es una **SPA**; hacer fetch al HTML solo devuelve el shell. Hay que
  **correr el proyecto localmente y navegar cada ruta con un navegador real** para auditar lo visual.
- **LÃ­nea base de rendimiento documentada (2026-09):** Desktop ~95â€“97, Mobile ~65â€“66,
  Accessibility 100 en Home y Proyectos. Usar como referencia histÃ³rica y **volver a medir**.

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
### Handoff â€” Fase NN (Nombre)
- **Estado:** Hecho / En curso / Bloqueado
- **Fecha:** AAAA-MM-DD
- **Rama y HEAD:** feat/visual-upgrade @ <hash corto>
- **Archivos creados/modificados:** (lista)
- **Comandos ejecutados y resultado:** (comando â†’ PASS/FAIL/detalle)
- **Entregables producidos:** (rutas de docs/capturas)
- **Decisiones tomadas:** (y enlace a docs/design/decisions.md)
- **Bloqueos / pendientes:** (quÃ© impide continuar y quÃ© se necesita)
- **Siguiente fase debe saber:** (contexto mÃ­nimo para retomar)
```

---

## FASE 00 â€” BrÃºjula (preservaciÃ³n y lÃ­nea base)

**Objetivo:** fotografiar el estado real antes de tocar nada y proteger el trabajo existente.

**Prerrequisitos:** repo clonado, dependencias instalables.

### Instrucciones detalladas
1. Comprobar rama actual, `git status`, cambios locales y commits recientes.
   **No borrar ni sobrescribir cambios no relacionados.** Identificar cambios ajenos o sin confirmar.
2. `pnpm install && pnpm start`; recorrer **todas** las rutas pÃºblicas y `/admin/*` en 3 anchos:
   **390, 820 y 1440 px**.
3. Ejecutar las pruebas de referencia que no sean destructivas:
   - `pnpm test:visual` y `pnpm test:perf` (guardar resultados como **lÃ­nea base**).
   - `pnpm test:ci` y `pnpm test:e2e`.
4. Registrar fallos preexistentes por separado (no atribuirlos al rediseÃ±o).
5. Capturar screenshots "antes" de las rutas principales en escritorio y mÃ³vil.

**Entregables:**
- `docs/design/baseline/` con: mÃ©tricas Lighthouse (desktop/mÃ³vil), bytes de bundle inicial
  (`pnpm build`), screenshots "antes", comandos y resultados, fallos previos aislados.

**VerificaciÃ³n / criterio de salida:**
- LÃ­nea base documentada y reproducible; fallos preexistentes distinguidos de los nuevos.

**Origen:** [A] Fase A (secciÃ³n 12) Â· [B] Fase 0 (secciÃ³n 4).

### Handoff â€” Fase 00
- **Estado:** Hecho
- **Fecha:** 2026-10-14
- **Rama y HEAD:** feature/redesign @ 357a11c (limpio; el plan menciona feat/visual-upgrade pero la rama real es feature/redesign)
- **Archivos creados/modificados:**
  - `docs/design/baseline/README.md` (nuevo)
  - `docs/design/baseline/baseline-metrics.json` (nuevo)
  - `docs/design/baseline/screenshots/` (21 PNG: 7 rutas Ã— 390/820/1440)
  - `tools/baseline-shots.mjs` (nuevo, captura reproducible)
  - `docs/directrices/plan-accion-rediseno-visual.md` (estado + este handoff)
- **Comandos ejecutados y resultado:**
  - `pnpm install --frozen-lockfile` â†’ OK (up to date)
  - `pnpm build` â†’ OK Â· 689.70 kB inicial / 146.99 kB transfer
  - `pnpm test:ci` â†’ 164/164 SUCCESS
  - `pnpm test:e2e` â†’ 69 passed Â· 3 skipped Â· 1 failed (password-recovery; ver bloqueos)
  - `pnpm test:visual` â†’ 0 FAIL Â· 0 WARN
  - `pnpm test:perf` â†’ todos los presupuestos nivel "error" OK
  - `node tools/baseline-shots.mjs` â†’ 21 capturas Â· 0 overflow horizontal
- **Entregables producidos:** `docs/design/baseline/` (README + metrics + screenshots)
- **Decisiones tomadas:** usar la mediciÃ³n real de hoy como lÃ­nea base (Accessibility 95, no el 100 histÃ³rico); aislar fallos de entorno sin corregirlos.
- **Bloqueos / pendientes:**
  - Supabase local (`127.0.0.1:64321`) no corriendo â†’ fallo e2e de password-recovery + REST 400/404. Requiere levantar Supabase o apuntar a un proyecto de pruebas.
  - Sin `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` â†’ `/admin/*` autenticado no recorrido (3 e2e skipped; QA visual admin omitida).
- **Siguiente fase debe saber:** LÃ­nea base en `docs/design/baseline/`; el modelo no ve imÃ¡genes (comparar con mÃ©tricas y revisiÃ³n humana). Hay dÃ©ficit de accesibilidad (95 vs objetivo 100) y pÃ¡ginas muy largas en mÃ³vil (QuiÃ©nes Somos 17.195 px, Home 8.681 px @390).

---

## FASE 01 â€” RadiografÃ­a (auditorÃ­a funcional y visual)

**Objetivo:** construir un mapa real y priorizado del estado actual, con evidencia.

**Prerrequisitos:** Fase 00 cerrada; proyecto corriendo en local.

### 1. InspecciÃ³n tÃ©cnica (mÃ­nimo)
- `README.md`, `package.json`, config de Angular, Tailwind y PostCSS.
- `src/styles.css`: estilos globales, tokens existentes, tipografÃ­as, reglas de `@layer` y
  utilities personalizadas. **Listar tokens existentes** (color, tipografÃ­a, radios, sombras,
  espaciados) y detectar valores sueltos/duplicados.
- `src/app/app.routes.ts` y componentes de cada ruta pÃºblica y administrativa.
- `src/app/layouts/public-layout/` y el layout administrativo.
- Componentes de header, footer, CTA, cards, botones, formulario, galerÃ­a, filtros y paginaciÃ³n.
- `src/app/features/home/`, `about/`, `services/`, `projects/`, `contact/` (modelos, servicios, componentes).
- Servicios y modelos en `data-access/`, carga de `content_blocks`, datos estÃ¡ticos de respaldo y flujo de imÃ¡genes.
- `src/app/core/cloudinary-urls.ts`, servicio que resuelve imÃ¡genes y transformaciones
  disponibles (`cover`, `gallery`, `hero`, `service`, `thumbnail`).
- `public/logo/`, favicons, Open Graph, `src/index.html`, `seo.service.ts`, `sitemap.xml`/`robots.txt`.
- Pruebas unitarias, E2E, QA visual, presupuestos Lighthouse y documentaciÃ³n en `docs/obsidian/`.

> No adivinar nombres de archivo: si una ruta difiere, localizar el equivalente. Usar la
> documentaciÃ³n del repo como punto de partida, pero confirmar que siga siendo cierta.

### 2. Mapa de experiencia (auditar estas rutas)

| Ruta | Aspectos a evaluar |
|---|---|
| `/` | Hero, propuesta de valor, indicadores reales, proyectos destacados, servicios, capacidades y CTA. |
| `/quienes-somos` | PresentaciÃ³n, historia, misiÃ³n/visiÃ³n/valores, timeline y equipo si hay contenido vÃ¡lido. |
| `/servicios` | JerarquÃ­a, claridad de servicios, imÃ¡genes/iconos, escaneabilidad y CTA. |
| `/proyectos` | Portafolio, filtros, tarjetas, carga progresiva, estados sin resultados y consistencia de imÃ¡genes. |
| `/proyectos/:slug` | Imagen principal, descripciÃ³n, galerÃ­a, metadatos disponibles, navegaciÃ³n a otros proyectos y contacto. |
| `/contacto` | Formulario, instrucciones, validaciÃ³n, estados de envÃ­o, informaciÃ³n confirmada y errores. |

Comprobar por separado el panel admin (`/admin/login`, dashboard, proyectos, servicios,
contenido, mensajes). El objetivo prioritario es el sitio pÃºblico; el panel solo recibe
ajustes de consistencia cuando sean Ãºtiles, sin convertirlo en reescritura independiente.

### 3. AuditorÃ­a visual (con ejemplos concretos)
Registrar:
- Problemas de jerarquÃ­a y orden de lectura.
- Secciones demasiado densas, vacÃ­as, repetitivas o desconectadas.
- Diferencias de espaciado, bordes, radios, sombras, iconos, tamaÃ±os de texto y estados hover/focus.
- Problemas de recorte, resoluciÃ³n, proporciones o carga de fotografÃ­as.
- MenÃºs poco claros, CTAs compitiendo, filtros difÃ­ciles de percibir, formularios confusos.
- Elementos que parecen plantilla genÃ©rica y no transmiten identidad constructora.
- Desbordamiento horizontal, texto pequeÃ±o y problemas de navegaciÃ³n en mÃ³vil.
- Componentes que ya funcionan bien y deben conservarse.

### 4. Registro de hallazgos
Crear/actualizar `docs/ui-audit.md` con la tabla:

| ID | PÃ¡gina/componente | Problema comprobado | Impacto para el usuario | Prioridad | SoluciÃ³n propuesta | Forma de verificar |
|---|---|---|---|---|---|---|

Clasificar cada hallazgo: **P0 crÃ­tico / P1 alto / P2 medio / P3 bajo**. P0 incluye regresiones
funcionales, accesibilidad bÃ¡sica rota, errores de carga o exposiciÃ³n de datos. No marcar algo
como problema sin poder seÃ±alar la evidencia.

**VerificaciÃ³n / criterio de salida:** mapa tÃ©cnico y de rutas, capturas iniciales, lista
priorizada de hallazgos y diagnÃ³stico de componentes reutilizables. **Continuar sin esperar
aprobaciÃ³n salvo bloqueo real.**

**Origen:** [A] Paso 2 (secciones 2.1â€“2.4) Â· [B] Fase 0 (secciÃ³n 4).

### Handoff â€” Fase 01

**Estado:** Hecho (2026-10-14). **Entregable:** `docs/ui-audit.md` (actualizado).

**QuÃ© se hizo**
- Se re-ejecutaron los comandos de la Fase 00 y se ampliÃ³ la radiografÃ­a con
  **mediciones programÃ¡ticas del DOM** (Playwright headless) sobre las 6 rutas
  pÃºblicas Ã— 390/1440, mÃ¡s la lectura del baseline (`docs/design/baseline/`).
- Se documentÃ³ en `docs/ui-audit.md`: tÃ­tulo actualizado, **mapa tÃ©cnico** (stack,
  rutas, layouts, `data-access`, imÃ¡genes/Cloudinary, SEO, mÃ³vil), **inventario de
  componentes reutilizables** (a consolidar en Fase 05), **mapa de experiencia por
  ruta** y **diagnÃ³stico de entornos**.
- Tabla de hallazgos reformateada al esquema del plan
  (`ID | PÃ¡gina/componente | Problema | Impacto | Prioridad P0â€“P3 | SoluciÃ³n | VerificaciÃ³n`)
  con **18 hallazgos**.

**Hallazgos nuevos de esta sesiÃ³n (ademÃ¡s de #1â€“#11 previos)**
- #12 **P1** Lighthouse Accessibility = **95** (objetivo 100): `color-contrast` +
  `label-content-name-mismatch` en las 4 corridas.
- #13 **P2** Contraste: footer `text-white/40` sobre `bg-primary` = 3.83:1;
  `/proyectos` `text-muted-foreground/70` claro = 3.34:1 (< 4.5:1).
- #14 **P2** `aria-label` del logo no incluye el texto visible (2 por pÃ¡gina).
- #15 **P2** Chips de filtro de `/proyectos` = 37â€“39px (< 44px).
- #16 **P2** PÃ¡ginas muy largas en mÃ³vil: `/quienes-somos` 17195px, `/` 8681px @390.
- #17 **P3** Duplicidad de tokens en `styles.css` (`--text-*`, `--spacing-*`,
  `--shadow-*`, `--radius`) frente a Tailwind v4.
- #18 **P1 (contenido, no cÃ³digo)** `/contacto` renderiza `juankos0714@gmail.com`
  desde el **CMS remoto** (`environment.prod.ts` â†’ `â€¦ietjikoddwpdybarcwfk.supabase.co`),
  no el `gerencia.ingesocc@gmail.com` verificado en el repo.

**Evidencia clave**
- `docs/ui-audit.md` (#1â€“#18), `.lighthouseci/*.json`, `docs/design/baseline/baseline-metrics.json`.
- Fortalezas confirmadas: 1 `h1` por pÃ¡gina, sin `img` sin `alt`, sin `id` duplicados,
  sin controles sin nombre accesible, 0 overflow horizontal en 390/820/1440.

**Comandos / resultados**
```
pnpm build            # 689.70 kB inicial / 146.99 kB transfer (dist/ingesocc-web/browser)
node tools/serve-dist.mjs  (PORT=4175)   # sirve la build de producciÃ³n para el audit DOM
node <script Playwright temporal>        # h1/alt/ids/nombres/tap-targets por rutaÃ—viewport
```

**Bloqueos / notas para la Fase 02**
- **Entorno dev**: Supabase local `http://127.0.0.1:64321` no corriendo â†’ e2e
  `password-recovery.spec.ts:46` falla y hay REST 400/404. **No corregir la UI por esto.**
- **Admin no auditable** sin `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` (#4â€“#7 quedan pendientes).
- La build de producciÃ³n lee **Supabase remoto**; contiene contenido (p. ej. #18) que no
  estÃ¡ en el repo â†’ no confundir contenido del CMS con cÃ³digo.
- Los hallazgos #12â€“#15 deben **cerrarse en Fase 11** (control de calidad), no antes.
- #18 requiere acciÃ³n sobre **datos del CMS** (fuera del rediseÃ±o): reportar al cliente.

**Siguiente (Fase 02):** moodboard escrito (UI.live), contrato de motion
(prompt-motion) y polÃ­tica de iconos (itshover con licencia), con la matriz de decisiones
de `docs/directrices/plan-accion-rediseno-visual.md` Â§2.1â€“2.4.

---

## FASE 02 â€” Moodboard (referencias y direcciÃ³n visual/movimiento)

**Objetivo:** decidir con intenciÃ³n quÃ© patrones se adoptan, adaptan o descartan de las tres
referencias, y dejar la direcciÃ³n de arte registrada.

**Prerrequisitos:** Fase 01 cerrada.

### 2.1 UI.live â€” patrones de interfaz
Referencia: `https://ui.live/components` (galerÃ­a de "design drops", **no es librerÃ­a ni da cÃ³digo**).
Construir un **moodboard escrito** explorando Explore/Trending (composiciÃ³n corporativa,
arquitectura, construcciÃ³n, real estate, portafolios). Extraer **principios**, no copiar shots.

Matriz de decisiÃ³n (de [A] 3.1):

| PatrÃ³n | DecisiÃ³n | AplicaciÃ³n concreta en INGESOCC | LÃ­mites |
|---|---|---|---|
| **Cards** | Adoptar | Tarjetas editoriales de proyectos y servicios; imagen protagonista, tÃ­tulo claro, categorÃ­a discreta, acceso evidente al detalle. | No convertir todo el sitio en cuadrÃ­cula de cajas con sombra. |
| **Navigation / menus** | Adoptar | Header simple, jerarquÃ­a clara, estado activo reconocible, menÃº mÃ³vil usable, CTA de contacto sin competir con el logo. | Evitar megamenÃºs o navegaciÃ³n tipo dashboard sin justificaciÃ³n. |
| **Typography** | Adoptar | JerarquÃ­a consistente: titular, texto intro, encabezados, etiquetas, cuerpo. | Sin tipografÃ­a cinÃ©tica ni display que perjudique lectura corporativa. |
| **Buttons / links** | Adoptar | Un CTA principal y acciones secundarias subordinadas; estados hover/focus/active/disabled coherentes. | No presentar cada enlace como botÃ³n relleno. |
| **Responsive** | Adoptar (obligatorio) | NavegaciÃ³n, cards, galerÃ­as, espaciado, formularios, imÃ¡genes y CTA en mÃ³vil/tablet/escritorio. | No limitarse a cambiar columnas: verificar lectura, foco, recorte y usabilidad tÃ¡ctil. |
| **Filters / tags** | Adoptar | Chips accesibles para categorÃ­as; selecciÃ³n activa perceptible; teclado. | No mostrar categorÃ­as inexistentes ni filtros vacÃ­os. |
| **Forms / inputs** | Adoptar | Etiquetas persistentes, ayudas, errores asociados, carga y confirmaciÃ³n. | No depender solo de placeholders/color/iconos para errores. |
| **Toasts / notifications** | Adaptar | Feedback discreto, sobre todo en CMS; en formularios crÃ­ticos mantener mensaje persistente. | No convertir cada interacciÃ³n pÃºblica en notificaciÃ³n flotante. |
| **Tabs / steps** | Condicional | Solo si el contenido se beneficia de pestaÃ±as/pasos. | No convertir la secciÃ³n corporativa en asistente multipaso. |
| **Dark mode** | No aÃ±adir | Mantener identidad actual. | No es objetivo de negocio; duplica contraste y pruebas. |
| **Dashboard / charts / tables / chat** | Descartar en pÃºblico | Conservar solo donde ya sean funcionales en el panel. | Sin grÃ¡ficos, mÃ©tricas sintÃ©ticas, chat falso ni estÃ©tica B2B. |
| **Glassmorphism / partÃ­culas / decoraciones** | No usar como direcciÃ³n | Preferir superficies sÃ³lidas, foto autÃ©ntica, tipografÃ­a y espacio. | Evitar desenfoques pesados y transparencias decorativas. |

**Criterio de UI.live:** calidad de interacciÃ³n, estados claros, consistencia y responsive;
**no** adopciÃ³n indiscriminada de tendencias.

### 2.2 Prompt Motion â€” movimiento narrativo
Referencia: `https://prompt-motion.com/` (**videos y prompts, no componentes web**).
Seleccionar estÃ©tica **editorial, arquitectÃ³nica, contenida y rÃ¡pida**. CategorÃ­as: Product UI,
Phone, Charts, Diagrams, Kinetic type, Shapes, Particles, Characters, Photos, Music, Code.

| PatrÃ³n de motion | DecisiÃ³n | Uso previsto | LÃ­mites |
|---|---|---|---|
| **Revelado progresivo de fotografÃ­as** | Adoptar con moderaciÃ³n | MÃ¡scaras simples/apariciÃ³n por opacidad al entrar galerÃ­a en viewport. | Una animaciÃ³n por entrada; contenido visible si falla el script. |
| **ApariciÃ³n escalonada de grupos** | Adoptar con moderaciÃ³n | TÃ­tulo+descripciÃ³n de secciÃ³n y luego tarjetas, retrasos pequeÃ±os. | No animar cada elemento; evitar cascadas largas. |
| **Kinetic typography** | Adaptar mÃ­nimo | Entrada suave de un titular clave del hero. | No animar letra por letra en toda la web. |
| **Desplazamiento/parallax** | Opcional y mÃ­nimo | Diferencia muy pequeÃ±a de profundidad en hero fotogrÃ¡fico. | Sin scroll hijacking; sin parallax obligatorio en mÃ³vil. |
| **Transiciones entre estados** | Adoptar | Filtros, expansiÃ³n de galerÃ­a, estados de botones, menÃº mÃ³vil. | No interrumpir navegaciÃ³n, validaciÃ³n ni lectura. |
| **CÃ¡mara 3D, partÃ­culas, morphing, showreels** | Descartar global | No se necesitan para una constructora confiable. | Sin motor 3D, canvas pesado ni vÃ­deo generativo de fondo. |
| **AnimaciÃ³n en bucle** | Descartar por defecto | Ninguna animaciÃ³n permanente para la base. | Evitar movimiento continuo que compita con foto/texto/a11y. |

**Contrato de movimiento (rangos iniciales, no rÃ­gidos):** microinteracciones **120â€“180 ms**;
cambios de componentes **180â€“280 ms**; revelados de secciÃ³n **250â€“450 ms**. Preferir `transform`
y `opacity`. Respetar `prefers-reduced-motion`; contenido legible sin animaciÃ³n; en mÃ³vil
efectos mÃ¡s discretos; sin animaciones que retrasen el hero; el movimiento no debe ocultar
focus, errores ni botones.

### 2.3 ItsHover â€” iconos con propÃ³sito
Referencias: `https://www.itshover.com/` y `https://github.com/itshover/itshover`
(componentes React + Motion; **no se pueden instalar tal cual en Angular**).
Antes de portar cÃ³digo: **revisar licencia**; si permite uso/modificaciÃ³n, conservar atribuciÃ³n
en `THIRD_PARTY.md`; si hay duda, **recrear desde cero** (mismo concepto, SVG propio sobre geometrÃ­a Lucide).

Adaptar: flecha que avanza en hover sobre "Ver proyecto"; icono de menÃº que cambia abrir/cerrar;
chevron que acompaÃ±a una expansiÃ³n real; icono de envÃ­o con feedback breve; transiciÃ³n corta en
iconos de contacto/navegaciÃ³n con acciÃ³n real.

Reglas tÃ©cnicas: mantener `@lucide/angular` como base; implementar solo lo necesario con
CSS/SVG/APIs nativas; movimiento de trazo, desplazamiento corto o rotaciÃ³n pequeÃ±a con
significado; decorativos con `aria-hidden="true"`; no crear catÃ¡logo de cientos de iconos;
no instalar `motion/react`, React, Shadcn ni dependencias solo para hover; si no comunica estado, dejar estÃ¡tico.

### 2.4 DirecciÃ³n de arte elegida para INGESOCC
- **Base:** editorial corporativo, limpio y arquitectÃ³nico, con fotografÃ­a de obra de alta
  calidad y abundante espacio en blanco.
- **UI:** componentes claros, estados previsibles, filtros legibles, CTA de alto contraste.
- **Motion:** microinteracciones rÃ¡pidas y revelados discretos; ningÃºn espectÃ¡culo constante.
- **Iconos:** Lucide coherente con animaciones selectivas.
- **SensaciÃ³n:** tÃ©cnica, sÃ³lida, transparente, contemporÃ¡nea y confiable.

### 2.5 Entregables
- `docs/design-reference-audit.md` con la matriz:

  | Recurso | PatrÃ³n evaluado | Elegido / Adaptado / Descartado | PÃ¡gina o componente | RazÃ³n de negocio/UX | Coste/riesgo tÃ©cnico | Evidencia o prueba |
  |---|---|---|---|---|---|---|

- `docs/design/moodboard.md` con **8â€“12 principios concretos** y a quÃ© zona aplican.
- `docs/design/motion-language.md` con tokens de movimiento + tabla "referencia â†’ implementaciÃ³n web".
- `docs/design/icons.md` (borrador) con el mapeo icono â†’ movimiento â†’ razÃ³n.

**VerificaciÃ³n / criterio de salida:** decisiones visuales justificadas y lÃ­mites tÃ©cnicos claros;
se evidencia que se eligiÃ³ intencionalmente (no se copiaron todas las caracterÃ­sticas).

**Origen:** [A] Paso 3 (3.1â€“3.5) Â· [B] Fase 0 Â§4.5 + secciÃ³n 2.

### Handoff â€” Fase 02

**Estado:** Hecho (2026-10-14).

**Entregables creados/actualizados**
- `docs/design/moodboard.md` â€” 12 principios concretos + matriz UI.live (patrÃ³n â†’
  decisiÃ³n â†’ aplicaciÃ³n â†’ lÃ­mite) + quÃ© se conserva.
- `docs/design/motion-language.md` â€” estÃ©tica elegida, **tokens de movimiento**
  (duraciÃ³n/easing/stagger/distancia), contrato de movimiento y tabla
  **referencia (prompt-motion) â†’ implementaciÃ³n web**.
- `docs/design/icons.md` (borrador) â€” polÃ­tica de iconos + tabla icono â†’ movimiento â†’ razÃ³n.
- `docs/design-reference-audit.md` â€” reescrito con la **matriz del plan**
  (`Recurso | PatrÃ³n | Elegido/Adaptado/Descartado | PÃ¡gina/componente | RazÃ³n | Coste/riesgo | Evidencia`).

**Decisiones clave**
- Adoptar: mosaico editorial (ui.live), motion tokenizado y contenido (prompt-motion),
  iconos con intenciÃ³n (itshover). Descartar en pÃºblico: dark mode, dashboards/charts,
  glassmorphism/partÃ­culas, 3D y animaciones en bucle.
- Movimiento: solo `transform`/`opacity`, una vez, sin bucle (salvo spinner de `loading`);
  todo se anula con `prefers-reduced-motion`.
- **Licencia itshover verificada: Apache-2.0** â†’ permite uso/modificaciÃ³n con atribuciÃ³n;
  se decide **recrear** iconos desde geometrÃ­a Lucide (sin portar React), con atribuciÃ³n
  en `THIRD_PARTY.md` (Fase 04) solo si se portara algÃºn patrÃ³n.

**Tokens propuestos (a implementar en Fase 03, ver `motion-language.md`)**
- Duraciones: `--motion-duration-instant/fast/base/slow/slower` (100/160/220/360/560 ms).
- Easings: `--motion-ease-out`, `--motion-ease-in-out`, `--motion-ease-emphasis`.
- Soporte: `--motion-stagger` (60 ms), `--motion-distance-sm/md` (8/16 px).
- Nota: los tokens actuales (`--duration-fast/normal/slow` = 200/300/500 ms) se migran
  en Fase 03; el `.media-zoom` a 0.7 s se reduce a `--motion-duration-slow`.

**VerificaciÃ³n / criterio de salida**
- Decisiones justificadas y con lÃ­mites; se evidencia elecciÃ³n intencional (no copia),
  en las cuatro matrices.

**Bloqueos/observaciones**
- El modelo no lee imÃ¡genes: el moodboard es de **principios**, no de shots. RevisiÃ³n
  visual humana recomendada sobre `docs/design/baseline/screenshots/`.
- Sin rastreo del sitio de obra (`laholanda.ingesocc.com`); no bloquea Fases 03+.

**Siguiente (Fase 03 â€” Cimientos):** consolidar tokens en `@theme` (`src/styles.css`),
resolver duplicados/tokens (#17), tipografÃ­a fluida, espaciado y estados. Prerrequisito:
Fase 02 cerrada (lo estÃ¡).

---

## FASE 03 â€” Cimientos (sistema de diseÃ±o)

**Objetivo:** consolidar una base visual reusable antes de rediseÃ±ar pÃ¡gina por pÃ¡gina.
Trabajar con variables/utilidades/componentes existentes; consolidar lo duplicado en vez de
crear otra capa paralela.

**Prerrequisitos:** Fase 02 cerrada.

### 3.1 Tokens de diseÃ±o (Tailwind v4 `@theme`)
Centralizar en `@theme` y documentar:
- **Color:** `--color-ink` (#171717), `--color-accent` (#f25623),
  `--color-accent-deep` (#a53a0c), escala de neutros (50â†’950), superficies
  (`surface`, `surface-raised`, `surface-inverse`), semÃ¡nticos (success/warn/error con
  contraste AA), overlay/gradientes para legibilidad de texto sobre foto.
- Definir/documentar tokens semÃ¡nticos: fondo de pÃ¡gina, superficie, superficie secundaria,
  bordes, texto principal/secundario/baja prioridad, marca, acento accesible, hover/active/focus,
  Ã©xito/advertencia/error (con texto e iconos ademÃ¡s del color), radios, sombras, ancho de
  contenido, gutters y escala de espaciado.
- No reemplazar ni multiplicar los colores de marca. **Confirmar los tokens reales en
  `src/styles.css` y su contraste.** Mantener la distinciÃ³n: naranja brillante para superficies/
  acentos donde el contraste lo permita y `accent-deep` para texto pequeÃ±o sobre fondos claros.
  **No usar `#f25623` como texto sobre blanco si no supera contraste.**
- Neutros adicionales derivados del lenguaje existente, comprobados; sin paleta arcoÃ­ris ni
  colores de estado como decoraciÃ³n.

### 3.2 TipografÃ­a
1. Inspeccionar familias cargadas, licencia, pesos y rendimiento.
2. Reutilizar la familia actual si es apropiada; no aÃ±adir fuentes externas ni mÃºltiples
   familias sin razÃ³n demostrable.
3. Definir **una** display (carÃ¡cter fuerte de ingenierÃ­a/arquitectura: sans geomÃ©trica/grotesk,
   peso 600â€“800) + **una** de texto (muy legible) si hace falta; autoalojadas
   (`font-display: swap`, subset latin + latin-ext, `preload` solo de la crÃ­tica) para no afectar LCP.
4. Escala fluida con `clamp()` (hero, h1â€“h4, body, small, eyebrow); `text-wrap: balance` en
   titulares y `pretty` en pÃ¡rrafos.
5. Limitar ancho de lectura; controlar longitud de lÃ­nea e interlineado.
6. Hero contundente sin dominar toda la pantalla ni forzar saltos de lÃ­nea.
7. Evitar mayÃºsculas extensas, tracking excesivo, titulares estrechos o cuerpo reducido.

### 3.3 Espaciado, contenedor y composiciÃ³n
- Escala coherente basada en tokens existentes (base 4/8 px); secciones con padding vertical fluido (`clamp`).
- Ancho mÃ¡ximo de contenido y gutters responsive en todas las pÃ¡ginas.
- Suficiente separaciÃ³n entre secciones.
- RetÃ­cula consistente, permitiendo composiciÃ³n editorial en hero, capacidades y galerÃ­a.
- Evitar cards anidadas, contenedores dentro de contenedores y bordes redundantes.
- Radios consistentes (sobriedad, no esquinas exageradas). Sombras discretas con razÃ³n visual
  (no toda tarjeta necesita sombra). 3 niveles de elevaciÃ³n; bordes finos 1 px; sombras suaves de baja opacidad.

### 3.4 Estados
`focus` ring visible y consistente (`:focus-visible`, 2 px accent con offset), hover, active,
disabled, loading, success, error.

### 3.5 Entregables
- `docs/design-system.md` con tokens, reglas tipogrÃ¡ficas, decisiones de componentes, estados
  y capturas de referencia.
- `docs/design/decisions.md` con decisiones ambiguas resueltas (sobriedad/accesibilidad).

**VerificaciÃ³n / criterio de salida:** tokens aplicados y documentados; contraste verificado
(sobre todo textos y enlaces de acento); base de estilos reusable antes de rediseÃ±ar pÃ¡ginas.

**Origen:** [A] Paso 4 (4.1â€“4.3) Â· [B] Fase 1 Â§5.1.

### Handoff â€” Fase 03

**Estado:** Hecho (2026-10-14).

**Objetivo:** centralizar y documentar el sistema de diseÃ±o como base reusable antes
de rediseÃ±ar pÃ¡ginas.

**QuÃ© se hizo**
- `src/styles.css`: reescritos los bloques `@theme inline` y `:root` a un set de
  **tokens semÃ¡nticos** documentado. Nuevos: `--ink`, `--surface-raised`,
  `--surface-inverse`, `--on-dark-muted`, estado `--warning/-soft`, `--error/-soft`,
  `--info/-soft`, escala `--neutral-50â€¦950`, `--content-max`, `--gutter`, `--measure`,
  `--elevation-1/2/3`, escala display fluida `--text-display-1â€¦4` + `--leading-*` +
  `--tracking-display`. Se **eliminaron** los tokens muertos `--spacing-*`, `--text-*`
  y `--shadow-*` (hallazgo #17).
- `@theme inline`: expuestas las utilidades nuevas (`bg-neutral-*`, `text-warning`,
  `shadow-elevation-2`, `text-display-2`â€¦). Se conservaron intactos los nombres
  existentes (`bg-background`, `text-foreground`, `bg-primary`, `border-border`â€¦):
  **0 cambios en plantillas**.
- `.wrap` ahora usa `--content-max` / `--gutter` (mismos valores 1.25/2/3rem);
  `.btn`, `.field` y `:focus-visible` usan `var(--radius)`.
- Base: `h1â€“h3 { text-wrap: balance }`, `p { text-wrap: pretty }`.
- Motion: sin cambios (se migra en Fase 04); `docs/design/motion-language.md` se
  alineÃ³ a los nombres canÃ³nicos del plan (`--motion-fast/base/slow/hero`, etc.).

**Entregables**
- `docs/design-system.md` â€” reescrito: tipografÃ­a fluida, y tablas de color
  (base/superficies/marca/estado/neutros) con ratios de contraste, espaciado/layout/
  radios/elevaciÃ³n, estados (Â§3.4), motion, componentes, accesibilidad.
- `docs/design/decisions.md` â€” **nuevo**: 10 decisiones ambiguas resueltas
  (sobriedad/accesibilidad) con evidencia.

**VerificaciÃ³n**
- Contraste WCAG calculado con script: `#f25623` sobre blanco **3.43:1** (solo
  acento/superficie; nunca texto pequeÃ±o) vs `#accent-deep` **6.54:1**; estado
  success/warning/error/info **â‰¥ 6.5:1** sobre su `*-soft` y sobre blanco;
  `--on-dark-muted` **8.67:1** sobre ink.
- `pnpm build` OK (styles 65.34 kB raw / 9.57 kB transfer; initial 689.71 kB / 147.04 kB).
- `pnpm test:ci` â†’ **164/164 SUCCESS**.
- `pnpm test:visual` â†’ 0 warn Â· 0 FAIL (sin regresiones de layout).
- Sin cambios de plantillas: los nombres de tokens/utilities previos se mantienen.

**Riesgos / notas**
- Los tokens nuevos (neutros, estado, display fluida, elevaciÃ³n) estÃ¡n disponibles
  pero **aÃºn no se aplican** en componentes/pÃ¡ginas: se consumen en Fases 05â€“10.
- Pendientes de a11y derivados de tokens (aplicaciÃ³n en fase de pÃ¡gina): footer
  `text-white/40` â†’ `--on-dark-muted` (#13), `aria-label` del logo (#14), chips
  < 44 px (#15).
- Entorno: e2e con 1 fallo por Supabase local caÃ­do y 3 skipped por falta de
  `E2E_ADMIN_*`; ambientales, no defectos de UI.

**Siguiente (Fase 04 â€” CinÃ©tica):** implementar tokens de movimiento canÃ³nicos,
directiva `Reveal`, sistema de iconos animados y `THIRD_PARTY.md`.

---

## FASE 04 â€” CinÃ©tica (sistema de movimiento e iconos)

**Objetivo:** implementar el lenguaje de movimiento y el sistema de iconos animados con
intenciÃ³n, accesibles y sin coste de rendimiento.

**Prerrequisitos:** Fase 03 cerrada.

### 4.1 Tokens de movimiento
- Duraciones: `--motion-fast: 150ms`, `--motion-base: 300ms`, `--motion-slow: 600ms`,
  `--motion-hero: 900ms`.
- Easings: `--ease-out: cubic-bezier(.22,1,.36,1)` (entradas),
  `--ease-in-out: cubic-bezier(.65,0,.35,1)` (transiciones),
  `--ease-spring-soft` aproximado con `linear()` si hay soporte.
- Stagger: 60â€“90 ms entre hermanos, mÃ¡ximo 8 elementos escalonados (el resto entra junto).
- Distancias: entradas de 16â€“24 px (nunca >40 px) + opacidad.

### 4.2 ElecciÃ³n de herramienta por necesidad (en este orden)
1. **CSS puro** (transitions, `@keyframes`, `:hover`/`:focus-visible`) para microinteracciones.
2. **CSS scroll-driven** (`animation-timeline: view()`/`scroll()`) con `@supports` para reveals y parallax sutil.
3. **`IntersectionObserver`** vÃ­a directiva `Reveal` como fallback universal (una sola instancia
   compartida, `unobserve` tras revelar).
4. **View Transitions API** para navegaciÃ³n entre rutas (Angular `withViewTransitions()`) con fallback.
5. **Web Animations API / librerÃ­a ligera** (p. ej. `motion` de motion.dev, carga `import()` diferido)
   solo para secuencias complejas (hero, contadores). Evitar GSAP/Lottie/three.js salvo justificaciÃ³n.
6. **Angular Animations** (`@angular/animations`): no usar si el CSS cubre el caso.

### 4.3 Sistema de iconos animados (detalle)
1. Crear `src/app/shared/icons/` con directiva `appIconMotion`
   (inputs: `motion = 'rotate' | 'nudge-x' | 'nudge-up' | 'pop' | 'draw' | 'shake' | 'pulse'`,
   `trigger = 'hover' | 'focus' | 'parent' | 'inview'`).
2. Cada movimiento con `@keyframes` en CSS, disparado por clases/atributos `data-*`;
   `trigger: parent` permite que la tarjeta/botÃ³n completo active el icono.
3. Mapeo sugerido (ajustar tras auditorÃ­a): engranajeâ†’`rotate`; enviarâ†’`nudge-x`+despegue;
   flecha CTAâ†’`nudge-x`; mensajeâ†’`pop`; campanaâ†’`shake`; candado/escudoâ†’`draw`/cierre;
   check de Ã©xitoâ†’`draw` (stroke).
4. Reduced-motion: sin animaciÃ³n (icono estÃ¡tico).
5. Documentar en `docs/design/icons.md` quÃ© icono usa quÃ© movimiento y por quÃ©. Si se portÃ³
   cÃ³digo de itshover: `THIRD_PARTY.md` con licencia y atribuciÃ³n.
6. Peso: sin dependencias nuevas; CSS de iconos mÃ­nimo y compartido.

### 4.4 Entregables
- `docs/design/motion-language.md` (tokens definitivos + tabla referencia â†’ implementaciÃ³n).
- `docs/design/icons.md` (mapeo completo).
- `src/app/shared/icons/` (directiva `appIconMotion`, `Reveal`, `Counter`).
- `THIRD_PARTY.md` (si aplica).

**VerificaciÃ³n / criterio de salida:**
- Directivas funcionan en hover/focus/parent/inview; respetan `prefers-reduced-motion`.
- Sin CLS; solo se animan `transform`/`opacity` (+ `clip-path`/`stroke-dashoffset` puntuales).

**Origen:** [A] Paso 3.2/3.3 + Fase G Â· [B] Fase 1 Â§5.3 + Â§7.

### Handoff â€” Fase 04
> (escribir aquÃ­)

---

## FASE 05 â€” Andamios (componentes globales)

**Objetivo:** primitivos compartidos consistentes, accesibles y sin regresiÃ³n funcional.

**Prerrequisitos:** Fases 03 y 04 cerradas.

### Instrucciones detalladas
Auditar primero quÃ© componentes ya existen y refactorizar de forma incremental:
1. Header pÃºblico y navegaciÃ³n mÃ³vil.
2. Footer y bloque de contacto global.
3. BotÃ³n primario, secundario, enlaces de texto y CTA.
4. Encabezado de secciÃ³n (`SectionHeading`: eyebrow + tÃ­tulo + descripciÃ³n) y etiqueta editorial.
5. Card de proyecto y card de servicio.
6. Chip de filtro y estado activo.
7. GalerÃ­a, imagen de portada, miniatura y `Lightbox` (si ya existe o es necesario).
8. Campo de formulario, mensaje de ayuda, error y confirmaciÃ³n.
9. `Skeleton`, empty state y mensaje de fallo.
10. `Reveal` (directiva), `Counter` (directiva), `AnimatedIcon`, `Divider` (lÃ­nea blueprint), `Marquee` (si se usa).

Cada componente: responsabilidad clara, API sencilla, tipado adecuado, estados accesibles y
estilos compartidos. No abstracciones excesivas para un Ãºnico caso; evitar copiar/pegar bloques
de estilo por pÃ¡gina.

### Entregable
- SecciÃ³n de componentes de `docs/design-system.md` (API, estados, uso).

**VerificaciÃ³n / criterio de salida:** componentes consistentes sin regresiÃ³n funcional;
inventario documentado y dÃ³nde se usan.

**Origen:** [A] Paso 4.4 + Fase E Â· [B] Fase 1 Â§5.2.

### Handoff â€” Fase 05
> (escribir aquÃ­)

---

## FASE 06 â€” Escaparate (Home)

**Objetivo:** portada corporativa que responda rÃ¡pido: quiÃ©n es INGESOCC, quÃ© hace, quÃ©
proyectos demuestran su capacidad y cÃ³mo contactar.

**Prerrequisitos:** Fase 05 cerrada.

### 6.1 Hero
- FotografÃ­a real y relevante de una obra/proyecto (calidad y derechos confirmados). La imagen
  aporta contexto, no compite con el titular. Texto con contraste comprobado en todos los recortes.
- Usar contexto `hero` de Cloudinary, **LCP priorizado** (`fetchpriority="high"`, no
  `loading="lazy"`). Overlay degradado para legibilidad. **Cero movimiento que afecte el LCP.**
- Titular claro sobre la actividad real; no inventar eslogan factual ni promesas absolutas.
  Si el contenido actual del CMS es correcto, conservarlo o mejorarlo sin cambiar el significado.
- Titular con **entrada tipo kinetic type** por lÃ­neas/palabras (mÃ¡scara `overflow:hidden` +
  `translateY`, stagger ~70 ms). **El texto debe existir en el DOM de inmediato** (legible/indexable sin JS).
- Secuencia: titular â†’ subtÃ­tulo â†’ CTAs â†’ indicador de scroll. SubtÃ­tulo breve y acciÃ³n primaria
  clara hacia proyectos/contacto; segunda acciÃ³n solo si se justifica.
- Detalle de marca opcional: lÃ­nea tipo plano/blueprint (SVG `stroke-dashoffset`) o retÃ­cula sutil, **muy discreta**.
- Indicador de scroll animado (solo `transform`; se oculta con reduced-motion).
- **Evitar** sliders automÃ¡ticos, carruseles de hero y vÃ­deos pesados de fondo.

### 6.2 Secciones siguientes (orden recomendado, sujeto a contenido real)
1. Breve presentaciÃ³n de INGESOCC.
2. Proyectos destacados como evidencia visual.
3. Servicios con jerarquÃ­a escaneable.
4. Capacidades/proceso/diferenciadores solo si hay contenido autÃ©ntico.
5. CTA final de contacto directo y sin exageraciones.

No convertir la pÃ¡gina en lista interminable de cards; combinar zonas fotogrÃ¡ficas amplias,
bloques de texto cortos y espacio en blanco con ritmo editorial.

### 6.3 EstadÃ­sticas
- Contadores que cuentan desde 0 al entrar en viewport (`Counter`, 1.2â€“1.6 s, `ease-out`,
  `font-variant-numeric: tabular-nums`). Con reduced-motion: mostrar el valor final directo.
- Grid con separadores finos; nÃºmero grande (display) + etiqueta pequeÃ±a. Valores desde `content_blocks`.
- No inventar mÃ©tricas; si no hay datos respaldados, no mostrar contador.

### 6.4 Proyectos destacados
- Cards con imagen (`aspect-ratio` fijo), tÃ­tulo, categorÃ­a (chip). Hover: zoom suave
  (`scale` 1.04, ~500 ms) + elevaciÃ³n + flecha animada; overlay de informaciÃ³n en foco/hover con
  equivalente tÃ¡ctil.
- Entrada escalonada (`Reveal`). Layout **bento/asimÃ©trico** en escritorio (1 destacado grande +
  secundarios), 1 columna en mÃ³vil.
- Enlace "Ver todos los proyectos" con icono animado.

### 6.5 Servicios y "Capacidad"
- Tarjetas de servicio con **icono animado** que se activa en hover/focus de **toda la tarjeta**
  (`trigger: parent`), no solo del icono.
- "Capacidad": visualizaciÃ³n clara; si hay barras/proporciones, animar con `scaleX` desde el
  origen (no `width`).
- Divisores de secciÃ³n tipo blueprint que se "dibujan" al entrar en viewport.

**VerificaciÃ³n / criterio de salida:** escritorio y mÃ³vil OK; LCP sin regresiÃ³n; sin overflow;
contenido del hero legible sin JS.

**Origen:** [A] Paso 5.2 + Fase F.1 Â· [B] Â§6.2â€“6.5.

### Handoff â€” Fase 06
> (escribir aquÃ­)

---

## FASE 07 â€” Portafolio (Proyectos + detalle + La Holanda)

**Objetivo:** presentar el portafolio como prueba de capacidad, con fotografÃ­a protagonista.
Es una de las secciones prioritarias.

**Prerrequisitos:** Fase 06 cerrada.

### 7.1 Listado `/proyectos`
- ImÃ¡genes protagonistas, proporciones coherentes y recorte cuidadoso.
- Cada tarjeta: tÃ­tulo claro, categorÃ­a solo si existe en los datos, invitaciÃ³n inequÃ­voca a explorar.
- RetÃ­cula editorial equilibrada, alineaciones consistentes, suficiente espacio. No forzar
  asimetrÃ­a solo por parecer moderna.
- **Barra de filtros por categorÃ­a como chips**: chip activo con transiciÃ³n de fondo/posiciÃ³n
  (indicador deslizante), `aria-pressed`, navegable con teclado, scroll horizontal con snap en mÃ³vil.
- Conservar categorÃ­as y lÃ³gica de filtros existente; opciÃ³n activa visible; foco de teclado.
- **Cambio de filtro:** transiciÃ³n de cards (fade/reordenamiento con View Transitions o `FLIP`
  ligero; fallback: fade simple). Sin saltos de layout.
- **"Cargar mÃ¡s" (bloques de 8):** botÃ³n con estado loading, **skeletons** durante la carga,
  cards nuevas con stagger; mover foco al primer elemento nuevo o anunciar con `aria-live="polite"`.
- Respetar la paginaciÃ³n/"Cargar mÃ¡s" actual (incluidos bloques de ocho); no alterar la lÃ³gica.
- Estados: carga (skeleton), vacÃ­o (ilustrado y sobrio), error y fin de resultados.
- No alterar el significado de `featured`, `draft`, `published` ni permisos de visibilidad.
  La informaciÃ³n publicada procede de Supabase o de los datos de respaldo; el pÃºblico es solo lectura.

### 7.2 Detalle `/proyectos/:slug`
Debe sentirse como reportaje de proyecto, no ficha genÃ©rica.
- Cabecera con imagen principal (`cover`/`hero`), tÃ­tulo, categorÃ­as, y metadatos reales
  (categorÃ­a, ubicaciÃ³n, periodo, dimensiones o valor, solo si existen).
- "Valor en salarios mÃ­nimos" presentado como dato destacado (con `Counter` si aplica), solo si existe.
- DescripciÃ³n legible con buena jerarquÃ­a, ancho de lectura y separaciÃ³n de pÃ¡rrafos.
- **GalerÃ­a** (contexto `gallery` 1200Ã—900): grid + **Lightbox** accesible (foco atrapado,
  flechas/Esc, swipe en mÃ³vil, precarga de la siguiente imagen, `aria-label` "imagen X de N",
  transiciÃ³n con `transform/opacity`).
- NavegaciÃ³n "proyecto anterior / siguiente" y proyectos relacionados al final.
- Camino obvio al listado y CTA de contacto.
- TransiciÃ³n compartida de imagen desde la card del listado (View Transitions con
  `view-transition-name` Ãºnico por slug) con fallback.
- Gestionar: imÃ¡genes ausentes, slug invÃ¡lido, proyecto no publicado y estados de carga.
- **No renderizar datos privados ni borradores al pÃºblico.**
- Aprovechar `cloudinary-urls.ts` y sus transformaciones (`hero`, `cover`, `gallery`, `thumbnail`).

### 7.3 Tratamiento de La Holanda
JerarquÃ­a **INGESOCC â†’ Proyectos â†’ La Holanda** (no reemplaza ni es la marca principal).
- Si ya existe en Supabase/seeds/contenido verificable, usar datos y medios reales.
- Si no existe ficha completa, **no inventar** datos: documentar faltantes y usar solo material autÃ©ntico.
- Priorizar fotografÃ­as reales de obra y descripciones detalladas. Organizar la galerÃ­a por
  contenido cuando lo permitan las descripciones, sin inventar etapas cronolÃ³gicas.
- No mezclar imÃ¡genes de distintos proyectos sin identificarlas.
- No afirmar porcentajes de avance, cantidades, metrajes, fechas ni estado si no estÃ¡n documentados.

**VerificaciÃ³n / criterio de salida:** filtros/paginaciÃ³n intactos; sin regresiones; datos
pÃºblicos reales; estados de error/vacÃ­o/carga resueltos; Lightbox accesible.

**Origen:** [A] Paso 5.5/5.6 + Fase F.2/F.3 Â· [B] Â§6.8â€“6.9.

### Handoff â€” Fase 07
> (escribir aquÃ­)

---

## FASE 08 â€” CatÃ¡logo y Trayectoria (Servicios + QuiÃ©nes Somos)

**Objetivo:** servicios escaneables y narrativa corporativa sin contenido inventado.

**Prerrequisitos:** Fase 07 cerrada.

### 8.1 Servicios `/servicios`
- Grid de los 6 servicios: foto (contexto `service` 800Ã—600) o icono de respaldo **coherente
  visualmente en ambos casos** (que no se vea "roto" cuando falta la foto).
- Que se entiendan con lectura rÃ¡pida: nombre, descripciÃ³n corta, imagen/icono apropiado y
  acciÃ³n asociada cuando corresponda.
- Usar fotografÃ­as autÃ©nticas del servicio si existen; si no, iconos consistentes en lugar de
  stock presentado como trabajo real.
- Hover/focus consistente con las tarjetas de Home. Entrada escalonada.
- Evitar iconos de estilos distintos, ilustraciones aleatorias y tarjetas con alturas/alineaciones
  incoherentes.
- Conservar la fuente de informaciÃ³n actual (CMS/servicio); no duplicar manualmente textos.

### 8.2 QuiÃ©nes Somos `/quienes-somos`
- JerarquÃ­a editorial, sin grandes bloques difÃ­ciles de recorrer.
- **Timeline** (historia): lÃ­nea vertical que se dibuja con el scroll (scroll-driven con fallback
  IO), hitos alternados en escritorio y una sola columna en mÃ³vil. **Solo si las fechas e hitos
  estÃ¡n verificados**; si no, presentar la historia sin fechas inventadas.
- MisiÃ³n/visiÃ³n/valores: los existentes o validados por el contenido; nunca inventados. Tarjetas
  con icono animado con intenciÃ³n (p. ej. bulb, star, lock/escudo).
- Equipo: solo con datos e imÃ¡genes reales y autorizadas; fotos con recorte consistente
  (`aspect-ratio`), hover sobrio, nombre/cargo siempre visibles (no solo en hover).
- Evitar contadores animados o estadÃ­sticas sin fuente real.
- Conectar la narrativa con proyectos y servicios sin repetir pÃ¡rrafos de Home.

**VerificaciÃ³n / criterio de salida:** sin textos/datos inventados; layouts responsive correctos;
timeline con h y fallback funcional.

**Origen:** [A] Paso 5.3/5.4 Â· [B] Â§6.6â€“6.7.

### Handoff â€” Fase 08
> (escribir aquÃ­)

---

## FASE 09 â€” Puente (Contacto + Footer + transversales)

**Objetivo:** camino de contacto claro y accesible; cierre global coherente.

**Prerrequisitos:** Fase 08 cerrada.

### 9.1 Contacto `/contacto`
- Formulario fÃ¡cil de localizar y completar: etiquetas visibles/persistentes, agrupaciÃ³n lÃ³gica,
  errores inline con `aria-describedby`, foco al primer error.
- Indicar quÃ© es requerido y por quÃ©; no solicitar datos innecesarios.
- Estados `enviando / Ã©xito / error` con icono animado (enviar â†’ check) y mensaje en
  `aria-live`. Prevenir dobles envÃ­os; error recuperable cuando falle.
- Mensajes de estado accesibles, no dependen solo del color ni de un toast fugaz.
- Panel de informaciÃ³n (telÃ©fono, email, direcciÃ³n, redes) con iconos con micro-movimiento en
  hover/focus. Enlaces `tel:` y `mailto:`. **Usar datos solo si estÃ¡n verificados** (la
  documentaciÃ³n advierte que algunos son placeholders: no convertirlos en reales por intuiciÃ³n).
- **Mantener la validaciÃ³n existente y el guardado en `contact_messages` y RLS: solo cambia la presentaciÃ³n.**

### 9.2 Footer
- Estructura clara y compacta: marca, navegaciÃ³n Ãºtil, contacto confirmado y enlaces legales/
  sociales que existan. Conservar la fuente de datos (`content_blocks`) para redes y contenido global.
- Iconos de redes con micro-animaciÃ³n, lÃ­nea superior blueprint, botÃ³n "volver arriba" accesible.
- No convertirlo en megasecciÃ³n con columnas irrelevantes.

### 9.3 Transversales
- **Transiciones de pÃ¡gina** (View Transitions) discretas: crossfade 200â€“300 ms; sin bloquear navegaciÃ³n.
- **404** y estados de error con diseÃ±o de marca (`src/app/features/not-found/`).
- **Skeletons** en todo lo que dependa de Supabase.
- **Barra de progreso de scroll** opcional y sutil (solo si no afecta rendimiento).
- **Cursor/efectos de mouse:** no usar.

**VerificaciÃ³n / criterio de salida:** validaciÃ³n y estados accesibles; datos placeholder no
convertidos en reales; guardado en `contact_messages` intacto; flujos E2E de contacto en verde.

**Origen:** [A] Paso 5.7/5.8 Â· [B] Â§6.10â€“6.12.

### Handoff â€” Fase 09
> (escribir aquÃ­)

---

## FASE 10 â€” Bastidores (Admin sobrio)

**Objetivo:** consistencia y accesibilidad del panel sin reescribir su arquitectura.

**Prerrequisitos:** Fase 09 cerrada.

### Instrucciones detalladas
- **Sobrio:** solo consistencia con tokens, mejor jerarquÃ­a, estados vacÃ­o/carga/error, feedback
  de guardado ("guardando/guardado/error") con micro-animaciÃ³n breve, y tablas legibles en mÃ³vil.
- **Sin animaciones decorativas.** Iconos animados Ãºnicamente en acciones (guardar, eliminar, subir imagen).
- No cambiar la arquitectura ni los flujos de gestiÃ³n de contenido.
- Si se modifica el sistema de botones/campos/mensajes/espaciado global, verificar todas las
  pantallas administrativas.
- No hacer un cambio visual global que provoque pÃ©rdida de contraste/visibilidad en el panel.
- Mantener separados los patrones de la web pÃºblica y del dashboard aunque compartan tokens.

**VerificaciÃ³n / criterio de salida:** admin funcionalmente intacto; contraste preservado;
CMS continÃºa editable con permisos correctos.

**Origen:** [A] Paso 5.9 + Fase F.7 Â· [B] Â§6.13.

### Handoff â€” Fase 10
> (escribir aquÃ­)

---

## FASE 11 â€” Control de Calidad (responsive, a11y, pruebas, rendimiento)

**Objetivo:** cerrar regresiones y validar calidad tÃ©cnica antes de la entrega.

**Prerrequisitos:** Fases 06â€“10 aplicadas.

### 11.1 Responsive y mÃ³vil primero
Comprobar al menos: **320, 375, 390, 412, 768, 1024, 1280 y 1440 px**, con al menos una prueba
en viewport estrecho y zoom del navegador. En cada ruta verificar:
- Sin overflow horizontal.
- Titular con saltos de lÃ­nea naturales.
- NavegaciÃ³n mÃ³vil con teclado y toque.
- Zonas tÃ¡ctiles ~44Ã—44 px cuando el contexto lo permita.
- Cards que cambian de columnas sin comprimir texto/imÃ¡genes.
- Filtros utilizables en pantallas estrechas; sin ocultar opciones.
- Formularios sin zoom involuntario ni campos minÃºsculos en mÃ³vil.
- ImÃ¡genes recortadas conservando el sujeto principal; altura que no consuma toda la pantalla.
- Animaciones mÃ¡s discretas en dispositivos modestos; respeto de reduced motion.
- MenÃº sticky, CTA flotantes y footer sin tapar contenido.
- PÃ¡ginas recorribles completas, no solo el primer viewport.

No usar breakpoints como soluciÃ³n automÃ¡tica: decidir el layout segÃºn el contenido y verificar
estados reales.

### 11.2 Accesibilidad (WCAG 2.2 AA, checklist por componente)
- SemÃ¡ntica HTML correcta y jerarquÃ­a de encabezados coherente; un Ãºnico H1 descriptivo por pÃ¡gina.
- Contraste de texto normal â‰¥4.5:1 y texto grande â‰¥3:1 (salvo excepciones de la norma).
  Comprobar expresamente `text-accent-deep` y utilities de color en enlaces.
- Todos los controles con teclado y foco visible; no eliminar outline sin sustituto contrastado.
- ImÃ¡genes informativas con `alt` pertinente; decorativas con `alt=""`/`aria-hidden`.
- Formularios: etiquetas, instrucciones, errores asociados al campo y estados anunciables.
- No comunicar Ã©xito/error/disponibilidad/selecciÃ³n solo con color.
- Sin animaciones que parpadeen/distraigan; respetar `prefers-reduced-motion`, `prefers-contrast`.
- Sin cambios bruscos de foco; sin capturar el scroll.
- Nombres accesibles para iconos dentro de botones/enlaces/controles.
- Revisar menÃº, filtros, galerÃ­a, paginaciÃ³n, formulario, mensajes y desplegables.
- Objetivos tÃ¡ctiles â‰¥44Ã—44 px; zoom 200 % sin pÃ©rdida de funcionalidad.

### 11.3 SEO y rendimiento
- Conservar tÃ­tulos, descripciones, canonical, Open Graph, sitemap, robots y JSON-LD existentes.
- Comprobar tÃ­tulos/descripciÃ³n por ruta; detalles de proyecto con metadatos correctos cuando haya datos.
- Un Ãºnico H1 descriptivo; enlaces internos claros entre Home/Servicios/Proyectos/detalle/Contacto.
- Sin keywords artificiales ni afirmaciones no confirmadas. Verificar rutas profundas y fallback SPA.
- No cambiar el dominio canÃ³nico placeholder sin confirmaciÃ³n (registrar el pendiente).
- Rendimiento: evitar librerÃ­as pesadas, vÃ­deos de fondo, canvas 3D; priorizar imagen LCP con
  tamaÃ±o adecuado; lazy bajo el fold, no en hero LCP; dimensiones explÃ­citas para CLS; evitar
  hidratar/ejecutar lÃ³gica innecesaria; medir desktop y mÃ³vil con scripts/budgets existentes.
  Si empeoran LCP/CLS/INP o presupuestos, identificar causa y corregir antes de cerrar.

### 11.4 Pruebas (usar scripts reales)
1. Ampliar `pnpm test:visual` para cubrir lo nuevo (contrastes, overflow horizontal, screenshots
   en escritorio y mÃ³vil, estado con `prefers-reduced-motion: reduce` emulado).
2. `pnpm test:e2e` (Playwright): confirmar Home â†’ Proyectos â†’ Detalle, filtros, "Cargar mÃ¡s" y
   Contacto; **aÃ±adir pruebas de lightbox (teclado/Esc) y de menÃº mÃ³vil**.
3. Prueba manual en Chrome, Firefox, Safari (WebKit), iPhone 14, Pixel 7 (`E2E_BROWSERS=all` cuando sea posible).
4. Verificar sin errores de consola, sin warnings de hidrataciÃ³n/animaciÃ³n, sin CLS visible.
5. `pnpm test:ci`, `pnpm typecheck:api` y `pnpm lint` deben pasar.
6. Lighthouse/`test:perf`: comparar con la lÃ­nea base de Fase 00.

### 11.5 Matriz mÃ­nima de validaciÃ³n

| Ãrea | Prueba mÃ­nima | Criterio de aceptaciÃ³n |
|---|---|---|
| Build | Build de producciÃ³n | Sin errores de compilaciÃ³n. |
| Tipos | Typecheck y validaciones | Sin errores nuevos de tipos. |
| Unidades | Tests unitarios | Sin regresiones introducidas. |
| Home | Abrir `/` directamente | Carga, secciones y CTA funcionan. |
| NavegaciÃ³n | Home â†’ internas â†’ volver | Enlaces y estados activos correctos. |
| Proyectos | Filtros, tarjetas, "Cargar mÃ¡s" | Resultados correctos; contrato de datos intacto. |
| Detalle | Slug vÃ¡lido e invÃ¡lido | Datos correctos; estado no encontrado resuelto. |
| CMS/datos | Contenido y medios | Lectura pÃºblica intacta; CMS editable con permisos. |
| Contacto | VÃ¡lidos, invÃ¡lidos, error recuperable | ValidaciÃ³n y feedback accesibles. |
| Responsive | 320 a 1440 px | Sin overflow; layouts y controles utilizables. |
| Accesibilidad | Teclado, contraste, foco, etiquetas, reduced motion | Sin barreras bÃ¡sicas; documentar lÃ­mites de herramientas. |
| ImÃ¡genes | LCP, tamaÃ±os, lazy, alt | Sin LCP diferido ni CLS evitable. |
| Visual | Capturas antes/despuÃ©s | Mejoras sin regresiones de color/contraste/recorte. |
| SEO | TÃ­tulos, descripciÃ³n, canonical, sitemap, rutas | Metadatos preservados; sin dominio ficticio. |
| Seguridad | InspecciÃ³n de diff/config | Sin secretos ni cambios de RLS/auth no solicitados. |

**VerificaciÃ³n / criterio de salida:** matriz en verde; budgets de rendimiento respetados;
regresiones corregidas y pruebas relevantes reejecutadas.

**Origen:** [A] Pasos 6â€“9 + Fase H + secciÃ³n 13 Â· [B] Â§8â€“10.

### Handoff â€” Fase 11
> (escribir aquÃ­)

---

## FASE 12 â€” Entrega (revisiÃ³n final y reporte)

**Objetivo:** cierre verificable, honesto y documentado.

**Prerrequisitos:** Fase 11 en verde.

### Instrucciones detalladas
1. Comparar capturas antes/despuÃ©s a los mismos viewports.
2. Recargar cada ruta **directamente**, no solo navegando desde Home.
3. Revisar estados: contenido largo, imagen ausente, filtro activo, formulario invÃ¡lido y error
   de red (si es seguro simularlo).
4. Actualizar `docs/visual-qa-report.md` con capturas y pruebas.
5. Comprobar el diff para detectar cambios accidentales de configuraciÃ³n, datos, secretos o
   archivos ajenos al diseÃ±o.
6. Producir el reporte final (formato abajo).
7. Actualizar este plan (estados + handoff final).

### Formato obligatorio del reporte final (en espaÃ±ol)
1. **Resumen ejecutivo:** quÃ© mejorÃ³ y quÃ© problemas principales resolviÃ³.
2. **Cambios por pÃ¡gina:** Home, QuiÃ©nes Somos, Servicios, Proyectos, detalle/La Holanda,
   Contacto y panel admin si aplica.
3. **Decisiones visuales:** quÃ© se tomÃ³ de UI.live, quÃ© motion de Prompt Motion, quÃ© iconos de
   ItsHover y quÃ© se descartÃ³.
4. **Archivos principales modificados:** lista breve con la razÃ³n de cada grupo.
5. **ValidaciÃ³n:** comandos ejecutados y resultado real; separar ejecutados de no ejecutados.
6. **ComparaciÃ³n visual:** viewports probados, capturas y regresiones detectadas/corregidas.
7. **Rendimiento y accesibilidad:** resultados medidos, diferencias vs. lÃ­nea base y limitaciones.
8. **Riesgos o pendientes:** datos faltantes, decisiones de negocio, tests bloqueados.
9. **Estado de Git:** rama, cambios locales respetados y si se creÃ³ algÃºn commit.
   **No hacer push ni deploy sin autorizaciÃ³n.**

No presentar recomendaciones hipotÃ©ticas como cambios realizados. No decir "todo pasa" si no
se ejecutaron las pruebas o hay fallos sin resolver.

**Origen:** [A] Fase I + secciÃ³n 15 Â· [B] Â§12.

### Handoff â€” Fase 12
> (escribir aquÃ­)

---

## Anexo A â€” Criterios de aceptaciÃ³n finales (Definition of Done)

### DiseÃ±o y marca
- [ ] INGESOCC sigue siendo la marca principal; jerarquÃ­a hacia proyectos y La Holanda clara.
- [ ] Identidad de marca y logo oficial se mantienen.
- [ ] JerarquÃ­a tipogrÃ¡fica reconocible y consistente.
- [ ] Ritmo visual y espacio en blanco suficientes.
- [ ] Proyectos con fotografÃ­a autÃ©ntica, buen recorte y metadatos reales.
- [ ] Un CTA principal reconocible sin que cada bloque compita.
- [ ] Patrones adoptados identificados en `docs/design-reference-audit.md` y justificados por UX.
- [ ] Tendencias que no encajan/restan accesibilidad o rendimiento descartadas conscientemente.

### InteracciÃ³n y responsive
- [ ] NavegaciÃ³n, filtros, tarjetas, galerÃ­a y formularios funcionan en mÃ³vil y escritorio.
- [ ] Sin overflow horizontal en los viewports verificados.
- [ ] Animaciones sutiles, semÃ¡nticas, rÃ¡pidas y reducibles/desactivables.
- [ ] El contenido principal funciona sin depender del movimiento.
- [ ] Controles interactivos con foco y nombres accesibles.

### Integridad tÃ©cnica
- [ ] Sigue en Angular 19, TypeScript y Tailwind CSS v4.
- [ ] Sin React ni dependencia de motion pesada sin justificaciÃ³n.
- [ ] Supabase, RLS, auth, CMS, Cloudinary y rutas mantienen sus contratos.
- [ ] Sin contenidos, contacto, mÃ©tricas ni proyectos inventados.
- [ ] SEO y optimizaciones de imÃ¡genes conservados.
- [ ] Pruebas ejecutadas y resultados documentados.
- [ ] Diff revisado; sin cambios accidentales ni secretos.

### Checklist de cierre de [B] (Â§12)
- [ ] Todas las zonas de la secciÃ³n 6 tienen su tratamiento (o justificaciÃ³n escrita).
- [ ] Accessibility Lighthouse = 100 en `/` y `/proyectos`; `test:visual` sin fallos de contraste/overflow.
- [ ] Performance dentro de presupuestos; sin regresiÃ³n de LCP/CLS.
- [ ] `prefers-reduced-motion` verificado en cada animaciÃ³n.
- [ ] Sitio pÃºblico solo lectura; admin intacto funcionalmente.
- [ ] Tests unitarios, e2e y typecheck en verde.
- [ ] DocumentaciÃ³n `docs/design/` completa.

---

## Anexo B â€” DocumentaciÃ³n y entregables del proyecto

Crear solo lo que no tenga un equivalente mantenido; enlazar o ampliar lo existente. Documentos existentes
en el repo: `docs/ui-audit.md`, `docs/design-reference-audit.md`, `docs/design-system.md`,
`docs/visual-qa-report.md`, `docs/cambios-auditoria-final.md`, `docs/test-plan-audit.md`.

Entregables a mantener/crear:
- `docs/design/baseline/` â€” mÃ©tricas y screenshots "antes".
- `docs/design/audit.md` â€” **alternativa/insumo** de `docs/ui-audit.md` (usar el existente).
- `docs/ui-audit.md` â€” diagnÃ³stico inicial y prioridades.
- `docs/design/moodboard.md` â€” 8â€“12 principios y sus zonas.
- `docs/design/motion-language.md` â€” tokens de movimiento + tabla referencia â†’ implementaciÃ³n.
- `docs/design/icons.md` â€” icono â†’ movimiento â†’ razÃ³n.
- `docs/design/decisions.md` â€” decisiones ambiguas resueltas (sobriedad/accesibilidad).
- `docs/design-reference-audit.md` â€” matriz de decisiÃ³n de patrones.
- `docs/design-system.md` â€” tokens, tipografÃ­a, componentes y estados.
- `docs/visual-qa-report.md` â€” pruebas, viewports, capturas y regresiones.
- `THIRD_PARTY.md` â€” licencia y atribuciÃ³n si se portÃ³ cÃ³digo de terceros (itshover).
- Reporte final de la Fase 12.

---

## Anexo C â€” Supuestos a confirmar (decidir con criterio si no hay respuesta)

1. Â¿Hay manual de marca o tipografÃ­as corporativas? (si no: elegir segÃºn Fase 03 y documentarlo).
2. Â¿Existen fotos reales de obra en buena calidad? (si no: diseÃ±ar estados que funcionen con
   imÃ¡genes irregulares: overlays, recortes consistentes).
3. Â¿Se acepta **una** librerÃ­a de animaciÃ³n ligera con carga diferida, o solo CSS nativo?
   (por defecto: CSS nativo + `motion` diferida solo si hace falta).
4. Â¿Se migra a SSR/prerender mÃ¡s adelante? (por ahora no; no asumir SSR en ninguna decisiÃ³n).

---

## Anexo D â€” Prioridad de la instrucciÃ³n final

Ordenar el trabajo por esta prioridad ([A], instrucciÃ³n final):
**claridad corporativa â†’ portafolio y fotografÃ­a real â†’ navegaciÃ³n y responsive â†’ consistencia
del sistema de diseÃ±o â†’ accesibilidad â†’ movimiento sutil â†’ refinamiento visual.**

La meta no es mÃ¡s animaciones ni parecerse a una plantilla de moda, sino que un potencial
cliente entienda quÃ© hace la empresa, encuentre proyectos relevantes, explore La Holanda dentro
del portafolio corporativo y sepa cÃ³mo contactar; todo con un diseÃ±o profesional, autÃ©ntico,
accesible y tÃ©cnicamente sostenible.

