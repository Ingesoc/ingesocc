import { createHash, randomUUID } from 'node:crypto';

/**
 * Helpers de Cloudinary compartidos por las funciones de `api/cloudinary/`.
 *
 * Todo lo que decide qué se puede tocar (carpetas, public_id) se valida AQUÍ, en
 * el servidor. El frontend solo propone `folder` + `entityId`; nunca decide el
 * `public_id` ni ve el API secret.
 */

/** Carpeta raíz: todo asset vive bajo este prefijo en la cuenta de Cloudinary. */
export const CLOUDINARY_ROOT = 'ingesocc';

/**
 * Carpetas permitidas. El cliente envía la clave, nunca la ruta completa: así no
 * se pueden escribir assets fuera del árbol conocido.
 */
export const CLOUDINARY_FOLDERS = [
  'projects',
  'services',
  'content',
  'team',
  'general',
] as const;

export type CloudinaryFolder = (typeof CLOUDINARY_FOLDERS)[number];

/**
 * Segmento de carpeta/intermedio (id de proyecto, id de servicio, slug…):
 * sin espacios, sin separadores de ruta ni `..`.
 */
const SEGMENT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

/**
 * `public_id` aceptado para destroy: `ingesocc/<carpeta>/<asset>[/<asset>]`.
 * Exige al menos un segmento de asset (una carpeta sola no es un asset) y como
 * máximo dos (carpeta de entidad + id del asset). El patrón no admite `.`, así
 * que `..` y el traversal quedan fuera por construcción, igual que los espacios
 * o los caracteres especiales.
 */
const PUBLIC_ID_PATTERN = new RegExp(
  `^${CLOUDINARY_ROOT}/(?:${CLOUDINARY_FOLDERS.join('|')})` +
    `(?:/[A-Za-z0-9][A-Za-z0-9_-]{0,63}){1,2}$`,
);

/** Límite de longitud del `public_id` (lo que Cloudinary admite en la práctica). */
const PUBLIC_ID_MAX_LENGTH = 200;

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

/**
 * Lee las credenciales de Cloudinary del entorno del servidor.
 *
 * Lanza si falta alguna: es un fallo de despliegue, no de la petición, así que
 * el handler lo traduce a 503 sin filtrar el nombre de la variable que falta.
 */
export function readCloudinaryConfig(): CloudinaryConfig {
  const cloudName = process.env['CLOUDINARY_CLOUD_NAME']?.trim();
  const apiKey = process.env['CLOUDINARY_API_KEY']?.trim();
  const apiSecret = process.env['CLOUDINARY_API_SECRET']?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary no está configurado en el entorno del servidor');
  }
  return { cloudName, apiKey, apiSecret };
}

/** Valida la carpeta solicitada contra la lista blanca. */
export function normalizeFolder(value: unknown): CloudinaryFolder | null {
  return typeof value === 'string' && (CLOUDINARY_FOLDERS as readonly string[]).includes(value)
    ? (value as CloudinaryFolder)
    : null;
}

/** true si el valor sirve como segmento intermedio de ruta. */
export function isValidSegment(value: unknown): value is string {
  return typeof value === 'string' && SEGMENT_PATTERN.test(value);
}

/** Valida el `public_id` completo de un asset antes de destruirlo. */
export function isAllowedPublicId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= PUBLIC_ID_MAX_LENGTH &&
    PUBLIC_ID_PATTERN.test(value)
  );
}

/**
 * Carpeta de destino ya normalizada: `ingesocc/<folder>[/<entityId>]`.
 * Lanza si el `entityId` no es un segmento válido.
 */
export function buildFolder(folder: CloudinaryFolder, entityId?: unknown): string {
  if (entityId == null || entityId === '') {
    return `${CLOUDINARY_ROOT}/${folder}`;
  }
  if (!isValidSegment(entityId)) {
    throw new Error(`entityId inválido: ${String(entityId)}`);
  }
  return `${CLOUDINARY_ROOT}/${folder}/${entityId}`;
}

/** Nombre determinista del asset dentro de la carpeta: un UUID, sin el nombre del usuario. */
export function newAssetId(): string {
  return randomUUID();
}

/**
 * Firma de Cloudinary (SHA-1) tal y como la documenta su API: params firmados
 * ordenados alfabéticamente, unidos con `&`, y el API secret concatenado al
 * final. El orden importa: el cliente debe enviar exactamente estos params.
 */
export function cloudinarySignature(
  params: Readonly<Record<string, string | number>>,
  apiSecret: string,
): string {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${String(params[key])}`)
    .join('&');
  return createHash('sha1').update(payload + apiSecret, 'utf8').digest('hex');
}

/** Endpoint de la API de Cloudinary para un cloud y un tipo de recurso. */
export function cloudinaryEndpoint(cloudName: string, resource: 'image'): string {
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resource}`;
}
