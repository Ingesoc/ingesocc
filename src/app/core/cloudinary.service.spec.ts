import { TestBed } from '@angular/core/testing';
import { CloudinaryService } from './cloudinary.service';
import { SupabaseService } from './supabase.service';
import { SupabaseStorageService } from './supabase-storage.service';
import { MediaApiError } from './cloudinary.model';

const CLOUD_URL =
  'https://res.cloudinary.com/ingesocc/image/upload/v1699999999/ingesocc/projects/abc/9f1e-uuid.jpg';

/** Stub mínimo de la sesión de Supabase (lo único que la API propia necesita). */
function stubSupabase(token: string | null = 'jwt-admin'): {
  clientPromise: Promise<void>;
  client: { auth: { getSession: () => Promise<{ data: { session: { access_token: string } | null }; error: unknown }> } };
} {
  return {
    clientPromise: Promise.resolve(),
    client: {
      auth: {
        getSession: () =>
          Promise.resolve({
            data: { session: token ? { access_token: token } : null },
            error: null,
          }),
      },
    },
  };
}

function makeFile(name = 'obra.jpg', type = 'image/jpeg', size = 1024): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('CloudinaryService', () => {
  let service: CloudinaryService;
  let legacy: { upload: jasmine.Spy; remove: jasmine.Spy; bucketFor: jasmine.Spy; legacyPath: jasmine.Spy };
  let fetchCalls: { url: string; init?: RequestInit }[];
  let currentHandler: FetchHandler;
  let fetchSpyInstalled = false;

  beforeEach(() => {
    fetchCalls = [];
    currentHandler = () => jsonResponse({});
    // Jasmine restaura el espía al terminar cada `it`, así que hay que volver
    // a instalarlo (y a permitir re-spies) en cada prueba.
    fetchSpyInstalled = false;
    legacy = {
      upload: jasmine.createSpy('upload').and.resolveTo('legacy/path.jpg'),
      remove: jasmine.createSpy('remove').and.resolveTo(undefined),
      bucketFor: jasmine.createSpy('bucketFor').and.callFake((folder: string) =>
        folder === 'projects' ? 'project-images' : folder === 'services' ? 'service-images' : null,
      ),
      legacyPath: jasmine.createSpy('legacyPath').and.callFake(() => 'legacy/path.jpg'),
    };

    TestBed.configureTestingModule({
      providers: [
        CloudinaryService,
        { provide: SupabaseService, useValue: stubSupabase() },
        { provide: SupabaseStorageService, useValue: legacy },
      ],
    });
    service = TestBed.inject(CloudinaryService);
  });

  /**
   * Instala un `fetch` falso (una sola vez) y registra cada llamada. El
   * handler se puede reasignar con `respondWith()` sin volver a espiar.
   */
  type FetchHandler = (url: string, init?: RequestInit) => Response;

  function mockFetch(handler: FetchHandler): void {
    currentHandler = handler;
    fetchCalls.length = 0;
    if (fetchSpyInstalled) return;
    fetchSpyInstalled = true;
    spyOn(window, 'fetch').and.callFake(((url: string, init?: RequestInit) => {
      fetchCalls.push({ url, init });
      return Promise.resolve(currentHandler(url, init));
    }) as unknown as typeof fetch);
  }

  /** Cambia la respuesta del `fetch` falso ya instalado. */
  function respondWith(handler: FetchHandler): void {
    currentHandler = handler;
  }

  function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const signatureBody = {
    timestamp: 1699999999,
    signature: 'sig-abc',
    cloudName: 'ingesocc',
    apiKey: 'key-123',
    folder: 'ingesocc/projects/abc',
    publicId: '9f1e-uuid',
  };

  it('sube a Cloudinary y devuelve la secure_url como referencia', async () => {
    mockFetch((url) =>
      url.includes('/api/cloudinary/signature')
        ? jsonResponse(signatureBody)
        : jsonResponse({
            secure_url: CLOUD_URL,
            public_id: 'ingesocc/projects/abc/9f1e-uuid',
            width: 1600,
            height: 1200,
            bytes: 4096,
          }),
    );

    const result = await service.uploadImage(makeFile(), 'projects', 'abc');

    expect(result.provider).toBe('cloudinary');
    expect(result.reference).toBe(CLOUD_URL);
    expect(result.publicId).toBe('ingesocc/projects/abc/9f1e-uuid');
    expect(legacy.upload).not.toHaveBeenCalled();
  });

  it('envía la firma, la carpeta y el public_id en el multipart', async () => {
    mockFetch((url) =>
      url.includes('/api/') ? jsonResponse(signatureBody) : jsonResponse({ secure_url: CLOUD_URL }),
    );

    await service.uploadImage(makeFile(), 'projects', 'abc');

    const uploadCall = fetchCalls.find((call) => call.url.includes('api.cloudinary.com'));
    expect(uploadCall).toBeDefined();
    const form = uploadCall!.init!.body as FormData;
    expect(form.get('api_key')).toBe('key-123');
    expect(form.get('signature')).toBe('sig-abc');
    expect(form.get('timestamp')).toBe('1699999999');
    expect(form.get('folder')).toBe('ingesocc/projects/abc');
    expect(form.get('public_id')).toBe('9f1e-uuid');
  });

  it('manda el JWT de Supabase en la llamada a la firma', async () => {
    mockFetch((url) =>
      url.includes('/api/') ? jsonResponse(signatureBody) : jsonResponse({ secure_url: CLOUD_URL }),
    );

    await service.uploadImage(makeFile(), 'projects', 'abc');

    const signatureCall = fetchCalls.find((call) => call.url.includes('/api/cloudinary/signature'));
    const headers = signatureCall!.init!.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer jwt-admin');
  });

  it('rechaza sin llamar a la API un formato o un tamaño no permitidos', async () => {
    mockFetch(() => jsonResponse(signatureBody));

    await expectAsync(
      service.uploadImage(makeFile('mal.svg', 'image/svg+xml'), 'projects', 'abc'),
    ).toBeRejectedWithError(MediaApiError);
    await expectAsync(
      service.uploadImage(makeFile('grande.jpg', 'image/jpeg', 9 * 1024 * 1024), 'projects', 'abc'),
    ).toBeRejectedWithError(MediaApiError);
    expect(fetchCalls).toHaveSize(0);
  });

  it('usa el límite del CMS cuando se le pasa', async () => {
    mockFetch((url) =>
      url.includes('/api/')
        ? jsonResponse(signatureBody)
        : jsonResponse({ secure_url: CLOUD_URL, public_id: 'ingesocc/content/uuid' }),
    );

    const file = makeFile('grande.jpg', 'image/jpeg', 3 * 1024 * 1024);
    await expectAsync(service.uploadImage(file, 'content', undefined, 5 * 1024 * 1024)).toBeResolved();
  });

  describe('degradación a Supabase Storage', () => {
    it('cae a Storage si la función de firma responde 503', async () => {
      mockFetch(() => jsonResponse({ message: 'no configurado' }, 503));

      const result = await service.uploadImage(makeFile(), 'projects', 'abc');

      expect(result.provider).toBe('supabase');
      expect(result.reference).toBe('legacy/path.jpg');
      expect(legacy.upload).toHaveBeenCalledWith('project-images', 'legacy/path.jpg', jasmine.anything());
    });

    it('marca el servicio como caído y evita seguir pidiendo firmas', async () => {
      mockFetch(() => jsonResponse({ message: 'no configurado' }, 503));

      await service.uploadImage(makeFile(), 'projects', 'abc');
      const callsAfterFirst = fetchCalls.length;
      await service.uploadImage(makeFile(), 'projects', 'abc');

      expect(fetchCalls.length).toBe(callsAfterFirst);
      expect(service.available).toBe(false);
    });

    it('vuelve a intentar Cloudinary tras resetAvailability()', async () => {
      mockFetch(() => jsonResponse({ message: 'no configurado' }, 503));
      await service.uploadImage(makeFile(), 'projects', 'abc');

      service.resetAvailability();
      respondWith((url) =>
        url.includes('/api/') ? jsonResponse(signatureBody) : jsonResponse({ secure_url: CLOUD_URL }),
      );

      const result = await service.uploadImage(makeFile(), 'projects', 'abc');
      expect(result.provider).toBe('cloudinary');
      expect(service.available).toBe(true);
    });

    it('NO degrada un 401 ni un 403 (son errores de sesión, no de disponibilidad)', async () => {
      mockFetch(() => jsonResponse({ message: 'no autorizado' }, 401));

      await expectAsync(service.uploadImage(makeFile(), 'projects', 'abc')).toBeRejectedWithError(
        MediaApiError,
      );
      expect(legacy.upload).not.toHaveBeenCalled();
    });

    it('propaga el error si la carpeta no tiene bucket legacy (team/general)', async () => {
      mockFetch(() => jsonResponse({ message: 'no configurado' }, 503));

      await expectAsync(service.uploadImage(makeFile(), 'team')).toBeRejectedWithError(MediaApiError);
    });
  });

  describe('errores de Cloudinary', () => {
    it('avisa cuando la firma expiró, sin degradar', async () => {
      mockFetch((url) =>
        url.includes('/api/')
          ? jsonResponse(signatureBody)
          : jsonResponse({ error: { message: 'Invalid signature or timestamp' } }, 400),
      );

      await expectAsync(service.uploadImage(makeFile(), 'projects', 'abc')).toBeRejectedWithError(
        /firma de subida expiró/i,
      );
    });

    it('avisa cuando la imagen excede el límite de Cloudinary', async () => {
      mockFetch((url) =>
        url.includes('/api/')
          ? jsonResponse(signatureBody)
          : jsonResponse({ error: { message: 'File size limit exceeded' } }, 413),
      );

      await expectAsync(service.uploadImage(makeFile(), 'projects', 'abc')).toBeRejectedWithError(
        /supera el tamaño permitido/i,
      );
    });
  });

  describe('deleteImage', () => {
    it('destruye el asset de Cloudinary por su public_id', async () => {
      mockFetch(() => jsonResponse({ ok: true }));

      await service.deleteImage(CLOUD_URL, 'projects');

      const call = fetchCalls[0];
      expect(call.url).toContain('/api/cloudinary/destroy');
      expect(JSON.parse(call.init!.body as string)).toEqual({
        publicId: 'ingesocc/projects/abc/9f1e-uuid',
      });
    });

    it('borra la ruta legacy en el bucket que le corresponde', async () => {
      await service.deleteImage('project-images/abc/x.jpg', 'projects');

      expect(legacy.remove).toHaveBeenCalledWith('project-images', ['project-images/abc/x.jpg']);
      expect(fetchCalls).toHaveSize(0);
    });

    it('no hace nada con referencias vacías', async () => {
      await service.deleteImage(null, 'projects');
      await service.deleteImage('', 'projects');
      expect(legacy.remove).not.toHaveBeenCalled();
    });

    it('nunca propaga el fallo del borrado (el cambio ya está guardado)', async () => {
      mockFetch(() => jsonResponse({ message: 'boom' }, 500));
      spyOn(console, 'warn');

      await expectAsync(service.deleteImage(CLOUD_URL, 'projects')).toBeResolved();
    });

    it('omite el borrado si no puede deducir el public_id', async () => {
      await service.deleteImage('https://res.cloudinary.com/ingesocc/image/upload/ingesocc/content/x.jpg', 'content');
      expect(fetchCalls).toHaveSize(0);
    });
  });

  describe('deleteImages', () => {
    it('separa assets de Cloudinary y rutas legacy en una sola pasada', async () => {
      mockFetch(() => jsonResponse({ ok: true }));

      await service.deleteImages([CLOUD_URL, 'project-images/abc/x.jpg'], 'projects');

      expect(fetchCalls).toHaveSize(1);
      expect(legacy.remove).toHaveBeenCalledWith('project-images', ['project-images/abc/x.jpg']);
    });

    it('no hace nada con listas vacías', async () => {
      await service.deleteImages([], 'projects');
      expect(fetchCalls).toHaveSize(0);
      expect(legacy.remove).not.toHaveBeenCalled();
    });

    it('no se detiene si un asset falla', async () => {
      mockFetch(() => jsonResponse({ message: 'boom' }, 500));
      spyOn(console, 'warn');

      await expectAsync(service.deleteImages([CLOUD_URL], 'projects')).toBeResolved();
    });
  });

  describe('delivery', () => {
    it('optimiza las URLs de Cloudinary por contexto', () => {
      expect(service.optimizedUrl(CLOUD_URL, service.transforms.cover)).toContain('w_960,h_720');
    });

    it('deja intactas las imágenes legacy', () => {
      const legacyUrl = 'https://proyecto.supabase.co/storage/v1/object/public/content-images/a/b.jpg';
      expect(service.optimizedUrl(legacyUrl, service.transforms.hero)).toBe(legacyUrl);
    });

    it('expone el public_id de una secure_url', () => {
      expect(service.publicIdOf(CLOUD_URL)).toBe('ingesocc/projects/abc/9f1e-uuid');
      expect(service.publicIdOf('project-images/a/b.jpg')).toBeNull();
    });
  });
});
