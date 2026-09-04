import { Component, computed, inject, signal } from '@angular/core';
import { LucideChevronDown } from '@lucide/angular';
import { ProjectCardComponent } from './project-card.component';
import { ProjectsService } from '../data-access/projects.service';

/** Paginación pública en bloques de 8 (plan 1.2.3). */
const PAGE_SIZE = 8;

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [ProjectCardComponent, LucideChevronDown],
  templateUrl: './projects-page.component.html',
})
export class ProjectsPageComponent {
  private readonly projects = inject(ProjectsService);

  /**
   * "Todos" es el filtro por defecto, no una categoría guardable (plan 1.2).
   * Las categorías vienen de la tabla `categories` (con respaldo estático solo
   * si la tabla no existe): así el sitio público ve categorías nuevas o
   * renombradas sin tocar código (Fase 4.4).
   */
  readonly categories = computed(() => ['Todos', ...this.projects.categoryNames()]);
  readonly activeCategory = signal<string>('Todos');
  readonly visibleCount = signal(PAGE_SIZE);

  readonly filtered = computed(() => {
    const category = this.activeCategory();
    if (category === 'Todos') {
      return this.projects.published();
    }
    return this.projects.published().filter((project) => project.categories.includes(category));
  });

  readonly visible = computed(() => this.filtered().slice(0, this.visibleCount()));

  readonly hasMore = computed(() => this.visible().length < this.filtered().length);

  setCategory(category: string): void {
    this.activeCategory.set(category);
    this.visibleCount.set(PAGE_SIZE);
  }

  loadMore(): void {
    this.visibleCount.update((count) => count + PAGE_SIZE);
  }
}