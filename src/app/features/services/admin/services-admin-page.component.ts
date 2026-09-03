import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgComponentOutlet } from '@angular/common';
import { LucidePencil, LucidePlus, LucideTrash2 } from '@lucide/angular';
import { ServicesService } from '../data-access/services.service';
import { serviceIconFor } from '../data-access/service-icons';
import type { AdminService } from '../data-access/service.model';

@Component({
  selector: 'app-services-admin-page',
  standalone: true,
  imports: [RouterLink, NgComponentOutlet, LucidePlus, LucidePencil, LucideTrash2],
  templateUrl: './services-admin-page.component.html',
})
export class ServicesAdminPageComponent {
  private readonly services = inject(ServicesService);
  private readonly router = inject(Router);

  readonly adminServices = this.services.adminServices;
  readonly loading = signal(true);
  readonly error = signal('');

  async ngOnInit(): Promise<void> {
    try {
      await this.services.loadAll();
    } catch {
      this.error.set('No se pudieron cargar los servicios.');
    } finally {
      this.loading.set(false);
    }
  }

  iconComponent(service: AdminService) {
    return serviceIconFor(service.iconName);
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