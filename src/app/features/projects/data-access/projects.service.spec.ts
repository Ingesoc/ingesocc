import { TestBed } from '@angular/core/testing';
import { SupabaseService } from '../../../core/supabase.service';
import { ProjectsService } from './projects.service';

type TableResult = { data?: unknown[]; error?: { message: string; code?: string } | null };

type WrittenRow = { table: string; payload: Record<string, unknown> };

/**
 * Cliente Supabase simulado: cadenas de métodos (select/order/eq…) devuelven
 * un objeto thenable que resuelve con el resultado configurado por tabla.
 * Registra el payload de cada insert/update en `writes` para poder verificarlo.
 */
function createFakeClient(results: Record<string, TableResult>, writes: WrittenRow[] = []) {
  const chainFor = (table: string) => {
    const result = () => results[table] ?? { data: [], error: null };
    const chain = {
      select: () => chain,
      order: () => chain,
      eq: () => chain,
      single: () => chain,
      insert: (payload: Record<string, unknown>) => {
        writes.push({ table, payload });
        return chain;
      },
      update: (payload: Record<string, unknown>) => {
        writes.push({ table, payload });
        return chain;
      },
      delete: () => chain,
      then: (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
        Promise.resolve(result()).then(resolve, reject),
    };
    return chain;
  };
  return { from: (table: string) => chainFor(table) };
}

describe('ProjectsService', () => {
  let results: Record<string, TableResult>;
  let writes: WrittenRow[];

  function setup(): ProjectsService {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SupabaseService,
          useValue: {
            client: createFakeClient(results, writes),
            ready: true,
            resolvePublicUrl: (bucket: string, path: string) =>
              path.startsWith('http') ? path : `https://cdn.test/${bucket}/${path}`,
          },
        },
      ],
    });
    return TestBed.inject(ProjectsService);
  }

  beforeEach(() => {
    results = {};
    writes = [];
    spyOn(console, 'warn');
    spyOn(console, 'info');
  });

  it('usa el seed estático cuando la tabla no existe (error 42P01)', async () => {
    results['projects'] = { error: { message: 'relation "public.projects" does not exist', code: '42P01' } };
    results['categories'] = { error: { message: 'relation "public.categories" does not exist', code: '42P01' } };

    const service = setup();
    await service.load();
    await service.loadCategories();

    const published = service.published();
    expect(published.length).toBe(10); // seed de 10 proyectos publicados
    expect(published.map((p) => p.sortOrder)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(service.bySlug('casa-ladera')).toBeDefined();
  });

  it('solo expone status=published y ordena por sortOrder', async () => {
    results['projects'] = {
      data: [
        { id: 'd1', title: 'Borrador', slug: 'borrador', description: 'x', price_min_wages: null, status: 'draft', featured: false, sort_order: 5 },
        { id: 'p2', title: 'Beta', slug: 'beta', description: 'x', price_min_wages: 10, status: 'published', featured: false, sort_order: 2 },
        { id: 'p1', title: 'Alfa', slug: 'alfa', description: 'x', price_min_wages: null, status: 'published', featured: true, sort_order: 1 },
      ],
    };
    results['categories'] = { data: [] };

    const service = setup();
    await service.load();

    expect(service.published().map((p) => p.slug)).toEqual(['alfa', 'beta']);
    expect(service.featured().map((p) => p.slug)).toEqual(['alfa']);
    expect(service.bySlug('borrador')).toBeUndefined();
  });

  it('muestra la lista vacía (sin seed) cuando la tabla existe pero está vacía', async () => {
    results['projects'] = { data: [] };
    results['categories'] = { data: [] };

    const service = setup();
    await service.load();

    expect(service.published().length).toBe(0);
    expect(service.featured().length).toBe(0);
  });

  it('loadCategories usa las filas de la tabla categories y expone sus nombres', async () => {
    results['projects'] = { data: [] };
    results['categories'] = {
      data: [
        { id: 'c1', name: 'Puentes', slug: 'puentes', sort_order: 1 },
        { id: 'c2', name: 'Edificaciones', slug: 'edificaciones', sort_order: 2 },
      ],
    };

    const service = setup();
    await service.loadCategories();

    expect(service.categoryNames()).toEqual(['Puentes', 'Edificaciones']);
    expect(service.categories().length).toBe(2);
  });

  it('createProject envía las columnas snake_case de la tabla projects', async () => {
    results['projects'] = { data: [{ id: 'nuevo-id' }] };
    const service = setup();

    await service.createProject({
      title: 'Casa',
      slug: 'casa',
      description: 'Desc',
      priceMinWages: 180,
      status: 'published',
      featured: true,
      sortOrder: 4,
    });

    expect(writes).toEqual([
      {
        table: 'projects',
        payload: {
          title: 'Casa',
          slug: 'casa',
          description: 'Desc',
          price_min_wages: 180,
          status: 'published',
          featured: true,
          sort_order: 4,
        },
      },
    ]);
  });

  it('updateProject envía las columnas snake_case de la tabla projects', async () => {
    results['projects'] = { data: [] };
    const service = setup();

    await service.updateProject('abc', {
      title: 'Casa 2',
      slug: 'casa-2',
      description: 'Desc 2',
      priceMinWages: null,
      status: 'draft',
      featured: false,
      sortOrder: 1,
    });

    expect(writes).toEqual([
      {
        table: 'projects',
        payload: {
          title: 'Casa 2',
          slug: 'casa-2',
          description: 'Desc 2',
          price_min_wages: null,
          status: 'draft',
          featured: false,
          sort_order: 1,
        },
      },
    ]);
  });
});
