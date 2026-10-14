export type TestimonialStatus = 'draft' | 'published';

/** Testimonio de cliente (tabla `testimonials` del plan, slice 3.5). */
export interface Testimonial {
  id: string;
  author: string;
  /** Cargo o contexto del autor (empresa, proyecto…); opcional. */
  role: string | null;
  quote: string;
  /** 1–5 estrellas; null = el diseño no muestra la fila de estrellas. */
  rating: number | null;
  status: TestimonialStatus;
  sortOrder: number;
}

/** Campos que el admin diligencia al crear/editar un testimonio. */
export interface TestimonialInput {
  author: string;
  role: string | null;
  quote: string;
  rating: number | null;
  status: TestimonialStatus;
  sortOrder: number;
}