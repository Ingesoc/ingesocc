import { Component, computed, inject, signal, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowUpRight, LucideChevronLeft, LucideChevronRight, LucideMessageCircle, LucideShieldCheck, LucideX } from '@lucide/angular';
import { ContentBlocksService } from '../content-blocks/data-access/content-blocks.service';
import { CLOUDINARY_TRANSFORMS, withCloudinaryTransform } from '../../core/cloudinary-urls';
import { CONTACT } from '../../core/site-config';
import { OPERACIONES } from './operaciones.data';

/** Slots fijos del timeline (plan 1.4): el admin edita el contenido, no la estructura. */
const TIMELINE_KEYS = ['item1', 'item2', 'item3', 'item4'] as const;

/** Slots fijos del equipo (plan 1.4): 4 miembros editables, sin añadir/quitar sin cambio de código. */
const TEAM_KEYS = ['member1', 'member2', 'member3', 'member4'] as const;

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, LucideArrowUpRight, LucideChevronLeft, LucideChevronRight, LucideMessageCircle, LucideShieldCheck, LucideX],
  templateUrl: './about.component.html',
})
export class AboutComponent {
  private readonly blocks = inject(ContentBlocksService);

  readonly heroTitle = computed(() => this.blocks.text('about', 'hero.title', 'Quiénes Somos'));
  readonly heroSubtitle = computed(() => this.blocks.text('about', 'hero.subtitle', ''));
  readonly historiaImage = computed(() =>
    withCloudinaryTransform(
      this.blocks.image('about', 'historia.image'),
      CLOUDINARY_TRANSFORMS.hero,
    ),
  );
  readonly historiaText = computed(() => this.blocks.text('about', 'historia.text'));
  readonly mision = computed(() => this.blocks.text('about', 'mision.text'));
  readonly vision = computed(() => this.blocks.text('about', 'vision.text'));
  readonly valores = computed(() => this.blocks.text('about', 'valores.text'));

  readonly timeline = computed(() =>
    TIMELINE_KEYS.map((key) => ({
      key,
      year: this.blocks.number('about', `timeline.${key}.year`),
      title: this.blocks.text('about', `timeline.${key}.title`),
    })),
  );

  /** WhatsApp del CTA final (contact.whatsapp; fallo: dato real verificado). */
  readonly whatsappUrl = computed(() => this.blocks.text('contact', 'whatsapp', CONTACT.whatsapp));

  readonly team = computed(() =>
    TEAM_KEYS.map((key) => ({
      key,
      name: this.blocks.text('about', `equipo.${key}.name`),
      role: this.blocks.text('about', `equipo.${key}.role`),
      photo: withCloudinaryTransform(
        this.blocks.image('about', `equipo.${key}.photo`),
        CLOUDINARY_TRANSFORMS.thumbnail,
      ),
    })),
  );

  // ── Operaciones en ejecución (galería con lightbox) ────────

  /** URL optimizada por el CDN de Cloudinary (las que no son Cloudinary pasan intactas). */
  private urlOptimizada(src: string): string {
    return withCloudinaryTransform(src, CLOUDINARY_TRANSFORMS.gallery);
  }

  /** Grupos con letra de sección e índice plano precalculado por imagen (lightbox). */
  readonly operacionesGrupos = computed(() => {
    const letras = ['A', 'B', 'C', 'D', 'E', 'F'];
    let flat = 0;
    return OPERACIONES.map((grupo, g) => ({
      key: grupo.key,
      label: grupo.label,
      letter: letras[g] ?? String(g + 1),
      media: grupo.media.map((m) => ({
        ...m,
        src: m.type === 'image' ? this.urlOptimizada(m.src) : m.src,
        index: m.type === 'image' ? flat++ : -1,
      })),
    }));
  });

  /** Vista plana (solo imágenes) para la navegación del lightbox. */
  readonly operacionesImages = computed(() =>
    OPERACIONES.flatMap((grupo) =>
      grupo.media
        .filter((m) => m.type === 'image')
        .map((m) => ({ ...m, src: this.urlOptimizada(m.src) })),
    ),
  );

  /** Índice (sobre `operacionesImages`) abierto en el lightbox; null = cerrado. */
  readonly lightboxIndex = signal<number | null>(null);

  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
  }

  closeLightbox(): void {
    this.lightboxIndex.set(null);
  }

  stepLightbox(direction: 1 | -1): void {
    const current = this.lightboxIndex();
    const total = this.operacionesImages().length;
    if (current === null || total === 0) return;
    this.lightboxIndex.set((current + direction + total) % total);
  }

  lightboxImageUrl(): string {
    const index = this.lightboxIndex();
    const images = this.operacionesImages();
    return index !== null && images[index] ? images[index].src : '';
  }

  lightboxImageAlt(): string {
    const index = this.lightboxIndex();
    const images = this.operacionesImages();
    return index !== null && images[index] ? images[index].alt : '';
  }

  lightboxPosition(): string {
    const index = this.lightboxIndex();
    const total = this.operacionesImages().length;
    return index !== null ? `${index + 1} / ${total}` : '';
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
}