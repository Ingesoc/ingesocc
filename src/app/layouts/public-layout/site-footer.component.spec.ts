import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { SiteFooterComponent } from './site-footer.component';
import { ContentBlocksService } from '../../features/content-blocks/data-access/content-blocks.service';
import { ServicesService } from '../../features/services/data-access/services.service';

/**
 * Fase 09: el pie cierra la página con línea blueprint, contraste AA en
 * textos oscuros (token `on-dark-muted`) y un botón "volver arriba" accesible.
 */
describe('SiteFooterComponent (Fase 09: cierre de página)', () => {
  function setup(): ComponentFixture<SiteFooterComponent> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ContentBlocksService,
          useValue: { text: (_page: string, _key: string, fallback = '') => fallback },
        },
        { provide: ServicesService, useValue: { published: signal([]) } },
      ],
    });
    const fixture = TestBed.createComponent(SiteFooterComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('remata con una línea superior blueprint', () => {
    const html = setup().nativeElement as HTMLElement;
    const line = html.querySelector('footer > div.bg-accent');
    expect(line).toBeTruthy();
  });

  it('usa el token de contraste on-dark-muted y no textos white/40', () => {
    const html = setup().nativeElement as HTMLElement;
    expect(html.querySelector('.text-on-dark-muted')).toBeTruthy();
    expect(html.innerHTML).not.toContain('text-white/40');
  });

  it('marca los iconos de redes como decorativos', () => {
    const html = setup().nativeElement as HTMLElement;
    const socialIcons = html.querySelectorAll(
      'a[aria-label^="LinkedIn"] svg, a[aria-label^="Instagram"] svg, a[aria-label^="Facebook"] svg',
    );
    expect(socialIcons.length).toBe(3);
    socialIcons.forEach((icon) => expect(icon.getAttribute('aria-hidden')).toBe('true'));
  });

  it('el botón "volver arriba" es accesible y desplaza al inicio', () => {
    const spy = spyOn(window, 'scrollTo');
    const html = setup().nativeElement as HTMLElement;

    const button = html.querySelector<HTMLButtonElement>('button[aria-label="Volver arriba"]');
    expect(button).toBeTruthy();

    button!.click();
    const options = (spy as jasmine.Spy).calls.mostRecent().args[0] as ScrollToOptions;
    expect(options.top).toBe(0);
    expect(typeof options.behavior).toBe('string');
  });
});
