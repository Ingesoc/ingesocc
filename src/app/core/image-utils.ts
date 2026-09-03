/** Extensiones aceptadas para las subidas de imagen (validación previa al storage). */
const ACCEPTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];

export const ACCEPTED_IMAGE_TYPES_LABEL = 'JPG, PNG, WebP, GIF o AVIF';

/**
 * Valida que un archivo sea una imagen aceptable (tipo MIME image/* y
 * extensión conocida). La restricción de `accept` del input no es suficiente:
 * un archivo renombrado pasaría igual (plan, auditoría 4.5).
 */
export function isAcceptableImageFile(file: File): boolean {
  if (!file.type.startsWith('image/')) {
    return false;
  }
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ACCEPTED_IMAGE_EXTENSIONS.includes(extension);
}
