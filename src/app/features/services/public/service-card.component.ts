import { Component, computed, input } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { LucideArrowRight } from '@lucide/angular';
import type { LucideIcon } from '@lucide/angular';
import { serviceIconFor } from '../data-access/service-icons';
import type { Service } from '../data-access/service.model';

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
}
