# Pruebas de regresión visual y responsive

Objetivo: que cada hallazgo corregido quede cubierto por una aserción automática que falle si el
defecto vuelve, más una lista corta de verificaciones manuales que el navegador no puede simular.

## Comandos base

```powershell
pnpm build            # obligatorio: el QA visual sirve dist/ingesocc-web/browser
pnpm lint
pnpm typecheck:api
pnpm test:ci          # unitarias (214/214 OK)
pnpm test:api         # 33/33 OK
pnpm test:visual      # QA visual extendido: 8 viewports × 9 rutas
```

`tools/visual-qa.mjs` sirve `dist/` en el puerto 4173, recorre 8 rutas públicas + login admin,
comprueba overflow horizontal, `<main>` único, barra/spacer, chips, grids del formulario,
galería de Quiénes Somos, hero a 320 y el menú móvil (foco, scroll, CTA, trap, Esc), y guarda
capturas en `test-results/visual-qa/`. Sin dependencias nuevas.

## Extensión aplicada de `tools/visual-qa.mjs`

### 1. Matriz de viewports y rutas

- `VIEWPORTS`: añadir 320×568, 360×800, 430×932, 768×1024, 1024×768, 1280×800 (además de
  1440×900 y 390×844).
- `PAGES`: añadir `/servicios/:slug` (p. ej. el primer servicio de la semilla) y
  `/no-encontrada`.
- Mantener el aborto de red externa (Supabase/Cloudinary/Maps) para determinismo, igual que en la
  medición de esta auditoría; las alturas no dependen de que la imagen cargue.

### 2. Aserciones por hallazgo

| ID | Aserción (Playwright `page.evaluate`) | Falla si |
| --- | --- | --- |
| VIS-01 | `spacerH = getBoundingClientRect().height` de `[data-bottom-spacer]`; `barH` de la barra inferior | `spacerH < barH` (pie tapado) |
| VIS-02 | Para cada enlace del menú: `textRect.right <= rowRect.right + 1` | texto desborda la fila |
| VIS-03 | Para cada hijo de los grids del formulario: `child.right <= panelContentRight + 1` | invasión del padding > 1 px |
| VIS-04 | `heroRect.height <= viewport.height * 1.15` (o presupuesto acordado) | hero excesivo en 320×568 |
| VIS-05 | Altura `fullPage` por ruta contra presupuesto (tabla abajo) | página demasiado larga |
| VIS-06 | Para cada `.chips-row`: todo hijo con `width <= row.clientWidth + 1` | chip más ancho que la fila |
| VIS-07 | En `/quienes-somos` a 320: `getComputedStyle(gallery).gridTemplateColumns` tiene 2 pistas | vuelve a 1 columna |
| VIS-08 | Abrir menú a 320×568: CTA visible **o** `nav.scrollHeight > nav.clientHeight` con `overflow-y: auto` y tras `scrollTo` el CTA es visible | CTA inalcanzable |
| VIS-09 | Abrir menú, Tab N veces: `document.activeElement` siempre dentro de `#mobile-menu`; Esc → foco en el botón | foco escapa o no vuelve |
| VIS-10 | `document.querySelectorAll('main').length === 1` en todas las rutas | `<main>` anidado |
| VIS-11 | Fase admin con credenciales; mismas aserciones + capturas | defecto en admin |

### 3. Presupuestos de altura (VIS-05 / VIS-07)

Valores de referencia a 320×568 y estado tras Fase A + B. El presupuesto de Home y Quiénes
Somos sigue sin cumplirse porque C3 (ritmo vertical) no se implementó.

| Ruta | Antes (320) | Después (320) | Presupuesto | Estado |
| --- | --- | --- | --- | --- |
| Home | 9.139 px | **9.015 px** | ≤ 8.000 px | `OPEN` (C3) |
| Quiénes Somos | 18.031 px | **13.224 px** | ≤ 12.000 px | `OPEN` (C3) |
| Servicios | 5.508 px | sin cambios | ≤ 5.000 px | `OPEN` (C3) |
| Detalle de servicio | 5.049 px | sin cambios | ≤ 4.600 px | `OPEN` (C3) |
| Proyectos | 5.390 px | sin cambios | ≤ 5.000 px | `OPEN` (C3) |
| Detalle de proyecto | 4.908 px | sin cambios | ≤ 4.600 px | `OPEN` (C3) |
| Contacto | 4.120 px | sin cambios | ≤ 3.800 px | `OPEN` (C3) |
| No encontrada | 2.090 px | sin cambios | ≤ 2.000 px | `OPEN` (C3) |

### 4. Salida

- JSON con `{ route, viewport, checks, heights, screenshots }` en
  `test-results/visual-qa/report.json` (mismo formato que `test-results/visual-audit/report.json`).
