import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowUpRight } from '@lucide/angular';
import { ProjectsService } from '../projects/data-access/projects.service';
import { ServicesService } from '../services/data-access/services.service';
import { ContentBlocksService } from '../content-blocks/data-access/content-blocks.service';
import { ContactMessagesService } from '../contact/data-access/contact-messages.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, LucideArrowUpRight],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private readonly projects = inject(ProjectsService);
  private readonly services = inject(ServicesService);
  private readonly blocks = inject(ContentBlocksService);
  private readonly messages = inject(ContactMessagesService);

  readonly loadingMessages = signal(true);

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
      value: String(this.messages.unreadCount()),
      detail: `${this.messages.messages().length} en total · ${this.messages.unreadCount()} sin leer`,
      link: '/admin/mensajes',
    },
  ]);

  async ngOnInit(): Promise<void> {
    try {
      await this.messages.load();
    } finally {
      this.loadingMessages.set(false);
    }
  }
}