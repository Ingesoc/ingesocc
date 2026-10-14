import { TestBed } from '@angular/core/testing';
import { SupabaseService } from '../../../core/supabase.service';
import { CloudinaryService } from '../../../core/cloudinary.service';
import { ServicesService } from './services.service';
import type { ServiceInput } from './service.model';

interface Result {
  data?: unknown;
  error?: { message: string } | null;
}

/**
 * Cliente simulado que responde según (tabla, operación) y guarda el último
 * payload de insert. Mismo patrón que contact-messages.service.spec.ts.
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

const SERVICE_ROW = {
  id: 's1',
  name: 'Proyectos de Infraestructura',
  slug: 'proyectos-de-infraestructura',
  description: 'Desarrollamos puentes, obras civiles y grandes estructuras.',
  scope: 'Alcance propio del servicio.',
  deliverables: ['Estudios y diseños preliminares', 'Gerencia de obra'],
  faq: [{ q: '¿Cómo se cotiza?', a: 'Con la información del proyecto.' }],
  photo_path: 'services/photo.jpg',
  icon_name: null,
  status: 'published',
  sort_order: 1,
};

describe('ServicesService', () => {
  let responder: (table: string, operation: string) => Result;
  let fake: ReturnType<typeof createFakeClient>;

  function setup(): ServicesService {
    fake = createFakeClient(() => responder);
    TestBed.configureTestingModule({
      providers: [
        { provide: CloudinaryService, useValue: {} },
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
    return TestBed.inject(ServicesService);
  }

  beforeEach(() => {
    responder = (_table, operation) =>
      operation === 'select'
        ? { data: [SERVICE_ROW], error: null }
        : operation === 'insert'
          ? { data: { id: 's1' }, error: null }
          : { data: [], error: null };
  });

  it('load() mapea los campos de detalle (jsonb) al modelo público', async () => {
    const service = setup();
    await service.load();

    const first = service.published()[0];
    expect(first.scope).toBe(SERVICE_ROW.scope);
    expect(first.deliverables).toEqual(SERVICE_ROW.deliverables);
    expect(first.faq).toEqual(SERVICE_ROW.faq);
  });

  it('createService() envía scope/deliverables/faq como columnas jsonb (snake_case)', async () => {
    const service = setup();
    const input: ServiceInput = {
      name: 'Proyectos de Infraestructura',
      slug: 'proyectos-de-infraestructura',
      description: 'Descripción del servicio.',
      scope: 'Alcance de prueba.',
      deliverables: ['Ítem A', 'Ítem B'],
      faq: [{ q: '¿Pregunta?', a: 'Respuesta.' }],
      iconName: null,
      status: 'published',
      sortOrder: 1,
    };

    const id = await service.createService(input);

    expect(id).toBe('s1');
    const payload = fake.lastInsert() as Record<string, unknown>;
    expect(payload['scope']).toBe('Alcance de prueba.');
    expect(payload['deliverables']).toEqual(['Ítem A', 'Ítem B']);
    expect(payload['faq']).toEqual([{ q: '¿Pregunta?', a: 'Respuesta.' }]);
  });

  it('load() ante error mantiene el seed (sitio nunca roto) y marca loadState', async () => {
    const service = setup();
    responder = (_table, operation) => ({
      data: operation === 'select' ? null : [],
      error: { message: 'relation "public.services" does not exist' },
    });

    const ok = await service.load();

    expect(ok).toBe(false);
    expect(service.loadState()).toBe(true);
    expect(service.published().length).toBeGreaterThan(0);
  });
});