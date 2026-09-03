import { Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { LucideArrowUpRight, LucideChevronLeft } from '@lucide/angular';
import { SeoService } from '../../../core/seo.service';
import { ProjectsService } from '../data-access/projects.service';
import { projectCoverUrl } from '../data-access/project.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [RouterLink, LucideArrowUpRight, LucideChevronLeft],
  templateUrl: './project-detail.component.html',
})
export class ProjectDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly projects = inject(ProjectsService);
  private readonly seo = inject(SeoService);

  private readonly slug = toSignal(this.route.paramMap.pipe(map((params) => params.get('slug'))));

  readonly project = computed(() => this.projects.bySlug(this.slug() ?? ''));

  readonly coverUrl = computed(() => (this.project() ? projectCoverUrl(this.project()!) : ''));

  constructor() {
    // SEO dinámico por proyecto (Fase 9): título y descripción propios en el <head>.
    effect(() => {
      const project = this.project();
      if (project) {
        this.seo.set(project.title, project.description.slice(0, 160));
      }
    });
  }
}