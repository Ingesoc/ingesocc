# Iconos con intención — INGESOCC S.A.S.

Fecha: 2026-10-14 · Fase 02 (finalizado Fase 04)

> Referencia: https://www.itshover.com/
> Licencia itshover verificada: Apache-2.0 (SPDX Apache-2.0, Copyright 2026 itshover).
> Decisión: recrear el patrón (CSS/Angular) sobre geometría Lucide; si se reutiliza algún trazo, registrar en THIRD_PARTY.md.

## 1. Política

- Base: @lucide/angular (^1.39.0), ya instalado. No añadir librerías nuevas por hover.
- Solo se anima un icono si comunica una acción o estado real; si no, estático.
- Decorativos con ria-hidden="true"; interactivos heredan nombre accesible.
- Movimiento = trazo, desplazamiento corto o rotación pequeña; nunca decorativo gratuito.
- No catálogo extenso: solo lo estrictamente necesario.

## 2. Mapeo icono → movimiento → razón

| Icono (Lucide base) | Disparador | Movimiento | Duración/token | Razón | Dónde |
|---|---|---|---|---|---|
| ArrowRight / ArrowUpRight | hover (o parent) | 
udge-x (4 px) | --motion-fast (150 ms) | Affordance de avance hacia detalle/externo | CTA, cards "Ver proyecto", links sección |
| Menu ↔ X | toggle menú móvil | morph (SVG path) | --motion-base (300 ms) | Comunica estado abierto/cerrado | site-header móvil (morph-icon) |
| ChevronDown | expandir/contraer | otate(180deg) | --motion-fast (150 ms) | Indica estado de expansión | FAQ, filtros desplegables |
| Send | envío de formulario | 
udge-x 4 px; al éxito usa CircleCheck | --motion-fast / --motion-slow | Feedback de acción y confirmación | /contacto |
| Phone / MessageCircle | hover/tap | pop 1→1.06 | --motion-fast (150 ms) | Acción real de contacto | mobile-action-bar, /contacto |
| MapPin | hover | 
udge-up (-2 px) | --motion-fast (150 ms) | Señala ubicación/interacción con mapa | /contacto, ficha proyecto |
| CircleCheck | tras éxito | draw (stroke-dashoffset) + fade | --motion-slow (600 ms) | Confirmación inequívoca | Formularios, admin |
| Loader (spinner) | solo durante loading real | otate continua | mientras loading | Única excepción a "sin bucle" | Botones de envío/guardado |
| Maximize / Expand | hover sobre imagen | pop 1→1.04 (o nudge) | --motion-fast (150 ms) | Affordance de ampliar (lightbox) | Galería proyecto |
| ExternalLink | hover | 
udge-x diagonal ligero | --motion-fast (150 ms) | Indica salida a recurso externo | Footer, enlaces externos |

Los elementos sin acción real permanecen estáticos y con ria-hidden="true".

## 3. Criterios técnicos

- Base @lucide/angular; sin React/Motion/Shadcn.
- Directiva ppIconMotion (IconMotionDirective) con triggers hover|focus|parent|inview y motions otate|nudge-x|nudge-up|pop|draw|shake|pulse.
- CSS nativo + @keyframes; reducido: global prefers-reduced-motion: reduce anula animaciones.
- 	rigger: parent: permite que tarjeta/botón active el icono.
- Atribución en THIRD_PARTY.md (Apache-2.0 de itshover; inspiración, no portado).
