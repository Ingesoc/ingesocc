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
import handler from './destroy';

const ADMIN_TOKEN = 'jwt-de-admin';
const PUBLIC_ID = 'ingesocc/projects/2f1a9b0c-1111-4222-8333-444444444444/9a8b7c6d-2222-4333-8444-555555555555';

describe('POST /api/cloudinary/destroy', () => {
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

  it('rechaza al usuario no autenticado (401) sin llamar a Cloudinary', async () => {
    fetchStub = stubFetch(supabaseRoutes('admin'));
    const res = makeResponse();
    await handler(makeRequest({ token: null, body: { publicId: PUBLIC_ID } }), res);

    assert.equal(res.captured.statusCode, 401);
    assert.equal(fetchStub.calls.length, 0);
  });

  it('rechaza al usuario autenticado que NO es admin (403)', async () => {
    fetchStub = stubFetch(supabaseRoutes('user'));
    const res = makeResponse();
    await handler(makeRequest({ token: 'jwt-de-user', body: { publicId: PUBLIC_ID } }), res);

    assert.equal(res.captured.statusCode, 403);
    assert.equal(
      fetchStub.calls.some((call) => call.url.includes('api.cloudinary.com')),
      false,
    );
  });

  it('rechaza un publicId fuera del árbol permitido (400)', async () => {
    fetchStub = stubFetch(supabaseRoutes('admin'));
    for (const publicId of [
      'ingesocc/../admin/secret',
      'otra-cuenta/projects/abc',
      'ingesocc/projects',
      'ingesocc/projects/abc def',
      '',
    ]) {
      const res = makeResponse();
      await handler(makeRequest({ token: ADMIN_TOKEN, body: { publicId } }), res);
      assert.equal(res.captured.statusCode, 400, `debía rechazar: ${publicId}`);
    }
    assert.equal(
      fetchStub.calls.some((call) => call.url.includes('api.cloudinary.com')),
      false,
    );
  });

  it('rechaza un body sin publicId (400)', async () => {
    fetchStub = stubFetch(supabaseRoutes('admin'));
    const res = makeResponse();
    await handler(makeRequest({ token: ADMIN_TOKEN, body: {} }), res);
    assert.equal(res.captured.statusCode, 400);
  });

  it('destruye el asset con la firma correcta contra la API de Cloudinary', async () => {
    fetchStub = stubFetch([
      ...supabaseRoutes('admin'),
      {
        match: (url) => url.includes('api.cloudinary.com'),
        status: 200,
        json: { result: 'ok' },
      },
    ]);

    const res = makeResponse();
    await handler(makeRequest({ token: ADMIN_TOKEN, body: { publicId: PUBLIC_ID } }), res);

    assert.equal(res.captured.statusCode, 200);
    assert.deepEqual(res.captured.body, { publicId: PUBLIC_ID, result: 'ok' });

    const call = fetchStub.calls.find((c) => c.url.includes('api.cloudinary.com'));
    assert.ok(call, 'debe llamar a Cloudinary');
    assert.equal(call.method, 'POST');
    assert.equal(
      call.url,
      `https://api.cloudinary.com/v1_1/${FAKE_CLOUDINARY.CLOUDINARY_CLOUD_NAME}/image/destroy`,
    );

    const sent = call.body as { public_id: string; timestamp: number; signature: string };
    assert.equal(sent.public_id, PUBLIC_ID);
    assert.equal(
      sent.signature,
      cloudinarySignature(
        { public_id: PUBLIC_ID, timestamp: sent.timestamp },
        FAKE_CLOUDINARY.CLOUDINARY_API_SECRET,
      ),
    );
    // El secret viaja solo en la firma: nunca en el cuerpo ni en la URL.
    assert.ok(!JSON.stringify(call.body).includes(FAKE_CLOUDINARY.CLOUDINARY_API_SECRET));
  });

  it('traduce un error de Cloudinary a un 502 sin filtrar detalle interno', async () => {
    fetchStub = stubFetch([
      ...supabaseRoutes('admin'),
      {
        match: (url) => url.includes('api.cloudinary.com'),
        status: 401,
        json: { error: { message: 'Invalid Signature, secret nope' } },
      },
    ]);

    const res = makeResponse();
    await handler(makeRequest({ token: ADMIN_TOKEN, body: { publicId: PUBLIC_ID } }), res);

    assert.equal(res.captured.statusCode, 502);
    const body = res.captured.body as { error: string; message: string };
    assert.equal(body.error, 'upstream_error');
    assert.ok(!JSON.stringify(body).toLowerCase().includes('signature'));
  });

  it('devuelve 503 si Cloudinary no está configurado', async () => {
    restoreEnv();
    restoreEnv = useEnv({ ...FAKE_CLOUDINARY, ...FAKE_SUPABASE, CLOUDINARY_API_KEY: undefined });
    fetchStub = stubFetch(supabaseRoutes('admin'));

    const res = makeResponse();
    await handler(makeRequest({ token: ADMIN_TOKEN, body: { publicId: PUBLIC_ID } }), res);

    assert.equal(res.captured.statusCode, 503);
    assert.equal((res.captured.body as { error: string }).error, 'not_configured');
  });

  it('traduce un fallo de red a un 502 en vez de filtrar el stack', async () => {
    fetchStub = stubFetch([
      ...supabaseRoutes('admin'),
      { match: (url) => url.includes('api.cloudinary.com'), status: 500, json: { error: {} } },
    ]);

    const res = makeResponse();
    await handler(makeRequest({ token: ADMIN_TOKEN, body: { publicId: PUBLIC_ID } }), res);

    assert.equal(res.captured.statusCode, 502);
    assert.ok(!JSON.stringify(res.captured.body).includes('at '), 'no debe filtrar stack traces');
  });
});
