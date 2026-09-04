import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '../../../core/supabase.service';
import type { AdminService, Service, ServiceInput } from './service.model';

/**
 * Catálogo de servicios (tabla `services` del plan, sección 3.3).
 *
 * Al iniciar intenta cargar desde Supabase (RLS ya filtra `status =
 * 'published'`). Si la tabla no existe todavía o está vacía, mantiene el seed
 * con los 6 servicios del maquetado (plan 1.3).
 */
const SEED_SERVICES: Service[] = [
  {
    id: 's01',
    name: 'Proyectos de Infraestructura',
    slug: 'proyectos-de-infraestructura',
    description:
      'Desarrollamos puentes, obras civiles y grandes estructuras que conectan comunidades y fomentan el progreso.',
    photoUrl:
      'https://images.unsplash.com/photo-1504307651254-35680f583dfb?auto=format&fit=crop&w=1200&q=85',
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

  private readonly services = signal<Service[]>(SEED_SERVICES);

  /** Todos los servicios visto por el admin (incluye borradores). */
  private readonly adminServicesSignal = signal<AdminService[]>([]);

  readonly adminServices = this.adminServicesSignal.asReadonly();

  /** Servicios publicados, en el orden editorial del plan (1.3). */
  readonly published = computed(() =>
    this.services()
      .filter((service) => service.status === 'published')
      .sort((a, b) => a.sortOrder - b.sortOrder),
  );

  constructor() {
    void this.load();
  }

  /** Recarga lo que consume el panel admin y el sitio público. */
  async refreshAll(): Promise<void> {
    await Promise.all([this.load(), this.loadAll()]);
  }

  /** Carga los servicios desde Supabase; si falla, mantiene el seed. */
  async load(): Promise<void> {
    await this.supabase.clientPromise;
    const { data, error } = await this.supabase.client
      .from('services')
      .select('id, name, slug, description, photo_path, icon_name, status, sort_order');

    if (error) {
      // Tabla inexistente (schema.sql sin aplicar) o sin credenciales: seed estático.
      console.warn('[services] usando seed estático:', error.message);
      return;
    }
    if (!data || data.length === 0) {
      // La tabla existe pero está vacía: se muestra la realidad.
      this.services.set([]);
      return;
    }

    this.services.set(
      (data as ServiceRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        photoUrl: this.supabase.resolvePublicUrl('service-images', row.photo_path),
        iconName: row.icon_name,
        status: row.status,
        sortOrder: row.sort_order,
      })),
    );
  }

  /** Carga TODOS los servicios para el panel admin (RLS permite todo a rol admin). */
  async loadAll(): Promise<void> {
    await this.supabase.clientPromise;
    const { data, error } = await this.supabase.client
      .from('services')
      .select('id, name, slug, description, photo_path, icon_name, status, sort_order')
      .order('sort_order');

    if (error) {
      console.warn('[services/admin] sin datos:', error.message);
      return;
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
    icon_name: string | null;
    status: string;
    sort_order: number;
  } {
    return {
      name: input.name,
      slug: input.slug,
      description: input.description,
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

  /** Elimina un servicio y su foto de storage (si existe). */
  async deleteService(id: string): Promise<void> {
    await this.supabase.clientPromise;
    const service = this.adminServicesSignal().find((item) => item.id === id);
    if (service?.photoPath) {
      await this.supabase.client.storage.from('service-images').remove([service.photoPath]);
    }
    const { error } = await this.supabase.client.from('services').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  /** Sube (o reemplaza) la foto de un servicio al bucket service-images. */
  async uploadServicePhoto(serviceId: string, file: File): Promise<void> {
    await this.supabase.clientPromise;
    const current = this.adminServicesSignal().find((item) => item.id === serviceId);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `services/${serviceId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await this.supabase.client.storage
      .from('service-images')
      .upload(path, file, { contentType: file.type || 'image/jpeg' });
    if (uploadError) throw new Error(uploadError.message);

    const { error } = await this.supabase.client
      .from('services')
      .update({ photo_path: path })
      .eq('id', serviceId);
    if (error) throw new Error(error.message);

    // Limpia la foto anterior si existía.
    if (current?.photoPath) {
      await this.supabase.client.storage.from('service-images').remove([current.photoPath]);
    }
  }

  /** Elimina la foto del servicio (storage + columna photo_path). */
  async removeServicePhoto(serviceId: string): Promise<void> {
    await this.supabase.clientPromise;
    const service = this.adminServicesSignal().find((item) => item.id === serviceId);
    if (!service?.photoPath) return;
    await this.supabase.client.storage.from('service-images').remove([service.photoPath]);
    const { error } = await this.supabase.client.from('services').update({ photo_path: null }).eq('id', serviceId);
    if (error) throw new Error(error.message);
  }

  /** Busca un servicio por id entre TODOS (incluye borradores, para el panel). */
  byId(id: string): AdminService | undefined {
    return this.adminServicesSignal().find((item) => item.id === id);
  }
}