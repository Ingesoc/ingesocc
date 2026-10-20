import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgComponentOutlet } from '@angular/common';
import { LucidePencil, LucidePlus, LucideTrash2 } from '@lucide/angular';
import { ServicesService } from '../data-access/services.service';
import { serviceIconFor } from '../data-access/service-icons';
import type { AdminService } from '../data-access/service.model';
import { CLOUDINARY_TRANSFORMS, withCloudinaryTransform } from '../../../core/cloudinary-urls';
import { IconMotionDirective } from '../../../shared/icons';

@Component({
  selector: 'app-services-admin-page',
  standalone: true,
  imports: [RouterLink, NgComponentOutlet, LucidePlus, LucidePencil, LucideTrash2, IconMotionDirective],
  templateUrl: './services-admin-page.component.html',
})
export class ServicesAdminPageComponent implements OnInit, OnDestroy {
  private readonly services = inject(ServicesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly adminServices = this.services.adminServices;
  readonly loading = signal(true);
  readonly error = signal('');
  /** true tras volver de un guardado exitoso (aviso efímero con `?guardado=1`). */
  readonly justSaved = signal(false);

  private savedTimer: ReturnType<typeof setTimeout> | undefined;

  async ngOnInit(): Promise<void> {
    this.showSavedNotice();
    try {
      await this.services.loadAll();
    } catch {
      this.error.set('No se pudieron cargar los servicios.');
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.savedTimer);
  }

  /** Aviso efímero de guardado: llega como `?guardado=1` desde el formulario. */
  private showSavedNotice(): void {
    if (this.route.snapshot.queryParamMap.get('guardado') !== '1') {
      return;
    }
    this.justSaved.set(true);
    this.savedTimer = setTimeout(() => {
      this.justSaved.set(false);
      void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }, 6000);
  }

  iconComponent(service: AdminService) {
    return serviceIconFor(service.iconName);
  }

  /** Miniatura 400×400 para la celda del listado admin. */
  photoUrl(service: AdminService): string {
    return withCloudinaryTransform(service.photoUrl, CLOUDINARY_TRANSFORMS.thumbnail);
  }

  async onDelete(service: AdminService): Promise<void> {
    if (!window.confirm(`¿Eliminar "${service.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await this.services.deleteService(service.id);
      await this.services.refreshAll();
    } catch {
      this.error.set('No se pudo eliminar el servicio.');
    }
  }

  onNewService(): void {
    this.router.navigate(['/admin/servicios/nuevo']);
  }
}