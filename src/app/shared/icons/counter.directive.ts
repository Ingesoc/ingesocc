import {
  AfterViewInit,
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[appCounter]',
  standalone: true,
})
export class CounterDirective implements AfterViewInit, OnDestroy {
  readonly appCounter = input<number>(0);
  readonly counterDuration = input(1400);
  readonly counterSuffix = input('');
  readonly counterPrefix = input('');

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private af = 0;
  private prefersReduced = true;
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      this.prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    const nativeEl = this.el.nativeElement;
    const end = Math.max(0, this.appCounter());
    const duration = Math.max(300, this.counterDuration());

    const render = (val: number) => {
      nativeEl.textContent = `${this.counterPrefix()}${this.format(val)}${this.counterSuffix()}`;
    };

    // Reduced-motion (o entorno sin observer): mostrar el valor final de inmediato.
    if (this.prefersReduced || typeof IntersectionObserver === 'undefined') {
      render(end);
      return;
    }

    render(0);

    const run = () => {
      const startTime = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / duration);
        const easeOut = 1 - Math.pow(1 - t, 3);
        render(Math.round(end * easeOut));
        if (t < 1) {
          this.af = requestAnimationFrame(step);
        } else {
          render(end);
        }
      };
      this.af = requestAnimationFrame(step);
    };

    // Contar solo al entrar en viewport (plan Fase 06 §6.3).
    this.observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        this.observer?.disconnect();
        this.observer = undefined;
        run();
      },
      { threshold: 0.4 },
    );
    this.observer.observe(nativeEl);
  }

  private format(n: number): string {
    try {
      return new Intl.NumberFormat('es-CO').format(n);
    } catch {
      return n.toString();
    }
  }

  ngOnDestroy(): void {
    if (this.af) cancelAnimationFrame(this.af);
    this.observer?.disconnect();
    this.observer = undefined;
  }
}
