export type ServiceStatus = 'draft' | 'published';

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
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
  iconName: string | null;
  status: ServiceStatus;
  sortOrder: number;
}