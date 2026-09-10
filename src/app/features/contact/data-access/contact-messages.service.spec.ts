import { TestBed } from '@angular/core/testing';
import { SupabaseService } from '../../../core/supabase.service';
import { ContactMessagesService } from './contact-messages.service';

interface Result {
  data?: unknown[];
  error?: { message: string } | null;
}

/**
 * Cliente simulado que responde según (tabla, operación). Mismo patrón que
 * content-blocks.service.spec.ts: la variable `responder` se lee al resolver,
 * para poder cambiarla entre llamadas dentro de un mismo test.
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
      update: () => {
        ops.push('update');
        return chain;
      },
      delete: () => {
        ops.push('delete');
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

const MESSAGE_ROW = {
  id: 'msg-1',
  name: 'Contacto Test',
  email: 'contacto@test.com',
  phone: null,
  subject: null,
  message: 'Hola, quiero una cotización.',
  read: false,
  created_at: new Date().toISOString(),
};

describe('ContactMessagesService', () => {
  let responder: (table: string, operation: string) => Result;

  function setup(): ContactMessagesService {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SupabaseService,
          useValue: {
            client: createFakeClient(() => responder),
            ready: true,
            resolvePublicUrl: (_bucket: string, path: string) => path,
          },
        },
      ],
    });
    return TestBed.inject(ContactMessagesService);
  }

  beforeEach(() => {
    responder = (_table, operation) =>
      operation === 'select' ? { data: [MESSAGE_ROW], error: null } : { data: [], error: null };
  });

  it('load() puebla la señal con los mensajes ordenados', async () => {
    const service = setup();
    await service.load();
    expect(service.messages().length).toBe(1);
    expect(service.unreadCount()).toBe(1);
  });

  it('load() lanza el error para que la UI muestre su estado de error', async () => {
    const service = setup();
    responder = (_table, operation) =>
      operation === 'select'
        ? { data: [], error: { message: 'sin permisos RLS' } }
        : { data: [], error: null };

    await expectAsync(service.load()).toBeRejectedWithError('sin permisos RLS');
    // La señal queda vacía, pero el error NO se traga: el componente decide.
    expect(service.messages()).toEqual([]);
  });
});
