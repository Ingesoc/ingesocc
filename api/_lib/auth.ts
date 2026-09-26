import { fail, header, type ApiRequest, type ApiResponse } from './http';

/** Identidad del administrador que llama a la API. */
export interface AdminIdentity {
  id: string;
  email: string;
}

/** Rolstor: solo `admin` puede tocar los buckets/medios. */
const ADMIN_ROLE = 'admin';

/** Credenciales públicas de Supabase (la clave publishable/anon, nunca la service_role). */
export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
}

/**
 * Lee URL + clave anon de Supabase desde el entorno del servidor.
 *
 * Solo son credenciales publicables: la separación real de responsabilidades la
 * mantiene RLS y la validación de sesión contra el Auth server de Supabase.
 */
export function readSupabaseConfig(): SupabasePublicConfig | null {
  const url = process.env['SUPABASE_URL']?.trim();
  const anonKey = process.env['SUPABASE_ANON_KEY']?.trim();
  if (!url || !anonKey) {
    return null;
  }
  return { url: url.replace(/\/+$/, ''), anonKey };
}

/** Extrae el JWT de Supabase de `Authorization: Bearer <token>`. */
export function readBearerToken(req: ApiRequest): string | null {
  const raw = header(req, 'authorization');
  if (!raw) {
    return null;
  }
  const match = /^Bearer\s+(\S+)$/i.exec(raw);
  return match?.[1] ?? null;
}

interface SupabaseUserResponse {
  id?: unknown;
  email?: unknown;
}

/**
 * Valida el JWT contra el Auth server de Supabase.
 *
 * NO se valida la firma del JWT en local (haría falta el JWT secret del
 * proyecto, otra credencial que mantener): se delega en `GET /auth/v1/user`,
 * que es la fuente de verdad y además comprueba que el usuario exista y no esté
 * borrado. El `401` aquí significa "no hay sesión válida" en cualquier caso.
 */
async function fetchSupabaseUser(
  config: SupabasePublicConfig,
  token: string,
): Promise<{ id: string; email: string } | null> {
  const response = await fetch(`${config.url}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: config.anonKey,
      authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    return null;
  }
  const user = (await response.json().catch(() => null)) as SupabaseUserResponse | null;
  if (typeof user?.id !== 'string' || user.id === '') {
    return null;
  }
  return { id: user.id, email: typeof user.email === 'string' ? user.email : '' };
}

/**
 * Lee el rol del usuario usando SU PROPIO JWT.
 *
 * Se consulta `profiles` vía PostgREST con el token del llamador: la política
 * `profiles_select_own` (RLS) hace que solo pueda ver su propia fila, así que
 * este endpoint no necesita ningún secreto de servidor para decidir el rol.
 */
async function fetchRole(
  config: SupabasePublicConfig,
  token: string,
  userId: string,
): Promise<string | null> {
  const url =
    `${config.url}/rest/v1/profiles` +
    `?select=role&id=eq.${encodeURIComponent(userId)}&limit=1`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: config.anonKey,
      authorization: `Bearer ${token}`,
      accept: 'application/json',
    },
  });
  if (!response.ok) {
    return null;
  }
  const rows = (await response.json().catch(() => null)) as unknown;
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }
  const role = (rows[0] as { role?: unknown }).role;
  return typeof role === 'string' ? role : null;
}

/**
 * Puerta de entrada de los endpoints de administración: exige un JWT válido de
 * Supabase Y rol `admin` en `profiles`.
 *
 * Escribe la respuesta de error y devuelve `null` cuando no se puede continuar,
 * de modo que el handler pueda terminar con `return`.
 */
export async function requireAdmin(
  req: ApiRequest,
  res: ApiResponse,
): Promise<AdminIdentity | null> {
  const config = readSupabaseConfig();
  if (!config) {
    console.error('[api/auth] faltan SUPABASE_URL o SUPABASE_ANON_KEY en el entorno');
    fail(
      res,
      503,
      'not_configured',
      'El servicio no está disponible en este momento. Intenta más tarde.',
    );
    return null;
  }

  const token = readBearerToken(req);
  if (!token) {
    fail(res, 401, 'unauthorized', 'La sesión expiró. Inicia sesión nuevamente.');
    return null;
  }

  let user: { id: string; email: string } | null = null;
  try {
    user = await fetchSupabaseUser(config, token);
  } catch (error) {
    console.error('[api/auth] no se pudo validar la sesión con Supabase', error);
    fail(res, 502, 'upstream_error', 'No se pudo validar la sesión. Intenta nuevamente.');
    return null;
  }

  if (!user) {
    fail(res, 401, 'unauthorized', 'La sesión expiró. Inicia sesión nuevamente.');
    return null;
  }

  let role: string | null = null;
  try {
    role = await fetchRole(config, token, user.id);
  } catch (error) {
    console.error('[api/auth] no se pudo leer el rol del usuario', error);
    fail(res, 502, 'upstream_error', 'No se pudo verificar el permiso. Intenta nuevamente.');
    return null;
  }

  if (role !== ADMIN_ROLE) {
    fail(res, 403, 'forbidden', 'No tienes permisos para realizar esta acción.');
    return null;
  }

  return user;
}
