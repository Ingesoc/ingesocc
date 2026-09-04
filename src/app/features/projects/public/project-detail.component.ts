import { Component, computed, effect, HostListener, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { LucideArrowUpRight, LucideChevronLeft, LucideChevronRight, LucideX } from '@lucide/angular';
import { SeoService } from '../../../core/seo.service';
import { ProjectsService } from '../data-access/projects.service';
import { projectCoverUrl, type ProjectImage } from '../data-access/project.model';

/** Patrón de la galería editorial: primera imagen grande, resto en celdas. */
const GALLERY_SPANS = [
  'md:col-span-8 md:row-span-2',
  'md:col-span-4',
  'md:col-span-4',
  'md:col-span-4',
  'md:col-span-4',
  'md:col-span-8 md:row-span-2',
  'md:col-span-4',
  'md:col-span-4',
  'md:col-span-4',
  'md:col-span-4',
];

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [RouterLink, LucideArrowUpRight, LucideChevronLeft, LucideChevronRight, LucideX],
  templateUrl: './project-detail.component.html',
})
export class ProjectDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly projects = inject(ProjectsService);
  private readonly seo = inject(SeoService);

  private readonly slug = toSignal(this.route.paramMap.pipe(map((params) => params.get('slug'))));

  readonly project = computed(() => this.projects.bySlug(this.slug() ?? ''));

  readonly coverUrl = computed(() => (this.project() ? projectCoverUrl(this.project()!) : ''));

  /** Galería: omite la portada (ya está en el hero) salvo que sea la única imagen. */
  readonly galleryImages = computed<ProjectImage[]>(() => {
    const project = this.project();
    if (!project) return [];
    const withoutCover = project.images.filter((image) => !image.isCover);
    return withoutCover.length > 0 ? withoutCover : project.images;
  });

  /** Índice de la imagen abierta en el lightbox (null = cerrado). */
  readonly lightboxIndex = signal<number | null>(null);

  gallerySpan(index: number): string {
    return GALLERY_SPANS[index % GALLERY_SPANS.length];
  }

  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
  }

  closeLightbox(): void {
    this.lightboxIndex.set(null);
  }

  /** URL de la imagen actualmente abierta en el lightbox ('' si cerrado). */
  lightboxImageUrl(): string {
    const index = this.lightboxIndex();
    const images = this.galleryImages();
    return index !== null && images[index] ? images[index].url : '';
  }

  /** Posición "2 / 5" para el pie del lightbox. */
  lightboxPosition(): string {
    const index = this.lightboxIndex();
    const total = this.galleryImages().length;
    return index !== null ? `${index + 1} / ${total}` : '';
  }

  /** Navegación circular dentro de la galería. */
  stepLightbox(direction: 1 | -1): void {
    const current = this.lightboxIndex();
    const total = this.galleryImages().length;
    if (current === null || total === 0) return;
    this.lightboxIndex.set((current + direction + total) % total);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.lightboxIndex() === null) return;
    if (event.key === 'Escape') {
      this.closeLightbox();
    } else if (event.key === 'ArrowRight') {
      this.stepLightbox(1);
    } else if (event.key === 'ArrowLeft') {
      this.stepLightbox(-1);
    }
  }

  constructor() {
    // SEO dinámico por proyecto: título, descripción e imagen social propios.
    effect(() => {
      const project = this.project();
      if (project) {
        this.seo.set(project.title, project.description.slice(0, 160), undefined, this.coverUrl());
      }
    });
  }
}
