import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AboutComponent } from './about.component';
import { ContentBlocksService } from '../content-blocks/data-access/content-blocks.service';
import { SupabaseService } from '../../core/supabase.service';
import { CloudinaryService } from '../../core/cloudinary.service';

/**
 * La sección 05 / Certificaciones se alimenta de cupos vacíos del CMS:
 * la página NUNCA publica certificaciones inventadas, solo las que el
 * cliente llena desde /admin.
 */
describe('AboutComponent (certificaciones)', () => {
  function fakeBlocks(values: Record<string, string>): Partial<ContentBlocksService> {
    return {
      text: (page: string, key: string, fallback = '') =>
        page === 'about' || page === 'contact' ? (values[key] ?? fallback) : fallback,
      number: () => 0,
      image: () => values['__image__'] ?? '',
    } as unknown as Partial<ContentBlocksService>;
  }

  function setup(values: Record<string, string>): AboutComponent {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ContentBlocksService, useValue: fakeBlocks(values) },
        { provide: SupabaseService, useValue: {} },
        { provide: CloudinaryService, useValue: {} },
      ],
    });
    return TestBed.createComponent(AboutComponent).componentInstance;
  }

  it('no publica tarjetas cuando los cupos están vacíos (estado en validación)', () => {
    const component = setup({});
    expect(component.certificaciones()).toEqual([]);
  });

  it('filtra cupos sin título y trimea los valores cargados', () => {
    const component = setup({
      'certificaciones.item1.title': 'ISO 9001:2015 ',
      'certificaciones.item1.issuer': 'ICONTEC',
      'certificaciones.item2.title': 'Licencia de construcción',
      'certificaciones.item3.title': '',
    });

    const certs = component.certificaciones();
    expect(certs).toHaveSize(2);
    expect(certs[0].title).toBe('ISO 9001:2015');
    expect(certs[0].issuer).toBe('ICONTEC');
    expect(certs[1].key).toBe('item2');
  });

  it('muestra la tarjeta de una certificación llena y oculta el placeholder', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ContentBlocksService,
          useValue: fakeBlocks({
            'certificaciones.item1.title': 'ISO 9001:2015',
            'certificaciones.item1.issuer': 'ICONTEC',
            'certificaciones.item1.link': 'https://verificar.test/iso-9001',
          }),
        },
        { provide: SupabaseService, useValue: {} },
        { provide: CloudinaryService, useValue: {} },
      ],
    });
    const fixture = TestBed.createComponent(AboutComponent);
    fixture.detectChanges();
    const html = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(html).toContain('ISO 9001:2015');
    expect(html).toContain('ICONTEC');
    expect(html).not.toContain('Certificaciones y licencias en validación');
  });

  it('con cupos vacíos mantiene el estado "en validación" (sin inventar datos)', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ContentBlocksService, useValue: fakeBlocks({}) },
        { provide: SupabaseService, useValue: {} },
        { provide: CloudinaryService, useValue: {} },
      ],
    });
    const fixture = TestBed.createComponent(AboutComponent);
    fixture.detectChanges();
    const html = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(html).toContain('Certificaciones y licencias en validación');
  });
});

/**
 * Fase 08: el timeline se dibuja con la directiva `appLineDraw` y la galería
 * de operaciones usa el lightbox compartido (`app-lightbox`).
 */
describe('AboutComponent (Fase 08: timeline y galería)', () => {
  function fakeBlocks(values: Record<string, string>): Partial<ContentBlocksService> {
    return {
      text: (page: string, key: string, fallback = '') =>
        page === 'about' || page === 'contact' ? (values[key] ?? fallback) : fallback,
      number: (page: string, key: string) => Number(values[key] ?? 0),
      image: () => values['__image__'] ?? '',
    } as unknown as Partial<ContentBlocksService>;
  }

  function setupDom(values: Record<string, string> = {}) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ContentBlocksService, useValue: fakeBlocks(values) },
        { provide: SupabaseService, useValue: {} },
        { provide: CloudinaryService, useValue: {} },
      ],
    });
    const fixture = TestBed.createComponent(AboutComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('dibuja el timeline con la línea animada y un hito por slot', () => {
    const fixture = setupDom({
      'timeline.item1.year': '2005',
      'timeline.item1.title': 'Fundación',
    });
    const html = fixture.nativeElement as HTMLElement;

    const line = html.querySelector('.timeline-line');
    expect(line).toBeTruthy();
    expect(line!.classList.contains('line-draw')).toBeTrue();
    expect(html.querySelectorAll('.timeline-item')).toHaveSize(4);
    expect(html.querySelectorAll('.timeline-dot')).toHaveSize(4);
    expect(html.textContent).toContain('Fundación');
  });

  it('renderiza las tarjetas de propósito con sus iconos', () => {
    const html = (setupDom().nativeElement as HTMLElement);
    expect(html.querySelector('svg[lucideTarget]')).toBeTruthy();
    expect(html.querySelector('svg[lucideEye]')).toBeTruthy();
    expect(html.querySelector('svg[lucideShieldCheck]')).toBeTruthy();
  });

  it('abre el lightbox compartido desde la galería de operaciones', () => {
    const fixture = setupDom();
    const html = fixture.nativeElement as HTMLElement;

    const trigger = html.querySelector<HTMLButtonElement>('button[aria-label^="Ampliar imagen"]');
    expect(trigger).toBeTruthy();

    trigger!.click();
    fixture.detectChanges();

    const img = html.querySelector<HTMLImageElement>('[role="dialog"] img');
    expect(img).toBeTruthy();
    expect(img!.getAttribute('aria-label')).toContain('Imagen 1 de');
  });
});