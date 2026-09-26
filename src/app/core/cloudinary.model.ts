/**
 * Tipos del proveedor de imágenes (Cloudinary como principal, Supabase Storage
 * como respaldo para lo ya existente).
 *
 * Se mantiene separado del servicio para que los tests y los componentes no
 * dependan de la implementación.
 */

/**
 * Carpeta lógica de destino. El valor es una clave, no una ruta: el servidor
 * (`api/cloudinary/signature.ts`) la valida contra lista blanca y decide la
 * ruta real bajo `ingesocc/`.
 */
export type MediaFolder = 'projects' | 'services' | 'content' | 'team' | 'general';

/** Proveedor donde quedó almacenado el asset. */
export type MediaProvider = 'cloudinary' | 'supabase';

/** Respuesta de `POST /api/cloudinary/signature`. Nunca incluye el API secret. */
export interface CloudinarySignature {
  /** Segundos epoch de la firma (Cloudinary rechaza firmas muy viejas). */
  timestamp: number;
  signature: string;
  cloudName: string;
  apiKey: string;
  /** Carpeta ya normalizada, p. ej. `ingesocc/projects/<projectId>`. */
  folder: string;
  /** Nombre del asset dentro de la carpeta (UUID). */
  publicId: string;
}

/** Respuesta de la API de imágenes de Cloudinary tras el upload firmado. */
export interface CloudinaryUploadResponse {
  secure_url?: string;
  public_id?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

/**
 * Resultado de una subida de imagen, sea cual sea el proveedor.
 *
 * `reference` es lo que se persiste en la columna de la base de datos: para
 * Cloudinary, la `secure_url`; para Supabase Storage, la ruta relativa al
 * bucket (que `SupabaseService.resolvePublicUrl` convierte en URL al leer).
 */
export interface MediaUploadResult {
  provider: MediaProvider;
  reference: string;
  /** `public_id` completo en Cloudinary; `null` si el asset vive en Supabase. */
  publicId: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
}

/** Error de la API propia con un mensaje ya apto para mostrar al admin. */
export class MediaApiError extends Error {
  constructor(
    message: string,
    /** true si el servicio está caído/no configurado: la app puede degradar a Storage. */
    readonly unavailable: boolean,
  ) {
    super(message);
    this.name = 'MediaApiError';
  }
}
