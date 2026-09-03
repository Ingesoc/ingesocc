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