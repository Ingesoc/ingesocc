import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucidePencil, LucidePlus, LucideStar, LucideTrash2 } from '@lucide/angular';
import { ProjectsService } from '../data-access/projects.service';
import type { AdminProject } from '../data-access/project.model';

@Component({
  selector: 'app-projects-admin-page',
  standalone: true,
  imports: [RouterLink, LucidePlus, LucidePencil, LucideTrash2, LucideStar],
  templateUrl: './projects-admin-page.component.html',
})
export class ProjectsAdminPageComponent {
  private readonly projects = inject(ProjectsService);
  private readonly router = inject(Router);

  readonly adminProjects = this.projects.adminProjects;
  readonly loading = signal(true);
  readonly error = signal('');

  readonly categoriesById = computed(() => {
    const map = new Map<string, string>();
    for (const category of this.projects.categories()) {
      map.set(category.id, category.name);
    }
    return map;
  });

  async ngOnInit(): Promise<void> {
    try {
      await this.projects.loadAll();
      await this.projects.loadCategories();
    } catch {
      this.error.set('No se pudieron cargar los proyectos.');
    } finally {
      this.loading.set(false);
    }
  }

  categoryNames(project: AdminProject): string {
    return project.categoryIds.map((id) => this.categoriesById().get(id) ?? id).join(', ');
  }

  coverUrl(project: AdminProject): string {
    return project.images.find((image) => image.isCover)?.url ?? project.images[0]?.url ?? '';
  }

  async onDelete(project: AdminProject): Promise<void> {
    if (!window.confirm(`¿Eliminar "${project.title}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await this.projects.deleteProject(project.id);
      await this.projects.refreshAll();
    } catch {
      this.error.set('No se pudo eliminar el proyecto.');
    }
  }

  onNewProject(): void {
    this.router.navigate(['/admin/proyectos/nuevo']);
  }
}