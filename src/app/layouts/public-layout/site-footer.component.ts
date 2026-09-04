import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideExternalLink } from '@lucide/angular';
import { ContentBlocksService } from '../../features/content-blocks/data-access/content-blocks.service';
import { EditableTextComponent } from '../../features/content-blocks/editable-text.component';
import { EditModeService } from '../../features/content-blocks/edit-mode.service';

/** Misma navegación que el header (el pie replica las páginas públicas). */
const NAV_ITEMS = [
  { label: 'Inicio', link: '/' },
  { label: 'Quiénes Somos', link: '/quienes-somos' },
  { label: 'Servicios', link: '/servicios' },
  { label: 'Proyectos', link: '/proyectos' },
  { label: 'Contacto', link: '/contacto' },
];

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterLink, EditableTextComponent, LucideExternalLink],
  templateUrl: './site-footer.component.html',
})
export class SiteFooterComponent {
  private readonly blocks = inject(ContentBlocksService);
  private readonly editMode = inject(EditModeService);

  /** Redes reales de la empresa, editables desde content_blocks (plan 1.1). */
  readonly linkedin = computed(() => this.blocks.text('global', 'social_linkedin', '#'));
  readonly facebook = computed(() => this.blocks.text('global', 'social_facebook', '#'));
  readonly instagram = computed(() => this.blocks.text('global', 'social_instagram', '#'));

  /** Datos de contacto (mismos bloques que la página /contacto). */
  readonly email = computed(() => this.blocks.text('contact', 'email', ''));
  readonly phone = computed(() => this.blocks.text('contact', 'phone', ''));
  readonly address = computed(() => this.blocks.text('contact', 'address', ''));

  readonly navItems = NAV_ITEMS;
  readonly isEditing = this.editMode.isEditing;

  readonly year = new Date().getFullYear();
}
