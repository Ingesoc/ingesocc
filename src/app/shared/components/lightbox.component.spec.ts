import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LightboxComponent, type LightboxImage } from './lightbox.component';

const IMAGES: LightboxImage[] = [
  { url: 'https://example.com/1.jpg', title: 'Uno' },
  { url: 'https://example.com/2.jpg', title: 'Dos' },
];

@Component({
  standalone: true,
  imports: [LightboxComponent],
  template: `
    <app-lightbox
      [images]="images"
      [openIndex]="index()"
      (lightboxClose)="closes = closes + 1"
      (indexChange)="index.set($event)"
    ></app-lightbox>
  `,
})
class HostComponent {
  readonly images = IMAGES;
  readonly index = signal<number | null>(0);
  closes = 0;
}

describe('LightboxComponent', () => {
  function create() {
    const fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('no renderiza el diálogo cuando está cerrado', () => {
    const fixture = create();
    fixture.componentInstance.index.set(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('emite lightboxClose al pulsar cerrar', () => {
    const fixture = create();
    const close = fixture.nativeElement.querySelector('[role="dialog"] button[aria-label="Cerrar galería"]') as HTMLButtonElement;
    close.click();
    expect(fixture.componentInstance.closes).toBe(1);
  });

  it('emite indexChange al navegar a la siguiente imagen', () => {
    const fixture = create();
    const next = fixture.nativeElement.querySelector('button[aria-label="Imagen siguiente"]') as HTMLButtonElement;
    next.click();
    expect(fixture.componentInstance.index()).toBe(1);
  });

  it('etiqueta la imagen como "Imagen X de N"', () => {
    const fixture = create();
    const img = fixture.nativeElement.querySelector('[role="dialog"] img') as HTMLImageElement;
    expect(img.getAttribute('aria-label')).toBe('Imagen 1 de 2: Uno');
  });

  it('avanza con swipe hacia la izquierda en móvil', () => {
    const fixture = create();
    const component = fixture.debugElement.children[0].componentInstance as LightboxComponent;
    component.onTouchStart({ changedTouches: [{ clientX: 220 }] } as unknown as TouchEvent);
    component.onTouchEnd({ changedTouches: [{ clientX: 120 }] } as unknown as TouchEvent);
    expect(fixture.componentInstance.index()).toBe(1);
  });

  it('atrapa el foco con Tab dentro del diálogo', () => {
    const fixture = create();
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    const buttons = Array.from(dialog.querySelectorAll<HTMLButtonElement>('button'));
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    last.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(first);
  });
});
