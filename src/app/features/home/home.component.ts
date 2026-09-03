import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowUpRight, LucideChevronDown } from '@lucide/angular';
import { ContentBlocksService } from '../content-blocks/data-access/content-blocks.service';
import { EditableTextComponent } from '../content-blocks/editable-text.component';
import { EditableImageComponent } from '../content-blocks/editable-image.component';
import { ProjectsService } from '../projects/data-access/projects.service';
import { ServicesService } from '../services/data-access/services.service';
import { ProjectCardComponent } from '../projects/public/project-card.component';

/** Patrón del masonry de proyectos destacados (mismo lenguaje visual del diseño actual). */
const MASONRY_CLASSES = [
  'md:col-span-7 md:row-span-2',
  'md:col-span-5',
  'md:col-span-5',
  'md:col-span-7 md:row-span-2',
  'md:col-span-5',
  'md:col-span-5',
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, LucideArrowUpRight, LucideChevronDown, ProjectCardComponent, EditableTextComponent, EditableImageComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private readonly blocks = inject(ContentBlocksService);
  private readonly projects = inject(ProjectsService);
  private readonly services = inject(ServicesService);

  readonly heroTitle = computed(() => this.blocks.text('home', 'hero.title', 'Construimos espacios que trascienden.'));
  readonly heroSubtitle = computed(() => this.blocks.text('home', 'hero.subtitle', ''));
  readonly heroCtaLabel = computed(() => this.blocks.text('home', 'hero.cta_label', 'Hablemos'));
  readonly heroBackground = computed(() => this.blocks.image('home', 'hero.background_image', ''));

  readonly years = computed(() => this.blocks.number('home', 'stats.years_experience', 15));
  readonly projectsExecuted = computed(() => this.blocks.number('home', 'stats.projects_executed', 120));
  readonly sectorsServed = computed(() => this.blocks.number('home', 'stats.sectors_served', 8));

  readonly capacidadTitle = computed(() => this.blocks.text('home', 'capacidad.title', 'Nuestra Capacidad a su Servicio'));
  readonly capacidadDescription = computed(() => this.blocks.text('home', 'capacidad.description', ''));
  readonly capacidadCards = computed(() => [
    {
      key: 'card1',
      title: this.blocks.text('home', 'capacidad.card1.title'),
      description: this.blocks.text('home', 'capacidad.card1.description'),
    },
    {
      key: 'card2',
      title: this.blocks.text('home', 'capacidad.card2.title'),
      description: this.blocks.text('home', 'capacidad.card2.description'),
    },
    {
      key: 'card3',
      title: this.blocks.text('home', 'capacidad.card3.title'),
      description: this.blocks.text('home', 'capacidad.card3.description'),
    },
  ]);

  readonly ctaTitle = computed(() => this.blocks.text('home', 'cta.title', '¿Tiene un proyecto en mente?'));
  readonly ctaLabel = computed(() => this.blocks.text('global', 'cta_label', 'Solicitar Cotización'));

  /** Solo `featured = true`, ordenados por sort_order (plan 1.2.2). */
  readonly featuredProjects = this.projects.featured;

  readonly previewServices = computed(() => this.services.published().slice(0, 3));

  masonryClass(index: number): string {
    return MASONRY_CLASSES[index % MASONRY_CLASSES.length];
  }
}