export type ProjectStatus = 'draft' | 'published';

export interface ProjectImage {
  url: string;
  isCover: boolean;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  priceMinWages: number | null;
  status: ProjectStatus;
  featured: boolean;
  sortOrder: number;
  categories: string[];
  images: ProjectImage[];
}

/** URL de la portada (la que se ve en las cards). */
export function projectCoverUrl(project: Project): string {
  return (
    project.images.find((image) => image.isCover)?.url ??
    project.images[0]?.url ??
    ''
  );
}

/** Opción de categoría cargada desde la tabla `categories` (plan 3.1). */
export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

/** Imagen de proyecto vista por el admin (con id y ruta de storage). */
export interface AdminProjectImage {
  id: string;
  storagePath: string;
  url: string;
  isCover: boolean;
  sortOrder: number;
}

/** Proyecto completo visto por el admin (incluye borradores). */
export interface AdminProject {
  id: string;
  title: string;
  slug: string;
  description: string;
  priceMinWages: number | null;
  status: ProjectStatus;
  featured: boolean;
  sortOrder: number;
  categoryIds: string[];
  images: AdminProjectImage[];
}

/** Campos que el admin diligencia al crear/editar (plan 1.2). */
export interface ProjectInput {
  title: string;
  slug: string;
  description: string;
  priceMinWages: number | null;
  status: ProjectStatus;
  featured: boolean;
  sortOrder: number;
}
