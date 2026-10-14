import { TestBed } from '@angular/core/testing';
import { ContactComponent } from './contact.component';
import { ContentBlocksService } from '../content-blocks/data-access/content-blocks.service';
import { ContactMessagesService } from './data-access/contact-messages.service';
import { SupabaseService } from '../../core/supabase.service';
import { CloudinaryService } from '../../core/cloudinary.service';
import { SupabaseStorageService } from '../../core/supabase-storage.service';

/**
 * Datos de contacto corporativos reales (fuente: src/constants/project.ts de
 * VentaDeLotes). Sirven de guardia: la página /contacto no debe volver a
 * mostrar placeholders de ejemplo.
 */
const REAL_CONTACT = {
  phone: '+57 312 737 0811',
  whatsapp: 'https://wa.me/573127370811',
  email: 'gerencia.ingesocc@gmail.com',
  address: 'Armenia – km 6 vía La Tebaida, Bodega 2',
};

describe('ContactComponent (datos corporativos reales)', () => {
  function blocksWith(values: Record<string, string>): Partial<ContentBlocksService> {
    const text = (page: string, key: string, fallback = '') =>
      page === 'contact' ? (values[key] ?? fallback) : fallback;
    return { text: text as ContentBlocksService['text'] };
  }

  function setup(values: Record<string, string>): ContactComponent {
    TestBed.configureTestingModule({
      providers: [
        { provide: ContentBlocksService, useValue: blocksWith(values) },
        { provide: SupabaseService, useValue: {} },
        { provide: CloudinaryService, useValue: {} },
      ],
    });
    return TestBed.createComponent(ContactComponent).componentInstance;
  }

  it('expone el teléfono, email y dirección reales del CMS', () => {
    const component = setup(REAL_CONTACT);

    expect(component.phone()).toBe(REAL_CONTACT.phone);
    expect(component.email()).toBe(REAL_CONTACT.email);
    expect(component.address()).toBe(REAL_CONTACT.address);
  });

  it('construye el enlace tel: normalizando espacios y signos', () => {
    const component = setup(REAL_CONTACT);
    expect(component.phoneHref()).toBe('tel:+573127370811');
  });

  it('sin teléfono no genera enlace tel: roto', () => {
    const component = setup({ whatsapp: REAL_CONTACT.whatsapp });
    expect(component.phoneHref()).toBeNull();
  });

  it('expone la URL wa.me como CTA de WhatsApp', () => {
    const component = setup(REAL_CONTACT);
    expect(component.whatsappUrl()).toBe(REAL_CONTACT.whatsapp);
  });

  it('sin bloque de WhatsApp el CTA queda vacío (la plantilla lo oculta)', () => {
    const component = setup({ phone: REAL_CONTACT.phone, email: REAL_CONTACT.email });
    expect(component.whatsappUrl()).toBe('');
  });

  it('los placeholders de ejemplo ya no existen en el seed estático', async () => {
    // Cliente Supabase simulado que responde 42P01 (tabla inexistente): el
    // servicio conserva el seed estático y nunca toca red en el test.
    const failure = { data: null, error: { message: 'relation "public.content_blocks" does not exist', code: '42P01' } };
    const chain = {
      select: () => chain,
      order: () => chain,
      eq: () => chain,
      then: (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
        Promise.resolve(failure).then(resolve, reject),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: { clientPromise: Promise.resolve({}), client: { from: () => chain }, ready: false } },
        { provide: CloudinaryService, useValue: {} },
        { provide: SupabaseStorageService, useValue: {} },
      ],
    });
    spyOn(console, 'warn');
    const service = TestBed.inject(ContentBlocksService);
    await service.load();

    expect(service.text('contact', 'phone')).toBe(REAL_CONTACT.phone);
    expect(service.text('contact', 'email')).toBe(REAL_CONTACT.email);
    expect(service.text('contact', 'address')).toBe(REAL_CONTACT.address);
    expect(service.text('contact', 'whatsapp')).toBe(REAL_CONTACT.whatsapp);
  });
});

describe('ContactComponent (formulario → lead)', () => {
  it('onSubmit() envía metadata del proyecto y honeypot al servicio', async () => {
    const insertSpy = jasmine.createSpy('insert').and.resolveTo();
    const blocks = {
      text: (page: string, key: string, fallback = '') =>
        page === 'contact' ? ((REAL_CONTACT as Record<string, string>)[key] ?? fallback) : fallback,
    } as unknown as ContentBlocksService;

    TestBed.configureTestingModule({
      providers: [
        { provide: ContentBlocksService, useValue: blocks },
        { provide: SupabaseService, useValue: {} },
        { provide: CloudinaryService, useValue: {} },
        { provide: ContactMessagesService, useValue: { insert: insertSpy } },
      ],
    });
    const component = TestBed.createComponent(ContactComponent).componentInstance;
    component.form.setValue({
      name: 'Cliente Prueba',
      email: 'cliente@test.com',
      phone: '',
      subject: 'Cotización bodega',
      message: 'Quiero una cotización para una bodega en Quimbaya.',
      projectType: 'Industria',
      budgetRange: 'Entre $100M y $500M',
      timeline: '3 a 6 meses',
      website: '',
    });

    await component.onSubmit();

    expect(insertSpy).toHaveBeenCalledWith({
      name: 'Cliente Prueba',
      email: 'cliente@test.com',
      phone: null,
      subject: 'Cotización bodega',
      message: 'Quiero una cotización para una bodega en Quimbaya.',
      project_type: 'Industria',
      budget_range: 'Entre $100M y $500M',
      timeline: '3 a 6 meses',
      website: '',
    });
  });
});
