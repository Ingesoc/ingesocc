import { Component, computed, input } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import type { LucideIcon } from '@lucide/angular';
import { serviceIconFor } from '../data-access/service-icons';
import type { Service } from '../data-access/service.model';

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [NgComponentOutlet],
  templateUrl: './service-card.component.html',
})
export class ServiceCardComponent {
  readonly service = input.required<Service>();

  /** Si el servicio tiene foto se muestra la foto; si no, el ícono de respaldo (plan 1.3). */
  readonly iconComponent = computed<LucideIcon | null>(() => serviceIconFor(this.service().iconName));
}