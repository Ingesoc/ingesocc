import { Component, computed, inject } from '@angular/core';
import { LucideMessageCircle, LucidePhone } from '@lucide/angular';
import { ContentBlocksService } from '../../features/content-blocks/data-access/content-blocks.service';
import { CONTACT } from '../../core/site-config';
import { safeHref, toTelHref } from '../../core/url-utils';
import { IconMotionDirective } from '../../shared/icons/icon-motion.directive';

/**
 * Barra de acciones fija inferior (solo móvil): WhatsApp + Llamar.
 * Valores reales editables desde content_blocks (contact.whatsapp / contact.phone).
 */
@Component({
  selector: 'app-mobile-action-bar',
  standalone: true,
  imports: [LucideMessageCircle, LucidePhone, IconMotionDirective],
  templateUrl: './mobile-action-bar.component.html',
})
export class MobileActionBarComponent {
  private readonly blocks = inject(ContentBlocksService);

  readonly whatsapp = computed(
    () => safeHref(this.blocks.text('contact', 'whatsapp', CONTACT.whatsapp)) ?? CONTACT.whatsapp,
  );
  readonly phoneLink = computed(
    () => toTelHref(this.blocks.text('contact', 'phone', CONTACT.phone)) ?? toTelHref(CONTACT.phone),
  );
}