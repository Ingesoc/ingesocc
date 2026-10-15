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
  private cleanupUnobserve?: () => void;

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      this.prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    const nativeEl = this.el.nativeElement;
    const start = 0;
    const end = Math.max(0, this.appCounter());
    const duration = Math.max(300, this.counterDuration());

    const setFinal = () => {
      nativeEl.textContent = `${this.counterPrefix()}${this.format(end)}${this.counterSuffix()}`;
    };

    if (this.prefersReduced) {
      setFinal();
      return;
    }

    const startTime = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const easeOut = 1 - Math.pow(1 - t, 3);
      const val = Math.round(start + (end - start) * easeOut);
      nativeEl.textContent = `${this.counterPrefix()}${this.format(val)}${this.counterSuffix()}`;
      if (t < 1) {
        this.af = requestAnimationFrame(step);
      } else {
        setFinal();
      }
    };

    nativeEl.textContent = `${this.counterPrefix()}${this.format(start)}${this.counterSuffix()}`;
    this.af = requestAnimationFrame(step);

    // Unobserve not necessary if no IntersectionObserver used now; but leave optional
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
    if (this.cleanupUnobserve) this.cleanupUnobserve();
  }
}
