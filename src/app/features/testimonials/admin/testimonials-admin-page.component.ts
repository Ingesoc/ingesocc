import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucidePencil, LucidePlus, LucideTrash2 } from '@lucide/angular';
import { TestimonialsService } from '../data-access/testimonials.service';
import { IconMotionDirective } from '../../../shared/icons';
import type { Testimonial } from '../data-access/testimonial.model';

@Component({
  selector: 'app-testimonials-admin-page',
  standalone: true,
  imports: [RouterLink, LucidePlus, LucidePencil, LucideTrash2, IconMotionDirective],
  templateUrl: './testimonials-admin-page.component.html',
})
export class TestimonialsAdminPageComponent implements OnInit, OnDestroy {
  private readonly testimonials = inject(TestimonialsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly adminTestimonials = this.testimonials.adminTestimonials;
  readonly loading = signal(true);
  readonly error = signal('');
  /** true tras volver de un guardado exitoso (aviso efímero con `?guardado=1`). */
  readonly justSaved = signal(false);

  private savedTimer: ReturnType<typeof setTimeout> | undefined;

  async ngOnInit(): Promise<void> {
    this.showSavedNotice();
    try {
      await this.testimonials.loadAll();
    } catch {
      this.error.set('No se pudieron cargar los testimonios.');
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.savedTimer);
  }

  /** Aviso efímero de guardado: llega como `?guardado=1` desde el formulario. */
  private showSavedNotice(): void {
    if (this.route.snapshot.queryParamMap.get('guardado') !== '1') {
      return;
    }
    this.justSaved.set(true);
    this.savedTimer = setTimeout(() => {
      this.justSaved.set(false);
      void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }, 6000);
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