- Código de salida 1 si hay cualquier `FAIL`; `WARN` no rompe.
- Capturas `fullPage` por ruta×viewport en `test-results/visual-qa/`.
- **Resultado de la última corrida:** `0 FAIL` en los 8 viewports; 72 capturas de esa corrida
  (8 viewports × 9 rutas) con las etiquetas `small`, `phone-s`, `phone`, `phone-l`, `tablet`,
  `landscape`, `laptop`, `desktop`. El resumen “0 OK” del script significa que no se acumularon
  incidencias, no que no se ejecutaran páginas.

### 4.1 Auditoría adicional por elemento, todas las vistas (2026-11-09)

Pasada extra de geometría en Chromium, más estricta que la comprobación de overflow de página:

- 10 anchos: 320, 360, 375, 390, 412, 430, 768, 1024, 1280 y 1440 px.
- 9 vistas: las 8 públicas + `/admin/login`.
- Estados: base, menú móvil abierto, errores de validación de contacto y filtro activo de proyectos.
- Total: **158 estados auditados**.
- Resultado: **0 page-overflow**, **0 elementos visibles fuera del viewport**, **0 contenidos
  desbordados sin recorte** y **0 hijos que invadan el padding de su padre**.
- Scrollers intencionales detectados: `.chips-row` (horizontal) y `#mobile-menu` (vertical).
- Elementos `fixed` fuera del padre: 269, todos corresponden al header y la barra inferior
  (`position: fixed`), comportamiento esperado.
- Único falso positivo: el honeypot `#website` dentro de `.sr-only` (oculto a propósito).
- **Touch targets <44 px:** 138 antes de corregir (botón de menú móvil a 38×44 y “Volver arriba” a
  111,6×16,5). Se añadió `shrink-0` al botón de menú y `min-h-11` a “Volver arriba”; la repetición
  de la auditoría dio **0 touch targets <44 px**.
- Evidencia: `test-results/full-layout-audit/report.json`.
- Verificación posterior: `pnpm lint`, `pnpm build`, `pnpm test:visual` (0 FAIL),
  `pnpm test:ci` (214/214) y `pnpm typecheck:api` OK.

### 5. CI

- Añadir un job `visual-qa` en `.github/workflows/quality.yml` que dependa de `build` y ejecute
  `pnpm test:visual` con Chromium de Playwright. Sin red externa (la página aborta esas
  peticiones), por lo que es determinista.
- Mantener la fase admin fuera de CI salvo que existan secretos (`E2E_ADMIN_EMAIL` /
  `E2E_ADMIN_PASSWORD`); si no existen, se omite como hoy.

## Pruebas unitarias / de componente (opcionales, sin librerías nuevas)

- `site-header.component.spec.ts`: abrir menú → el primer enfocable recibe foco; Tab desde el
  último vuelve al primero; Esc emite cierre y el foco regresa al botón. Usar `TestBed` + eventos
  de teclado; no requiere DOM real de layout.
- `filter-chip` / `chips-row`: no aplica lógica; la aserción es de layout (Playwright).

## Verificación manual (no automatizable en Chromium de escritorio)

1. **iPhone real con home indicator** (Safari iOS): abrir el menú, comprobar que el CTA es
   alcanzable y que la barra inferior no tapa el pie. Repetir con `viewport-fit=cover` si se
   aprueba C1.
2. **Teclado**: recorrer el menú solo con Tab/Shift+Tab/Esc en 320 y 390.
3. **Lector de pantalla** (VoiceOver/NVDA): el menú anuncia su estado (`aria-expanded`) y no se
   pierde el foco al cerrar.
4. **Zoom 200 %** y **texto al 200 %**: sin scroll horizontal ni contenido cortado.
5. **Orientación horizontal** en 568×320 y 844×390: menú y barra inferior utilizables.
6. **`prefers-reduced-motion`**: sin animaciones de hero/timeline/progreso.
7. **Fotos reales** en Quiénes Somos y detalle de proyecto (≥ 4 imágenes) para validar recortes
   de la galería (B2/C4).
8. **Panel admin** con credenciales: listados, formularios "nuevo", bandeja y contenido en 320 y
   390 (VIS-11).

## Criterio de cierre de la auditoría

- `pnpm lint`, `pnpm typecheck:api`, `pnpm build`, `pnpm test:ci`, `pnpm test:api` en verde. ✅
- `pnpm test:visual` extendido en verde en los 8 viewports (o con los `WARN` justificados). ✅
- Cada hallazgo con estado `FIXED` tiene su aserción y su captura antes/después. ✅
  (VIS-11 sigue `NO VERIFICADO`; C3/C4 siguen `OPEN`.)
- Los `ACCEPTED_RISK` (safe-area edge-to-edge no activada) quedan documentados. ✅
