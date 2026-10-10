import { Component, computed, inject } from '@angular/core';
import { LucideMessageCircle, LucidePhone } from '@lucide/angular';
import { ContentBlocksService } from '../../features/content-blocks/data-access/content-blocks.service';
import { CONTACT } from '../../core/site-config';

/**
 * Barra de acciones fija inferior (solo móvil): WhatsApp + Llamar.
 * Valores reales editables desde content_blocks (contact.whatsapp / contact.phone).
 */
@Component({
  selector: 'app-mobile-action-bar',
  standalone: true,
  imports: [LucideMessageCircle, LucidePhone],
  templateUrl: './mobile-action-bar.component.html',
})
export class MobileActionBarComponent {
  private readonly blocks = inject(ContentBlocksService);

  readonly whatsapp = computed(() => this.blocks.text('contact', 'whatsapp', CONTACT.whatsapp));
  readonly phone = computed(() => this.blocks.text('contact', 'phone', CONTACT.phone));
}