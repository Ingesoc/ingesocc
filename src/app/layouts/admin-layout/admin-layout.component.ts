import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideFileText,
  LucideFolderKanban,
  LucideInbox,
  LucideLayoutDashboard,
  LucideLogOut,
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
  ],
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly userEmail = computed(() => this.auth.user()?.email ?? '');

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }
}