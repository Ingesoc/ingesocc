# Matriz responsive

## Dispositivos / viewports medidos

| Etiqueta | Ancho × alto | Referencia |
| --- | --- | --- |
| small | 320 × 568 | iPhone SE (1.ª gen) / Android pequeño |
| phone-s | 360 × 800 | Android común |
| phone | 390 × 844 | iPhone 14 |
| phone-l | 430 × 932 | iPhone 14 Pro Max |
| tablet | 768 × 1024 | iPad vertical (`md`) |
| landscape | 1024 × 768 | iPad horizontal (`lg`; la barra inferior se oculta) |
| laptop | 1280 × 800 | — |
| desktop | 1440 × 900 | — |

Breakpoints relevantes de Tailwind v4 usados en el código: `sm` 640 px, `md` 768 px, `lg` 1024 px.
Gutters de `.wrap`: 20 px (<640), 32 px (≥640), 48 px (≥1024) (`styles.css:190-196`).

## Resultado por ruta × viewport (antes de Fase A + B)

`doc` = `scrollWidth - clientWidth` del documento (overflow horizontal real).
`po` = elementos que desbordan el viewport sin ancestro que los recorte.
`masked` = elementos que desbordan pero quedan recortados por un ancestro con `overflow`.
`mains` = cantidad de landmarks `<main>`.
`formOv` = px que el grid del formulario invade el padding del panel.

