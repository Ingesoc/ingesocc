import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { cloudinarySignature } from '../_lib/cloudinary';
import {
  FAKE_CLOUDINARY,
  FAKE_SUPABASE,
  makeRequest,
  makeResponse,
  stubFetch,
  supabaseRoutes,
  useEnv,
  type FetchStub,
} from '../_lib/test-support';
import handler from './signature';

const ADMIN_TOKEN = 'jwt-de-admin';
const PROJECT_ID = '2f1a9b0c-1111-4222-8333-444444444444';

describe('POST /api/cloudinary/signature', () => {
  let fetchStub: FetchStub | null = null;
  let restoreEnv: () => void = () => undefined;

  beforeEach(() => {
    restoreEnv = useEnv({ ...FAKE_CLOUDINARY, ...FAKE_SUPABASE });
  });

  afterEach(() => {
    fetchStub?.restore();
    fetchStub = null;
    restoreEnv();
  });

  it('rechaza peticiones que no son POST', async () => {
    const res = makeResponse();
    await handler(makeRequest({ method: 'GET', token: ADMIN_TOKEN }), res);
    assert.equal(res.captured.statusCode, 405);
    assert.equal(res.captured.headers['Allow'], 'POST');
  });

  it('rechaza al usuario no autenticado (401) sin tocar Supabase', async () => {
    fetchStub = stubFetch(supabaseRoutes('admin'));
    const res = makeResponse();
    await handler(makeRequest({ token: null, body: { folder: 'projects' } }), res);

    assert.equal(res.captured.statusCode, 401);
    assert.deepEqual(res.captured.body, {
      error: 'unauthorized',
      message: 'La sesión expiró. Inicia sesión nuevamente.',
    });
    assert.equal(fetchStub.calls.length, 0);
  });

  it('rechaza un JWT inválido o expirado (401)', async () => {
    fetchStub = stubFetch([
      { match: (url) => url.includes('/auth/v1/user'), status: 401, json: { message: 'bad jwt' } },
    ]);
    const res = makeResponse();
    await handler(makeRequest({ token: 'jwt-caducado', body: { folder: 'projects' } }), res);

    assert.equal(res.captured.statusCode, 401);
    assert.equal((res.captured.body as { error: string }).error, 'unauthorized');
  });

  it('rechaza al usuario autenticado que NO es admin (403)', async () => {
    fetchStub = stubFetch(supabaseRoutes('user'));
    const res = makeResponse();
    await handler(makeRequest({ token: 'jwt-de-user', body: { folder: 'projects' } }), res);

    assert.equal(res.captured.statusCode, 403);
    assert.equal((res.captured.body as { error: string }).error, 'forbidden');
    assert.equal(
      fetchStub.calls.some((call) => call.url.includes('cloudinary.com')),
      false,
      'no debe contactar Cloudinary sin rol admin',
    );
  });

  it('rechaza cuando no hay fila en profiles (403)', async () => {
    fetchStub = stubFetch(supabaseRoutes(null));
    const res = makeResponse();
    await handler(makeRequest({ token: 'jwt-sin-perfil', body: { folder: 'projects' } }), res);
    assert.equal(res.captured.statusCode, 403);
  });

  it('rechaza una carpeta fuera de la lista blanca (400)', async () => {
    fetchStub = stubFetch(supabaseRoutes('admin'));
    const res = makeResponse();
    await handler(makeRequest({ token: ADMIN_TOKEN, body: { folder: '../../etc' } }), res);

    assert.equal(res.captured.statusCode, 400);
    assert.equal((res.captured.body as { error: string }).error, 'invalid_request');
  });

  it('rechaza un entityId con traversal (400)', async () => {
    fetchStub = stubFetch(supabaseRoutes('admin'));
    const res = makeResponse();
    await handler(
      makeRequest({ token: ADMIN_TOKEN, body: { folder: 'projects', entityId: '../admin' } }),
      res,
    );

    assert.equal(res.captured.statusCode, 400);
  });

  it('devuelve la firma, cloudName, apiKey y folder al admin válido', async () => {
    fetchStub = stubFetch(supabaseRoutes('admin'));
    const res = makeResponse();
    await handler(
      makeRequest({ token: ADMIN_TOKEN, body: { folder: 'projects', entityId: PROJECT_ID } }),
      res,
    );

    assert.equal(res.captured.statusCode, 200);
    const body = res.captured.body as Record<string, unknown>;
    assert.equal(body['cloudName'], FAKE_CLOUDINARY.CLOUDINARY_CLOUD_NAME);
    assert.equal(body['apiKey'], FAKE_CLOUDINARY.CLOUDINARY_API_KEY);
    assert.equal(body['folder'], `ingesocc/projects/${PROJECT_ID}`);
    assert.match(String(body['publicId']), /^[0-9a-f-]{36}$/);
    assert.ok(
      Math.abs(Number(body['timestamp']) - Math.floor(Date.now() / 1000)) < 60,
      'el timestamp debe ser el actual, en segundos',
    );

    // La firma debe ser exactamente la que Cloudinary recalculará con el secret.
    assert.equal(
      body['signature'],
      cloudinarySignature(
        {
          folder: `ingesocc/projects/${PROJECT_ID}`,
          public_id: String(body['publicId']),
          timestamp: Number(body['timestamp']),
        },
        FAKE_CLOUDINARY.CLOUDINARY_API_SECRET,
      ),
    );
  });

  it('NUNCA devuelve el API secret ni lo incluye en la respuesta', async () => {
    fetchStub = stubFetch(supabaseRoutes('admin'));
    const res = makeResponse();
    await handler(makeRequest({ token: ADMIN_TOKEN, body: { folder: 'general' } }), res);

    const serialized = JSON.stringify(res.captured.body);
    assert.ok(!serialized.includes(FAKE_CLOUDINARY.CLOUDINARY_API_SECRET));
    assert.ok(!('apiSecret' in (res.captured.body as object)));
    assert.ok(!('api_secret' in (res.captured.body as object)));
  });

  it('valida el rol usando el JWT del propio usuario (RLS, sin secretos de servidor)', async () => {
    fetchStub = stubFetch(supabaseRoutes('admin'));
    const res = makeResponse();
    await handler(makeRequest({ token: ADMIN_TOKEN, body: { folder: 'content' } }), res);

    const roleCall = fetchStub.calls.find((call) => call.url.includes('/rest/v1/profiles'));
    assert.ok(roleCall, 'debe leer el rol desde profiles');
    assert.equal(roleCall.method, 'GET');
    assert.ok(roleCall.url.includes(`id=eq.${encodeURIComponent('user-uuid-0001')}`));
    // La petición usa el token del admin, no una service_role del servidor.
    assert.equal(fetchStub.calls.every((call) => call.method === 'GET'), true);
  });

  it('devuelve 503 si Cloudinary no está configurado en el servidor', async () => {
    restoreEnv();
    restoreEnv = useEnv({ ...FAKE_CLOUDINARY, ...FAKE_SUPABASE, CLOUDINARY_API_SECRET: undefined });
    fetchStub = stubFetch(supabaseRoutes('admin'));
    const res = makeResponse();
    await handler(makeRequest({ token: ADMIN_TOKEN, body: { folder: 'projects' } }), res);

    assert.equal(res.captured.statusCode, 503);
    assert.equal((res.captured.body as { error: string }).error, 'not_configured');
    const serialized = JSON.stringify(res.captured.body);
    assert.ok(!serialized.includes('CLOUDINARY_API_SECRET'), 'no revela qué variable falta');
  });

  it('devuelve 503 si Supabase no está configurado en el servidor', async () => {
    restoreEnv();
    restoreEnv = useEnv({
      ...FAKE_CLOUDINARY,
      SUPABASE_URL: undefined,
      SUPABASE_ANON_KEY: undefined,
    });
    const res = makeResponse();
    await handler(makeRequest({ token: ADMIN_TOKEN, body: { folder: 'projects' } }), res);

    assert.equal(res.captured.statusCode, 503);
    assert.equal((res.captured.body as { error: string }).error, 'not_configured');
  });

  it('nunca deja la respuesta cacheable', async () => {
    fetchStub = stubFetch(supabaseRoutes('admin'));
    const res = makeResponse();
    await handler(makeRequest({ token: ADMIN_TOKEN, body: { folder: 'team' } }), res);
    assert.match(String(res.captured.headers['Cache-Control']), /no-store/);
  });
});
