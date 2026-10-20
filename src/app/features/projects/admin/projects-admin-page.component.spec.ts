import { TestBed, ComponentFixture, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ProjectsService } from '../data-access/projects.service';
import { ProjectsAdminPageComponent } from './projects-admin-page.component';

const PROJECT = {
  id: 'p1',
  title: 'Puente vehicular',
  slug: 'puente-vehicular',
  status: 'published' as const,
  featured: true,
  sortOrder: 1,
  priceMinWages: 1200,
  categoryIds: ['c1'],
  images: [{ isCover: true, url: 'https://cdn.test/cover.jpg' }],
};

describe('ProjectsAdminPageComponent', () => {
  let route: { snapshot: { queryParamMap: ReturnType<typeof convertToParamMap> } };
  let loadAll: jasmine.Spy;

  function configure(queryParams: Record<string, string>): void {
    route = { snapshot: { queryParamMap: convertToParamMap(queryParams) } };
    loadAll = jasmine.createSpy('loadAll').and.resolveTo(undefined);
    TestBed.configureTestingModule({
      imports: [ProjectsAdminPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: route },
        {
          provide: ProjectsService,
          useValue: {
            adminProjects: signal([PROJECT]),
            categories: signal([{ id: 'c1', name: 'Infraestructura' }]),
            loadAll,
            loadCategories: jasmine.createSpy('loadCategories').and.resolveTo(undefined),
            deleteProject: jasmine.createSpy('deleteProject').and.resolveTo(undefined),
            refreshAll: jasmine.createSpy('refreshAll').and.resolveTo(undefined),
          },
        },
      ],
    });
  }

  async function render(): Promise<ComponentFixture<ProjectsAdminPageComponent>> {
    const fixture = TestBed.createComponent(ProjectsAdminPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('muestra el listado y las etiquetas móviles de la tabla', async () => {
    configure({});
    const fixture = await render();
    const html = (fixture.nativeElement as HTMLElement).innerHTML;

    expect(html).toContain('Puente vehicular');
    expect(html).toContain('Categorías');
    expect(html).toContain('Valor');
    expect(html).toContain('Orden');
    fixture.destroy();
  });

  it('anuncia el error de carga con role="alert"', async () => {
    configure({});
    loadAll.and.rejectWith(new Error('red'));
    const fixture = await render();

    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('No se pudieron cargar los proyectos');
    fixture.destroy();
  });

  it('muestra el aviso de guardado con ?guardado=1 y lo oculta a los 6 s', fakeAsync(() => {
    configure({ guardado: '1' });
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);

    const fixture = TestBed.createComponent(ProjectsAdminPageComponent);
    fixture.detectChanges();
    flushMicrotasks();

    const status = (fixture.nativeElement as HTMLElement).querySelector('[role="status"]');
    expect(status?.textContent).toContain('Proyecto guardado correctamente');
    expect(status?.classList).toContain('alert-success');
    expect(fixture.componentInstance.justSaved()).toBeTrue();

    tick(6000);
    flushMicrotasks();

    expect(fixture.componentInstance.justSaved()).toBeFalse();
    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: route as unknown as ActivatedRoute,
      queryParams: {},
      replaceUrl: true,
    });

    fixture.destroy();
  }));

  it('sin ?guardado=1 no muestra el aviso', async () => {
    configure({});
    const fixture = await render();

    expect(fixture.componentInstance.justSaved()).toBeFalse();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')).toBeNull();
    fixture.destroy();
  });
});
