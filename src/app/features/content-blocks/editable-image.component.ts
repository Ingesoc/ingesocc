import { Component, computed, inject, input, signal } from '@angular/core';
import { LucideImagePlus } from '@lucide/angular';
import { SupabaseService } from '../../core/supabase.service';
import { ContentBlocksService } from './data-access/content-blocks.service';
import { EditModeService } from './edit-mode.service';

@Component({
  selector: 'app-editable-image',
  standalone: true,
  imports: [LucideImagePlus],
  templateUrl: './editable-image.component.html',
})
export class EditableImageComponent {
  private readonly blocks = inject(ContentBlocksService);
  private readonly supabase = inject(SupabaseService);
  private readonly editMode = inject(EditModeService);

  readonly page = input.required<string>();
  readonly sectionKey = input.required<string>();
  readonly fallback = input('');
  readonly alt = input('');

  /** true cuando la imagen llena su contenedor (p. ej. fondo del hero). */
  readonly fill = input(false);

  /** Clases extra aplicadas a la <img> (opacidad, object-fit, etc.). */
  readonly imageClass = input('');

  /** Clases extra aplicadas al contenedor (p. ej. aspect-square para el equipo). */
  readonly containerClass = input('');

  readonly wrapperClass = computed(() =>
    [this.fill() ? 'absolute inset-0' : '', this.containerClass()].filter(Boolean).join(' '),
  );

  readonly isEditingMode = this.editMode.isEditing;

  readonly image = computed(() => this.blocks.image(this.page(), this.sectionKey(), this.fallback()));

  readonly uploading = signal(false);
  readonly error = signal('');

  /** Sube la imagen al bucket content-images y actualiza el bloque. */
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.uploading.set(true);
    this.error.set('');

    try {
      let processed = file;
      try {
        // Carga diferida: la librería de compresión solo baja cuando el admin sube una imagen.
        const { default: imageCompression } = await import('browser-image-compression');
        processed = await imageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 2000,
          useWebWorker: true,
        });
      } catch {
        // Sin compresión si falla; se sube el original.
      }

      const ext = processed.name.split('.').pop() ?? 'jpg';
      const path = `content/${this.page()}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await this.supabase.client.storage
        .from('content-images')
        .upload(path, processed, { contentType: processed.type || 'image/jpeg' });
      if (uploadError) throw new Error(uploadError.message);

      await this.blocks.updateBlock(this.page(), this.sectionKey(), { valueImagePath: path });
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'No se pudo subir la imagen.');
    } finally {
      this.uploading.set(false);
    }
  }
}