| Ruta | 320 | 360 | 390 | 430 | 768 | 1024 | 1280 | 1440 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` Home | doc 0 · po 0 · **mains 2** | doc 0 · mains 2 | doc 0 · mains 2 | doc 0 · mains 2 | doc 0 · mains 2 | doc 0 · mains 2 | doc 0 · mains 2 | doc 0 · mains 2 |
| `/quienes-somos` | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 |
| `/servicios` | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 |
| `/servicios/:slug` | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 |
| `/proyectos` | doc 0 · po 0 · masked 2 | doc 0 · masked 2 | doc 0 · masked 2 | doc 0 · masked 2 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 |
| `/proyectos/:slug` | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 |
| `/contacto` | doc 0 · **formOv 5** | doc 0 · formOv 0 | doc 0 · formOv 0 | doc 0 · formOv 0 | doc 0 · formOv 0 | doc 0 · formOv 0 | doc 0 · formOv 0 | doc 0 · formOv 0 |
| `/no-encontrada` | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 | doc 0 · po 0 |

Conclusiones:

- **Cero overflow horizontal de página en las 64 combinaciones.** El problema no es de scroll
  lateral; es de ajuste vertical, densidad y elementos que invaden su propio contenedor.
- `masked 2` en `/proyectos` es el chip de ubicación de 495 px dentro de `.chips-row` (VIS-06);
  el recorte lo hace el contenedor scrolleable, no la página.
- `mains 2` en Home es el `<main>` anidado (VIS-10).

### Después de Fase A + B

| Ruta | 320 | 360–430 | ≥768 |
| --- | --- | --- | --- |
| `/` Home | doc 0 · **mains 1** | doc 0 · mains 1 | doc 0 · mains 1 |
| `/quienes-somos` | doc 0 · po 0 · **galería 2 col** | doc 0 · po 0 | doc 0 · po 0 |
| `/proyectos` | doc 0 · **masked 0** | doc 0 · masked 0 | doc 0 · po 0 |
| `/contacto` | doc 0 · **formOv 0** | doc 0 · formOv 0 | doc 0 · formOv 0 |
| Resto | sin cambios (doc 0 · po 0) | sin cambios | sin cambios |

`masked 0` no significa que el scroll-snap desaparezca: la fila sigue scrolleable, pero ningún
chip individual excede ya el ancho de la fila.

## Altura de página (densidad, antes de Fase A + B)

Capturas `fullPage` a 320 y 390 px (JPEG, imágenes externas bloqueadas; las alturas no dependen
de que la imagen cargue porque los contenedores reservan espacio).

| Ruta | 320×568 | 390×844 | Viewports de alto |
| --- | --- | --- | --- |
| Home | 9.139 px | 8.720 px | 16,1× | 
| Quiénes Somos | **18.031 px** | 17.801 px | 31,7× |
| Servicios | 5.508 px | — | 9,7× |
| Detalle de servicio | 5.049 px | — | 8,9× |
| Proyectos | 5.390 px | — | 9,5× |
| Detalle de proyecto | 4.908 px | — | 8,6× |
| Contacto | 4.120 px | — | 7,3× |
| No encontrada | 2.090 px | — | 3,7× |

### Después de Fase A + B (320×568)

| Ruta | Antes | Después | Presupuesto | Estado |
| --- | --- | --- | --- | --- |
| Home | 9.139 px | **9.015 px** | 8.000 px | sigue por encima (VIS-05) |
| Quiénes Somos | 18.031 px | **13.224 px** | 12.000 px | sigue por encima (VIS-05) |
| Resto | — | sin cambios | — | — |

## Mediciones de componentes

### Barra inferior (`mobile-action-bar`)

| Viewport | `display` | Alto barra | `padding-bottom` | Spacer | Veredicto |
| --- | --- | --- | --- | --- | --- |
| <1024 (después) | flex | 49,5 px | 0 px (sin `env()`) | 50 px | correcto (0,5 px de holgura) |
| ≥1024 | none | 0 | — | 0 | correcto |
| iPhone con `viewport-fit=cover` (hipotético) | flex | 49,5 + inset ≈ 83,5 px | inset ≈ 34 px | 50 px | **solapa 33,5 px** (latente, no activado) |

### Menú móvil

| Viewport | Contenido | CTA top/bottom | CTA visible | Scroll interno |
| --- | --- | --- | --- | --- |
| 320×568 (antes) | 653 px | 653 / 697 | **No** | **No** (`overflow: visible`; body bloqueado) |
| 360×800 (antes) | 669 px | 669 / 713 | Sí | No necesario |
| 390×844 (antes) | 713 px | 713 / 757 | Sí | No necesario |
| 430×932 (antes) | 801 px | 801 / 845 | Sí | No necesario |
| 320×568 (después) | >568 px | alcanzable con scroll | **Sí** | **Sí** (`overflow-y-auto`) |
| 360–430 (después) | ≤ viewport | visible | Sí | No necesario |

Texto más ancho del menú: 204 px (320), 239 px (360), 260 px (390) — no desborda.
Verificado además: foco inicial en el primer enlace, Tab cicla dentro del menú, Esc cierra y
devuelve el foco al botón.

### Chips de filtro (`/proyectos`)

| Viewport | Fila | `clientWidth` | `scrollWidth` | Chip más ancho |
| --- | --- | --- | --- | --- |
| 320 | ubicación | 280 px | 589 px | **495 px** |
| 360 | ubicación | 320 px | 589 px | 495 px |
| 390 | ubicación | 350 px | 589 px | 495 px |
| 430 | ubicación | 390 px | 589 px | 495 px |
| ≥768 | ambas | — | — | wrap, sin scroll |

Después de Fase A + B: el chip más ancho queda **≤ `clientWidth`** de la fila en 320, 360, 390 y
430 px. La fila puede seguir scrolleando por la suma de chips, pero ningún chip individual la
excede. En ≥768 px se mantiene el wrap.

### Galerías

| Página | Grupos | Imágenes | Columnas <640 | Altura de fila | Alto estimado de galería |
| --- | --- | --- | --- | --- | --- |
| Quiénes Somos (antes) | 4 | 44 (17+11+7+9) | 1 | 180 px | ≈ 8.436 px |
| Quiénes Somos (después) | 4 | 44 | **2** | **140 px** | ≈ 3.600 px |
| Detalle de proyecto | 1 | 1 (`casa-ladera`) | 1 | 200 px | 200 px (no ejercita el mosaico) |

La galería de Quiénes Somos computa 2 columnas en móvil; el resto del ahorro de altura
(18.031 → 13.224 px) proviene de esa corrección.

### Hero de Home

| Viewport | Alto hero (antes) | Alto hero (después) | Alto viewport | Excede |
| --- | --- | --- | --- | --- |
| 320×568 | 777 px | **636 px** | 568 px | +68 px (CTA visible) |
| 360×800 | 669 px | — (no medido) | 800 px | No |
| 390×844 | 669 px | — (no medido) | 844 px | No |
| 430×932 | 669 px | — (no medido) | 932 px | No |
| 768×1024 | 901 px | 901 px | 1024 px | No |
| 1024×768 | 676 px | 676 px | 768 px | No |
| 1280×800 | 704 px | 704 px | 800 px | No |
| 1440×900 | 792 px | 792 px | 900 px | No |

El objetivo era ≤653 px a 320×568 para que el CTA quedara dentro del primer viewport; se logró
636 px. El hero sigue creciendo por contenido, no por `min-h`.
