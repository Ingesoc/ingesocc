import { Component, OnInit, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgSwitch, NgSwitchCase } from '@angular/common';
import { filter } from 'rxjs';
import {
  LucideFolderKanban,
  LucideInbox,
  LucideLayoutDashboard,
  LucideLogOut,
  LucideMenu,
  LucidePenLine,
  LucideWrench,
  LucideX,
} from '@lucide/angular';
import { AuthService } from '../../features/auth/data-access/auth.service';

/** Iconos por sección, usado por el sidebar y el menú móvil. */
const ICONS = {
  dashboard: LucideLayoutDashboard,
  projects: LucideFolderKanban,
  services: LucideWrench,
  content: LucidePenLine,
  messages: LucideInbox,
} as const;

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgSwitch,
    NgSwitchCase,
    LucideLayoutDashboard,
    LucideFolderKanban,
    LucideWrench,
    LucidePenLine,
    LucideInbox,
    LucideLogOut,
    LucideMenu,
    LucideX,
  ],
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Navegación del panel (compartida por sidebar desktop y menú móvil). */
  readonly navItems = [
    { label: 'Dashboard', link: '/admin', exact: true, icon: 'dashboard' as const },
    { label: 'Proyectos', link: '/admin/proyectos', exact: false, icon: 'projects' as const },
    { label: 'Servicios', link: '/admin/servicios', exact: false, icon: 'services' as const },
    { label: 'Contenido', link: '/admin/contenido', exact: false, icon: 'content' as const },
    { label: 'Mensajes', link: '/admin/mensajes', exact: false, icon: 'messages' as const },
  ];

  readonly icons = ICONS;

  readonly mobileMenuOpen = signal(false);
  /** Etiqueta de la sección activa (migaja en el topbar). */
  readonly sectionLabel = signal('Dashboard');

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.syncSection());
  }

  /** Resuelve la sección activa a partir de la URL (más específica primero). */
  private syncSection(): void {
    const url = this.router.url;
    const item = [...this.navItems].reverse().find((nav) => url.startsWith(nav.link));
    this.sectionLabel.set(item?.label ?? 'Dashboard');
  }

  readonly userEmail = signal('');

  async ngOnInit(): Promise<void> {
    this.userEmail.set(this.auth.user()?.email ?? '');
  }

  /** ¿Es la sección actual? (indicador naranja del sidebar). */
  isActive(item: { link: string; exact: boolean }): boolean {
    const url = this.router.url;
    return item.exact ? url === item.link : url.startsWith(item.link);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  logout(): void {
    this.mobileMenuOpen.set(false);
    void this.auth.logout();
    void this.router.navigate(['/admin/login']);
  }

  readonly year = new Date().getFullYear();
}
