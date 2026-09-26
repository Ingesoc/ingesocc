/**
 * Utilidades puras (sin DI, sin red) para trabajar con URLs de Cloudinary.
 *
 * Viven aparte de `CloudinaryService` porque son deterministas y fáciles de
 * probar: `CloudinaryService` las usa y las reexpone, pero cualquier
 * componente que solo necesite "optimizar esta URL" puede usar el helper.
 *
 * Compatibilidad: estas funciones distinguen una URL de Cloudinary de una
 * legacy de Supabase Storage o de un CDN externo (Unsplash en los seeds) y
 * NUNCA rompen las que no son de Cloudinary.
 */

/** Marcador de la ruta de upload de Cloudinary dentro de una `secure_url`. */
const UPLOAD_MARKER = '/image/upload/';

/** Versión que Cloudinary añade al asset: `.../upload/<transforms>/v12345/<public_id>.<ext>`. */
const VERSION_SEGMENT = /^v\d+$/;

/** Transformaciones por contexto de uso. */
export const CLOUDINARY_TRANSFORMS = {
  /** Portada de proyecto en la card/mosaico. */
  cover: 'c_fill,g_auto,w_960,h_720,q_auto,f_auto',
  /** Galería del detalle de proyecto. */
  gallery: 'c_fill,g_auto,w_1200,h_900,q_auto,f_auto',
  /** Hero de página (CMS). */
  hero: 'c_fill,g_auto,w_1600,h_1000,q_auto,f_auto',
  /** Foto de servicio. */
  service: 'c_fill,g_auto,w_800,h_600,q_auto,f_auto',
  /** Fotografía de equipo / thumbnail de admin. */
  thumbnail: 'c_fill,g_auto,w_400,h_400,q_auto,f_auto',
} as const;

export type CloudinaryTransform = (typeof CLOUDINARY_TRANSFORMS)[keyof typeof CLOUDINARY_TRANSFORMS];

/** true si la URL es una `secure_url` de la API de imágenes de Cloudinary. */
export function isCloudinaryUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.endsWith('cloudinary.com');
  } catch {
    return false;
  }
}

/** true si el valor es una URL absoluta (legacy de Supabase o CDN externo). */
export function isAbsoluteUrl(value: string | null | undefined): boolean {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

/**
 * Extrae el `public_id` de una `secure_url` de Cloudinary.
 *
 * `https://res.cloudinary.com/<cloud>/image/upload/<transforms>/v1699/<public_id>.jpg`
 *   → `<public_id>`
 *
 * Devuelve `null` cuando no se puede saber con certeza (URL externa, sin
 * versión, vacía). Es deliberado: ante la duda, `null` (no se intenta borrar
 * un asset que podría ser otro) en vez de un `public_id` adivinado.
 */
export function cloudinaryPublicIdFromUrl(value: string | null | undefined): string | null {
  if (!isCloudinaryUrl(value)) return null;

  const markerIndex = value!.indexOf(UPLOAD_MARKER);
  if (markerIndex < 0) return null;

  const segments = value!.slice(markerIndex + UPLOAD_MARKER.length).split('/');
  const versionIndex = segments.findIndex((segment) => VERSION_SEGMENT.test(segment));
  if (versionIndex < 0) return null;

  // Sin la versión no se puede distinguir la transformación del public_id.
  const publicId = segments.slice(versionIndex + 1).join('/');
  if (!publicId) return null;

  // La extensión (`public_id.foo.jpg`) no forma parte del public_id.
  return publicId.replace(/\.[A-Za-z0-9]+$/, '');
}

/**
 * Inserta (o reemplaza) una transformación en una URL de Cloudinary.
 *
 * Las URLs que no son de Cloudinary se devuelven tal cual: es lo que permite
 * que el sitio sirva imágenes viejas de Supabase Storage sin transformaciones
 * y las nuevas optimizadas por el CDN, en el mismo `<img>`.
 */
export function withCloudinaryTransform(
  value: string | null | undefined,
  transform: string,
): string {
  if (!isCloudinaryUrl(value)) return value ?? '';

  const markerIndex = value!.indexOf(UPLOAD_MARKER);
  const base = value!.slice(0, markerIndex + UPLOAD_MARKER.length);
  const segments = value!.slice(markerIndex + UPLOAD_MARKER.length).split('/');
  const versionIndex = segments.findIndex((segment) => VERSION_SEGMENT.test(segment));
  // A partir de la versión no hay nada que conservar: la transformación se
  // define aquí y sustituye a la que tuviera la URL.
  const tail = versionIndex >= 0 ? segments.slice(versionIndex).join('/') : segments.join('/');

  return `${base}${transform}/${tail}`;
}
