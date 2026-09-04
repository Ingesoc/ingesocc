import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideArrowUpRight, LucideMenu, LucideX } from '@lucide/angular';
import { ContentBlocksService } from '../../features/content-blocks/data-access/content-blocks.service';
import { EditableTextComponent } from '../../features/content-blocks/editable-text.component';

/** Navegación única del sitio, 100% en español. */
const NAV_ITEMS = [
  { label: 'Inicio', link: '/' },
  { label: 'Quiénes Somos', link: '/quienes-somos' },
  { label: 'Servicios', link: '/servicios' },
  { label: 'Proyectos', link: '/proyectos' },
  { label: 'Contacto', link: '/contacto' },
];

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideMenu, LucideX, LucideArrowUpRight, EditableTextComponent],
  templateUrl: './site-header.component.html',
})
export class SiteHeaderComponent {
  private readonly blocks = inject(ContentBlocksService);

  readonly navItems = NAV_ITEMS;
  readonly menuOpen = signal(false);

  /** Label único del botón de cotizar, reutilizado en todos los headers. */
  readonly ctaLabel = computed(() => this.blocks.text('global', 'cta_label', 'Solicitar Cotización'));

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }
}
