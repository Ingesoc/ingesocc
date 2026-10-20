import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { ProjectDetailComponent } from './project-detail.component';
import { ProjectsService } from '../data-access/projects.service';
import { SeoService } from '../../../core/seo.service';
import type { Project } from '../data-access/project.model';

/** Proyecto con las categorías dadas (solo importan `slug` y `categories`). */
function projectOf(slug: string, categories: string[]): Project {
  return {
    id: slug,
    title: slug,
    slug,
    description: '',
    priceMinWages: null,
    status: 'published',
    featured: false,
    sortOrder: 0,
    categories,
    images: [],
  };
}

describe('ProjectDetailComponent (navegación y relacionados)', () => {
  function create(slug: string): ProjectDetailComponent {
    const published: Project[] = [
      projectOf('a', ['Edificaciones']),
      projectOf('b', ['Edificaciones']),
      projectOf('c', ['Puentes']),
      projectOf('d', ['Edificaciones']),
    ];
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProjectsService,
          useValue: {
            published: () => published,
            bySlug: (value: string) => published.find((project) => project.slug === value),
          },
        },
        { provide: SeoService, useValue: { set: () => undefined } },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ slug })) } },
      ],
    });
    return TestBed.createComponent(ProjectDetailComponent).componentInstance;
  }

  it('calcula el proyecto anterior y siguiente según el orden publicado', () => {
    const page = create('b');
    expect(page.previousProject()?.slug).toBe('a');
    expect(page.nextProject()?.slug).toBe('c');
  });

  it('no hay anterior en el primero ni siguiente en el último', () => {
    expect(create('a').previousProject()).toBeNull();
    expect(create('d').nextProject()).toBeNull();
  });

  it('relaciona proyectos que comparten categoría, excluyendo el actual', () => {
    const page = create('a');
    expect(page.relatedProjects().map((project) => project.slug)).toEqual(['b', 'd']);
  });
});
