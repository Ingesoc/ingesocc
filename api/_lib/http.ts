/**
 * Utilidades HTTP compartidas por las funciones de Vercel que viven en `api/`.
 *
 * Los tipos de request/response se declaran aquí (estructuralmente compatibles
 * con los de `@vercel/node`) para no añadir esa dependencia al proyecto: el
 * proyecto es Angular puro y estas funciones son el único código de servidor.
 */

/** Request de una función serverless (subconjunto de `VercelRequest`). */
export interface ApiRequest {
  method?: string | undefined;
  url?: string | undefined;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

/** Response de una función serverless (subconjunto de `VercelResponse`). */
export interface ApiResponse {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string): void;
  json(payload: unknown): void;
}

export type ApiHandler = (req: ApiRequest, res: ApiResponse) => Promise<void> | void;

/** Códigos de error estables para que el frontend pueda reaccionar sin parsear texto. */
export type ApiErrorCode =
  | 'method_not_allowed'
  | 'unauthorized'
  | 'forbidden'
  | 'invalid_request'
  | 'not_configured'
  | 'upstream_error';

export interface ApiErrorBody {
  error: ApiErrorCode;
  message: string;
}

/** Cabeceras que se envían en todas las respuestas de la API. */
const BASE_HEADERS: readonly (readonly [string, string])[] = [
  ['Content-Type', 'application/json; charset=utf-8'],
  // Las firmas caducan y el rol puede cambiar: nada de esto se cachea.
  ['Cache-Control', 'no-store, max-age=0'],
  // La API solo se consume desde el mismo origen (mismo dominio en Vercel).
  ['X-Content-Type-Options', 'nosniff'],
];

/** Envía una respuesta JSON con las cabeceras de seguridad base. */
export function sendJson(res: ApiResponse, status: number, payload: unknown): void {
  for (const [name, value] of BASE_HEADERS) {
    res.setHeader(name, value);
  }
  res.status(status).json(payload);
}

/**
 * Responde con un error. El mensaje es apto para mostrar al admin: nunca
 * incluye secretos, stack traces ni credenciales (el detalle real se registra
 * solo en el log del servidor).
 */
export function fail(res: ApiResponse, status: number, error: ApiErrorCode, message: string): void {
  sendJson(res, status, { error, message } satisfies ApiErrorBody);
}

/** Corta la ejecución si el método no es POST (los endpoints solo aceptan POST). */
export function requirePost(req: ApiRequest, res: ApiResponse): boolean {
  if ((req.method ?? '').toUpperCase() === 'POST') {
    return true;
  }
  res.setHeader('Allow', 'POST');
  fail(res, 405, 'method_not_allowed', 'Método no permitido.');
  return false;
}

/**
 * Lee el cuerpo de la petición como objeto. Vercel ya parsea `application/json`,
 * pero en pruebas o con otro cliente puede llegar como string o vacío.
 */
export function readJson(req: ApiRequest): Record<string, unknown> {
  const { body } = req;
  if (body == null || body === '') {
    return {};
  }
  if (typeof body === 'object' && !Array.isArray(body)) {
    return body as Record<string, unknown>;
  }
  if (typeof body === 'string') {
    try {
      const parsed: unknown = JSON.parse(body);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  return {};
}

/** Lee una cabecera de request de forma case-insensitive y sin adivinar el tipo. */
export function header(req: ApiRequest, name: string): string | null {
  const wanted = name.toLowerCase();
  for (const [key, value] of Object.entries(req.headers ?? {})) {
    if (key.toLowerCase() !== wanted) continue;
    const single = Array.isArray(value) ? value[0] : value;
    if (typeof single === 'string' && single.trim() !== '') {
      return single.trim();
    }
  }
  return null;
}

/** Traduce errores inesperados a un log de servidor + respuesta genérica. */
export function failUnexpected(
  res: ApiResponse,
  scope: string,
  error: unknown,
  status = 500,
): void {
  console.error(`[api/${scope}]`, error);
  fail(res, status, 'upstream_error', 'Ocurrió un error inesperado. Intenta de nuevo.');
}
