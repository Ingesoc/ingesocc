import { Component, computed, input } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import {
  LucideBuilding2,
  LucideFactory,
  LucideFrame,
  LucideHeartPulse,
  LucideHome,
  LucideRuler,
  type LucideIcon,
} from '@lucide/angular';
import type { Service } from '../data-access/service.model';

/** Mapa icon_name (seed) -> componente lucide. Regla foto vs. ícono del plan 1.3. */
const ICON_MAP: Record<string, LucideIcon> = {
  'building-2': LucideBuilding2,
  'heart-pulse': LucideHeartPulse,
  'factory': LucideFactory,
  'ruler': LucideRuler,
  'frame': LucideFrame,
  'home': LucideHome,
};

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [NgComponentOutlet],
  templateUrl: './service-card.component.html',
})
export class ServiceCardComponent {
  readonly service = input.required<Service>();

  /** Si el servicio tiene foto se muestra la foto; si no, el ícono de respaldo (plan 1.3). */
  readonly iconComponent = computed<LucideIcon | null>(() => {
    const iconName = this.service().iconName;
    return iconName ? (ICON_MAP[iconName] ?? null) : null;
  });
}