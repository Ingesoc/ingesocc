import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContentBlocksService } from '../content-blocks/data-access/content-blocks.service';
import { EditableTextComponent } from '../content-blocks/editable-text.component';
import { ContactMessagesService } from './data-access/contact-messages.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule, EditableTextComponent],
  templateUrl: './contact.component.html',
})
export class ContactComponent {
  private readonly blocks = inject(ContentBlocksService);
  private readonly messages = inject(ContactMessagesService);

  readonly title = computed(() => this.blocks.text('contact', 'title', 'Contacto'));
  readonly subtitle = computed(() => this.blocks.text('contact', 'subtitle', ''));
  readonly phone = computed(() => this.blocks.text('contact', 'phone'));
  readonly email = computed(() => this.blocks.text('contact', 'email'));
  readonly address = computed(() => this.blocks.text('contact', 'address'));
  readonly privacyNote = computed(() => this.blocks.text('contact', 'privacy_note'));

  /** Obligatorios según supuesto del plan 1.5: Nombre, Email, Mensaje. Teléfono y Asunto opcionales. */
  readonly form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl(''),
    subject: new FormControl(''),
    message: new FormControl('', [Validators.required, Validators.minLength(10)]),
  });

  readonly submitted = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal('');

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.submitError.set('');

    try {
      await this.messages.insert({
        name: this.form.value.name!.trim(),
        email: this.form.value.email!.trim(),
        phone: this.form.value.phone?.trim() || null,
        subject: this.form.value.subject?.trim() || null,
        message: this.form.value.message!.trim(),
      });
      this.submitted.set(true);
    } catch {
      this.submitError.set('No se pudo enviar el mensaje. Inténtalo de nuevo o escríbenos directamente.');
    } finally {
      this.submitting.set(false);
    }
  }
}