import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import imageCompression from 'browser-image-compression';
import { NgComponentOutlet } from '@angular/common';
import { LucideChevronLeft, LucidePlus, LucideTrash2, LucideUpload } from '@lucide/angular';
import type { LucideIcon } from '@lucide/angular';
import { ServicesService } from '../data-access/services.service';
import { SERVICE_ICON_NAMES, serviceIconFor } from '../data-access/service-icons';
import type { ServiceFaqItem, ServiceInput } from '../data-access/service.model';
import { slugify } from '../../../core/slugify';
import { MAX_IMAGE_BYTES, validateImageFile } from '../../../core/image-utils';

/** Grupo del editor de FAQ (una pregunta con su respuesta). */
function faqFormGroup(q = '', a = '') {
  return new FormGroup({
    q: new FormControl(q),
    a: new FormControl(a),
  });
}

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgComponentOutlet, LucideChevronLeft, LucidePlus, LucideUpload, LucideTrash2],
  templateUrl: './service-form.component.html',
})
export class ServiceFormComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly services = inject(ServicesService);

  readonly serviceId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))));
  readonly isEdit = computed(() => Boolean(this.serviceId()));
  readonly iconNames = SERVICE_ICON_NAMES;

  readonly form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    slug: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required, Validators.minLength(10)]),
    scope: new FormControl(''),
    deliverables: new FormControl(''),
    faq: new FormArray<ReturnType<typeof faqFormGroup>>([]),
    iconName: new FormControl<string | null>(null),
    status: new FormControl<'draft' | 'published'>('draft'),
    sortOrder: new FormControl(0),
  });

  readonly loading = signal(true);
  readonly saving = signal(false);
  /** true mientras la foto comprime y/or sube a Cloudinary (evita guardar a medias). */
  readonly photoBusy = signal(false);
  readonly error = signal('');
  readonly photo = signal<{ url: string; file?: File; existingPath?: string } | null>(null);
  /** Etiqueta de la acción principal según la fase en curso. */
  readonly submitLabel = computed(() =>
    this.photoBusy() ? 'Subiendo foto…' : this.saving() ? 'Guardando…' : 'Guardar servicio',
  );

  private slugEditedByUser = false;
  /** Id de la fila creada en este formulario; evita duplicar si la foto falla y se reintenta. */
  private createdId: string | null = null;

  constructor() {
    // Slug automático desde el nombre mientras el admin no lo edite a mano.
    this.form.controls.name.valueChanges.subscribe((name) => {
      if (!this.slugEditedByUser && name) {
        this.form.controls.slug.patchValue(slugify(name));
      }
    });
  }

  async ngOnInit(): Promise<void> {
    if (!this.isEdit()) {
      this.loading.set(false);
      return;
    }

    try {
      if (this.services.adminServices().length === 0) {
        await this.services.loadAll();
      }
      const service = this.services.byId(this.serviceId()!);
      if (!service) {
        this.error.set('Servicio no encontrado.');
        return;
      }
      this.slugEditedByUser = true;
      this.form.patchValue({
        name: service.name,
        slug: service.slug,
        description: service.description,
        scope: service.scope ?? '',
        iconName: service.iconName,
        status: service.status,
        sortOrder: service.sortOrder,
      });
      this.form.controls.deliverables.setValue((service.deliverables ?? []).join('\n'));
      this.form.controls.faq.clear();
      for (const item of service.faq ?? []) {
        this.form.controls.faq.push(faqFormGroup(item.q, item.a));
      }
      if (service.photoUrl) {
        this.photo.set({ url: service.photoUrl, existingPath: service.photoPath ?? undefined });
      }
    } catch {
      this.error.set('No se pudo cargar el servicio.');
    } finally {
      this.loading.set(false);
    }
  }

  onSlugInput(): void {
    this.slugEditedByUser = true;
  }

  selectedIcon(): LucideIcon | null {
    return serviceIconFor(this.form.value.iconName ?? null);
  }

  readonly faqItems = () => this.form.controls.faq.controls;

  addFaq(): void {
    this.form.controls.faq.push(faqFormGroup());
  }

  removeFaq(index: number): void {
    this.form.controls.faq.removeAt(index);
  }

  /** Valida, comprime y prepara la nueva foto; se sube al guardar. */
  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // permite volver a elegir el mismo archivo
    if (!file) return;

    const invalid = validateImageFile(file);
    if (invalid) {
      this.error.set(invalid);
      return;
    }

    this.photoBusy.set(true);
    try {
      let processed = file;
      try {
        processed = await imageCompression(file, {
          maxSizeMB: MAX_IMAGE_BYTES / (1024 * 1024),
          maxWidthOrHeight: 1600,
          useWebWorker: true,
        });
      } catch {
        // Sin compresión si falla; se sube el original.
      }
      this.releasePreview();
      this.photo.set({ url: URL.createObjectURL(processed), file: processed });
    } finally {
      this.photoBusy.set(false);
    }
  }

  /** Quita la foto actual (la existente se borra del almacenamiento al guardar). */
  removePhoto(): void {
    this.releasePreview();
    this.photo.set(null);
  }

  /** Libera el object URL del preview local, si lo hay. */
  private releasePreview(): void {
    const current = this.photo();
    if (current?.file) {
      URL.revokeObjectURL(current.url);
    }
  }

  ngOnDestroy(): void {
    this.releasePreview();
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // Corta el doble submit mientras haya una operación en curso.
    if (this.saving() || this.photoBusy()) {
      return;
    }

    this.saving.set(true);
    this.error.set('');

    try {
      const value = this.form.value;
      const deliverables = (value.deliverables ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      const faq: ServiceFaqItem[] = (value.faq ?? [])
        .map((item) => ({ q: (item.q ?? '').trim(), a: (item.a ?? '').trim() }))
        .filter((item) => item.q.length > 0 && item.a.length > 0);
      const input: ServiceInput = {
        name: value.name!.trim(),
        slug: value.slug!.trim(),
        description: value.description!.trim(),
        scope: value.scope?.trim() || null,
        deliverables,
        faq,
        iconName: value.iconName ?? null,
        status: value.status!,
        sortOrder: Number(value.sortOrder ?? 0),
      };

      let finalId = this.serviceId() ?? this.createdId;
      if (finalId) {
        await this.services.updateService(finalId, input);
      } else {
        finalId = await this.services.createService(input);
        // La fila ya existe: un reintento tras un fallo posterior (p. ej. la
        // foto) debe actualizarla, no volver a insertarla.
        this.createdId = finalId;
      }

      const photo = this.photo();
      if (photo?.file) {
        this.photoBusy.set(true);
        try {
          await this.services.uploadServicePhoto(finalId!, photo.file);
        } finally {
          this.photoBusy.set(false);
        }
      } else if (!photo && finalId) {
        // Sin foto: asegura que no quede foto vieja (p. ej. si se quitó).
        await this.services.removeServicePhoto(finalId);
      }

      await this.services.refreshAll();
      await this.router.navigate(['/admin/servicios']);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error al guardar el servicio.');
    } finally {
      this.saving.set(false);
    }
  }
}