import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideExternalLink, LucideMail, LucideMapPin, LucideMessageCircle, LucidePhone } from '@lucide/angular';
import { ContentBlocksService } from '../content-blocks/data-access/content-blocks.service';
import { ContactMessagesService } from './data-access/contact-messages.service';

/**
 * Normaliza un teléfono a enlace tel: (deja dígitos y "+" inicial; espacios y
 * signos de puntuación fuera). Sin valor devuelve null para ocultar el enlace.
 */
function telLink(phone: string): string | null {
  const digits = phone.replace(/[^+\d]/g, '');
  return digits ? `tel:${digits}` : null;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideMail, LucidePhone, LucideMapPin, LucideMessageCircle, LucideExternalLink],
  templateUrl: './contact.component.html',
})
export class ContactComponent {
  private readonly blocks = inject(ContentBlocksService);
  private readonly messages = inject(ContactMessagesService);

  readonly title = computed(() => this.blocks.text('contact', 'title', 'Contacto'));
  readonly subtitle = computed(() => this.blocks.text('contact', 'subtitle', ''));
  readonly phone = computed(() => this.blocks.text('contact', 'phone'));
  readonly phoneHref = computed(() => telLink(this.phone()));
  readonly email = computed(() => this.blocks.text('contact', 'email'));
  readonly address = computed(() => this.blocks.text('contact', 'address'));
  /** URL wa.me del CMS (p. ej. https://wa.me/573127370811); '' = sin CTA. */
  readonly whatsappUrl = computed(() => this.blocks.text('contact', 'whatsapp'));
  readonly privacyNote = computed(() => this.blocks.text('contact', 'privacy_note'));

  /** Mapa embebido (sin API key) a partir de la dirección real; '' = oculto. */
  readonly mapEmbedUrl = computed(() => {
    const where = this.address();
    return where ? `https://maps.google.com/maps?q=${encodeURIComponent(where)}&z=15&output=embed` : '';
  });

  /** Obligatorios: Nombre, Email, Mensaje. Teléfono, Asunto y contexto del
 *  proyecto (tipo/presupuesto/plazo) opcionales. `website` es el honeypot
 *  anti-spam: oculto y sin validar, los bots lo rellenan. */
  readonly form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]),
    email: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(254)]),
    phone: new FormControl('', [Validators.maxLength(30)]),
    subject: new FormControl('', [Validators.maxLength(200)]),
    message: new FormControl('', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]),
    projectType: new FormControl(''),
    budgetRange: new FormControl(''),
    timeline: new FormControl(''),
    website: new FormControl(''),
  });

  /** Opciones del contexto del proyecto (labels en español = valores en DB). */
  readonly projectTypeOptions = ['Construcción', 'Diseño', 'Remodelación', 'Infraestructura', 'Industria', 'Salud', 'Otro'];
  readonly budgetRangeOptions = ['Menos de $100M', 'Entre $100M y $500M', 'Más de $500M', 'Aún sin definir'];
  readonly timelineOptions = ['Inmediato', '1 a 3 meses', '3 a 6 meses', '6 a 12 meses', 'Más de un año'];

  /** Mensaje de error por campo (primer validador fallido). */
  fieldError(control: 'name' | 'email' | 'phone' | 'subject' | 'message'): string {
    const c = this.form.controls[control];
    if (!c.touched || !c.errors) return '';
    if (c.errors['required']) {
      const labels = {
        name: 'Ingrese su nombre.',
        email: 'Ingrese su correo.',
        phone: '',
        subject: '',
        message: 'Escriba un mensaje.',
      };
      return labels[control];
    }
    if (c.errors['minlength']) {
      return control === 'name'
        ? 'El nombre debe tener al menos 2 caracteres.'
        : 'Escriba un mensaje de al menos 10 caracteres.';
    }
    if (c.errors['maxlength']) {
      const limits = { name: 80, email: 254, phone: 30, subject: 200, message: 5000 } as const;
      return `Máximo ${limits[control]} caracteres.`;
    }
    if (c.errors['email']) return 'Ingrese un email válido.';
    return 'Revisa este campo.';
  }

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
        project_type: this.form.value.projectType?.trim() || null,
        budget_range: this.form.value.budgetRange?.trim() || null,
        timeline: this.form.value.timeline?.trim() || null,
        website: this.form.value.website ?? '',
      });
      this.submitted.set(true);
    } catch {
      this.submitError.set('No se pudo enviar el mensaje. Inténtalo de nuevo o escríbenos directamente.');
    } finally {
      this.submitting.set(false);
    }
  }
}
