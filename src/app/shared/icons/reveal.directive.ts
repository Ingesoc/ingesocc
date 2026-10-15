import {
  AfterViewInit,
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';

const DEFAULT_STAGGER_MS = 70;

/**
 * IntersectionObserver compartido para revelar elementos en viewport.
 */
class RevealObserver {
  private static instance: RevealObserver | null = null;
  private observer: IntersectionObserver | null = null;
  private readonly targets = new Map<Element, () => void>();

  static getInstance(): RevealObserver {
    if (!RevealObserver.instance) {
      RevealObserver.instance = new RevealObserver();
    }
    return RevealObserver.instance;
  }

  observe(el: Element, callback: () => void): void {
    this.targets.set(el, callback);
    if (!this.observer) {
      this.observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const cb = this.targets.get(entry.target);
              if (cb) {
                cb();
                this.targets.delete(entry.target);
              }
            }
          }
          if (this.observer && this.targets.size === 0) {
            this.observer.disconnect();
            this.observer = null;
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
      );
    }
    this.observer.observe(el);
  }

  unobserve(el: Element): void {
    this.targets.delete(el);
    if (this.observer) {
      this.observer.unobserve(el);
      if (this.targets.size === 0) {
        this.observer.disconnect();
        this.observer = null;
      }
    }
  }
}

@Directive({
  selector: '[appReveal]',
  standalone: true,
})
export class RevealDirective implements OnInit, AfterViewInit, OnDestroy {
  /** Retardo en índices para stagger (cada unidad = stagger ms). */
  readonly revealIndex = input(0);
  /** Retrasar por N ms adicionales. */
  readonly revealDelay = input(0);
  /** Solo revelar una vez. */
  readonly revealOnce = input(true);

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly observer = RevealObserver.getInstance();
  private revealed = false;
  private prefersReduced = true;
  private cleanupUnobserve?: () => void;

  ngOnInit(): void {
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReduced = mq.matches;
    } else {
      this.prefersReduced = true;
    }
  }

  ngAfterViewInit(): void {
    if (this.prefersReduced) return;

    const nativeEl = this.el.nativeElement;
    this.renderer.addClass(nativeEl, 'reveal-pending');
    const staggerVar = getComputedStyle(document.documentElement).getPropertyValue('--motion-stagger').trim();
    const stagger = staggerVar ? parseInt(staggerVar.replace('ms',''),10) || DEFAULT_STAGGER_MS : DEFAULT_STAGGER_MS;
    const idx = Math.max(0, Math.min(this.revealIndex(), 20));
    const d = Math.max(0, this.revealDelay());
    const delay = idx * stagger + d;
    nativeEl.style.transitionDelay = `${delay}ms`;

    const show = () => {
      if (this.revealed) return;
      this.revealed = true;
      this.renderer.removeClass(nativeEl, 'reveal-pending');
      this.renderer.addClass(nativeEl, 'reveal-visible');
      if (this.cleanupUnobserve) {
        this.cleanupUnobserve();
        this.cleanupUnobserve = undefined;
      }
    };

    this.observer.observe(nativeEl, () => {
      requestAnimationFrame(show);
      if (this.revealOnce()) {
        this.cleanupUnobserve = () => this.observer.unobserve(nativeEl);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.cleanupUnobserve) this.cleanupUnobserve();
    else this.observer.unobserve(this.el.nativeElement);
  }
}
