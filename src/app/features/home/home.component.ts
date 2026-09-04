import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowUpRight, LucideChevronDown } from '@lucide/angular';
import { ContentBlocksService } from '../content-blocks/data-access/content-blocks.service';
import { EditableTextComponent } from '../content-blocks/editable-text.component';
import { EditableImageComponent } from '../content-blocks/editable-image.component';
import { ProjectsService } from '../projects/data-access/projects.service';
import { ServicesService } from '../services/data-access/services.service';
import { ProjectCardComponent } from '../projects/public/project-card.component';

/** Composición editorial del mosaico de destacados (Home).
 *
 *  Bloques de 3 tarjetas que se alternan para que 6+ proyectos no repitan
 *  ritmo visual:
 *    - Bloque A (apaisado): un protagonista grande 7×2 + dos apaisados 5/5.
 *    - Bloque B (vertical): tres tarjetas altas 4×2.
 *  Si el total no es múltiplo de 3, el resto se resuelve sin dejar huecos
 *  en la cuadrícula: 1 → banda completa 12×2; 2 → dos mitades 6×2.
 */
const BLOCK_A = ['md:col-span-7 md:row-span-2', 'md:col-span-5', 'md:col-span-5'];
const BLOCK_B = ['md:col-span-4 md:row-span-2', 'md:col-span-4 md:row-span-2', 'md:col-span-4 md:row-span-2'];

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

  /** Span de la tarjeta `index` dentro del mosaico (ver patrón arriba). */
  masonryClass(index: number, total: number): string {
    const full = Math.floor(total / 3) * 3;
    if (index < full) {
      const group = Math.floor(index / 3);
      return (group % 2 === 0 ? BLOCK_A : BLOCK_B)[index % 3];
    }
    const tail = total - full; // total % 3 ∈ {1, 2}
    return tail === 1 ? 'md:col-span-12 md:row-span-2' : 'md:col-span-6 md:row-span-2';
  }
}