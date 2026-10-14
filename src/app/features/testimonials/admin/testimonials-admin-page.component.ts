import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucidePencil, LucidePlus, LucideTrash2 } from '@lucide/angular';
import { TestimonialsService } from '../data-access/testimonials.service';
import type { Testimonial } from '../data-access/testimonial.model';

@Component({
  selector: 'app-testimonials-admin-page',
  standalone: true,
  imports: [RouterLink, LucidePlus, LucidePencil, LucideTrash2],
  templateUrl: './testimonials-admin-page.component.html',
})
export class TestimonialsAdminPageComponent implements OnInit {
  private readonly testimonials = inject(TestimonialsService);
  private readonly router = inject(Router);

  readonly adminTestimonials = this.testimonials.adminTestimonials;
  readonly loading = signal(true);
  readonly error = signal('');

  async ngOnInit(): Promise<void> {
    try {
      await this.testimonials.loadAll();
    } catch {
      this.error.set('No se pudieron cargar los testimonios.');
    } finally {
      this.loading.set(false);
    }
  }

  /** Previsualización del testimonio (primera parte de la cita). */
  quotePreview(testimonial: Testimonial): string {
    const quote = testimonial.quote.trim();
    return quote.length > 64 ? `${quote.slice(0, 64)}…` : quote;
  }

  async onDelete(testimonial: Testimonial): Promise<void> {
    if (!window.confirm(`¿Eliminar el testimonio de "${testimonial.author}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await this.testimonials.deleteTestimonial(testimonial.id);
      await this.testimonials.refreshAll();
    } catch {
      this.error.set('No se pudo eliminar el testimonio.');
    }
  }

  onNewTestimonial(): void {
    this.router.navigate(['/admin/testimonios/nuevo']);
  }
}