import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectsService } from '../projects/data-access/projects.service';
import { ServicesService } from '../services/data-access/services.service';
import { ContentBlocksService } from '../content-blocks/data-access/content-blocks.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent {
  private readonly projects = inject(ProjectsService);
  private readonly services = inject(ServicesService);
  private readonly blocks = inject(ContentBlocksService);

  readonly projectsCount = computed(() => this.projects.published().length);
  readonly featuredCount = computed(() => this.projects.featured().length);
  readonly servicesCount = computed(() => this.services.published().length);
  readonly blocksCount = computed(() =>
    Object.values(this.blocks.byPage()).reduce((total, page) => total + Object.keys(page).length, 0),
  );

  readonly cards = computed(() => [
    {
      label: 'Proyectos publicados',
      value: String(this.projectsCount()),
      detail: `${this.featuredCount()} destacados en el Home`,
      link: '/admin/proyectos',
    },
    {
      label: 'Servicios',
      value: String(this.servicesCount()),
      detail: 'Catálogo de servicios',
      link: '/admin/servicios',
    },
    {
      label: 'Bloques de contenido',
      value: String(this.blocksCount()),
      detail: 'Textos e imágenes editables',
      link: '/admin/contenido',
    },
    {
      label: 'Mensajes de contacto',
      value: '—',
      detail: 'Disponible en Fase 7',
      link: '/admin/mensajes',
    },
  ]);
}