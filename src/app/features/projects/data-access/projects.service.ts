import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '../../../core/supabase.service';
import { CloudinaryService } from '../../../core/cloudinary.service';
import { slugify } from '../../../core/slugify';
import type {
  AdminProject,
  AdminProjectImage,
  CategoryOption,
  Project,
  ProjectImage,
  ProjectInput,
} from './project.model';

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

interface DbError {
  message: string;
  code?: string;
}

/** Traduce el error de unicidad de slug a un mensaje claro para el admin (plan 1.2). */
function mapProjectWriteError(error: DbError): Error {
  if (error.code === '23505') {
    return new Error('Ya existe un proyecto con ese slug (URL). Elígelo diferente.');
  }
  return new Error(error.message);
}

/** Categorías reales del filtro (plan 1.2 — "Todos" es el filtro por defecto, no una categoría). */
const PROJECT_CATEGORIES: readonly string[] = [
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
  // PostgREST devuelve la relación to-one `categories` como OBJETO
  // ({ name }) y no como array — se normaliza en load() con `asArray`.
  categories: { name: string } | { name: string }[] | null;
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
  /** Único punto de entrada a la media del sitio (Cloudinary). */
  private readonly media = inject(CloudinaryService);

  private readonly projects = signal<Project[]>(SEED_PROJECTS);

  /** Última carga pública falló (seed visible ≠ datos reales). */
  private readonly loadFailed = signal(false);

  /** Todos los proyectos visto por el admin (incluye borradores). */
  private readonly adminProjectsSignal = signal<AdminProject[]>([]);

  /** Categorías disponibles para asignar (tabla `categories`). */
  private readonly categoriesSignal = signal<CategoryOption[]>([]);

  readonly adminProjects = this.adminProjectsSignal.asReadonly();
  readonly categories = this.categoriesSignal.asReadonly();

  /** Nombres visibles de las categorías, en el orden de la tabla (filtro público). */
  readonly categoryNames = computed(() => this.categoriesSignal().map((category) => category.name));

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
    void this.loadCategories();
  }

  /** Recarga todo lo que consume el panel admin y el sitio público. */
  async refreshAll(): Promise<void> {
    await Promise.all([this.load(), this.loadAll(), this.loadCategories()]);
  }

  /**
   * Carga proyectos + categorías + imágenes desde Supabase; si falla, mantiene
   * el seed (sitio público) y devuelve false (el admin muestra error, plan §2).
   */
  async load(): Promise<boolean> {
    await this.supabase.clientPromise;
    const client = this.supabase.client;

    const { data: projects, error } = await client
      .from('projects')
      .select('id, title, slug, description, price_min_wages, status, featured, sort_order');

    if (error) {
      // Tabla inexistente (schema.sql sin aplicar) o sin credenciales: seed estático.
      console.warn('[projects] usando seed estático:', error.message);
      this.loadFailed.set(true);
      return false;
    }
    this.loadFailed.set(false);
    if (!projects || projects.length === 0) {
      // La tabla existe pero está vacía (p. ej. se eliminaron todos los
      // proyectos): se muestra la realidad, no un seed que ya no está en DB.
      this.projects.set([]);
      return true;
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
      const linkCategories = link.categories == null ? [] : Array.isArray(link.categories) ? link.categories : [link.categories];
      for (const category of linkCategories) {
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
    return true;
  }

  /** Última carga pública falló (seed visible ≠ datos reales). Panel admin. */
  readonly loadState = this.loadFailed.asReadonly();

  /** Carga TODOS los proyectos para el panel admin (RLS permite todo a rol admin). */
  async loadAll(): Promise<void> {
    await this.supabase.clientPromise;
    const client = this.supabase.client;

    const { data: rows, error } = await client
      .from('projects')
      .select('id, title, slug, description, price_min_wages, status, featured, sort_order')
      .order('sort_order');

    if (error) {
      console.warn('[projects/admin] sin datos:', error.message);
      return;
    }
    if (!rows || rows.length === 0) {
      this.adminProjectsSignal.set([]);
      return;
    }

    const { data: links } = await client.from('project_categories').select('project_id, category_id');
    const { data: images } = await client
      .from('project_images')
      .select('id, project_id, storage_path, is_cover, sort_order')
      .order('sort_order');

    const categoryIdsByProject = new Map<string, string[]>();
    for (const link of (links ?? []) as { project_id: string; category_id: string }[]) {
      const list = categoryIdsByProject.get(link.project_id) ?? [];
      list.push(link.category_id);
      categoryIdsByProject.set(link.project_id, list);
    }

    const imagesByProject = new Map<string, AdminProjectImage[]>();
    for (const image of (images ?? []) as {
      id: string;
      project_id: string;
      storage_path: string;
      is_cover: boolean;
      sort_order: number;
    }[]) {
      const list = imagesByProject.get(image.project_id) ?? [];
      list.push({
        id: image.id,
        storagePath: image.storage_path,
        url: this.supabase.resolvePublicUrl('project-images', image.storage_path),
        isCover: image.is_cover,
        sortOrder: image.sort_order,
      });
      imagesByProject.set(image.project_id, list);
    }

    this.adminProjectsSignal.set(
      (rows as ProjectRow[]).map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        priceMinWages: row.price_min_wages != null ? Number(row.price_min_wages) : null,
        status: row.status,
        featured: row.featured,
        sortOrder: row.sort_order,
        categoryIds: categoryIdsByProject.get(row.id) ?? [],
        images: imagesByProject.get(row.id) ?? [],
      })),
    );
  }

  /** Carga las categorías; si la tabla no existe, respaldo con las 4 del plan. */
  async loadCategories(): Promise<void> {
    await this.supabase.clientPromise;
    const { data, error } = await this.supabase.client
      .from('categories')
      .select('id, name, slug, sort_order')
      .order('sort_order');

    if (error) {
      // Tabla inexistente (schema.sql sin aplicar) o sin credenciales.
      console.warn('[projects] categorías: respaldo estático:', error.message);
      this.categoriesSignal.set(
        PROJECT_CATEGORIES.map((name, index) => ({
          id: slugify(name),
          name,
          slug: slugify(name),
          sortOrder: index + 1,
        })),
      );
      return;
    }
    if (!data || data.length === 0) {
      this.categoriesSignal.set([]);
      return;
    }

    this.categoriesSignal.set(
      (data as { id: string; name: string; slug: string; sort_order: number }[]).map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        sortOrder: row.sort_order,
      })),
    );
  }

  /**
   * Guarda el proyecto de forma ATÓMICA vía el RPC `admin_save_project`
   * (migración 20260917000004): una sola transacción Postgres hace upsert del
   * proyecto, sincroniza imágenes (insert/update/delete según el diff) y
   * reemplaza categorías. Si cualquier paso falla, TODO se revierte.
   *
   * Devuelve el id definitivo y los paths de storage que quedaron huérfanos
   * (filas borradas en la transacción) para que el cliente elimine esos
   * objetos del bucket DESPUÉS de que el guardado commiteó.
   *
   * `projectId` null = crear con id generado en el servidor.
   */
  async saveProjectAtomic(
    projectId: string | null,
    input: ProjectInput,
    categoryIds: string[],
    imageRows: { id?: string; storagePath: string; isCover: boolean; sortOrder: number }[],
  ): Promise<{ projectId: string; orphanPaths: string[] }> {
    await this.supabase.clientPromise;
    const { data, error } = await this.supabase.client.rpc('admin_save_project', {
      p_project_id: projectId,
      p_title: input.title,
      p_slug: input.slug,
      p_description: input.description,
      p_price_min_wages: input.priceMinWages,
      p_status: input.status,
      p_featured: input.featured,
      p_sort_order: input.sortOrder,
      p_category_ids: categoryIds,
      p_image_rows: JSON.stringify(
        imageRows.map((row) => ({
          id: row.id ?? null,
          storage_path: row.storagePath,
          is_cover: row.isCover,
          sort_order: row.sortOrder,
        })),
      ),
    });
    if (error) throw mapProjectWriteError(error as DbError);

    const result = (data as { project_id: string; orphan_storage_paths: string[] }[])[0];
    if (!result) {
      throw new Error('El servidor no devolvió el proyecto guardado.');
    }
    return { projectId: result.project_id, orphanPaths: result.orphan_storage_paths ?? [] };
  }

  /**
   * Elimina un proyecto: PRIMERO las filas (cascade a project_images y
   * project_categories) y DESPUÉS los assets (diagnóstico #8).
   * Orden inverso al anterior: si el delete de DB falla, no se toca la media;
   * si la limpieza falla después, el proyecto ya no existe y el asset queda
   * huérfano pero inaccesible (limpieza cosmética, no inconsistencia).
   * Las referencias se leen de la DB en el momento, no de la señal (estado).
   */
  async deleteProject(id: string): Promise<void> {
    await this.supabase.clientPromise;
    const { data: images, error: fetchError } = await this.supabase.client
      .from('project_images')
      .select('storage_path')
      .eq('project_id', id);
    if (fetchError) throw new Error(fetchError.message);
    const references = ((images ?? []) as { storage_path: string }[])
      .map((row) => row.storage_path)
      .filter(Boolean);

    const { error } = await this.supabase.client.from('projects').delete().eq('id', id);
    if (error) throw new Error(error.message);

    await this.removeProjectImages(references);
  }

  /**
   * Sube SOLO el archivo a Cloudinary; la fila en `project_images` la crea el
   * RPC `admin_save_project` dentro de la transacción. Así se cierra la ventana
   * "archivo subido sin fila en DB": si el RPC falla, el caller compensa
   * borrando el asset recién subido.
   *
   * Devuelve la referencia a persistir en `project_images.storage_path`: la
   * `secure_url` de Cloudinary, o la ruta del bucket legacy si Cloudinary no
   * está disponible (compatibilidad de lectura en ambos casos).
   */
  async uploadProjectImageFile(projectId: string, file: File): Promise<string> {
    const media = await this.media.uploadImage(file, 'projects', projectId);
    return media.reference;
  }

  /**
   * Elimina assets de proyectos (limpieza de huérfanos y compensación).
   * `CloudinaryService` decide por asset si va a `image/destroy` o al bucket
   * legacy, y nunca propaga el fallo.
   */
  async removeProjectImages(references: readonly string[]): Promise<void> {
    await this.media.deleteImages(references, 'projects');
  }

  /** Busca un proyecto por id entre TODOS (incluye borradores, para el panel). */
  byId(id: string): AdminProject | undefined {
    return this.adminProjectsSignal().find((item) => item.id === id);
  }
}