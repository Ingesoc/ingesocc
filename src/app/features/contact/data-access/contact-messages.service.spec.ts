import { TestBed } from '@angular/core/testing';
import { SupabaseService } from '../../../core/supabase.service';
import { ContactMessagesService } from './contact-messages.service';

interface Result {
  data?: unknown[];
  error?: { message: string } | null;
}

/**
 * Cliente simulado que responde según (tabla, operación) y guarda los últimos
 * payloads de insert/update para poder asertar el mapeo snake_case. Mismo
 * patrón que content-blocks.service.spec.ts: la variable `responder` se lee al
 * resolver, para poder cambiarla entre llamadas dentro de un mismo test.
 */
function createFakeClient(getResponder: () => (table: string, operation: string) => Result) {
  let lastInsert: unknown = null;
  let lastUpdate: unknown = null;
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
      update: (payload?: unknown) => {
        ops.push('update');
        lastUpdate = payload;
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
      then: (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
        Promise.resolve(getResponder()(table, ops[0] ?? 'select')).then(resolve, reject),
    };
    return chain;
  };
  return {
    from: (table: string) => chainFor(table),
    lastInsert: () => lastInsert,
    lastUpdate: () => lastUpdate,
  };
}

const MESSAGE_ROW = {
  id: 'msg-1',
  name: 'Contacto Test',
  email: 'contacto@test.com',
  phone: null,
  subject: null,
  message: 'Hola, quiero una cotización.',
  project_type: 'Infraestructura',
  budget_range: 'Entre $100M y $500M',
  timeline: '6 a 12 meses',
  status: 'new',
  is_spam: false,
  website: null,
  read: false,
  created_at: new Date().toISOString(),
};

describe('ContactMessagesService', () => {
  let responder: (table: string, operation: string) => Result;
  let fake: ReturnType<typeof createFakeClient>;

  function setup(): ContactMessagesService {
    fake = createFakeClient(() => responder);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SupabaseService,
          useValue: {
            client: fake,
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

  it('load() mapea el contexto comercial del lead (metadata de lead)', async () => {
    const service = setup();
    await service.load();
    const message = service.messages()[0];
    expect(message.project_type).toBe('Infraestructura');
    expect(message.budget_range).toBe('Entre $100M y $500M');
    expect(message.timeline).toBe('6 a 12 meses');
    expect(message.status).toBe('new');
    expect(message.is_spam).toBe(false);
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

  it('insert() envía columnas snake_case (metadata de lead + honeypot)', async () => {
    const service = setup();
    await service.insert({
      name: 'Contacto Test',
      email: 'contacto@test.com',
      phone: null,
      subject: null,
      message: 'Quiero una cotización para una bodega.',
      project_type: 'Diseño',
      budget_range: 'Menos de $100M',
      timeline: 'Inmediato',
      website: '',
    });

    const payload = fake.lastInsert() as Record<string, unknown>;
    expect(payload['project_type']).toBe('Diseño');
    expect(payload['budget_range']).toBe('Menos de $100M');
    expect(payload['timeline']).toBe('Inmediato');
    expect(payload['website']).toBe('');
    expect(payload['message']).toContain('cotización');
  });

  it('insert() sin contexto envía null en la metadata y honeypot vacío', async () => {
    const service = setup();
    await service.insert({
      name: 'Contacto Test',
      email: 'contacto@test.com',
      phone: null,
      subject: null,
      message: 'Un mensaje sencillo de contacto.',
    });

    const payload = fake.lastInsert() as Record<string, unknown>;
    expect(payload['project_type']).toBeNull();
    expect(payload['budget_range']).toBeNull();
    expect(payload['timeline']).toBeNull();
    expect(payload['website']).toBe('');
  });

  it('setStatus() envía { status } y actualiza la señal', async () => {
    const service = setup();
    await service.load();
    await service.setStatus('msg-1', 'contacted');

    expect(fake.lastUpdate()).toEqual({ status: 'contacted' });
    expect(service.messages()[0].status).toBe('contacted');
  });
});