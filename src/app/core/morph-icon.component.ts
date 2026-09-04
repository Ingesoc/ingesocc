import {
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { createMorph } from 'morphicons/dom';
import type { Morph, ReducedMotionMode } from 'morphicons/dom';

/**
 * `d` canónicos extraídos de @lucide/angular 21.2.19 (el mismo paquete que ya
 * renderiza el resto de iconos del sitio), para que las formas coincidan
 * exactamente en reposo con los iconos estáticos de Lucide.
 */
export const MENU_PATH = 'M4 5h16M4 12h16M4 19h16';
export const CLOSE_PATH = 'M18 6 6 18m6 6 12 12';
export const PENCIL_PATH =
  'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497zm15 5 4 4';

/**
 * Icono de trazo con morph (morphicons/dom): cambia el input `icon` (un `d`
 * de 24×24) y el componente anima la forma con física de muelle.
 *
 * - Sin librería de componentes: un `<svg>` propio con las mismas
 *   características de Lucide (viewBox 24, trazo 2, round), por lo que el
 *   resto de la app puede seguir usando @lucide/angular para iconos estáticos.
 * - `reducedMotion` por defecto "user": respeta `prefers-reduced-motion`
 *   (el morph degrada a intercambio instantáneo). Regla del sistema de diseño:
 *   animaciones mínimas.
 * - El tamaño se controla con clases en el host (`h-5 w-5`, etc.); el `<svg>`
 *   rellena el host.
 */
@Component({
  selector: 'app-morph-icon',
  standalone: true,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class="h-full w-full"
    >
      <path #pathEl />
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-block;
        line-height: 0;
      }
    `,
  ],
})
export class MorphIconComponent {
  /** `d` del icono actual: al cambiar, el componente hace morph al nuevo. */
  readonly icon = input.required<string>();

  /** Política de movimiento reducido del morph ("user" respeta el SO). */
  readonly reducedMotion = input<ReducedMotionMode>('user');

  private readonly pathEl = viewChild<ElementRef<SVGPathElement>>('pathEl');
  private readonly destroyRef = inject(DestroyRef);

  private morph: Morph | null = null;
  private lastD = '';

  constructor() {
    effect(() => {
      const d = this.icon();
      const path = this.pathEl()?.nativeElement;
      if (!d || !path) return;

      if (!this.morph) {
        // Primer icono: se pinta en reposo sin animar (contrato del driver).
        this.morph = createMorph(path, d, { reducedMotion: this.reducedMotion() });
        this.lastD = d;
        return;
      }

      // Política viva + morph solo cuando cambia la forma de destino.
      this.morph.reducedMotion = this.reducedMotion();
      if (d !== this.lastD) {
        this.morph.morphTo(d);
        this.lastD = d;
      }
    });

    this.destroyRef.onDestroy(() => this.morph?.destroy());
  }
}
