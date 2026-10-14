export type ServiceStatus = 'draft' | 'published';

/** Pregunta frecuente del detalle del servicio (columna jsonb `faq`). */
export interface ServiceFaqItem {
  q: string;
  a: string;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Párrafo de alcance propio; null → se usa description en el detalle. */
  scope: string | null;
  /** Entregables por línea de servicio; null → respaldo genérico del detalle. */
  deliverables: string[] | null;
  /** Preguntas frecuentes propias; null → respaldo genérico del detalle. */
  faq: ServiceFaqItem[] | null;
  photoUrl: string | null;
  iconName: string | null;
  status: ServiceStatus;
  sortOrder: number;
}

/** Servicio completo visto por el admin (incluye borradores y la ruta de storage). */
export interface AdminService {
  id: string;
  name: string;
  slug: string;
  description: string;
  scope: string | null;
  deliverables: string[] | null;
  faq: ServiceFaqItem[] | null;
  photoPath: string | null;
  photoUrl: string | null;
  iconName: string | null;
  status: ServiceStatus;
  sortOrder: number;
}

/** Campos que el admin diligencia al crear/editar un servicio (plan 1.3). */
export interface ServiceInput {
  name: string;
  slug: string;
  description: string;
  scope: string | null;
  deliverables: string[];
  faq: ServiceFaqItem[];
  iconName: string | null;
  status: ServiceStatus;
  sortOrder: number;
}