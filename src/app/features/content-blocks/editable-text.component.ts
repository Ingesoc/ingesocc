import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideCheck, LucidePencil, LucideX } from '@lucide/angular';
import { ContentBlocksService } from './data-access/content-blocks.service';
import { EditModeService } from './edit-mode.service';

@Component({
  selector: 'app-editable-text',
  standalone: true,
  imports: [FormsModule, LucidePencil, LucideCheck, LucideX],
  templateUrl: './editable-text.component.html',
})
export class EditableTextComponent {
  private readonly blocks = inject(ContentBlocksService);
  private readonly editMode = inject(EditModeService);

  readonly page = input.required<string>();
  readonly sectionKey = input.required<string>();
  /** Texto o número de respaldo mientras no exista la fila en `content_blocks`. */
  readonly fallback = input<string | number>('');

  /** true para descripciones largas (textarea en vez de input). */
  readonly multiline = input(false);

  readonly isEditingMode = this.editMode.isEditing;

  readonly block = computed(() => this.blocks.block(this.page(), this.sectionKey()));
  readonly isNumber = computed(() => this.block()?.type === 'number');

  /** Valor actual del bloque (texto o número) con respaldo. */
  readonly value = computed(() => {
    const block = this.block();
    if (!block) return String(this.fallback());
    return block.type === 'number'
      ? String(block.valueNumber ?? this.fallback())
      : (block.valueText ?? String(this.fallback()));
  });

  readonly editing = signal(false);
  readonly draft = signal('');
  readonly saving = signal(false);
  readonly error = signal('');

  startEdit(): void {
    this.draft.set(this.value());
    this.editing.set(true);
    this.error.set('');
  }

  cancel(): void {
    this.editing.set(false);
    this.error.set('');
  }

  async save(): Promise<void> {
    const raw = this.draft().trim();

    if (this.isNumber()) {
      const parsed = Number(raw);
      if (raw === '' || Number.isNaN(parsed)) {
        this.error.set('Ingrese un valor numérico.');
        return;
      }
      await this.persist({ valueNumber: parsed });
    } else {
      if (!raw) {
        this.error.set('El texto no puede quedar vacío.');
        return;
      }
      await this.persist({ valueText: raw });
    }
  }

  private async persist(changes: { valueText?: string; valueNumber?: number }): Promise<void> {
    this.saving.set(true);
    this.error.set('');
    try {
      await this.blocks.updateBlock(this.page(), this.sectionKey(), changes);
      this.editing.set(false);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      this.saving.set(false);
    }
  }
}