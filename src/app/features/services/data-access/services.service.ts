import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '../../../core/supabase.service';
import { CloudinaryService } from '../../../core/cloudinary.service';
import type { AdminService, Service, ServiceFaqItem, ServiceInput } from './service.model';

/**
 * Catálogo de servicios (tabla `services` del plan, sección 3.3).
 *
 * Al iniciar intenta cargar desde Supabase (RLS ya filtra `status =
 * 'published'`). Si la tabla no existe todavía o está vacía, mantiene el seed
 * con los 6 servicios del maquetado (plan 1.3). Los entregables por línea son
 * copy del diseño [PENDIENTE: validar con el cliente].
 */
const SEED_SERVICES: Service[] = [
  {
    id: 's01',
    name: 'Proyectos de Infraestructura',
    slug: 'proyectos-de-infraestructura',
    description:
      'Desarrollamos puentes, obras civiles y grandes estructuras que conectan comunidades y fomentan el progreso.',
    scope: null,
    deliverables: [
      'Estudios y diseños preliminares',
      'Gerencia de obra e interventoría',
      'Construcción de obras civiles',
      'Entrega y puesta en servicio',
    ],
    faq: null,
    photoUrl:
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=85',
    iconName: null,
    status: 'published',
    sortOrder: 1,
  },
  {
    id: 's02',
    name: 'Proyectos Hospitalarios',
    slug: 'proyectos-hospitalarios',
    description:
      'Construcción especializada de centros de salud, cumpliendo con los más altos estándares de calidad y funcionalidad.',
    scope: null,
    deliverables: [
      'Adecuación y montaje de áreas asistenciales',
      'Instalaciones y redes hospitalarias',
      'Acabados y control de bioseguridad',
      'Documentación y puesta en marcha',
    ],
    faq: null,
    photoUrl:
      'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1200&q=85',
    iconName: null,
    status: 'published',
    sortOrder: 2,
  },
  {
    id: 's03',
    name: 'Proyectos Industriales',
    slug: 'proyectos-industriales',
    description:
      'Fabricamos e instalamos naves industriales, plantas de producción y bodegas optimizadas para la eficiencia operativa.',
    scope: null,
    deliverables: [
      'Obra civil para nave industrial',
      'Estructuras metálicas y cubiertas',
      'Instalaciones técnicas industriales',
      'Montaje y puesta en marcha',
    ],
    faq: null,
    photoUrl: null,
    iconName: 'factory',
    status: 'published',
    sortOrder: 3,
  },
  {
    id: 's04',
    name: 'Consultoría y Diseño',
    slug: 'consultoria-y-diseno',
    description:
      'Acompañamos desde la conceptualización, ofreciendo diseños innovadores y viables que optimizan recursos y garantizan resultados.',
    scope: null,
    deliverables: [
      'Levantamientos y diagnóstico',
      'Diseño arquitectónico y estructural',
      'Documentos técnicos y memorias',
      'Acompañamiento en licencias',
    ],
    faq: null,
    photoUrl: null,
    iconName: 'ruler',
    status: 'published',
    sortOrder: 4,
  },
  {
    id: 's05',
    name: 'Fabricación Metálica',
    slug: 'fabricacion-metalica',
    description:
      'Especialistas en la fabricación a medida de estructuras metálicas de alta precisión para cualquier tipo de proyecto.',
    scope: null,
    deliverables: [
      'Diseño y despiece técnico',
      'Fabricación en taller',
      'Recubrimiento anticorrosivo',
      'Montaje en sitio',
    ],
    faq: null,
    photoUrl: null,
    iconName: 'frame',
    status: 'published',
    sortOrder: 5,
  },
  {
    id: 's06',
    name: 'Proyectos de Vivienda',
    slug: 'proyectos-de-vivienda',
    description:
      'Ejecutamos proyectos de vivienda unifamiliar y multifamiliar con diseños modernos y estructuras duraderas.',
    scope: null,
    deliverables: [
      'Diseño y legalización del proyecto',
      'Construcción de vivienda',
      'Urbanismo y zonas comunes',
      'Entrega de obra y acompañamiento',
    ],
    faq: null,
    photoUrl: null,
    iconName: 'home',
    status: 'published',
    sortOrder: 6,
  },
];

