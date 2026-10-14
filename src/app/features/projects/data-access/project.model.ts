export type ProjectStatus = 'draft' | 'published';

/**
 * Metadatos de una imagen de proyecto. Todos opcionales: la vista usa un texto
 * neutro cuando faltan, en lugar de inventar contenido (regla: no atribuir
 * características no verificables).
 */
export interface ProjectImageMetadata {
  /** Texto alternativo: lo que lee un lector de pantalla. */
  alt?: string | null;
  /** Título visible en la galería y el lightbox. */
  title?: string | null;
  /** Descripción visible bajo el título. */
  description?: string | null;
  /** Agrupamiento editorial ("Urbanismo", "Estructura"…). */
  category?: string | null;
}

export interface ProjectImage extends ProjectImageMetadata {
  url: string;
  isCover: boolean;
}

/**
 * Cifra del caso de estudio (p. ej. "Área construida", "2.400 m²"). Ambas
 * partes son requeridas por el panel; la vista pública solo renderiza pares
 * completos (sin inventar contenido).
 */
export interface ProjectKeyFigure {
  label: string;
  value: string;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  /**
   * Ubicación de la OBRA, no de la empresa. La dirección corporativa vive en
   * `content_blocks` (`contact.address`) y son datos distintos.
   */
  location?: string | null;
  priceMinWages: number | null;
  status: ProjectStatus;
  featured: boolean;
  sortOrder: number;
  categories: string[];
  images: ProjectImage[];
  /**
   * Enlace público opcional al micrositio oficial del proyecto
   * (p. ej. https://laholanda.ingesocc.com/). Null/undefined = el detalle
   * termina con el CTA de contacto habitual, sin enlace externo.
   */
  externalUrl?: string | null;
  /**
   * Datos del caso de estudio. Todos opcionales: la vista oculta las secciones
   * vacías en lugar de inventar contenido (regla: no atribuir características
   * no verificables). `keyFigures` es un array de {label, value}.
   */
  client?: string | null;
  scope?: string | null;
  timeline?: string | null;
  progress?: string | null;
  results?: string | null;
  keyFigures?: ProjectKeyFigure[];
}

/**
 * Texto alternativo de una imagen, con respaldo neutro.
 *
 * Prioriza el `alt` que diligenció el admin; si no hay, usa el título de la
 * imagen; y como último recurso una referencia neutra al proyecto (sin
 * inventar qué muestra la foto). Nunca devuelve cadena vacía: un `alt` vacío
 * es peor que uno genérico porque un lector de pantalla lo anuncia como
 * "imagen" y no dice nada.
 */
export function projectImageAlt(image: ProjectImage, projectTitle: string): string {
  return image.alt?.trim() || image.title?.trim() || `Imagen del proyecto ${projectTitle}`;
}

/** ¿La imagen tiene algún texto visible que valga la pena mostrar? */
export function projectImageCaption(image: ProjectImage): boolean {
  return Boolean(image.title?.trim() || image.description?.trim());
}

/** URL de la portada (la que se ve en las cards). */
export function projectCoverUrl(project: Project): string {
  return (
    project.images.find((image) => image.isCover)?.url ??
    project.images[0]?.url ??
    ''
  );
}

/** Ubicación de la obra, o cadena vacía si el proyecto no la tiene registrada. */
export function projectLocation(project: Project): string {
  return project.location?.trim() ?? '';
}

/** Opción de categoría cargada desde la tabla `categories` (plan 3.1). */
export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

/** Imagen de proyecto vista por el admin (con id y ruta de storage). */
export interface AdminProjectImage extends ProjectImageMetadata {
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
  /** Igual que `Project.location`: ubicación de la obra, no de la empresa. */
  location: string | null;
  priceMinWages: number | null;
  status: ProjectStatus;
  featured: boolean;
  sortOrder: number;
  categoryIds: string[];
  images: AdminProjectImage[];
  /** Igual que `Project.externalUrl`: opcional y genérico. */
  externalUrl: string | null;
  /** Datos del caso de estudio (ver `Project`): null/vacío = no registrado. */
  client: string | null;
  scope: string | null;
  timeline: string | null;
  progress: string | null;
  results: string | null;
  keyFigures: ProjectKeyFigure[];
}

/** Campos que el admin diligencia al crear/editar (plan 1.2). */
export interface ProjectInput {
  title: string;
  slug: string;
  description: string;
  /** Ubicación de la obra ('' = sin registrar). */
  location?: string | null;
  priceMinWages: number | null;
  status: ProjectStatus;
  featured: boolean;
  sortOrder: number;
  /** Enlace externo opcional (vacío/null = sin micrositio). */
  externalUrl?: string | null;
  /** Datos del caso de estudio (vacío/null = no registrado). */
  client?: string | null;
  scope?: string | null;
  timeline?: string | null;
  progress?: string | null;
  results?: string | null;
  /** Cifras del caso de estudio; se filtran las incompletas al guardar. */
  keyFigures?: ProjectKeyFigure[];
}

/**
 * Fila de imagen que el panel envía al RPC. Los metadatos viajan dentro de
 * `p_image_rows` (jsonb), por eso la firma de esa RPC no cambia al añadirlos.
 */
export interface ProjectImageInput {
  id?: string;
  storagePath: string;
  isCover: boolean;
  sortOrder: number;
  alt?: string | null;
  title?: string | null;
  description?: string | null;
  category?: string | null;
}
