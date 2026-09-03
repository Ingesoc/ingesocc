import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '../../../core/supabase.service';
import type { ContentBlock } from './content-block.model';

/**
 * Contenido editable del sitio (tabla `content_blocks` del plan, sección 1.4).
 *
 * Al iniciar intenta cargar las filas reales desde Supabase. Si la tabla no
 * existe todavía (schema.sql sin aplicar) o devuelve vacío, mantiene el seed
 * estático como respaldo para que el sitio nunca quede roto.
 */
const SEED_CONTENT_BLOCKS: ContentBlock[] = [
  // ---- global (header/footer de todas las páginas) ----
  { page: 'global', sectionKey: 'cta_label', type: 'text', valueText: 'Solicitar Cotización', valueNumber: null, valueImagePath: null },
  { page: 'global', sectionKey: 'social_linkedin', type: 'text', valueText: 'https://www.linkedin.com/company/ingesocc', valueNumber: null, valueImagePath: null },
  { page: 'global', sectionKey: 'social_facebook', type: 'text', valueText: 'https://www.facebook.com/ingesocc', valueNumber: null, valueImagePath: null },
  { page: 'global', sectionKey: 'social_instagram', type: 'text', valueText: 'https://www.instagram.com/ingesocc', valueNumber: null, valueImagePath: null },

  // ---- home ----
  { page: 'home', sectionKey: 'hero.title', type: 'text', valueText: 'Construimos espacios que trascienden.', valueNumber: null, valueImagePath: null },
  { page: 'home', sectionKey: 'hero.subtitle', type: 'text', valueText: 'Diseñamos y ejecutamos proyectos con precisión, propósito y una visión que permanece.', valueNumber: null, valueImagePath: null },
  { page: 'home', sectionKey: 'hero.cta_label', type: 'text', valueText: 'Hablemos', valueNumber: null, valueImagePath: null },
  { page: 'home', sectionKey: 'hero.background_image', type: 'image', valueText: null, valueNumber: null, valueImagePath: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1600&q=80' },
  { page: 'home', sectionKey: 'stats.years_experience', type: 'number', valueText: null, valueNumber: 15, valueImagePath: null },
  { page: 'home', sectionKey: 'stats.projects_executed', type: 'number', valueText: null, valueNumber: 120, valueImagePath: null },
  { page: 'home', sectionKey: 'stats.sectors_served', type: 'number', valueText: null, valueNumber: 8, valueImagePath: null },
  { page: 'home', sectionKey: 'capacidad.title', type: 'text', valueText: 'Nuestra Capacidad a su Servicio', valueNumber: null, valueImagePath: null },
  { page: 'home', sectionKey: 'capacidad.description', type: 'text', valueText: 'Ejecutamos proyectos de infraestructura, industria y salud con equipo técnico propio, taller de fabricación metálica y procesos de calidad.', valueNumber: null, valueImagePath: null },
  { page: 'home', sectionKey: 'capacidad.card1.title', type: 'text', valueText: 'Experiencia Técnica', valueNumber: null, valueImagePath: null },
  { page: 'home', sectionKey: 'capacidad.card1.description', type: 'text', valueText: 'Más de 15 años respaldan cada obra: personal calificado y procesos probados en campo.', valueNumber: null, valueImagePath: null },
  { page: 'home', sectionKey: 'capacidad.card2.title', type: 'text', valueText: 'Fabricación Metálica', valueNumber: null, valueImagePath: null },
  { page: 'home', sectionKey: 'capacidad.card2.description', type: 'text', valueText: 'Taller propio para estructuras y componentes metálicos fabricados a medida con control de calidad.', valueNumber: null, valueImagePath: null },
  { page: 'home', sectionKey: 'capacidad.card3.title', type: 'text', valueText: 'Ingeniería de Precisión', valueNumber: null, valueImagePath: null },
  { page: 'home', sectionKey: 'capacidad.card3.description', type: 'text', valueText: 'Diseño y cálculo estructural bajo estándares exigentes para obras seguras, eficientes y duraderas.', valueNumber: null, valueImagePath: null },
  { page: 'home', sectionKey: 'cta.title', type: 'text', valueText: '¿Tiene un proyecto en mente?', valueNumber: null, valueImagePath: null },

  // ---- about (Quiénes Somos) ----
  { page: 'about', sectionKey: 'hero.title', type: 'text', valueText: 'Quiénes Somos', valueNumber: null, valueImagePath: null },
  { page: 'about', sectionKey: 'hero.subtitle', type: 'text', valueText: 'Nuestra Trayectoria y Compromiso', valueNumber: null, valueImagePath: null },
  { page: 'about', sectionKey: 'historia.image', type: 'image', valueText: null, valueNumber: null, valueImagePath: 'https://images.unsplash.com/photo-1590579491624-f98f36d4c763?auto=format&fit=crop&w=1200&q=85' },
  { page: 'about', sectionKey: 'historia.text', type: 'richtext', valueText: 'Somos un equipo de arquitectos, ingenieros y constructores que cree en hacer las cosas bien: desde la primera línea hasta la última entrega. Unimos conocimiento técnico, sensibilidad arquitectónica y ejecución rigurosa para crear obras que mejoran la vida de quienes las habitan.', valueNumber: null, valueImagePath: null },
  { page: 'about', sectionKey: 'timeline.item1.title', type: 'text', valueText: 'Fundación de Ingesocc SAS', valueNumber: null, valueImagePath: null },
  { page: 'about', sectionKey: 'timeline.item1.year', type: 'number', valueText: null, valueNumber: 2005, valueImagePath: null },
  { page: 'about', sectionKey: 'timeline.item2.title', type: 'text', valueText: 'Primer Gran Proyecto Industrial', valueNumber: null, valueImagePath: null },
  { page: 'about', sectionKey: 'timeline.item2.year', type: 'number', valueText: null, valueNumber: 2010, valueImagePath: null },
  { page: 'about', sectionKey: 'timeline.item3.title', type: 'text', valueText: 'Expansión de Capacidades', valueNumber: null, valueImagePath: null },
  { page: 'about', sectionKey: 'timeline.item3.year', type: 'number', valueText: null, valueNumber: 2015, valueImagePath: null },
  { page: 'about', sectionKey: 'timeline.item4.title', type: 'text', valueText: 'Consolidación como Líder del Sector', valueNumber: null, valueImagePath: null },
  { page: 'about', sectionKey: 'timeline.item4.year', type: 'number', valueText: null, valueNumber: 2022, valueImagePath: null },
  { page: 'about', sectionKey: 'mision.text', type: 'richtext', valueText: 'Convertir ideas en espacios de valor, uniendo conocimiento técnico, sensibilidad arquitectónica y ejecución rigurosa para crear obras que mejoran la vida de quienes las habitan.', valueNumber: null, valueImagePath: null },
  { page: 'about', sectionKey: 'vision.text', type: 'richtext', valueText: 'Ser reconocidos en Colombia como referentes en obras de infraestructura, industria y salud, destacando por la calidad, la seguridad y el compromiso con cada cliente.', valueNumber: null, valueImagePath: null },
  { page: 'about', sectionKey: 'valores.text', type: 'richtext', valueText: 'Compromiso, precisión, seguridad y transparencia en cada proyecto, desde la primera línea hasta la última entrega.', valueNumber: null, valueImagePath: null },
  // Equipo: nombres del maquetado, NO son el equipo real (plan sección 1.7 — reemplazar en Fase 9)
  { page: 'about', sectionKey: 'equipo.member1.name', type: 'text', valueText: 'Juan Pérez', valueNumber: null, valueImagePath: null },
  { page: 'about', sectionKey: 'equipo.member1.role', type: 'text', valueText: 'Director de Proyectos', valueNumber: null, valueImagePath: null },
  { page: 'about', sectionKey: 'equipo.member1.photo', type: 'image', valueText: null, valueNumber: null, valueImagePath: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80' },
  { page: 'about', sectionKey: 'equipo.member2.name', type: 'text', valueText: 'María García', valueNumber: null, valueImagePath: null },
  { page: 'about', sectionKey: 'equipo.member2.role', type: 'text', valueText: 'Gerente de Obra', valueNumber: null, valueImagePath: null },
  { page: 'about', sectionKey: 'equipo.member2.photo', type: 'image', valueText: null, valueNumber: null, valueImagePath: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80' },
  { page: 'about', sectionKey: 'equipo.member3.name', type: 'text', valueText: 'Carlos Rodríguez', valueNumber: null, valueImagePath: null },
  { page: 'about', sectionKey: 'equipo.member3.role', type: 'text', valueText: 'Ingeniero Estructural', valueNumber: null, valueImagePath: null },
  { page: 'about', sectionKey: 'equipo.member3.photo', type: 'image', valueText: null, valueNumber: null, valueImagePath: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80' },
  { page: 'about', sectionKey: 'equipo.member4.name', type: 'text', valueText: 'Ana Martínez', valueNumber: null, valueImagePath: null },
  { page: 'about', sectionKey: 'equipo.member4.role', type: 'text', valueText: 'Arquitecta Líder', valueNumber: null, valueImagePath: null },
  { page: 'about', sectionKey: 'equipo.member4.photo', type: 'image', valueText: null, valueNumber: null, valueImagePath: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80' },

  // ---- contact ----
  // Datos de ejemplo del diseño actual — reemplazar por los reales vía content_blocks (plan 1.6/1.7)
  { page: 'contact', sectionKey: 'title', type: 'text', valueText: 'Contacto', valueNumber: null, valueImagePath: null },
  { page: 'contact', sectionKey: 'subtitle', type: 'text', valueText: 'Cuéntenos sobre su proyecto y le responderemos a la brevedad.', valueNumber: null, valueImagePath: null },
  { page: 'contact', sectionKey: 'phone', type: 'text', valueText: '+57 (604) 444 44 44', valueNumber: null, valueImagePath: null },
  { page: 'contact', sectionKey: 'email', type: 'text', valueText: 'info@ingesocc.com', valueNumber: null, valueImagePath: null },
  { page: 'contact', sectionKey: 'address', type: 'text', valueText: 'Medellín, Colombia', valueNumber: null, valueImagePath: null },
  { page: 'contact', sectionKey: 'privacy_note', type: 'text', valueText: 'Tus datos serán tratados con confidencialidad.', valueNumber: null, valueImagePath: null },
];

interface ContentBlockRow {
  page: string;
  section_key: string;
  type: ContentBlock['type'];
  value_text: string | null;
  value_number: number | null;
  value_image_path: string | null;
}

@Injectable({ providedIn: 'root' })
export class ContentBlocksService {
  private readonly supabase = inject(SupabaseService);

  private readonly blocks = signal<ContentBlock[]>(SEED_CONTENT_BLOCKS);

  /** Índice page -> sectionKey -> bloque, para consultas reactivas por página. */
  readonly byPage = computed(() => {
    const index: Record<string, Record<string, ContentBlock>> = {};
    for (const block of this.blocks()) {
      (index[block.page] ??= {})[block.sectionKey] = block;
    }
    return index;
  });

  constructor() {
    void this.load();
  }

  /** Carga las filas reales de `content_blocks`; si falla o está vacío, mantiene el seed. */
  async load(): Promise<void> {
    await this.supabase.clientPromise;
    const { data, error } = await this.supabase.client
      .from('content_blocks')
      .select('page, section_key, type, value_text, value_number, value_image_path');

    if (error) {
      // Tabla inexistente (schema.sql sin aplicar) o sin credenciales: seed estático.
      console.warn('[content_blocks] usando seed estático:', error.message);
      return;
    }
    if (!data || data.length === 0) {
      // Tabla existente pero vacía: sin bloques reales no hay contenido DB.
      this.blocks.set([]);
      return;
    }

    this.blocks.set(
      (data as ContentBlockRow[]).map((row) => ({
        page: row.page,
        sectionKey: row.section_key,
        type: row.type,
        valueText: row.value_text,
        valueNumber: row.value_number != null ? Number(row.value_number) : null,
        valueImagePath:
          row.type === 'image'
            ? this.supabase.resolvePublicUrl('content-images', row.value_image_path)
            : row.value_image_path,
      })),
    );
  }

  /** Bloque por (page, sectionKey). */
  block(page: string, sectionKey: string): ContentBlock | undefined {
    return this.byPage()[page]?.[sectionKey];
  }

  /** Valor de texto con respaldo. */
  text(page: string, sectionKey: string, fallback = ''): string {
    return this.block(page, sectionKey)?.valueText ?? fallback;
  }

  /** Valor numérico con respaldo. */
  number(page: string, sectionKey: string, fallback = 0): number {
    const value = this.block(page, sectionKey)?.valueNumber;
    return value == null ? fallback : Number(value);
  }

  /** Ruta/URL de imagen con respaldo. */
  image(page: string, sectionKey: string, fallback = ''): string {
    return this.block(page, sectionKey)?.valueImagePath ?? fallback;
  }

  /**
   * Persiste un cambio de bloque en `content_blocks` (plan 7.3/7.4).
   *
   * El fallback en memoria (cambio local sin tocar la DB) queda reservado
   * EXCLUSIVAMENTE para el caso "la tabla todavía no existe en Supabase"
   * (código 42P01/relación inexistente) o credenciales no configuradas.
   * Cualquier otro error real (RLS, red, timeout) se re-lanza para que la UI
   * lo muestre: antes se tragaba todo error y el cambio se perdía al recargar.
   */
  async updateBlock(
    page: string,
    sectionKey: string,
    changes: { valueText?: string | null; valueNumber?: number | null; valueImagePath?: string | null },
  ): Promise<void> {
    await this.supabase.clientPromise;
    const type: ContentBlock['type'] =
      changes.valueImagePath != null ? 'image' : changes.valueNumber != null ? 'number' : 'text';
    const existing = this.block(page, sectionKey);

    if (existing) {
      const { error } = await this.supabase.client
        .from('content_blocks')
        .update(changes)
        .eq('page', page)
        .eq('section_key', sectionKey);
      if (!error) {
        // Sin sobrescribir `type`: se conserva el del bloque existente (richtext, number, image…).
        this.applyLocalUpdate(page, sectionKey, changes);
        return;
      }
      this.handlePersistError(page, sectionKey, changes, error.message, error.code);
      return;
    }

    const { error } = await this.supabase.client.from('content_blocks').insert({
      page,
      section_key: sectionKey,
      type,
      ...changes,
    });
    if (!error) {
      await this.load();
      return;
    }
    this.handlePersistError(page, sectionKey, { ...changes, type }, error.message, error.code);
  }

  /**
   * Decide entre fallback local (tabla inexistente / sin credenciales) y
   * re-lanzar el error real para que el editor lo vea.
   */
  private handlePersistError(
    page: string,
    sectionKey: string,
    changes: Partial<ContentBlock>,
    message: string,
    code?: string,
  ): void {
    const tableMissing =
      code === '42P01' ||
      code === 'PGRST205' ||
      /relation .*does not exist|does not exist/i.test(message ?? '');
    const notConfigured = !this.supabase.ready;

    if (tableMissing || notConfigured) {
      console.warn('[content_blocks] cambio aplicado solo en memoria:', message);
      this.applyLocalUpdate(page, sectionKey, changes);
      return;
    }

    throw new Error(message || 'No se pudo guardar el contenido.');
  }

  private applyLocalUpdate(
    page: string,
    sectionKey: string,
    changes: Partial<ContentBlock>,
  ): void {
    const localChanges: Partial<ContentBlock> = { ...changes };
    // En memoria se guarda la URL pública (igual que load()): el cambio de
    // imagen llega como storage_path y sin resolver el <img> quedaría roto
    // hasta recargar.
    if (localChanges.valueImagePath) {
      localChanges.valueImagePath = this.supabase.resolvePublicUrl(
        'content-images',
        localChanges.valueImagePath,
      );
    }
    this.blocks.update((blocks) => {
      const index = blocks.findIndex((b) => b.page === page && b.sectionKey === sectionKey);
      if (index >= 0) {
        const updated = [...blocks];
        updated[index] = { ...updated[index], ...localChanges };
        return updated;
      }
      return [
        ...blocks,
        {
          page,
          sectionKey,
          type: (localChanges.type as ContentBlock['type']) ?? 'text',
          valueText: localChanges.valueText ?? null,
          valueNumber: localChanges.valueNumber ?? null,
          valueImagePath: localChanges.valueImagePath ?? null,
        },
      ];
    });
  }
}