import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import type { MediaFolder } from './cloudinary.model';

/**
 * Proveedor LEGACY de imágenes: Supabase Storage.
 *
 * No es el proveedor principal (eso es Cloudinary, vía `CloudinaryService`),
 * pero sigue haciendo falta por dos razones documentadas:
 *
 *  1. Las imágenes ya persistidas en `project_images.storage_path`,
 *     `services.photo_path` y `content_blocks.value_image_path` son rutas de
 *     estos buckets. Se siguen leyendo (`resolvePublicUrl`) y no se borran.
 *  2. Si Cloudinary no está configurado en el servidor, las subidas nuevas
 *     caen aquí para que el panel de administración no se quede sin función.
 *
 * La migración física de assets (Supabase → Cloudinary) es una segunda fase
 * explícita, no parte de este despliegue.
 */
export const LEGACY_BUCKETS: Readonly<Record<string, string>> = {
  projects: 'project-images',
  services: 'service-images',
  content: 'content-images',
  // `team` y `general` nunca existieron en Supabase: no hay bucket legacy.
};

@Injectable({ providedIn: 'root' })
export class SupabaseStorageService {
  private readonly supabase = inject(SupabaseService);

  /** Bucket legacy de una carpeta, o `null` si esa carpeta no tiene equivalente. */
  bucketFor(folder: MediaFolder): string | null {
    return LEGACY_BUCKETS[folder] ?? null;
  }

  /**
   * Ruta legacy de un asset, con el mismo formato que usaba la app antes de
   * Cloudinary (`<projectId>/<uuid>.<ext>`, `services/<id>/<uuid>.<ext>`, …).
   * `null` si la carpeta no tiene bucket legacy equivalente.
   */
  legacyPath(folder: MediaFolder, file: File, entityId?: string): string | null {
    const bucket = this.bucketFor(folder);
    if (!bucket) return null;

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const name = `${crypto.randomUUID()}.${extension}`;
    switch (folder) {
      case 'projects':
        return entityId ? `${entityId}/${name}` : name;
      case 'services':
        return entityId ? `services/${entityId}/${name}` : `services/${name}`;
      case 'content':
        return `content/${name}`;
      default:
        return null;
    }
  }

  /** Sube un archivo al bucket legacy y devuelve la ruta relativa. */
  async upload(bucket: string, path: string, file: File): Promise<string> {
    await this.supabase.clientPromise;
    const { error } = await this.supabase.client.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type || 'image/jpeg' });
    if (error) throw new Error(error.message);
    return path;
  }

  /**
   * Borra objetos del bucket. `remove()` no lanza si la ruta ya no existe, así
   * que es idempotente: se puede usar también como compensación.
   */
  async remove(bucket: string, paths: readonly string[]): Promise<void> {
    if (paths.length === 0) return;
    await this.supabase.clientPromise;
    const { error } = await this.supabase.client.storage.from(bucket).remove([...paths]);
    if (error) throw new Error(error.message);
  }

  /** Ruta relativa a URL pública (compatibilidad con lo ya guardado). */
  resolvePublicUrl(bucket: string, path: string | null | undefined): string {
    return this.supabase.resolvePublicUrl(bucket, path);
  }
}
