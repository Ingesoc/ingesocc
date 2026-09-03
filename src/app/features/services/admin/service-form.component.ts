import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import imageCompression from 'browser-image-compression';
import { NgComponentOutlet } from '@angular/common';
import { LucideChevronLeft, LucideTrash2, LucideUpload } from '@lucide/angular';
import type { LucideIcon } from '@lucide/angular';
import { ServicesService } from '../data-access/services.service';
import { SERVICE_ICON_NAMES, serviceIconFor } from '../data-access/service-icons';
import type { ServiceInput } from '../data-access/service.model';
import { slugify } from '../../../core/slugify';

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgComponentOutlet, LucideChevronLeft, LucideUpload, LucideTrash2],
  templateUrl: './service-form.component.html',
})
export class ServiceFormComponent {
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
    iconName: new FormControl<string | null>(null),
    status: new FormControl<'draft' | 'published'>('draft'),
    sortOrder: new FormControl(0),
  });

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly photo = signal<{ url: string; file?: File; existingPath?: string } | null>(null);

  private slugEditedByUser = false;

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
        iconName: service.iconName,
        status: service.status,
        sortOrder: service.sortOrder,
      });
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

  /** Comprime (si puede) y prepara la nueva foto; se sube al guardar. */
  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    let processed = file;
    try {
      processed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });
    } catch {
      // Sin compresión si falla; se sube el original.
    }
    this.photo.set({ url: URL.createObjectURL(processed), file: processed });
  }

  /** Quita la foto actual (la existente se borra del storage al guardar). */
  removePhoto(): void {
    const current = this.photo();
    if (current && !current.file) {
      URL.revokeObjectURL(current.url);
    }
    this.photo.set(null);
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
      const input: ServiceInput = {
        name: value.name!.trim(),
        slug: value.slug!.trim(),
        description: value.description!.trim(),
        iconName: value.iconName ?? null,
        status: value.status!,
        sortOrder: Number(value.sortOrder ?? 0),
      };

      let finalId = this.serviceId();
      if (finalId) {
        await this.services.updateService(finalId, input);
      } else {
        finalId = await this.services.createService(input);
      }

      const photo = this.photo();
      if (photo?.file) {
        await this.services.uploadServicePhoto(finalId!, photo.file);
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