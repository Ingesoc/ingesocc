import type { ApiRequest, ApiResponse } from './http';

/**
 * Utilidades para probar las funciones de `api/` con el runner de Node
 * (`node --test`). No las usa ningún handler: Vercel ignora como rutas los
 * archivos con prefijo `_`, y el bundler solo incluye lo que se importa.
 */

/** Env de Cloudinary de mentira (valores que NUNCA sirven para nada real). */
export const FAKE_CLOUDINARY = {
  CLOUDINARY_CLOUD_NAME: 'ingesocc-test',
  CLOUDINARY_API_KEY: '123456789012345',
  CLOUDINARY_API_SECRET: 'test-api-secret-no-usar',
} as const;

/** Env de Supabase de mentira. */
export const FAKE_SUPABASE = {
  SUPABASE_URL: 'https://project-test.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_test',
} as const;

export interface CapturedResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
}

export interface TestResponse extends ApiResponse {
  readonly captured: CapturedResponse;
}

export interface TestRequest extends ApiRequest {
  headers: Record<string, string>;
}

/** Request de prueba con token de Supabase. */
export function makeRequest(options: {
  token?: string | null;
  body?: unknown;
  method?: string;
}): TestRequest {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (options.token) {
    headers['authorization'] = `Bearer ${options.token}`;
  }
  return {
    method: options.method ?? 'POST',
    url: '/api/cloudinary/test',
    headers,
    body: options.body ?? {},
  };
}

/** Response de prueba que captura lo que el handler escribe. */
export function makeResponse(): TestResponse {
  const captured: CapturedResponse = { statusCode: 0, headers: {}, body: undefined };
  const api: TestResponse = {
    captured,
    status(code: number) {
      captured.statusCode = code;
      return api;
    },
    setHeader(name: string, value: string) {
      captured.headers[name] = value;
      return api;
    },
    json(payload: unknown) {
      captured.body = payload;
      return api;
    },
  };
  return api;
}

export interface FetchCall {
  url: string;
  method: string;
  body: unknown;
}

export interface FetchStub {
  calls: FetchCall[];
  restore(): void;
}

/**
 * Sustituye `globalThis.fetch` por un stub enrutado por URL. Las URLs sin
 * coincidencia fallan, de modo que un handler que hable con un host
 * inesperado se rompe en el test en lugar de salir a internet.
 */
export function stubFetch(
  routes: readonly {
    match: (url: string) => boolean;
    status?: number;
    json?: unknown;
    text?: string;
  }[],
): FetchStub {
  const calls: FetchCall[] = [];
  const original = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = (init?.method ?? 'GET').toUpperCase();
    let parsedBody: unknown = init?.body;
    if (typeof parsedBody === 'string') {
      try {
        parsedBody = JSON.parse(parsedBody);
      } catch {
        parsedBody = init?.body;
      }
    }
    calls.push({ url, method, body: parsedBody });

    const route = routes.find((candidate) => candidate.match(url));
    if (!route) {
      throw new Error(`fetch sin stub: ${method} ${url}`);
    }
    const status = route.status ?? 200;
    return new Response(status === 204 || route.json === undefined ? null : JSON.stringify(route.json), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof globalThis.fetch;

  return {
    calls,
    restore() {
      globalThis.fetch = original;
    },
  };
}

/** Rutas de Supabase que usa `requireAdmin` (auth/v1/user + rest/v1/profiles). */
export function supabaseRoutes(role: string | null, userId = 'user-uuid-0001'): readonly {
  match: (url: string) => boolean;
  status: number;
  json: unknown;
}[] {
  return [
    {
      match: (url) => url.includes('/auth/v1/user'),
      status: 200,
      json: { id: userId, email: 'admin@ingesocc.com' },
    },
    {
      match: (url) => url.includes('/rest/v1/profiles'),
      status: 200,
      json: role === null ? [] : [{ role }],
    },
  ];
}

/** Snapshot del env relevante para restaurarlo al terminar cada test. */
export function useEnv(overrides: Record<string, string | undefined>): () => void {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(overrides)) {
    previous.set(key, process.env[key]);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  return () => {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
}
