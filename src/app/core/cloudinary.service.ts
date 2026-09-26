import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SupabaseStorageService } from './supabase-storage.service';
import {
  CLOUDINARY_TRANSFORMS,
  cloudinaryPublicIdFromUrl,
  isCloudinaryUrl,
  withCloudinaryTransform,
  type CloudinaryTransform,
} from './cloudinary-urls';
import {
  MediaApiError,
  type CloudinarySignature,
  type CloudinaryUploadResponse,
  type MediaFolder,
  type MediaUploadResult,
} from './cloudinary.model';
import { MAX_IMAGE_BYTES, validateImageFile } from './image-utils';

/** Endpoints de Vercel (mismo origen; en local los sirve `vercel dev`). */
const SIGNATURE_ENDPOINT = '/api/cloudinary/signature';
const DESTROY_ENDPOINT = '/api/cloudinary/destroy';

/**
 * Códigos de error de la API propia que representan "el servicio no está" y no
 * "la petición fue mala". Solo estos degradan a Supabase Storage: un 401 o un
 * 403 son errores reales de sesión/permiso y deben llegar al admin.
 */
const UNAVAILABLE_STATUSES = new Set([404, 405, 500, 502, 503, 504]);

/**
 * Proveedor principal de imágenes: Cloudinary.
 *
 * Flujo de subida (upload firmado):
 *
 *   Angular → POST /api/cloudinary/signature (Bearer + JWT de Supabase)
 *           → la función valida sesión y rol admin, valida la carpeta y
 *             devuelve timestamp/signature/cloudName/apiKey/folder/publicId
 *   Angular → POST directo a api.cloudinary.com con esa firma
 *           → secure_url
 *   Angular → guarda la secure_url en Supabase
 *
 * El `CLOUDINARY_API_SECRET` solo existe en el entorno de las funciones: el
 * frontend nunca lo ve, ni siquiera en el bundle. `cloudName` y `apiKey` (que
 * no son secretos) llegan en la respuesta de la firma, por eso el código
 * Angular no tiene ninguna variable de Cloudinary.
 *
 * Este servicio es el ÚNICO punto de entrada a la media: proyectos, servicios
 * y CMS llaman aquí con (archivo, carpeta) y nunca hablan con fetch ni con
 * Cloudinary por su cuenta.
 */
