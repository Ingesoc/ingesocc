import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { LucideArrowUpRight, LucideChevronLeft, LucideChevronRight, LucideExternalLink, LucideMapPin } from '@lucide/angular';
import { SeoService } from '../../../core/seo.service';
import { CLOUDINARY_TRANSFORMS, withCloudinaryTransform } from '../../../core/cloudinary-urls';
import { LightboxComponent, type LightboxImage } from '../../../shared/components';
import { CounterDirective, IconMotionDirective, RevealDirective } from '../../../shared/icons';
import { ProjectsService } from '../data-access/projects.service';
import { ProjectCardComponent } from './project-card.component';
import {
  projectCoverUrl,
  projectImageAlt,
  projectLocation,
  type ProjectImage,
} from '../data-access/project.model';

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
  imports: [
    RouterLink,
    LucideArrowUpRight,
    LucideChevronLeft,
    LucideChevronRight,
    LucideExternalLink,
    LucideMapPin,
    LightboxComponent,
    CounterDirective,
    IconMotionDirective,
    RevealDirective,
    ProjectCardComponent,
  ],
  templateUrl: './project-detail.component.html',
})
export class ProjectDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly projects = inject(ProjectsService);
  private readonly seo = inject(SeoService);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly slug = toSignal(this.route.paramMap.pipe(map((params) => params.get('slug'))));

  readonly project = computed(() => this.projects.bySlug(this.slug() ?? ''));

  /** Hero a sangre: ancho de viewport, no el de las cards. */
  readonly coverUrl = computed(() =>
    withCloudinaryTransform(
      this.project() ? projectCoverUrl(this.project()!) : '',
      CLOUDINARY_TRANSFORMS.hero,
    ),
  );

  /** Galería: omite la portada (ya está en el hero) salvo que sea la única imagen. */
  readonly galleryImages = computed<ProjectImage[]>(() => {
    const project = this.project();
    if (!project) return [];
    const withoutCover = project.images.filter((image) => !image.isCover);
    return withoutCover.length > 0 ? withoutCover : project.images;
  });

  /** Imagen de portada del hero, con sus metadatos (null si el proyecto no tiene). */
  readonly coverImage = computed<ProjectImage | null>(() => {
    const project = this.project();
    if (!project) return null;
    return project.images.find((image) => image.isCover) ?? project.images[0] ?? null;
  });

  /** Nombre de transición compartida card → detalle (`View Transitions`, por slug). */
  readonly transitionName = computed(() => {
    const project = this.project();
    return project ? `project-cover-${project.slug}` : '';
  });

  /** URL de galería optimizada para el tamaño de celda. */
  galleryUrl(image: ProjectImage): string {
    return withCloudinaryTransform(image.url, CLOUDINARY_TRANSFORMS.gallery);
  }

  /**
   * Texto alternativo de una imagen: el que escribió el admin, con respaldo
   * neutro. Evita que todas las imágenes de la galería anuncien el mismo texto.
   */
  imageAlt(image: ProjectImage): string {
    return projectImageAlt(image, this.project()?.title ?? '');
  }

  /** Ubicación de la obra ('' si el proyecto no la tiene registrada). */
  readonly location = computed(() => {
    const project = this.project();
    return project ? projectLocation(project) : '';
  });

  /**
   * Cifras del caso de estudio listas para renderizar: solo pares completos
   * (label y value), en el orden del panel. Vacío = la vista no muestra cifras.
   */
  readonly keyFigures = computed(() =>
    (this.project()?.keyFigures ?? []).filter((figure) => figure.label?.trim() && figure.value?.trim()),
  );

  /**
   * ¿El caso de estudio tiene contenido visible? Separa el SÍ (se renderiza la
   * sección completa, incluye la columna de cifras) del NO (no hay nada que
   * inventar ni mostrar): cliente, alcance, plazo, avance, resultados o cifras.
   */
  readonly hasCaseStudy = computed(() => {
    const project = this.project();
    if (!project) return false;
    return Boolean(
      project.client?.trim() ||
        project.scope?.trim() ||
        project.timeline?.trim() ||
        project.progress?.trim() ||
        project.results?.trim() ||
        this.keyFigures().length > 0,
    );
  });

  /**
   * Mapa embebido (sin API key) a partir de la ubicación real de la obra.
   * Devuelve null cuando no hay ubicación: el template oculta la sección.
   * Se marca como `SafeResourceUrl` porque el `src` de un `<iframe>` es un
   * contexto de *resource URL*: Angular lo rechaza si recibe un string plano.
   */
  readonly mapEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const where = this.location();
    if (!where) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://maps.google.com/maps?q=${encodeURIComponent(where)}&z=13&output=embed`,
    );
  });

  /** Descripción corta: incluye la ubicación para que el dato sea rastreable. */
  readonly seoDescription = computed(() => {
    const project = this.project();
    if (!project) return '';
    const where = this.location();
    return where ? `${project.description} Ubicación: ${where}.` : project.description;
  });

  /** Imágenes de la galería en el formato del componente compartido de lightbox. */
  readonly lightboxImages = computed<LightboxImage[]>(() =>
    this.galleryImages().map((image) => ({
      url: this.galleryUrl(image),
      alt: this.imageAlt(image),
      title: image.title ?? undefined,
      description: image.description ?? undefined,
      category: image.category ?? undefined,
    })),
  );

  /** Índice de la imagen abierta en el lightbox (null = cerrado). */
  readonly lightboxIndex = signal<number | null>(null);

  // ── Navegación entre proyectos y relacionados (sobre los publicados) ──
  private readonly publishedList = computed(() => this.projects.published());

  private readonly currentIndex = computed(() => {
    const slug = this.slug();
    return slug ? this.publishedList().findIndex((item) => item.slug === slug) : -1;
  });

  readonly previousProject = computed(() => {
    const index = this.currentIndex();
    return index > 0 ? this.publishedList()[index - 1] : null;
  });

  readonly nextProject = computed(() => {
    const list = this.publishedList();
    const index = this.currentIndex();
    return index >= 0 && index < list.length - 1 ? list[index + 1] : null;
  });

  /** Hasta 3 proyectos publicados que comparten alguna categoría con el actual. */
  readonly relatedProjects = computed(() => {
    const project = this.project();
    if (!project) return [];
    const categories = new Set(project.categories);
    return this.publishedList()
      .filter(
        (item) =>
          item.slug !== project.slug && item.categories.some((category) => categories.has(category)),
      )
      .slice(0, 3);
  });

  gallerySpan(index: number): string {
    return GALLERY_SPANS[index % GALLERY_SPANS.length];
  }

  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
  }

  closeLightbox(): void {
    this.lightboxIndex.set(null);
  }

  constructor() {
    // SEO dinámico por proyecto: título, descripción e imagen social propias.
    effect(() => {
      const project = this.project();
      if (project) {
        this.seo.set(project.title, this.seoDescription().slice(0, 160), undefined, this.coverUrl());
      }
    });
  }
}
