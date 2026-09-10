import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { LucideImageUp, LucideLoaderCircle, LucideRefreshCw } from '@lucide/angular';
import { ContentBlocksService } from '../data-access/content-blocks.service';
import {
  CONTENT_PAGES,
  blockDescription,
  blockLabel,
  sectionGroupLabel,
} from '../data-access/content-blocks.catalog';
import type { ContentBlockType } from '../data-access/content-block.model';

/** Fila editable del CMS (una por bloque de contenido del sitio). */
interface BlockView {
  page: string;
  sectionKey: string;
  label: string;
  description: string;
  group: string;
  type: ContentBlockType;
  valueText: string | null;
  valueNumber: number | null;
  valueImagePath: string | null;
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  error: string;
}

/** Tamaño máximo de imagen aceptado en el CMS (5 MB). */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-content-cms-page',
  standalone: true,
  imports: [LucideLoaderCircle, LucideRefreshCw, LucideImageUp],
  templateUrl: './content-cms-page.component.html',
})
export class ContentCmsPageComponent implements OnInit {
  private readonly blocksService = inject(ContentBlocksService);

  readonly pages = CONTENT_PAGES;

  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly activePage = signal('home');

  /** Estado de conexión Supabase para el indicador del encabezado. */
  readonly connection = computed(() => {
    if (this.loading()) return 'checking' as const;
    return this.loadError() ? ('error' as const) : ('ok' as const);
  });

  private readonly views = signal<BlockView[]>([]);

  /** Bloques de la página activa (para el conteo del tab). */
  readonly countFor = computed(() => {
    const map = new Map<string, number>();
    for (const view of this.views()) {
      map.set(view.page, (map.get(view.page) ?? 0) + 1);
    }
    return (page: string) => map.get(page) ?? 0;
  });

  /** Bloques de la página activa agrupados por sección, en orden de aparición. */
  readonly groups = computed(() => {
    const groups: { label: string; blocks: BlockView[] }[] = [];
    for (const view of this.views()) {
      if (view.page !== this.activePage()) continue;
      const group = groups.find((g) => g.label === view.group);
      if (group) group.blocks.push(view);
      else groups.push({ label: view.group, blocks: [view] });
    }
    return groups;
  });

  readonly savingAny = computed(() => this.views().some((view) => view.saving));

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  /** Carga (o recarga) los bloques desde Supabase con estado de error visible. */
  async reload(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    try {
      const ok = await this.blocksService.load();
      if (!ok) {
        this.loadError.set(
          'No se pudo conectar con Supabase: se muestran los textos de ejemplo, no los datos reales.',
        );
      }
    } catch {
      this.loadError.set('No se pudo conectar con Supabase.');
    } finally {
      this.views.set(this.buildViews());
      this.loading.set(false);
    }
  }

  selectPage(page: string): void {
    this.activePage.set(page);
  }

  /** Guarda un bloque según su tipo y refleja el estado en la fila. */
  async save(view: BlockView): Promise<void> {
    view.saving = true;
    view.saved = false;
    view.error = '';
    this.patchView();

    try {
      const changes =
        view.type === 'number'
          ? { valueNumber: view.valueNumber }
          : view.type === 'image'
            ? { valueImagePath: view.valueImagePath }
            : { valueText: view.valueText };

      await this.blocksService.updateBlock(view.page, view.sectionKey, changes);
      view.saved = true;
      setTimeout(() => (view.saved = false), 2500);
    } catch (err) {
      view.error =
        err instanceof Error ? err.message : 'No se pudo guardar el bloque.';
    } finally {
      view.saving = false;
      this.patchView();
    }
  }

  /** Reemplaza una imagen: valida, sube a Storage y persiste la ruta. */
  async replaceImage(view: BlockView, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // permite volver a elegir el mismo archivo
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      view.error = 'El archivo debe ser una imagen (JPG, PNG o WebP).';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      view.error = 'La imagen supera el máximo de 5 MB.';
      return;
    }

    view.saving = true;
    view.error = '';
    try {
      const path = await this.blocksService.uploadContentImage(file);
      await this.blocksService.updateBlock(view.page, view.sectionKey, {
        valueImagePath: path,
      });
      view.valueImagePath = this.blocksService.image(view.page, view.sectionKey);
      view.dirty = false;
      view.saved = true;
      setTimeout(() => (view.saved = false), 2500);
    } catch (err) {
      view.error =
        err instanceof Error ? err.message : 'No se pudo subir la imagen.';
    } finally {
      view.saving = false;
    }
  }

  onText(view: BlockView, value: string): void {
    view.valueText = value;
    view.dirty = value !== (this.blocksService.block(view.page, view.sectionKey)?.valueText ?? '');
  }

  onNumber(view: BlockView, value: string): void {
    const parsed = value === '' ? null : Number(value);
    view.valueNumber = parsed != null && Number.isFinite(parsed) ? parsed : null;
    view.dirty =
      view.valueNumber !== (this.blocksService.block(view.page, view.sectionKey)?.valueNumber ?? null);
  }

  private buildViews(): BlockView[] {
    const byPage = this.blocksService.byPage();
    const views: BlockView[] = [];
    for (const page of this.pages.map((p) => p.key)) {
      const pageBlocks = byPage[page] ?? {};
      for (const sectionKey of Object.keys(pageBlocks).sort()) {
        const block = pageBlocks[sectionKey];
        views.push({
          page,
          sectionKey,
          label: blockLabel(page, sectionKey),
          description: blockDescription(page, sectionKey),
          group: sectionGroupLabel(sectionKey),
          type: block.type,
          valueText: block.valueText,
          valueNumber: block.valueNumber,
          valueImagePath: block.valueImagePath,
          dirty: false,
          saving: false,
          saved: false,
          error: '',
        });
      }
    }
    return views;
  }

  /** Re-renderiza las filas tras mutar el estado de guardado. */
  private patchView(): void {
    this.views.update((views) => [...views]);
  }
}