interface ServiceRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  scope: string | null;
  deliverables: string[] | null;
  faq: ServiceFaqItem[] | null;
  photo_path: string | null;
  icon_name: string | null;
  status: Service['status'];
  sort_order: number;
}

/** Traduce el error de unicidad de slug a un mensaje claro para el admin (plan 1.3). */
function mapServiceWriteError(error: { message: string; code?: string }): Error {
  if (error.code === '23505') {
    return new Error('Ya existe un servicio con ese slug (URL). Elígelo diferente.');
  }
  return new Error(error.message);
}

@Injectable({ providedIn: 'root' })
export class ServicesService {
  private readonly supabase = inject(SupabaseService);
  /** Único punto de entrada a la media del sitio (Cloudinary). */
  private readonly media = inject(CloudinaryService);

  private readonly services = signal<Service[]>(SEED_SERVICES);

  /** Última carga pública falló (seed visible ≠ datos reales). */
  private readonly loadFailed = signal(false);

  /** Todos los servicios visto por el admin (incluye borradores). */
  private readonly adminServicesSignal = signal<AdminService[]>([]);

  readonly adminServices = this.adminServicesSignal.asReadonly();

  /** Servicios publicados, en el orden editorial del plan (1.3). */
  readonly published = computed(() =>
    this.services()
      .filter((service) => service.status === 'published')
      .sort((a, b) => a.sortOrder - b.sortOrder),
  );

  /** Servicio publicado por slug para la vista de detalle (ruta /servicios/:slug). */
  bySlug(slug: string): Service | undefined {
    return this.published().find((service) => service.slug === slug);
  }

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

