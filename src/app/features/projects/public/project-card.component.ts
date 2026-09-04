import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowUpRight } from '@lucide/angular';
import type { Project } from '../data-access/project.model';
import { projectCoverUrl } from '../data-access/project.model';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [RouterLink, LucideArrowUpRight],
  templateUrl: './project-card.component.html',
})
export class ProjectCardComponent {
  readonly project = input.required<Project>();

  /** Clases extra aplicadas a la tarjeta (p. ej. spans del masonry). */
  readonly className = input('');

  /** 'overlay' = imagen a sangre con texto encima (Home); 'panel' = imagen + metadata debajo (Proyectos). */
  readonly variant = input<'overlay' | 'panel'>('overlay');

  readonly coverUrl = computed(() => projectCoverUrl(this.project()));
}
