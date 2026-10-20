import { Component, input } from '@angular/core';

type SkeletonVariant = 'text' | 'block' | 'circle';

/**
 * Placeholder de carga reutilizable (design system).
 * Presentacional y sin lógica: combina `animate-pulse` de Tailwind con las
 * formas base del sitio. Se documenta en `docs/design-system.md`.
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    @switch (variant()) {
      @case ('circle') {
        <div class="animate-pulse rounded-full bg-muted" [class]="sizeClass()"></div>
      }
      @case ('text') {
        <div class="grid gap-3">
          @for (line of lines(); track $index) {
            <div class="h-3 animate-pulse rounded bg-muted" [class]="line === lines() - 1 ? 'w-2/3' : 'w-full'"></div>
          }
        </div>
      }
      @default {
        <div class="animate-pulse rounded bg-muted" [class]="sizeClass()"></div>
      }
    }
  `,
})
export class AppSkeletonComponent {
  readonly variant = input<SkeletonVariant>('block');
  /** Número de líneas cuando `variant` es 'text'. */
  readonly lines = input(3);
  /** Clases utilitarias de tamaño/forma (p. ej. 'h-48 w-full'). */
  readonly sizeClass = input('h-48 w-full');
}
