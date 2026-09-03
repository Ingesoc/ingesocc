import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContentBlocksService } from '../content-blocks/data-access/content-blocks.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './contact.component.html',
})
export class ContactComponent {
  private readonly blocks = inject(ContentBlocksService);

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

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // Fase 7: insertar en contact_messages vía Supabase (RLS permite insert público).
    console.log('Mensaje de contacto (Fase 7 -> contact_messages):', this.form.value);
    this.submitted.set(true);
  }
}