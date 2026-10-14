import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { LucideChevronLeft } from '@lucide/angular';
import { TestimonialsService } from '../data-access/testimonials.service';
import type { TestimonialInput } from '../data-access/testimonial.model';

/** Opciones de la valoración editorial (1–5 estrellas; null = sin mostrar). */
const RATING_OPTIONS = [null, 1, 2, 3, 4, 5] as const;

@Component({
  selector: 'app-testimonial-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideChevronLeft],
  templateUrl: './testimonial-form.component.html',
})
export class TestimonialFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly testimonials = inject(TestimonialsService);

  readonly testimonialId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))));
  readonly isEdit = computed(() => Boolean(this.testimonialId()));
  readonly ratingOptions = RATING_OPTIONS;

  readonly form = new FormGroup({
    author: new FormControl('', [Validators.required, Validators.minLength(3)]),
    role: new FormControl(''),
    quote: new FormControl('', [Validators.required, Validators.minLength(10)]),
    rating: new FormControl<number | null>(null),
    status: new FormControl<'draft' | 'published'>('draft'),
    sortOrder: new FormControl(0),
  });

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly submitLabel = computed(() => (this.saving() ? 'Guardando…' : 'Guardar testimonio'));

  async ngOnInit(): Promise<void> {
    if (!this.isEdit()) {
      this.loading.set(false);
      return;
    }

    try {
      if (this.testimonials.adminTestimonials().length === 0) {
        await this.testimonials.loadAll();
      }
      const testimonial = this.testimonials.byId(this.testimonialId()!);
      if (!testimonial) {
        this.error.set('Testimonio no encontrado.');
        return;
      }
      this.form.patchValue({
        author: testimonial.author,
        role: testimonial.role ?? '',
        quote: testimonial.quote,
        rating: testimonial.rating,
        status: testimonial.status,
        sortOrder: testimonial.sortOrder,
      });
    } catch {
      this.error.set('No se pudo cargar el testimonio.');
    } finally {
      this.loading.set(false);
    }
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    this.error.set('');

    try {
      const value = this.form.value;
      const input: TestimonialInput = {
        author: value.author!.trim(),
        role: value.role?.trim() || null,
        quote: value.quote!.trim(),
        rating: value.rating != null ? Number(value.rating) : null,
        status: value.status!,
        sortOrder: Number(value.sortOrder ?? 0),
      };

      const id = this.testimonialId();
      if (id) {
        await this.testimonials.updateTestimonial(id, input);
      } else {
        await this.testimonials.createTestimonial(input);
      }

      await this.testimonials.refreshAll();
      await this.router.navigate(['/admin/testimonios']);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error al guardar el testimonio.');
    } finally {
      this.saving.set(false);
    }
  }
}