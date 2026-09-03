import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '../../../core/supabase.service';
import type { Project, ProjectImage } from './project.model';

/**
 * Catálogo de proyectos (tabla `projects` del plan, sección 3.2).
 *
 * Al iniciar intenta cargar desde Supabase (RLS ya filtra `status =
 * 'published'` para anónimos). Si la tabla no existe todavía o está vacía,
 * mantiene el seed estático de ejemplo (plan 1.7 — ilustrativo, el portafolio
 * real se carga vía el CRUD del admin en Fase 4).
 */
const SEED_PROJECTS: Project[] = [
  {
    id: 'p01',
    title: 'Casa Ladera',
    slug: 'casa-ladera',
    description:
      'Proyecto residencial unifamiliar de dos niveles con diseño contemporáneo, grandes ventanales y acabados de alta calidad, integrado a la topografía del lote.',
    priceMinWages: 180,
    status: 'published',
    featured: true,
    sortOrder: 1,
    categories: ['Edificaciones'],
    images: [
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85', isCover: true },
      { url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85', isCover: false },
    ],
  },
  {
    id: 'p02',
    title: 'Distrito 48',
    slug: 'distrito-48',
    description:
      'Edificio comercial de oficinas con fachada moderna en muro cortina, espacios flexibles y áreas comunes de alto estándar.',
    priceMinWages: 320,
    status: 'published',
    featured: true,
    sortOrder: 2,
    categories: ['Edificaciones'],
    images: [
      { url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85', isCover: true },
    ],
  },
  {
    id: 'p03',
    title: 'Taller Norte',
    slug: 'taller-norte',
    description:
      'Nave industrial en estructura metálica con cubierta liviana, amplios vanos libres y piso de alto tránsito para operación logística.',
    priceMinWages: 240,
    status: 'published',
    featured: true,
    sortOrder: 3,
    categories: ['Estructuras Metálicas'],
    images: [
      { url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=85', isCover: true },
    ],
  },
  {
    id: 'p04',
    title: 'Puente Metálico Veredal "El Progreso"',
    slug: 'puente-metalico-veredal-el-progreso',
    description:
      'Puente vehicular en estructura metálica que conecta dos veredas, con luces de 24 m y barandas de seguridad certificadas.',
    priceMinWages: 350,
    status: 'published',
    featured: false,
    sortOrder: 4,
    categories: ['Puentes'],
    images: [
      { url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1600&q=85', isCover: true },
      { url: 'https://images.unsplash.com/photo-1504307651254-35680f583dfb?auto=format&fit=crop&w=1400&q=85', isCover: false },
    ],
  },
  {
    id: 'p05',
    title: 'Bodega Estructural XYZ',
    slug: 'bodega-estructural-xyz',
    description:
      'Bodega industrial de 2.400 m² con pórticos metálicos, cubierta en panel y sistema contra incendios.',
    priceMinWages: 250,
    status: 'published',
    featured: false,
    sortOrder: 5,
    categories: ['Estructuras Metálicas'],
    images: [
      { url: 'https://images.unsplash.com/photo-1567958451986-2de427a4a0be?auto=format&fit=crop&w=1400&q=85', isCover: true },
      { url: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=1400&q=85', isCover: false },
    ],
  },
  {
    id: 'p06',
    title: 'Torre de Oficinas Centro',
    slug: 'torre-de-oficinas-centro',
    description:
      'Edificación de 8 niveles en concreto reforzado con fachada en muro cortina y dos sótanos de parqueadero.',
    priceMinWages: 480,
    status: 'published',
    featured: false,
    sortOrder: 6,
    categories: ['Edificaciones'],
    images: [
      { url: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1400&q=85', isCover: true },
      { url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=85', isCover: false },
    ],
  },
  {
    id: 'p07',
    title: 'Centro de Salud Municipal',
    slug: 'centro-de-salud-municipal',
    description:
      'Centro de salud de baja complejidad con áreas de urgencias, hospitalización y consulta externa, construido bajo estándares hospitalarios.',
    priceMinWages: 410,
    status: 'published',
    featured: false,
    sortOrder: 7,
    categories: ['Proyectos Especiales'],
    images: [
      { url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=85', isCover: true },
      { url: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1400&q=85', isCover: false },
    ],
  },
  {
    id: 'p08',
    title: 'Planta de Producción Andina',
    slug: 'planta-de-produccion-andina',
    description:
      'Planta de producción con estructura metálica de gran luz, mezzanines de proceso y sistemas de ventilación industrial.',
    priceMinWages: 300,
    status: 'published',
    featured: false,
    sortOrder: 8,
    categories: ['Estructuras Metálicas'],
    images: [
      { url: 'https://images.unsplash.com/photo-1429497419816-9ca5cfb4571a?auto=format&fit=crop&w=1400&q=85', isCover: true },
      { url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1400&q=85', isCover: false },
    ],
  },
  {
    id: 'p09',
    title: 'Puente Peatonal Parque Lineal',
    slug: 'puente-peatonal-parque-lineal',
    description:
      'Puente peatonal curvo en acero que articula el parque lineal con la zona comercial, con iluminación integrada.',
    priceMinWages: 90,
    status: 'published',
    featured: false,
    sortOrder: 9,
    categories: ['Puentes'],
    images: [
      { url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1400&q=85', isCover: true },
    ],
  },
  {
    id: 'p10',
    title: 'Conjunto Residencial Altos del Café',
    slug: 'conjunto-residencial-altos-del-cafe',
    description:
      'Conjunto de vivienda multifamiliar con 3 torres, zonas verdes, piscina y urbanismo interior completo.',
    priceMinWages: 520,
    status: 'published',
    featured: false,
    sortOrder: 10,
    categories: ['Edificaciones'],
    images: [
      { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=85', isCover: true },
      { url: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1400&q=85', isCover: false },
    ],
  },
];

/** Categorías reales del filtro (plan 1.2 — "Todos" es el filtro por defecto, no una categoría). */
export const PROJECT_CATEGORIES: readonly string[] = [
  'Edificaciones',
  'Estructuras Metálicas',
  'Puentes',
  'Proyectos Especiales',
];

interface ProjectRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  price_min_wages: number | null;
  status: Project['status'];
  featured: boolean;
  sort_order: number;
}

interface CategoryLinkRow {
  project_id: string;
  categories: { name: string }[] | null;
}

interface ProjectImageRow {
  project_id: string;
  storage_path: string;
  is_cover: boolean;
  sort_order: number;
}

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly supabase = inject(SupabaseService);

  private readonly projects = signal<Project[]>(SEED_PROJECTS);

  /** Proyectos publicados, en orden manual del admin. */
  readonly published = computed(() =>
    this.projects()
      .filter((project) => project.status === 'published')
      .sort((a, b) => a.sortOrder - b.sortOrder),
  );

  /** Solo los destacados (`featured = true`) para la sección del Home (plan 1.2.2). */
  readonly featured = computed(() => this.published().filter((project) => project.featured));

  bySlug(slug: string): Project | undefined {
    return this.published().find((project) => project.slug === slug);
  }

  constructor() {
    void this.load();
  }

  /** Carga proyectos + categorías + imágenes desde Supabase; si falla, mantiene el seed. */
  async load(): Promise<void> {
    const client = this.supabase.client;

    const { data: projects, error } = await client
      .from('projects')
      .select('id, title, slug, description, price_min_wages, status, featured, sort_order');

    if (error) {
      console.warn('[projects] usando seed estático:', error.message);
      return;
    }
    if (!projects || projects.length === 0) {
      console.info('[projects] tabla vacía: usando seed estático.');
      return;
    }

    const { data: links } = await client
      .from('project_categories')
      .select('project_id, categories(name)');

    const { data: images } = await client
      .from('project_images')
      .select('project_id, storage_path, is_cover, sort_order')
      .order('sort_order');

    const categoriesByProject = new Map<string, string[]>();
    for (const link of (links ?? []) as CategoryLinkRow[]) {
      for (const category of link.categories ?? []) {
        const list = categoriesByProject.get(link.project_id) ?? [];
        list.push(category.name);
        categoriesByProject.set(link.project_id, list);
      }
    }

    const imagesByProject = new Map<string, ProjectImage[]>();
    for (const image of (images ?? []) as ProjectImageRow[]) {
      const list = imagesByProject.get(image.project_id) ?? [];
      list.push({
        url: this.supabase.resolvePublicUrl('project-images', image.storage_path),
        isCover: image.is_cover,
      });
      imagesByProject.set(image.project_id, list);
    }

    this.projects.set(
      (projects as ProjectRow[]).map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        priceMinWages: row.price_min_wages != null ? Number(row.price_min_wages) : null,
        status: row.status,
        featured: row.featured,
        sortOrder: row.sort_order,
        categories: categoriesByProject.get(row.id) ?? [],
        images: imagesByProject.get(row.id) ?? [],
      })),
    );
  }
}