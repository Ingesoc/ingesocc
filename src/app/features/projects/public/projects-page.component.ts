import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideChevronDown } from '@lucide/angular';
import { slugify } from '../../../core/slugify';
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /**
   * "Todos" es el filtro por defecto, no una categoría guardable (plan 1.2).
   * Las categorías vienen de la tabla `categories` (con respaldo estático solo
   * si la tabla no existe): así el sitio público ve categorías nuevas o
   * renombradas sin tocar código (Fase 4.4).
   */
  readonly categories = computed(() => ['Todos', ...this.projects.categoryNames()]);

  /**
   * Filtro activo como slug ('' = Todos), sincronizado con el query param
   * `?categoria=`: el estado del filtro sobrevive un refresh o un enlace
   * compartido (plan §8, "URL/estado consistente"). Se compara por slug y no
   * por nombre para que la URL sea válida aunque las categorías aún carguen
   * desde la base de datos; un slug sin correspondencia simplemente no arroja
   * resultados (estado vacío del listado).
   */
  readonly activeSlug = signal<string>(this.initialSlugFromUrl());
  readonly visibleCount = signal(PAGE_SIZE);

  readonly filtered = computed(() => {
    const slug = this.activeSlug();
    if (!slug) {
      return this.projects.published();
    }
    return this.projects.published().filter((project) =>
      project.categories.some((category) => slugify(category) === slug),
    );
  });

  readonly visible = computed(() => this.filtered().slice(0, this.visibleCount()));

  readonly hasMore = computed(() => this.visible().length < this.filtered().length);

  /** true si el chip de la categoría dada está activo ('' = Todos). */
  isActive(category: string): boolean {
    return this.activeSlug() === (category === 'Todos' ? '' : slugify(category));
  }

  setCategory(category: string): void {
    const slug = category === 'Todos' ? '' : slugify(category);
    // `categoria: null` elimina el query param al volver a "Todos"; merge
    // conserva cualquier otro parámetro futuro. replaceUrl evita ensuciar el
    // historial del navegador con cada cambio de filtro.
    void this.router.navigate([], {
      queryParams: { categoria: slug || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    this.activeSlug.set(slug);
    this.visibleCount.set(PAGE_SIZE);
  }

  loadMore(): void {
    this.visibleCount.update((count) => count + PAGE_SIZE);
  }

  private initialSlugFromUrl(): string {
    const param = this.route.snapshot.queryParamMap.get('categoria');
    return param ? slugify(param) : '';
  }
}