  /**
   * Carga los servicios desde Supabase; si falla, mantiene el seed (sitio
   * público) y devuelve false (el admin muestra error, plan §2).
   */
  async load(): Promise<boolean> {
    await this.supabase.clientPromise;
    const { data, error } = await this.supabase.client
      .from('services')
      .select('id, name, slug, description, scope, deliverables, faq, photo_path, icon_name, status, sort_order');

    if (error) {
      // Tabla inexistente (schema.sql sin aplicar) o sin credenciales: seed estático.
      console.warn('[services] usando seed estático:', error.message);
      this.loadFailed.set(true);
      return false;
    }
    this.loadFailed.set(false);
    if (!data || data.length === 0) {
      // La tabla existe pero está vacía: se muestra la realidad.
      this.services.set([]);
      return true;
    }

    this.services.set(
      (data as ServiceRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        scope: row.scope,
        deliverables: row.deliverables,
        faq: row.faq,
        photoUrl: this.supabase.resolvePublicUrl('service-images', row.photo_path),
        iconName: row.icon_name,
        status: row.status,
        sortOrder: row.sort_order,
      })),
    );
    return true;
  }

  /** Última carga pública falló (seed visible ≠ datos reales). Panel admin. */
  readonly loadState = this.loadFailed.asReadonly();

  /** Carga TODOS los servicios para el panel admin (RLS permite todo a rol admin). */
  async loadAll(): Promise<void> {
    await this.supabase.clientPromise;
    const { data, error } = await this.supabase.client
      .from('services')
      .select('id, name, slug, description, scope, deliverables, faq, photo_path, icon_name, status, sort_order')
      .order('sort_order');

    if (error) {
      // Relanza para que el panel distinga "sin datos" de "fallo de carga".
      console.warn('[services/admin] error de carga:', error.message);
      throw new Error(error.message);
    }
    if (!data || data.length === 0) {
      this.adminServicesSignal.set([]);
      return;
    }

    this.adminServicesSignal.set(
      (data as ServiceRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        scope: row.scope,
        deliverables: row.deliverables,
        faq: row.faq,
        photoPath: row.photo_path,
        photoUrl: this.supabase.resolvePublicUrl('service-images', row.photo_path),
        iconName: row.icon_name,
        status: row.status,
        sortOrder: row.sort_order,
      })),
    );
  }

  /** Traduce ServiceInput (camelCase) a las columnas reales de `services`. */
  private toServiceRow(input: ServiceInput): {
    name: string;
    slug: string;
    description: string;
    scope: string | null;
    deliverables: string[];
    faq: ServiceFaqItem[];
    icon_name: string | null;
    status: string;
    sort_order: number;
  } {
    return {
      name: input.name,
      slug: input.slug,
      description: input.description,
      scope: input.scope,
      deliverables: input.deliverables,
      faq: input.faq,
      icon_name: input.iconName,
      status: input.status,
      sort_order: input.sortOrder,
    };
  }

  /** Crea un servicio y devuelve su id. */
  async createService(input: ServiceInput): Promise<string> {
    await this.supabase.clientPromise;
    const { data, error } = await this.supabase.client
      .from('services')
      .insert(this.toServiceRow(input))
      .select('id')
      .single();
    if (error) throw mapServiceWriteError(error);
    return (data as { id: string }).id;
  }

  /** Actualiza los datos básicos de un servicio. */
  async updateService(id: string, input: ServiceInput): Promise<void> {
    await this.supabase.clientPromise;
    const { error } = await this.supabase.client
      .from('services')
      .update(this.toServiceRow(input))
      .eq('id', id);
    if (error) throw mapServiceWriteError(error);
  }

  /**
   * Elimina un servicio y su foto (Cloudinary o bucket legacy).
   * Las filas van primero: si la foto no se puede borrar, el servicio ya no
   * existe y el asset queda huérfano pero inaccesible (limpieza cosmética).
   */
  async deleteService(id: string): Promise<void> {
    await this.supabase.clientPromise;
    const service = this.adminServicesSignal().find((item) => item.id === id);
    const { error } = await this.supabase.client.from('services').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await this.media.deleteImage(service?.photoPath, 'services');
  }

  /**
   * Sube (o reemplaza) la foto de un servicio a Cloudinary.
   *
   * `services.photo_path` conserva su nombre histórico pero ahora guarda la
   * `secure_url` de Cloudinary: no hace falta migrar el esquema porque la
   * columna ya es `text` y `resolvePublicUrl` devuelve las URLs absolutas tal
   * cual. Así conviven fotos viejas (bucket) y nuevas (CDN) sin cambios.
   *
   * Compensaciones: si el UPDATE de `photo_path` falla, se borra el asset recién
   * subido (no queda huérfano). Si el borrado de la foto anterior falla, no se
   * rompe la operación: se registra y sigue.
   */
  async uploadServicePhoto(serviceId: string, file: File): Promise<void> {
    const current = this.adminServicesSignal().find((item) => item.id === serviceId);
    const uploaded = await this.media.uploadImage(file, 'services', serviceId);

    const { error } = await this.supabase.client
      .from('services')
      .update({ photo_path: uploaded.reference })
      .eq('id', serviceId);

    if (error) {
      // La DB no apunta al asset nuevo: se deshace la subida.
      await this.media.deleteImage(uploaded.reference, 'services');
      throw new Error(error.message);
    }

    // Limpia la foto anterior (best-effort: la nueva ya está guardada).
    await this.media.deleteImage(current?.photoPath, 'services');
  }

  /** Elimina la foto del servicio (asset + columna photo_path). */
  async removeServicePhoto(serviceId: string): Promise<void> {
    const service = this.adminServicesSignal().find((item) => item.id === serviceId);
    if (!service?.photoPath) return;
    await this.media.deleteImage(service.photoPath, 'services');

    const { error } = await this.supabase.client
      .from('services')
      .update({ photo_path: null })
      .eq('id', serviceId);
    if (error) throw new Error(error.message);
  }

  /** Busca un servicio por id entre TODOS (incluye borradores, para el panel). */
  byId(id: string): AdminService | undefined {
    return this.adminServicesSignal().find((item) => item.id === id);
  }
}