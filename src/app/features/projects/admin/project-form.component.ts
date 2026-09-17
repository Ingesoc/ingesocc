import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import imageCompression from 'browser-image-compression';
import { LucideChevronLeft, LucideStar, LucideTrash2, LucideUpload } from '@lucide/angular';
import { ProjectsService } from '../data-access/projects.service';
import type { ProjectInput } from '../data-access/project.model';
import { slugify } from '../../../core/slugify';
import { ACCEPTED_IMAGE_TYPES_LABEL, isAcceptableImageFile } from '../../../core/image-utils';

/** Imagen del formulario: pendiente de subir o ya persistida. */
interface ImageSlot {
  key: string;
  id?: string;
  url: string;
  storagePath?: string;
  file?: File;
  isCover: boolean;
}

function parseNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideChevronLeft, LucideUpload, LucideTrash2, LucideStar],
  templateUrl: './project-form.component.html',
})
export class ProjectFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projects = inject(ProjectsService);

  readonly projectId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))));
  readonly isEdit = computed(() => Boolean(this.projectId()));
  readonly categories = this.projects.categories;

  readonly form = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.minLength(3)]),
    slug: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required, Validators.minLength(10)]),
    priceMinWages: new FormControl<number | null>(null),
    status: new FormControl<'draft' | 'published'>('draft'),
    featured: new FormControl(false),
    sortOrder: new FormControl(0),
  });

  readonly selectedCategoryIds = signal<string[]>([]);
  readonly imageSlots = signal<ImageSlot[]>([]);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');

  private slugEditedByUser = false;

  constructor() {
    // Slug automático desde el título mientras el admin no lo edite a mano.
    this.form.controls.title.valueChanges.subscribe((title) => {
      if (!this.slugEditedByUser && title) {
        this.form.controls.slug.patchValue(slugify(title));
      }
    });
  }

  async ngOnInit(): Promise<void> {
    if (!this.isEdit()) {
      this.loading.set(false);
      return;
    }

    try {
      if (this.projects.adminProjects().length === 0) {
        await this.projects.loadAll();
      }
      const project = this.projects.byId(this.projectId()!);
      if (!project) {
        this.error.set('Proyecto no encontrado.');
        return;
      }
      this.slugEditedByUser = true;
      this.form.patchValue({
        title: project.title,
        slug: project.slug,
        description: project.description,
        priceMinWages: project.priceMinWages,
        status: project.status,
        featured: project.featured,
        sortOrder: project.sortOrder,
      });
      this.selectedCategoryIds.set(project.categoryIds);
      this.imageSlots.set(
        project.images.map((image) => ({
          key: image.id,
          id: image.id,
          url: image.url,
          storagePath: image.storagePath,
          isCover: image.isCover,
        })),
      );
    } catch {
      this.error.set('No se pudo cargar el proyecto.');
    } finally {
      this.loading.set(false);
    }
  }

  onSlugInput(): void {
    this.slugEditedByUser = true;
  }

  toggleCategory(categoryId: string): void {
    this.selectedCategoryIds.update((ids) =>
      ids.includes(categoryId) ? ids.filter((id) => id !== categoryId) : [...ids, categoryId],
    );
  }

  /** Comprime (si puede) y agrega los archivos seleccionados como slots pendientes. */
  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';

    const validFiles = files.filter((file) => {
      const valid = isAcceptableImageFile(file);
      if (!valid) {
        this.error.set(
          `Algunos archivos no se subieron: solo se aceptan imágenes (${ACCEPTED_IMAGE_TYPES_LABEL}).`,
        );
      }
      return valid;
    });

    for (const file of validFiles) {
      let processed = file;
      try {
        processed = await imageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 2000,
          useWebWorker: true,
        });
      } catch {
        // Sin compresión si falla; se sube el original.
      }
      const url = URL.createObjectURL(processed);
      this.imageSlots.update((slots) => [
        ...slots,
        {
          key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          url,
          file: processed,
          isCover: slots.length === 0,
        },
      ]);
    }
  }

  setCover(slot: ImageSlot): void {
    this.imageSlots.update((slots) => slots.map((s) => ({ ...s, isCover: s.key === slot.key })));
  }

  removeImage(slot: ImageSlot): void {
    // Los slots ya persistidos se quitan solo de la UI: al guardar, el diff del
    // RPC borra su fila y devuelve el path para limpiar el bucket. Los nuevos
    // nunca se subieron (el upload ocurre en onSave), así que basta con
    // revocar la URL del preview.
    if (!slot.id) {
      URL.revokeObjectURL(slot.url);
    }
    this.imageSlots.update((slots) => slots.filter((s) => s.key !== slot.key));
  }

  /**
   * Guardado ATÓMICO (diagnóstico #9): primero sube los archivos nuevos al
   * bucket (solo storage, sin fila), luego UNA llamada RPC `admin_save_project`
   * crea/actualiza proyecto + sincroniza imágenes + reemplaza categorías en una
   * única transacción Postgres. Si el RPC falla, se compensa borrando los
   * archivos recién subidos (no quedan huérfanos). Si el RPC acierta, limpia
   * los objetos de las imágenes eliminadas (paths que devuelve el propio RPC).
   */
  async onSave(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');

    // Para un proyecto nuevo se genera el uuid EN EL CLIENTE: permite subir los
    // archivos a su prefijo ANTES de que exista la fila (storage no depende de
    // la DB) y el RPC hace el INSERT con ese mismo id.
    const finalId = this.projectId() ?? crypto.randomUUID();
    // Declarado fuera del try: la compensación del catch necesita la lista.
    const uploadedPaths: string[] = [];

    try {
      const value = this.form.value;
      const input: ProjectInput = {
        title: value.title!.trim(),
        slug: value.slug!.trim(),
        description: value.description!.trim(),
        priceMinWages: parseNumber(value.priceMinWages),
        status: value.status!,
        featured: Boolean(value.featured),
        sortOrder: Number(value.sortOrder ?? 0),
      };

      const slots = this.imageSlots();

      // 1) Subir archivos nuevos (solo storage; la fila la crea el RPC).
      const pathByKey = new Map<string, string>();
      for (const slot of slots.filter((s) => s.file)) {
        const path = await this.projects.uploadProjectImageFile(finalId, slot.file!);
        uploadedPaths.push(path);
        pathByKey.set(slot.key, path);
      }

      // 2) Filas definitivas de imágenes: existentes (por id) + recién subidas
      //    (por path). Lo que NO esté aquí, el RPC lo borra y devuelve su path.
      const remaining = slots.filter((s) => s.id || pathByKey.has(s.key));
      const coverKey = remaining.find((s) => s.isCover)?.key ?? remaining[0]?.key;
      const imageRows = remaining.map((slot, index) => ({
        id: slot.id,
        storagePath: slot.id ? slot.storagePath! : pathByKey.get(slot.key)!,
        isCover: slot.key === coverKey,
        sortOrder: index,
      }));

      // 3) Transacción única en Postgres.
      const { orphanPaths } = await this.projects.saveProjectAtomic(
        finalId,
        input,
        this.selectedCategoryIds(),
        imageRows,
      );

      // 4) Limpieza best-effort de objetos huérfanos (imágenes eliminadas).
      try {
        await this.projects.removeStorageObjects(orphanPaths);
      } catch (cleanupError) {
        console.warn('[project-form] limpieza de storage incompleta:', cleanupError);
      }

      await this.projects.refreshAll();
      await this.router.navigate(['/admin/proyectos']);
    } catch (err) {
      // Compensación: el RPC es transaccional (DB quedó consistente), pero los
      // archivos subidos en el paso 1 sí quedaron en el bucket → borrarlos.
      try {
        await this.projects.removeStorageObjects(uploadedPaths);
      } catch (cleanupError) {
        console.warn('[project-form] compensación de storage incompleta:', cleanupError);
      }
      this.error.set(err instanceof Error ? err.message : 'Error al guardar el proyecto.');
    } finally {
      this.saving.set(false);
    }
  }
}