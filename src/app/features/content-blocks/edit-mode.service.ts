import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../auth/data-access/auth.service';

/**
 * Modo edición del sitio (plan, sección 7.1): solo activable con sesión admin.
 * En modo edición, los EditableText/EditableImage del sitio muestran sus
 * controles (lápiz / cambiar imagen) y guardan en `content_blocks`.
 */
@Injectable({ providedIn: 'root' })
export class EditModeService {
  private readonly auth = inject(AuthService);

  private readonly isEditingSignal = signal(false);

  readonly isEditing = this.isEditingSignal.asReadonly();

  /** Solo los administradores pueden editar contenido. */
  readonly canEdit = computed(() => this.auth.isAdmin());

  constructor() {
    // Al cerrar sesión (o perder el rol admin) se sale del modo edición.
    effect(() => {
      if (!this.auth.isAdmin()) {
        this.isEditingSignal.set(false);
      }
    });
  }

  toggle(): void {
    if (!this.canEdit()) {
      this.isEditingSignal.set(false);
      return;
    }
    this.isEditingSignal.update((editing) => !editing);
  }

  disable(): void {
    this.isEditingSignal.set(false);
  }
}