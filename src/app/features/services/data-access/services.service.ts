import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '../../../core/supabase.service';
import type { Service } from './service.model';

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

@Injectable({ providedIn: 'root' })
export class ServicesService {
  private readonly supabase = inject(SupabaseService);

  private readonly services = signal<Service[]>(SEED_SERVICES);

  /** Servicios publicados, en el orden editorial del plan (1.3). */
  readonly published = computed(() =>
    this.services()
      .filter((service) => service.status === 'published')
      .sort((a, b) => a.sortOrder - b.sortOrder),
  );

  constructor() {
    void this.load();
  }

  /** Carga los servicios desde Supabase; si falla, mantiene el seed. */
  async load(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('services')
      .select('id, name, slug, description, photo_path, icon_name, status, sort_order');

    if (error) {
      console.warn('[services] usando seed estático:', error.message);
      return;
    }
    if (!data || data.length === 0) {
      console.info('[services] tabla vacía: usando seed estático.');
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
}