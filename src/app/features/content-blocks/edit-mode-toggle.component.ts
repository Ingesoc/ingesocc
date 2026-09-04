import { Component, inject } from '@angular/core';
import { EditModeService } from './edit-mode.service';
import { MorphIconComponent, CLOSE_PATH, PENCIL_PATH } from '../../core/morph-icon.component';

@Component({
  selector: 'app-edit-mode-toggle',
  standalone: true,
  imports: [MorphIconComponent],
  templateUrl: './edit-mode-toggle.component.html',
})
export class EditModeToggleComponent {
  private readonly editMode = inject(EditModeService);

  readonly isEditing = this.editMode.isEditing;

  /** Iconos del toggle (morph ✎ ↔ ✕). */
  readonly editIcon = PENCIL_PATH;
  readonly closeIcon = CLOSE_PATH;

  /** Solo visible para administradores (plan 7.2). */
  readonly canEdit = this.editMode.canEdit;

  toggle(): void {
    this.editMode.toggle();
  }
}