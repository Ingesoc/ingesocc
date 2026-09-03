import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { LucideArrowUpRight, LucideChevronLeft } from '@lucide/angular';
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

  private readonly slug = toSignal(this.route.paramMap.pipe(map((params) => params.get('slug'))));

  readonly project = computed(() => this.projects.bySlug(this.slug() ?? ''));

  readonly coverUrl = computed(() => (this.project() ? projectCoverUrl(this.project()!) : ''));
}