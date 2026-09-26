/**
 * Validación de imágenes compartida por el admin y por `CloudinaryService`.
 *
 * La lista de formatos es la MISMA que la que aplica el backend de Supabase
 * Storage (`allowed_mime_types`) y la que aceptamos en Cloudinary. Mantener una
 * sola fuente evita el clásico "el navegador lo dejó pasar y el storage lo
 * rechazó con un error opaco".
 */

/** Formatos aceptados. `gif` queda fuera a propósito: ni los buckets ni Cloudinary lo admiten. */
export const ACCEPTED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export const ACCEPTED_IMAGE_TYPES_LABEL = 'JPG, PNG, WebP o AVIF';

/** Extensiones equivalentes a los MIME de arriba (segunda capa de validación). */
const ACCEPTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif'] as const;

/** Límite por defecto (proyectos y servicios): 2 MB, como los buckets legacy. */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/** Límite del CMS (hero, banners, equipo): 5 MB, como el bucket content-images. */
export const MAX_CMS_IMAGE_BYTES = 5 * 1024 * 1024;

/** Máximo de lado largo tras comprimir (evita subir originales gigantes). */
export const MAX_IMAGE_EDGE_PX = 2000;

/**
 * Valida que un archivo sea una imagen aceptable (MIME de la lista + extensión
 * conocida). La restricción de `accept` del input no es suficiente: un archivo
 * renombrado pasaría igual.
 */
export function isAcceptableImageFile(file: File): boolean {
  if (!ACCEPTED_IMAGE_MIME_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_MIME_TYPES)[number])) {
    return false;
  }
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return (ACCEPTED_IMAGE_EXTENSIONS as readonly string[]).includes(extension);
}

/** true si el archivo supera el límite de tamaño indicado. */
export function exceedsMaxBytes(file: File, maxBytes: number = MAX_IMAGE_BYTES): boolean {
  return file.size > maxBytes;
}

/** Mensajes de error de validación, listos para pintar en el admin. */
export const IMAGE_VALIDATION_MESSAGES = {
  format: `Formato de imagen no soportado. Solo se aceptan ${ACCEPTED_IMAGE_TYPES_LABEL}.`,
  size: (maxMb: number) => `La imagen supera el tamaño permitido (máximo ${maxMb} MB).`,
} as const;

/**
 * Valida un archivo y devuelve el mensaje de error, o `null` si es válido.
 * La usan tanto el componente (feedback inmediato) como el servicio (guarda).
 */
export function validateImageFile(file: File, maxBytes: number = MAX_IMAGE_BYTES): string | null {
  if (!isAcceptableImageFile(file)) {
    return IMAGE_VALIDATION_MESSAGES.format;
  }
  if (exceedsMaxBytes(file, maxBytes)) {
    return IMAGE_VALIDATION_MESSAGES.size(Math.round(maxBytes / (1024 * 1024)));
  }
  return null;
}
