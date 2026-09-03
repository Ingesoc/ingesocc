import { Component, computed, inject } from '@angular/core';
import { ContentBlocksService } from '../../features/content-blocks/data-access/content-blocks.service';
import { EditableTextComponent } from '../../features/content-blocks/editable-text.component';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [EditableTextComponent],
  templateUrl: './site-footer.component.html',
})
export class SiteFooterComponent {
  private readonly blocks = inject(ContentBlocksService);

  /** Un solo set de redes reales de la empresa, editable desde content_blocks (plan 1.1). */
  readonly linkedin = computed(() => this.blocks.text('global', 'social_linkedin', '#'));
  readonly facebook = computed(() => this.blocks.text('global', 'social_facebook', '#'));
  readonly instagram = computed(() => this.blocks.text('global', 'social_instagram', '#'));

  readonly year = new Date().getFullYear();
}