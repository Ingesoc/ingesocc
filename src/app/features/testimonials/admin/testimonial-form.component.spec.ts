import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TestimonialsService } from '../data-access/testimonials.service';
import { TestimonialFormComponent } from './testimonial-form.component';

const TESTIMONIAL = {
  id: 't1',
  author: 'Alcaldía de Armenia',
  role: 'Entidad pública',
  quote: 'Excelente trabajo en el proyecto.',
  rating: 5,
  status: 'published' as const,
  sortOrder: 1,
};

describe('TestimonialFormComponent (nuevo)', () => {
  let fixture: ComponentFixture<TestimonialFormComponent>;
  const create = jasmine.createSpy('createTestimonial').and.resolveTo('t1');
  const refreshAll = jasmine.createSpy('refreshAll').and.resolveTo(undefined);

  beforeEach(() => {
    create.calls.reset();
    refreshAll.calls.reset();
    TestBed.configureTestingModule({
      imports: [TestimonialFormComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({})) } },
        {
          provide: TestimonialsService,
          useValue: {
            adminTestimonials: () => [],
            loadAll: jasmine.createSpy('loadAll').and.resolveTo(undefined),
            byId: () => null,
            createTestimonial: create,
            updateTestimonial: jasmine.createSpy('updateTestimonial').and.resolveTo(undefined),
            refreshAll,
          },
        },
      ],
    });
    fixture = TestBed.createComponent(TestimonialFormComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('inicia como borrador y envía valores recortados (con role nulo y rating) al crear', async () => {
    const component = fixture.componentInstance;
    expect(component.isEdit()).toBeFalse();
    expect(component.form.controls.status.value).toBe('draft');

    component.form.controls.author.setValue('  Alcaldía de Armenia  ');
    component.form.controls.quote.setValue('  Cumplimiento total del cronograma.  ');
    component.form.controls.rating.setValue(4);

    await component.onSave();

    expect(create).toHaveBeenCalledWith({
      author: 'Alcaldía de Armenia',
      role: null,
      quote: 'Cumplimiento total del cronograma.',
      rating: 4,
      status: 'draft',
      sortOrder: 0,
    });
    expect(refreshAll).toHaveBeenCalled();
  });

  it('no guarda si faltan campos obligatorios', async () => {
    const component = fixture.componentInstance;
    await component.onSave();

    expect(create).not.toHaveBeenCalled();
  });

  it('tras guardar exitosamente navega al listado con ?guardado=1', async () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const component = fixture.componentInstance;

    component.form.controls.author.setValue('Alcaldía de Armenia');
    component.form.controls.quote.setValue('Cumplimiento total del cronograma.');
    await component.onSave();

    expect(navigate).toHaveBeenCalledWith(['/admin/testimonios'], { queryParams: { guardado: '1' } });
  });
});

describe('TestimonialFormComponent (edición)', () => {
  const update = jasmine.createSpy('updateTestimonial').and.resolveTo(undefined);
  const refreshAll = jasmine.createSpy('refreshAll').and.resolveTo(undefined);

  beforeEach(() => {
    update.calls.reset();
    refreshAll.calls.reset();
    TestBed.configureTestingModule({
      imports: [TestimonialFormComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: 't1' })) } },
        {
          provide: TestimonialsService,
          useValue: {
            adminTestimonials: () => [TESTIMONIAL],
            loadAll: jasmine.createSpy('loadAll').and.resolveTo(undefined),
            byId: (id: string) => (id === 't1' ? TESTIMONIAL : null),
            createTestimonial: jasmine.createSpy('createTestimonial').and.resolveTo('t1'),
            updateTestimonial: update,
            refreshAll,
          },
        },
      ],
    });
  });

  async function render(): Promise<ComponentFixture<TestimonialFormComponent>> {
    const fixture = TestBed.createComponent(TestimonialFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('carga los datos existentes al editar', async () => {
    const fixture = await render();
    const component = fixture.componentInstance;

    expect(component.isEdit()).toBeTrue();
    expect(component.form.controls.author.value).toBe(TESTIMONIAL.author);
    expect(component.form.controls.role.value).toBe(TESTIMONIAL.role);
    expect(component.form.controls.quote.value).toBe(TESTIMONIAL.quote);
    expect(component.form.controls.rating.value).toBe(5);
    expect(component.form.controls.status.value).toBe('published');
    fixture.destroy();
  });

  it('al guardar actualiza (y refresca publicados + admin)', async () => {
    const fixture = await render();
    const component = fixture.componentInstance;

    component.form.controls.quote.setValue('Texto editado por el admin.');
    await component.onSave();

    expect(update).toHaveBeenCalledWith('t1', jasmine.objectContaining({ quote: 'Texto editado por el admin.' }));
    expect(refreshAll).toHaveBeenCalled();
    fixture.destroy();
  });
});