import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotFoundComponent } from './not-found.component';

/**
 * Fase 09: la 404 mantiene el chrome del sitio y refuerza su presentación
 * (numeral decorativo + iconos con micro-movimiento).
 */
describe('NotFoundComponent (Fase 09: polish 404)', () => {
  function setup(): HTMLElement {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('oculta el numeral 404 a lectores de pantalla', () => {
    const html = setup();
    const numeral = html.querySelector('p[aria-hidden="true"]');
    expect(numeral?.textContent?.trim()).toBe('404');
  });

  it('aplica micro-movimiento a los iconos de los enlaces', () => {
    const html = setup();
    const icons = html.querySelectorAll('svg[data-icon-motion]');
    expect(icons.length).toBe(2);
  });
});
