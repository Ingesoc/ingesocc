import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { ProjectsPageComponent } from './projects-page.component';
import { ProjectsService } from '../data-access/projects.service';
import type { Project } from '../data-access/project.model';

/** Proyecto con las categorías dadas (solo importan `slug`, `status`, `categories`). */
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

describe('ProjectsPageComponent (filtro por URL)', () => {
  let projectsStub: {
    published: () => Project[];
    categoryNames: () => string[];
  };
  let routerSpy: { navigate: jasmine.Spy };
  let routeStub: { snapshot: { queryParamMap: ReturnType<typeof convertToParamMap> } };

  /**
   * Instancia el componente SIN detectChanges: el template (con las cards y su
   * RouterLink) requiere providers completos del router que esta suite no
   * necesita — lo que se prueba aquí es la lógica del filtro.
   */
  function createPage(): ProjectsPageComponent {
    return TestBed.createComponent(ProjectsPageComponent).componentInstance;
  }

  beforeEach(() => {
    projectsStub = {
      published: () => [
        projectOf('puente-norte', ['Edificaciones']),
        projectOf('taller-sur', ['Estructuras Metálicas']),
      ],
      categoryNames: () => ['Edificaciones', 'Estructuras Metálicas'],
    };
    routerSpy = { navigate: jasmine.createSpy('navigate').and.resolveTo(true) };
    routeStub = { snapshot: { queryParamMap: convertToParamMap({}) } };

    TestBed.configureTestingModule({
      providers: [
        { provide: ProjectsService, useValue: projectsStub },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    });
  });

  it('arranca en "Todos" (slug vacío) y muestra todos los publicados', () => {
    const page = createPage();
    expect(page.isActive('Todos')).toBeTrue();
    expect(page.filtered().length).toBe(2);
  });

  it('inicializa el filtro desde el query param ?categoria= (deep link)', () => {
    routeStub.snapshot.queryParamMap = convertToParamMap({ categoria: 'estructuras-metalicas' });
    const page = createPage();
    expect(page.filtered().map((p) => p.slug)).toEqual(['taller-sur']);
  });

  it('compara categorías por slug (mayúsculas y acentos)', () => {
    const page = createPage();
    page.setCategory('Edificaciones');
    expect(page.filtered().map((p) => p.slug)).toEqual(['puente-norte']);
    expect(page.isActive('Edificaciones')).toBeTrue();
    expect(page.isActive('Todos')).toBeFalse();
  });

  it('setCategory navega con el query param y reinicia la paginación', () => {
    const page = createPage();
    page.loadMore();
    expect(page.visibleCount()).toBe(16);

    page.setCategory('Edificaciones');

    expect(routerSpy.navigate).toHaveBeenCalledWith([], {
      queryParams: { categoria: 'edificaciones' },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    expect(page.visibleCount()).toBe(8);
  });

  it('"Todos" elimina el query param (categoria: null)', () => {
    routeStub.snapshot.queryParamMap = convertToParamMap({ categoria: 'edificaciones' });
    const page = createPage();
    page.setCategory('Todos');

    expect(routerSpy.navigate).toHaveBeenCalledWith([], {
      queryParams: { categoria: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    expect(page.filtered().length).toBe(2);
  });

  it('un query param de categoría inexistente no lanza resultados (estado vacío)', () => {
    routeStub.snapshot.queryParamMap = convertToParamMap({ categoria: 'no-existe' });
    const page = createPage();
    expect(page.filtered()).toEqual([]);
    expect(page.visible()).toEqual([]);
    expect(page.hasMore()).toBeFalse();
  });
});
