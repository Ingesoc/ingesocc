import { TestBed } from '@angular/core/testing';
import { SupabaseService } from '../../../core/supabase.service';
import { ContentBlocksService } from './content-blocks.service';

interface Result {
  data?: unknown[];
  error?: { message: string; code?: string } | null;
}

/**
 * Cliente simulado que responde según (tabla, operación): select/update/insert.
 * Lee la variable `responder` en el momento de resolver, para poder cambiarla
 * entre llamadas dentro de un mismo test.
 */
function createFakeClient(getResponder: () => (table: string, operation: string) => Result) {
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
      single: () => {
        ops.push('single');
        return chain;
      },
      update: () => {
        ops.push('update');
        return chain;
      },
      insert: () => {
        ops.push('insert');
        return chain;
      },
      then: (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
        Promise.resolve(getResponder()(table, ops[0] ?? 'select')).then(resolve, reject),
    };
    return chain;
  };
  return { from: (table: string) => chainFor(table) };
}

const BLOCK_ROW = {
  page: 'home',
  section_key: 'hero.title',
  type: 'text',
  value_text: 'Construimos espacios que trascienden.',
  value_number: null,
  value_image_path: null,
};

describe('ContentBlocksService', () => {
  let responder: (table: string, operation: string) => Result;

  function setup(): ContentBlocksService {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SupabaseService,
          useValue: {
            client: createFakeClient(() => responder),
            ready: true,
            resolvePublicUrl: (_bucket: string, path: string) =>
              path.startsWith('http') ? path : `https://cdn.test/${path}`,
          },
        },
      ],
    });
    return TestBed.inject(ContentBlocksService);
  }

  beforeEach(() => {
    responder = (_table, operation) =>
      operation === 'select' ? { data: [BLOCK_ROW], error: null } : { data: [], error: null };
    spyOn(console, 'warn');
  });

  it('actualiza un bloque existente y refleja el cambio localmente', async () => {
    const service = setup();
    await service.load();

    await service.updateBlock('home', 'hero.title', { valueText: 'Otro título' });

    expect(service.text('home', 'hero.title')).toBe('Otro título');
  });

  it('re-lanza errores reales de persistencia (RLS) sin aplicar el cambio', async () => {
    const service = setup();
    await service.load();

    responder = (_table, operation) =>
      operation === 'select'
        ? { data: [BLOCK_ROW], error: null }
        : {
            data: [],
            error: { message: 'new row violates row-level security policy', code: '42501' },
          };

    let thrown: unknown;
    try {
      await service.updateBlock('home', 'hero.title', { valueText: 'No debería persistir' });
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeDefined();
    // El cambio NO se aplicó en memoria.
    expect(service.text('home', 'hero.title')).toBe('Construimos espacios que trascienden.');
  });

  it('aplica en memoria (sin romper) cuando la tabla no existe (42P01)', async () => {
    const service = setup();
    await service.load();

    responder = (_table, operation) =>
      operation === 'select'
        ? { data: [BLOCK_ROW], error: null }
        : { data: [], error: { message: 'relation "public.content_blocks" does not exist', code: '42P01' } };

    await expectAsync(
      service.updateBlock('home', 'hero.title', { valueText: 'Cambio de desarrollo' }),
    ).toBeResolved();

    expect(service.text('home', 'hero.title')).toBe('Cambio de desarrollo');
  });

  it('resuelve la URL pública al guardar una imagen (storage path → URL)', async () => {
    const service = setup();
    await service.load();

    await service.updateBlock('home', 'hero.title', {
      valueImagePath: 'content/home/abc.png',
    });

    expect(service.image('home', 'hero.title')).toBe('https://cdn.test/content/home/abc.png');
  });
});
