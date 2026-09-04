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
  readonly removedImages = signal<{ id: string; storagePath: string }[]>([]);

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
    if (slot.id && slot.storagePath) {
      this.removedImages.update((list) => [...list, { id: slot.id!, storagePath: slot.storagePath! }]);
    } else {
      URL.revokeObjectURL(slot.url);
    }
    this.imageSlots.update((slots) => slots.filter((s) => s.key !== slot.key));
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');

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

      let finalId = this.projectId();
      if (finalId) {
        await this.projects.updateProject(finalId, input);
      } else {
        finalId = await this.projects.createProject(input);
      }

      const slots = this.imageSlots();

      // Subir imágenes nuevas
      const uploadedIds = new Map<string, string>();
      for (const slot of slots.filter((s) => s.file)) {
        const id = await this.projects.addProjectImage(finalId!, slot.file!);
        uploadedIds.set(slot.key, id);
      }

      // Eliminar imágenes marcadas
      for (const image of this.removedImages()) {
        await this.projects.removeProjectImage(image.id, image.storagePath);
      }

      // Sincronizar orden y portada
      const remaining = slots.filter((s) => s.id || uploadedIds.has(s.key));
      const coverKey = remaining.find((s) => s.isCover)?.key ?? remaining[0]?.key;
      const rows = remaining.map((slot, index) => ({
        id: slot.id ?? uploadedIds.get(slot.key)!,
        sortOrder: index,
        isCover: slot.key === coverKey,
      }));
      if (rows.length > 0) {
        await this.projects.syncProjectImages(finalId!, rows);
      }

      // Categorías
      await this.projects.replaceCategories(finalId!, this.selectedCategoryIds());

      await this.projects.refreshAll();
      await this.router.navigate(['/admin/proyectos']);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error al guardar el proyecto.');
    } finally {
      this.saving.set(false);
    }
  }
}