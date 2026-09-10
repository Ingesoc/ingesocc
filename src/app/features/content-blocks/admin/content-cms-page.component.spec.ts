import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SupabaseService } from '../../../core/supabase.service';
import { ContentBlocksService } from '../data-access/content-blocks.service';
import { ContentCmsPageComponent } from './content-cms-page.component';

describe('ContentCmsPageComponent', () => {
  let fixture: ComponentFixture<ContentCmsPageComponent>;
  let blocks: {
    load: jasmine.Spy;
    updateBlock: jasmine.Spy;
    byPage: () => Record<string, Record<string, unknown>>;
    block: (page: string, key: string) => unknown;
    image: (page: string, key: string) => string;
    uploadContentImage: jasmine.Spy;
  };

  const PAGE_BLOCKS = {
    home: {
      'hero.title': { page: 'home', sectionKey: 'hero.title', type: 'text', valueText: 'Título', valueNumber: null, valueImagePath: null },
      'stats.years_experience': { page: 'home', sectionKey: 'stats.years_experience', type: 'number', valueText: null, valueNumber: 15, valueImagePath: null },
      'hero.background_image': { page: 'home', sectionKey: 'hero.background_image', type: 'image', valueText: null, valueNumber: null, valueImagePath: 'https://cdn.test/hero.jpg' },
    },
  };

  beforeEach(async () => {
    blocks = {
      load: jasmine.createSpy('load').and.resolveTo(true),
      updateBlock: jasmine.createSpy('updateBlock').and.resolveTo(undefined),
      byPage: () => PAGE_BLOCKS,
      block: (page: string, key: string) => (PAGE_BLOCKS as Record<string, any>)[page]?.[key],
      image: () => 'https://cdn.test/nueva.jpg',
      uploadContentImage: jasmine.createSpy('uploadContentImage').and.resolveTo('content/nueva.jpg'),
    };
    TestBed.configureTestingModule({
      imports: [ContentCmsPageComponent],
      providers: [
        { provide: SupabaseService, useValue: {} },
        { provide: ContentBlocksService, useValue: blocks },
      ],
    });
    fixture = TestBed.createComponent(ContentCmsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('agrupa los bloques de la página activa y muestra etiquetas amigables', () => {
    const html = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(html).toContain('Título principal'); // label de hero.title
    expect(html).toContain('Estadísticas'); // grupo de stats.*
    expect(html).not.toContain('No se pudo conectar');
  });

  it('muestra el banner de error cuando Supabase falla (no seed como dato real)', async () => {
    blocks.load.and.resolveTo(false);
    await fixture.componentInstance.reload();
    fixture.detectChanges();
    const html = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(fixture.componentInstance.loadError()).toContain('No se pudo conectar con Supabase');
    expect(html).toContain('textos de ejemplo');
  });

  it('guarda un bloque de texto y muestra el estado Guardado', async () => {
    const component = fixture.componentInstance;
    const view = component.groups()[0].blocks.find((b) => b.sectionKey === 'hero.title');
    expect(view).toBeDefined();

    component.onText(view!, 'Nuevo título');
    await component.save(view!);
    fixture.detectChanges();

    expect(blocks.updateBlock).toHaveBeenCalledWith('home', 'hero.title', { valueText: 'Nuevo título' });
    const html = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(html).toContain('Guardado correctamente');
  });

  it('valida tipo y tamaño antes de subir una imagen', async () => {
    const component = fixture.componentInstance;
    const view = component.groups()[0].blocks.find((b) => b.type === 'image')!;
    const bad = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    const tooBig = new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.png', { type: 'image/png' });

    await component.replaceImage(view, { target: { files: [bad], value: '' } } as unknown as Event);
    expect(view.error).toContain('debe ser una imagen');
    expect(blocks.uploadContentImage).not.toHaveBeenCalled();

    await component.replaceImage(view, { target: { files: [tooBig], value: '' } } as unknown as Event);
    expect(view.error).toContain('5 MB');
    expect(blocks.uploadContentImage).not.toHaveBeenCalled();
  });
});
