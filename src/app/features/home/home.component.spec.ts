import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { HomeComponent } from './home.component';
import { ContentBlocksService } from '../content-blocks/data-access/content-blocks.service';
import { ProjectsService } from '../projects/data-access/projects.service';
import { ServicesService } from '../services/data-access/services.service';
import { TestimonialsService } from '../testimonials/data-access/testimonials.service';
import type { Testimonial } from '../testimonials/data-access/testimonial.model';

const PUBLISHED: Testimonial = {
  id: 't1',
  author: 'Alcaldía de Armenia',
  role: 'Entidad pública',
  quote: 'Excelente trabajo en el proyecto.',
  rating: 5,
  status: 'published',
  sortOrder: 1,
};

describe('HomeComponent (testimonios)', () => {
  function setup(published: Testimonial[]): ComponentFixture<HomeComponent> {
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        {
          provide: ContentBlocksService,
          useValue: {
            text: (_page: string, _key: string, fallback?: string) => fallback ?? '',
            image: () => '',
            number: (_page: string, _key: string, fallback?: number) => fallback ?? 0,
          },
        },
        { provide: ProjectsService, useValue: { featured: signal([]) } },
        { provide: ServicesService, useValue: { published: signal([]) } },
        { provide: TestimonialsService, useValue: { published: signal(published) } },
      ],
    });
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('sin testimonios publicados oculta la sección y deja el CTA en "06 / Hablemos"', () => {
    const fixture = setup([]);
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('#testimonios')).toBeNull();
    expect(el.textContent).toContain('06 / Hablemos');
    expect(el.textContent).not.toContain('07 / Hablemos');
    fixture.destroy();
  });

  it('con un testimonio publicado muestra autor, cargo y cita, y avanza el CTA a "07 / Hablemos"', () => {
    const fixture = setup([PUBLISHED]);
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('#testimonios')).not.toBeNull();
    expect(el.textContent).toContain('Alcaldía de Armenia');
    expect(el.textContent).toContain('Entidad pública');
    expect(el.textContent).toContain('Excelente trabajo en el proyecto.');
    expect(el.textContent).toContain('07 / Hablemos');
    fixture.destroy();
  });
});