import { AfterViewInit, Directive, ElementRef, inject, OnDestroy } from '@angular/core';

/**
 * "Dibuja" una línea vertical al hacer scroll (plan 8.2, timeline de Quiénes Somos).
 *
 * Mejora progresiva:
 * - Con soporte de `animation-timeline: view()` → animación guiada por scroll (CSS puro).
 * - Sin soporte → `IntersectionObserver` dibuja la línea una vez entra en viewport.
 * - `prefers-reduced-motion: reduce` → línea completa de inmediato (sin animación).
 *
 * El alto/posición de la línea los define el CSS (`.timeline-line`); esta directiva
 * solo alterna las clases de estado (`line-draw`, `line-scroll`, `line-drawn`).
 */
@Directive({
  selector: '[appLineDraw]',
  standalone: true,
})
export class LineDrawDirective implements AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private observer: IntersectionObserver | null = null;

  ngAfterViewInit(): void {
    const nativeEl = this.el.nativeElement;
    nativeEl.classList.add('line-draw');

    const reduced =
      typeof window !== 'undefined' &&
      'matchMedia' in window &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      nativeEl.classList.add('line-drawn');
      return;
    }

    if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('animation-timeline: view()')) {
      nativeEl.classList.add('line-scroll');
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      nativeEl.classList.add('line-drawn');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            nativeEl.classList.add('line-drawn');
            this.cleanup();
            break;
          }
        }
      },
      { threshold: 0.15 },
    );
    this.observer.observe(nativeEl);
  }

  private cleanup(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  ngOnDestroy(): void {
    this.cleanup();
  }
}
