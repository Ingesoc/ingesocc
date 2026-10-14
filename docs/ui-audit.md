# Auditoría de interfaz (UI) — Ingesocc

Fecha: 2026-10-13 · Rama: `feature/redesign`

Método: lectura de plantillas/estilos, **medición programática del DOM con Playwright**
(geometría, overflow, overflow de contenido) y revisión de la suite e2e existente.
Las capturas de `test-results/audit/*.png` no se inspeccionaron visualmente porque el
modelo no puede leer imágenes; se usó medición.

## Fortalezas confirmadas

- Sistema de componentes único en `src/styles.css` (`.btn`, `.field`, `.badge`,
  `.kicker`, `.panel`, `.media-zoom`, `.wrap`) compartido por público y admin.
- Accesibilidad de base: `:focus-visible` global, `prefers-reduced-motion`
  neutralizando animaciones, `overflow-wrap: anywhere` para tolerar zoom 150 %.
- SEO/social: `index.html` con OG/Twitter/JSON-LD, cabecera canónica y preload de
  fuentes Archivo.
- Sin desbordamiento horizontal: la suite `responsive-overflow.spec.ts` cubre 12
  viewports × todas las rutas públicas y pasa.

## Hallazgos

| # | Severidad | Hallazgo | Estado |
|---|---|---|---|
| 1 | **Alta** | En `/proyectos` la rejilla fijaba filas de `300px` (`auto-rows-[300px]`) mientras la variante `panel` mide ~446px (imagen `aspect-[4/3]` + texto). El contenido desbordaba 146px (1440) / 81px (390) y se **solapaba con la fila siguiente**. | **Corregido** (`projects-page.component.html`): se eliminó el alto de fila fijo; se añadió regresión en `responsive-overflow.spec.ts`. |
| 2 | Media | Menú móvil (`site-header`) se abría a pantalla completa pero sin `Escape`, sin bloqueo de scroll del fondo, sin cierre al navegar ni `aria-controls`. | **Corregido**: `Escape` cierra y devuelve foco al botón, `body.overflow=hidden` mientras está abierto, cierre en `NavigationEnd`, `aria-controls="mobile-menu"`, throttle de scroll con `requestAnimationFrame`. |
| 3 | Media | Lightbox de galería (`project-detail`) sin bloqueo de scroll de fondo ni gestión de foco (al abrir/cerrar). | **Corregido**: focus al diálogo al abrir, restitución del foco previo al cerrar, `body.overflow=hidden` mientras está abierto. |
| 4 | Media | CMS confirma "Guardado" sin persistir en algunos flujos; botón "Actualizar" puede borrar ediciones (`savingAny` vs `dirty`). | Pendiente (admin) |
| 5 | Media | Links del dashboard CMS apuntan todos a `activePage='home'`. | Pendiente (admin) |
| 6 | Baja | `new-password.component.ts` puede mostrar falso "enlace inválido". | Pendiente |
| 7 | Baja | Inputs `file` con `hidden` no son enfocables por teclado; botones icono solo con `title`; editor FAQ sin labels asociados. | Pendiente |
| 8 | Baja | `[href]` provenientes de `content_blocks` se usan sin validar esquema. | Pendiente |
| 9 | Baja | `setTimeout` sin limpieza en algunos componentes. | Pendiente |
| 10 | **Alta** | **NG0904** (`unsafe value used in a resource URL context`) en `/contacto` y `/proyectos/la-holanda`: los `<iframe>` de Google Maps enlazaban `[src]` a un string plano; en standalone `bootstrapApplication` Angular tampoco registra el mapeo `Sanitizer → DomSanitizer`. | **Corregido**: `DomSanitizer.bypassSecurityTrustResourceUrl(...)` en `contact.component.ts` y `project-detail.component.ts`. Verificado: 0 `pageerror`. |
| 11 | Media | Imagen Unsplash `photo-1504307651254` devuelve **404** (`ERR_BLOCKED_BY_ORB`) en `/servicios` y su ficha (servicio *Proyectos de Infraestructura* y galería del *Puente vehicular*). | **Corregido**: reemplazada por imágenes válidas en `services.service.ts`, `projects.service.ts` y `supabase/seed.sql`. Verificado: `broken: []`. |

## Detalle del hallazgo #1 (evidencia)

Medición con Playwright sobre `/proyectos` (antes del arreglo):

```
INNER w=1440 hostBottom=1044 aBottom=1190 contentOverflowsHost=146
INNER w=390  hostBottom=1201 aBottom=1282 contentOverflowsHost=81
```

Tras el arreglo (`contentOverflowsHost: 0` y `parentAutoRows: auto`). Nota: el mosaico
del Home **sí** usa filas fijas, pero con tarjetas `overlay` cuyo contenido es absoluto
y llena la celda; no debe copiarse ese `auto-rows` a las tarjetas `panel` con texto.

## Detalle de los hallazgos #10 y #11 (evidencia)

Diagnóstico con Playwright sobre todas las rutas públicas, capturando `pageerror`,
errores de consola, respuestas ≥ 400 y el estado real de cada `<img>` (forzando lazy).

```
# #10  antes: pageErrors: ["NG0904: unsafe value used in a resource URL context ..."]
# #10  después: pageErrors: []
# #11  antes: broken: ["https://images.unsplash.com/photo-1504307651254-..."]
# #11  después: broken: []
```

Errores residuales (no de UI): respuestas **400/404 de Supabase REST** en todas las
rutas (`projects` 400, `services` 400, `testimonials` 404) por migraciones sin aplicar;
el cliente cae al seed y la interfaz se ve bien.

## Recomendaciones

1. Cerrar los hallazgos de admin (#4–#5) en una sesión dedicada por tocar estado y
   persistencia, no estética.
2. Revisar visualmente (persona) el caption del lightbox y los campos de metadatos del
   admin: la verificación de esta sesión fue programática.
3. Añadir labels accesibles a los inputs de archivo y sustituir `title` por
   `aria-label` en botones icono (#7).
