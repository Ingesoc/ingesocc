# Iconos con intención — INGESOCC S.A.S. (borrador)

Fecha: 2026-10-14 · Fase 02 · Rama: `feature/redesign`

> Referencia: `https://www.itshover.com/` y `https://github.com/itshover/itshover`
> (componentes **React + Motion**; no instalables tal cual en Angular).
>
> **Licencia verificada:** `itshover` se distribuye bajo **Apache-2.0**
> (SPDX `Apache-2.0`, Copyright 2026 itshover, confirmado vía GitHub API). Permite
> uso, modificación y redistribución **conservando aviso y atribución**. Aun así,
> se decide **recrear los pocos iconos necesarios desde cero** (SVG propio sobre
> geometría Lucide) con CSS/APIs nativas, **sin portar React ni `motion`**, y dejar
> atribución en `THIRD_PARTY.md` si se reutiliza cualquier trazo/concepto.

## 1. Política

- Base: `@lucide/angular` (`^1.39.0`, ya instalado). No añadir librerías nuevas por hover.
- Solo se anima un icono si **comunica una acción o estado real**; si no, se deja estático.
- Decorativos con `aria-hidden="true"` y sin foco; los interactivos heredan el nombre
  accesible del control (no usar el icono como único nombre sin texto/`aria-label`).
- Movimiento = trazo, desplazamiento corto o rotación pequeña; nunca decorativo gratuito.
- No crear un catálogo de cientos de iconos: solo los de la tabla.

## 6. Mapeo icono → movimiento → razón

| Icono (Lucide base) | Disparador | Movimiento | Duración/token | Razón | Dónde |
|---|---|---|---|---|---|
| `ArrowRight` / `ArrowUpRight` | hover del CTA | `translateX/Y` 4 px | `--motion-duration-fast` (160 ms) | Affordance de avance hacia el detalle | Cards "Ver proyecto", links de sección |
| `Menu` ↔ `X` | toggle menú móvil | morph (rotar/escala/opacidad) | `--motion-duration-base` (220 ms) | Comunica estado abierto/cerrado | `site-header` móvil (`morph-icon`) |
| `ChevronDown` | expandir/contraer real | `rotate(180deg)` | 160 ms | Indica estado de la expansión | FAQ, filtros desplegables |
| `Send` | envío de formulario | `translateX` 4 px; al éxito, check + fade | 160 ms / 220 ms | Feedback de acción y confirmación | `/contacto` |
| `Phone` / `MessageCircle` (WhatsApp) | hover/tap | "pop" de escala 1→1.06 | 120 ms | Acción real de contacto; refuerza la barra móvil | `mobile-action-bar`, `/contacto` |
| `MapPin` | hover | desplazamiento vertical corto (−2 px) | 120 ms | Señala ubicación/interacción con el mapa | `/contacto`, ficha de proyecto |
| `CircleCheck` | tras éxito | trazo (stroke-dashoffset) + fade | 220 ms | Confirmación inequívoca | Formularios, admin |
| `Loader` (spinner) | solo durante `loading` real | rotación continua | while loading | Única excepción a "sin bucle"; estado transitorio | Botones de envío/guardado |
| `Maximize` / `Expand` | hover sobre imagen de galería | `scale` 1→1.05 | 160 ms | Affordance de ampliar (abre lightbox) | Galería de proyecto |
| `ExternalLink` | hover | flecha diagonal se desplaza | 160 ms | Indica salida a un recurso externo | Enlaces externos/documentos |

> Los elementos sin acción real (p. ej. iconos de lista, separadores) permanecen
> **estáticos** y `aria-hidden="true"`.

## 7. Criterios técnicos

- Base `@lucide/angular`; nada de `motion/react`, React ni Shadcn.
- Implementación con CSS/SVG nativos (transiciones, `@keyframes`), sin librerías de motion.
- Todos anulan su animación bajo `prefers-reduced-motion: reduce` (contrato §3 de `motion-language.md`).
- Licencia Apache-2.0 de itshover: conservar atribución en `THIRD_PARTY.md` si se portara
  algún patrón concreto; por defecto se **recrea** desde geometría Lucide.

## 8. Entregable asociado

`THIRD_PARTY.md` (Fase 04) incluirá la atribución de las fuentes de iconos/motion usadas.
