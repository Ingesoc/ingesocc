import { Component, inject } from '@angular/core';
import { LucidePencil, LucideX } from '@lucide/angular';
import { EditModeService } from './edit-mode.service';

@Component({
  selector: 'app-edit-mode-toggle',
  standalone: true,
  imports: [LucidePencil, LucideX],
  templateUrl: './edit-mode-toggle.component.html',
})
export class EditModeToggleComponent {
  private readonly editMode = inject(EditModeService);

  readonly isEditing = this.editMode.isEditing;

  /** Solo visible para administradores (plan 7.2). */
  readonly canEdit = this.editMode.canEdit;

  toggle(): void {
    this.editMode.toggle();
  }
}