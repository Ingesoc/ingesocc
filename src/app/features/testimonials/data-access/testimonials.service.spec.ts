import { TestBed } from '@angular/core/testing';
import { SupabaseService } from '../../../core/supabase.service';
import { TestimonialsService } from './testimonials.service';
import type { TestimonialInput } from './testimonial.model';

interface Result {
  data?: unknown;
  error?: { message: string } | null;
}

/**
 * Cliente simulado que responde según (tabla, operación) y guarda el último
 * payload de insert. Mismo patrón que services.service.spec.ts.
 */
function createFakeClient(getResponder: () => (table: string, operation: string) => Result) {
  let lastInsert: unknown = null;
  const chainFor = (table: string) => {
    const ops: string[] = [];
    const chain = {
      select: () => {
        ops.push('select');
        return chain;
      },
      order: () => {
        ops.push('order');
        return chain;
      },
      eq: () => {
        ops.push('eq');
        return chain;
      },
      update: () => {
        ops.push('update');
        return chain;
      },
      delete: () => {
        ops.push('delete');
        return chain;
      },
      insert: (payload?: unknown) => {
        ops.push('insert');
        lastInsert = payload;
        return chain;
      },
      single: () => {
        ops.push('single');
        return chain;
      },
      then: (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
        Promise.resolve(getResponder()(table, ops[0] ?? 'select')).then(resolve, reject),
    };
    return chain;
  };
  return {
    from: (table: string) => chainFor(table),
    lastInsert: () => lastInsert,
  };
}

const TESTIMONIAL_ROW = {
  id: 't1',
  author: 'Alcaldía de Armenia',
  role: 'Entidad pública',
  quote: 'Excelente trabajo en el proyecto.',
  rating: 5,
  status: 'published',
  sort_order: 1,
};

describe('TestimonialsService', () => {
  let responder: (table: string, operation: string) => Result;
  let fake: ReturnType<typeof createFakeClient>;

  function setup(): TestimonialsService {
    fake = createFakeClient(() => responder);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SupabaseService,
          useValue: {
            clientPromise: Promise.resolve({}),
            client: fake,
            ready: true,
            resolvePublicUrl: (_bucket: string, path: string) => path,
          },
        },
      ],
    });
    return TestBed.inject(TestimonialsService);
  }

  beforeEach(() => {
    responder = (_table, operation) =>
      operation === 'select'
        ? { data: [TESTIMONIAL_ROW], error: null }
        : operation === 'insert'
          ? { data: { id: 't1' }, error: null }
          : { data: [], error: null };
  });

  it('load() mapea las filas (snake_case → modelo) y ordena por sort_order', async () => {
    const service = setup();
    await service.load();

    const first = service.published()[0];
    expect(first.author).toBe(TESTIMONIAL_ROW.author);
    expect(first.role).toBe(TESTIMONIAL_ROW.role);
    expect(first.quote).toBe(TESTIMONIAL_ROW.quote);
    expect(first.rating).toBe(5);
    expect(first.sortOrder).toBe(1);
  });

  it('create() envía el payload en snake_case (sort_order, no sortOrder)', async () => {
    const service = setup();
    const input: TestimonialInput = {
      author: 'Secretaría de Infraestructura',
      role: null,
      quote: 'Cumplimiento total del cronograma.',
      rating: 4,
      status: 'draft',
      sortOrder: 2,
    };

    const id = await service.createTestimonial(input);

    expect(id).toBe('t1');
    const payload = fake.lastInsert() as Record<string, unknown>;
    expect(payload['author']).toBe('Secretaría de Infraestructura');
    expect(payload['role']).toBeNull();
    expect(payload['rating']).toBe(4);
    expect(payload['sort_order']).toBe(2);
  });

  it('ante error muestra cero publicados y marca loadState (la sección del Home se oculta, sin seed falso)', async () => {
    const service = setup();
    responder = () => ({
      data: null,
      error: { message: 'relation "public.testimonials" does not exist' },
    });

    const ok = await service.load();

    expect(ok).toBe(false);
    expect(service.loadState()).toBe(true);
    expect(service.published().length).toBe(0);
  });
});