import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '../../../core/supabase.service';
import type { Testimonial, TestimonialInput, TestimonialStatus } from './testimonial.model';

/**
 * Testimonios de clientes (tabla `testimonials` del plan, slice 3.5).
 *
 * Sin seed estático a propósito: no se inventan opiniones de clientes
 * (plan 1.7). Cuando Supabase falla o la tabla está vacía, `published` queda
 * vacío y la sección del Home se oculta sola.
 */
interface TestimonialRow {
  id: string;
  author: string;
  role: string | null;
  quote: string;
  rating: number | null;
  status: TestimonialStatus;
  sort_order: number;
}

@Injectable({ providedIn: 'root' })
export class TestimonialsService {
  private readonly supabase = inject(SupabaseService);

  /** Publicados que ve el sitio (RLS ya filtra status = 'published'). */
  private readonly publishedSignal = signal<Testimonial[]>([]);
  /** Todos los testimonios para el panel admin (incluye borradores). */
  private readonly adminSignal = signal<Testimonial[]>([]);

  /** Última carga pública falló (sección del Home oculta, no errores de página). */
  private readonly loadFailed = signal(false);

  readonly published = computed(() =>
    [...this.publishedSignal()].sort((a, b) => a.sortOrder - b.sortOrder),
  );
  readonly adminTestimonials = this.adminSignal.asReadonly();
  readonly loadState = this.loadFailed.asReadonly();

  constructor() {
    void this.load();
  }

  /** Recarga lo que consume el panel admin y el sitio público. */
  async refreshAll(): Promise<void> {
    await this.load();
    // Relectura del panel best-effort: una caída transitoria no debe hacer que
    // una mutación ya confirmada se reporte como fallida en la UI.
    await this.loadAll().catch(() => undefined);
  }

  /** Carga los publicados para el Home. */
  async load(): Promise<boolean> {
    await this.supabase.clientPromise;
    const { data, error } = await this.supabase.client
      .from('testimonials')
      .select('id, author, role, quote, rating, status, sort_order');

    if (error) {
      console.warn('[testimonials] sin datos (se oculta la sección):', error.message);
      this.loadFailed.set(true);
      return false;
    }
    this.loadFailed.set(false);
    this.publishedSignal.set((data as TestimonialRow[]).map(mapRow));
    return true;
  }

  /** Carga TODOS los testimonios para el panel admin (RLS permite todo a admin). */
  async loadAll(): Promise<void> {
    await this.supabase.clientPromise;
    const { data, error } = await this.supabase.client
      .from('testimonials')
      .select('id, author, role, quote, rating, status, sort_order')
      .order('sort_order');

    if (error) {
      // Relanza para que el panel distinga "sin datos" de "fallo de carga".
      console.warn('[testimonials/admin] error de carga:', error.message);
      throw new Error(error.message);
    }
    this.adminSignal.set((data as TestimonialRow[]).map(mapRow));
  }

  /** Crea un testimonio y devuelve su id. */
  async createTestimonial(input: TestimonialInput): Promise<string> {
    await this.supabase.clientPromise;
    const { data, error } = await this.supabase.client
      .from('testimonials')
      .insert(toRow(input))
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return (data as { id: string }).id;
  }

  /** Actualiza los datos de un testimonio. */
  async updateTestimonial(id: string, input: TestimonialInput): Promise<void> {
    await this.supabase.clientPromise;
    const { error } = await this.supabase.client
      .from('testimonials')
      .update(toRow(input))
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  /** Elimina un testimonio (sin assets que limpiar: no tiene imagen). */
  async deleteTestimonial(id: string): Promise<void> {
    await this.supabase.clientPromise;
    const { error } = await this.supabase.client.from('testimonials').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  /** Busca un testimonio por id entre TODOS (incluye borradores, para el panel). */
  byId(id: string): Testimonial | undefined {
    return this.adminSignal().find((item) => item.id === id);
  }
}

/** Fila de la tabla → modelo camelCase de la app. */
function mapRow(row: TestimonialRow): Testimonial {
  return {
    id: row.id,
    author: row.author,
    role: row.role,
    quote: row.quote,
    rating: row.rating != null ? Number(row.rating) : null,
    status: row.status,
    sortOrder: row.sort_order,
  };
}

/** TestimonialInput (camelCase) → columnas reales de `testimonials`. */
function toRow(input: TestimonialInput): Record<string, unknown> {
  return {
    author: input.author,
    role: input.role,
    quote: input.quote,
    rating: input.rating,
    status: input.status,
    sort_order: input.sortOrder,
  };
}