@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  private readonly supabase = inject(SupabaseService);
  private readonly legacy = inject(SupabaseStorageService);

  /**
   * Caché de sesión: si el servicio se detecta caído, las siguientes subidas
   * van directo a Storage sin esperar un timeout. Vuelve a intentarse tras
   * `resetAvailability()`.
   */
  private cloudinaryUnavailable = false;

  /** true cuando Cloudinary está operativo (o aún no se ha comprobado). */
  get available(): boolean {
    return !this.cloudinaryUnavailable;
  }

  /** Permite reintentar Cloudinary tras un despliegue que lo habilite. */
  resetAvailability(): void {
    this.cloudinaryUnavailable = false;
  }

  // ---------------------------------------------------------------- uploads

  /**
   * Sube una imagen y devuelve lo que hay que persistir.
   *
   * @param file     archivo ya comprimido por el admin
   * @param folder   carpeta lógica (`projects`, `services`, `content`, …)
   * @param entityId id de la entidad dueña; crea el subárbol `folder/entityId/`
   * @param maxBytes límite de tamaño; por defecto 2 MB
   */
  async uploadImage(
    file: File,
    folder: MediaFolder,
    entityId?: string,
    maxBytes: number = MAX_IMAGE_BYTES,
  ): Promise<MediaUploadResult> {
    const invalid = validateImageFile(file, maxBytes);
    if (invalid) {
      throw new MediaApiError(invalid, false);
    }

    if (this.cloudinaryUnavailable) {
      return this.uploadToLegacyStorage(file, folder, entityId);
    }

    let signature: CloudinarySignature;
    try {
      signature = await this.requestSignature(folder, entityId);
    } catch (error) {
      if (error instanceof MediaApiError && error.unavailable) {
        return this.degradeToLegacyStorage(error, file, folder, entityId);
      }
      throw error;
    }

    try {
      return await this.postSignedUpload(file, signature);
    } catch (error) {
      if (error instanceof MediaApiError && error.unavailable) {
        return this.degradeToLegacyStorage(error, file, folder, entityId);
      }
      throw error;
    }
  }

  // ----------------------------------------------------------------- delete

  /**
   * Borra el asset referenciado, sea de Cloudinary o legacy de Supabase.
   *
   * NUNCA propaga el fallo: un error al limpiar el asset anterior no debe
   * tumbar la operación principal (el admin ya guardó el cambio). Se registra
   * en consola para una limpieza posterior.
   */
  async deleteImage(reference: string | null | undefined, folder: MediaFolder): Promise<void> {
    if (!reference) return;
    try {
      if (isCloudinaryUrl(reference)) {
        await this.destroyCloudinaryAsset(reference);
        return;
      }
      const bucket = this.legacy.bucketFor(folder);
      if (bucket) {
        await this.legacy.remove(bucket, [reference]);
      }
    } catch (error) {
      console.warn(
        `[cloudinary] no se pudo eliminar "${reference}" (${folder}); queda pendiente de limpieza:`,
        error,
      );
    }
  }

  /** Borra varios assets de una vez (huérfanos que devuelve el RPC de proyectos). */
  async deleteImages(references: readonly string[], folder: MediaFolder): Promise<void> {
    if (references.length === 0) return;

    const cloudinaryUrls = references.filter((ref) => isCloudinaryUrl(ref));
    const legacyPaths = references.filter((ref) => !isCloudinaryUrl(ref));
    const bucket = this.legacy.bucketFor(folder);

    const cleanups: Promise<void>[] = cloudinaryUrls.map((url) => this.safeDestroy(url));
    if (bucket && legacyPaths.length > 0) {
      cleanups.push(this.safeLegacyRemove(bucket, legacyPaths));
    }
    await Promise.all(cleanups);
  }

  // --------------------------------------------------------------- delivery

  /**
   * URL optimizada para delivering. Las imágenes de Cloudinary se sirven por su
   * CDN con `q_auto,f_auto` y el ancho del contexto; las legacy o externas se
   * devuelven intactas (compatibilidad con lo ya guardado).
   */
  optimizedUrl(url: string | null | undefined, transform: CloudinaryTransform): string {
    return withCloudinaryTransform(url, transform);
  }

  /** Transformaciones por contexto, para no repetirlas en los componentes. */
  readonly transforms = CLOUDINARY_TRANSFORMS;

  /** `public_id` de una secure_url de Cloudinary, o `null` si no se puede saber. */
  publicIdOf(url: string | null | undefined): string | null {
    return cloudinaryPublicIdFromUrl(url);
  }

  // ------------------------------------------------------------- internals

  /** JWT de la sesión actual de Supabase (lo que prueba quién es el admin). */
  private async accessToken(): Promise<string> {
    await this.supabase.clientPromise;
    const { data, error } = await this.supabase.client.auth.getSession();
    const token = data.session?.access_token;
    if (error || !token) {
      throw new MediaApiError('La sesión expiró. Inicia sesión nuevamente.', false);
    }
    return token;
  }

  private async requestSignature(folder: MediaFolder, entityId?: string): Promise<CloudinarySignature> {
    const response = await this.callApi(SIGNATURE_ENDPOINT, { folder, entityId });
    return response as CloudinarySignature;
  }

  /**
   * Upload firmado contra la API de Cloudinary. `FormData` porque Cloudinary
   * acepta multipart y no necesita CORS con credenciales.
   */
  private async postSignedUpload(
    file: File,
    signature: CloudinarySignature,
  ): Promise<MediaUploadResult> {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('api_key', signature.apiKey);
    form.append('timestamp', String(signature.timestamp));
    form.append('signature', signature.signature);
    form.append('folder', signature.folder);
    form.append('public_id', signature.publicId);

    let response: Response;
    try {
      response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`,
        { method: 'POST', body: form },
      );
    } catch {
      throw new MediaApiError('No se pudo conectar con Cloudinary.', true);
    }

    const payload = (await response.json().catch(() => null)) as
      | (CloudinaryUploadResponse & { error?: { message?: string } })
      | null;

    if (!response.ok || !payload?.secure_url) {
      throw this.mapCloudinaryUploadError(response.status, payload?.error?.message);
    }

    return {
      provider: 'cloudinary',
      reference: payload.secure_url,
      publicId: payload.public_id ?? `${signature.folder}/${signature.publicId}`,
      width: payload.width ?? null,
      height: payload.height ?? null,
      bytes: payload.bytes ?? file.size,
    };
  }

  /** Traduce los errores de Cloudinary a mensajes accionables, sin filtrar detalle. */
  private mapCloudinaryUploadError(status: number, detail?: string): MediaApiError {
    if (UNAVAILABLE_STATUSES.has(status)) {
      return new MediaApiError('No se pudo conectar con Cloudinary.', true);
    }
    if (/signature|timestamp|expired/i.test(detail ?? '')) {
      return new MediaApiError('La firma de subida expiró. Intenta de nuevo.', false);
    }
    if (/limit|too large|size/i.test(detail ?? '')) {
      return new MediaApiError('La imagen supera el tamaño permitido.', false);
    }
    if (status === 401 || status === 403) {
      return new MediaApiError('Cloudinary rechazó la petición. Revisa la configuración del servidor.', true);
    }
    return new MediaApiError('No se pudo subir la imagen. Intenta de nuevo.', false);
  }

  /** Elimina el asset de Cloudinary pasando por la función de servidor. */
  private async destroyCloudinaryAsset(url: string): Promise<void> {
    const publicId = cloudinaryPublicIdFromUrl(url);
    if (!publicId) {
      console.warn(`[cloudinary] no se pudo deducir el public_id de "${url}"; se omite el borrado`);
      return;
    }
    await this.callApi(DESTROY_ENDPOINT, { publicId });
  }

  private async safeDestroy(url: string): Promise<void> {
    try {
      await this.destroyCloudinaryAsset(url);
    } catch (error) {
      console.warn(`[cloudinary] no se pudo eliminar "${url}":`, error);
    }
  }

  private async safeLegacyRemove(bucket: string, paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    try {
      await this.legacy.remove(bucket, paths);
    } catch (error) {
      console.warn(`[cloudinary] no se pudo limpiar el bucket "${bucket}":`, error);
    }
  }

  /**
   * Llamada a la API propia con el JWT de Supabase. Separa "el servicio no
   * está" de "la petición es inválida" para poder degradar a Storage solo en
   * el primer caso.
   */
  private async callApi(endpoint: string, body: Record<string, unknown>): Promise<unknown> {
    const token = await this.accessToken();

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new MediaApiError('No se pudo conectar con el servidor de imágenes.', true);
    }

    const payload = (await response.json().catch(() => null)) as
      | { error?: string; message?: string }
      | null;

    if (response.ok) {
      if (!payload || typeof payload !== 'object') {
        throw new MediaApiError('El servidor de imágenes respondió de forma inesperada.', true);
      }
      return payload;
    }

    throw new MediaApiError(
      payload?.message ?? 'No se pudo completar la operación con el servidor de imágenes.',
      UNAVAILABLE_STATUSES.has(response.status),
    );
  }

  /**
   * Degradación documentada a Supabase Storage: si Cloudinary no está
   * disponible, la imagen se guarda en el bucket legacy para que el admin no
   * pierda el trabajo. Solo aplica a las carpetas que tienen bucket; el resto
   * propaga el error real.
   */
  private degradeToLegacyStorage(
    cause: MediaApiError,
    file: File,
    folder: MediaFolder,
    entityId?: string,
  ): Promise<MediaUploadResult> {
    this.cloudinaryUnavailable = true;
    console.warn(
      `[cloudinary] no disponible (${cause.message}); la subida cae a Supabase Storage en "${folder}"`,
    );
    return this.uploadToLegacyStorage(file, folder, entityId);
  }

  private async uploadToLegacyStorage(
    file: File,
    folder: MediaFolder,
    entityId?: string,
  ): Promise<MediaUploadResult> {
    const bucket = this.legacy.bucketFor(folder);
    const path = this.legacy.legacyPath(folder, file, entityId);
    if (!bucket || !path) {
      throw new MediaApiError(
        'No se pudo subir la imagen: el servicio de almacenamiento no está disponible.',
        false,
      );
    }
    const reference = await this.legacy.upload(bucket, path, file);
    return {
      provider: 'supabase',
      reference,
      publicId: null,
      width: null,
      height: null,
      bytes: file.size,
    };
  }
}
