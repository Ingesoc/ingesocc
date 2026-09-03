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

  /** Clases extra aplicadas a la tarjeta (p. ej. spans del masonry o altura fija). */
  readonly className = input('');

  /** Variante compacta para grids densos. */
  readonly compact = input(false);

  readonly coverUrl = computed(() => projectCoverUrl(this.project()));
}