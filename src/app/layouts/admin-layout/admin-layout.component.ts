import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideFolderKanban,
  LucideInbox,
  LucideLayoutDashboard,
  LucideLogOut,
  LucideMenu,
  LucidePenLine,
  LucideWrench,
} from '@lucide/angular';
import { AuthService } from '../../features/auth/data-access/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideLayoutDashboard,
    LucideFolderKanban,
    LucideWrench,
    LucidePenLine,
    LucideInbox,
    LucideLogOut,
    LucideMenu,
  ],
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly userEmail = computed(() => this.auth.user()?.email ?? '');

  /** Navegación del panel (compartida por sidebar desktop y menú móvil). */
  readonly navItems = [
    { label: 'Dashboard', link: '/admin', exact: true, icon: 'dashboard' },
    { label: 'Proyectos', link: '/admin/proyectos', exact: false, icon: 'projects' },
    { label: 'Servicios', link: '/admin/servicios', exact: false, icon: 'services' },
    { label: 'Contenido', link: '/admin/contenido', exact: false, icon: 'content' },
    { label: 'Mensajes', link: '/admin/mensajes', exact: false, icon: 'messages' },
  ] as const;

  /** Menú móvil abierto/cerrado (el sidebar es hidden en < md). */
  readonly mobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  logout(): void {
    this.mobileMenuOpen.set(false);
    void this.auth.logout();
    void this.router.navigate(['/admin/login']);
  }
}