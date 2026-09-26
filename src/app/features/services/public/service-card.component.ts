import { Component, computed, input } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { LucideArrowRight } from '@lucide/angular';
import type { LucideIcon } from '@lucide/angular';
import { serviceIconFor } from '../data-access/service-icons';
import type { Service } from '../data-access/service.model';
import { CLOUDINARY_TRANSFORMS, withCloudinaryTransform } from '../../../core/cloudinary-urls';

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [NgComponentOutlet, LucideArrowRight],
  templateUrl: './service-card.component.html',
})
export class ServiceCardComponent {
  readonly service = input.required<Service>();

  /** Posición dentro del listado (para la numeración editorial 01/02/…). */
  readonly index = input(0);

  /** Si el servicio tiene foto se muestra la foto; si no, el ícono de respaldo. */
  readonly iconComponent = computed<LucideIcon | null>(() => serviceIconFor(this.service().iconName));

  /** Foto ya optimizada por el CDN (las legacy de Supabase salen intactas). */
  readonly photoUrl = computed(() =>
    withCloudinaryTransform(this.service().photoUrl, CLOUDINARY_TRANSFORMS.service),
  );
}
