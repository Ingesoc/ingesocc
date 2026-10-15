import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  input,
  OnInit,
  Renderer2,
} from '@angular/core';

export type IconMotion = 'rotate' | 'nudge-x' | 'nudge-up' | 'pop' | 'draw' | 'shake' | 'pulse';
export type IconTrigger = 'hover' | 'focus' | 'parent' | 'inview';

@Directive({
  selector: '[appIconMotion]',
  standalone: true,
})
export class IconMotionDirective implements OnInit {
  readonly appIconMotion = input<IconMotion>('nudge-x');
  readonly iconTrigger = input<IconTrigger>('hover');

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private prefersReduced = true;

  ngOnInit(): void {
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      this.prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    const nativeEl = this.el.nativeElement;
    this.renderer.setAttribute(nativeEl, 'data-icon-motion', this.appIconMotion());
    this.renderer.setAttribute(nativeEl, 'data-icon-trigger', this.iconTrigger());
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.prefersReduced) return;
    if (this.iconTrigger() === 'hover' || this.iconTrigger() === 'parent') {
      this.addAnimating();
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.iconTrigger() === 'parent') return;
    this.removeAnimating();
  }

  @HostListener('focusin')
  onFocusIn(): void {
    if (this.prefersReduced) return;
    if (this.iconTrigger() === 'focus') {
      this.addAnimating();
    }
  }

  @HostListener('focusout')
  onFocusOut(): void {
    if (this.iconTrigger() === 'focus') this.removeAnimating();
  }

  @HostListener('animationend')
  onAnimEnd(): void {
    this.removeAnimating();
  }

  private addAnimating(): void {
    this.renderer.addClass(this.el.nativeElement, 'is-animating');
  }

  private removeAnimating(): void {
    this.renderer.removeClass(this.el.nativeElement, 'is-animating');
  }
}
