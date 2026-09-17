import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowUpRight, LucideLoaderCircle, LucideRefreshCw } from '@lucide/angular';
import { ProjectsService } from '../projects/data-access/projects.service';
import { ServicesService } from '../services/data-access/services.service';
import { ContentBlocksService } from '../content-blocks/data-access/content-blocks.service';
import { ContactMessagesService } from '../contact/data-access/contact-messages.service';

/**
 * Dashboard del panel (plan §3): métricas reales desde Supabase, con estados
 * loading / error / conexión explícitos. NUNCA presenta el seed estático como
 * dato real: si la carga falla, la tarjeta lo indica y el banner lo explica.
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, LucideArrowUpRight, LucideLoaderCircle, LucideRefreshCw],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private readonly projects = inject(ProjectsService);
  private readonly services = inject(ServicesService);
  private readonly blocks = inject(ContentBlocksService);
  private readonly messages = inject(ContactMessagesService);

  readonly loading = signal(true);
  readonly refreshing = signal(false);

  /** Módulos cuya carga desde Supabase falló (vacío = todo OK). */
  readonly failedModules = signal<string[]>([]);

  readonly messagesError = signal('');

  /** Indicador de conexión del encabezado. */
  readonly connection = computed(() => {
    if (this.loading()) return 'checking' as const;
    return this.failedModules().length > 0 ? ('error' as const) : ('ok' as const);
  });

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
      detail:
        `${this.featuredCount()} destacados en el Home` +
        (this.projects.loadState() ? ' · datos de ejemplo' : ''),
      link: '/admin/proyectos',
    },
    {
      label: 'Servicios',
      value: String(this.servicesCount()),
      detail: this.services.loadState()
        ? 'Catálogo de servicios · datos de ejemplo'
        : 'Catálogo de servicios',
      link: '/admin/servicios',
    },
    {
      label: 'Bloques de contenido',
      value: String(this.blocksCount()),
      detail: this.blocks.loadState()
        ? 'Textos e imágenes editables · datos de ejemplo'
        : 'Textos e imágenes editables',
      link: '/admin/contenido',
    },
    {
      label: 'Mensajes de contacto',
      value: String(this.messages.unreadCount()),
      detail: `${this.messages.messages().length} en total · ${this.messages.unreadCount()} sin leer`,
      link: '/admin/mensajes',
    },
  ]);

  /** Accesos al CMS de contenido (una entrada por página del sitio). */
  readonly contentLinks = [
    { label: 'Inicio', page: 'home' },
    { label: 'Quiénes somos', page: 'about' },
    { label: 'Contacto', page: 'contact' },
    { label: 'Header / footer', page: 'global' },
  ];

  ngOnInit(): void {
    void this.refreshAll().then(() => {
      this.loading.set(false);
    });
  }

  /** Recarga todo desde Supabase y actualiza el estado de conexión. */
  async refreshAll(): Promise<void> {
    this.refreshing.set(true);
    this.messagesError.set('');

    const results = await Promise.allSettled([
      this.projects.load(),
      this.services.load(),
      this.blocks.load(),
      this.messages.load(),
    ]);

    /** true si la carga falló (rechazo) o reportó Supabase caído (false). */
    const failedIf = (result: PromiseSettledResult<boolean | void>): boolean =>
      result.status === 'rejected' ? true : (result.value as boolean) === false;

    const failed: string[] = [];
    if (failedIf(results[0])) failed.push('Proyectos');
    if (failedIf(results[1])) failed.push('Servicios');
    if (failedIf(results[2])) failed.push('Contenido');
    if (failedIf(results[3])) {
      failed.push('Mensajes');
      this.messagesError.set('No se pudieron cargar los mensajes.');
    }
    this.failedModules.set(failed);

    this.refreshing.set(false);
  }
}
