import { Component, computed, inject } from '@angular/core';
import { ContentBlocksService } from '../content-blocks/data-access/content-blocks.service';
import { EditableTextComponent } from '../content-blocks/editable-text.component';
import { EditableImageComponent } from '../content-blocks/editable-image.component';

/** Slots fijos del timeline (plan 1.4): el admin edita el contenido, no la estructura. */
const TIMELINE_KEYS = ['item1', 'item2', 'item3', 'item4'] as const;

/** Slots fijos del equipo (plan 1.4): 4 miembros editables, sin añadir/quitar sin cambio de código. */
const TEAM_KEYS = ['member1', 'member2', 'member3', 'member4'] as const;

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [EditableTextComponent, EditableImageComponent],
  templateUrl: './about.component.html',
})
export class AboutComponent {
  private readonly blocks = inject(ContentBlocksService);

  readonly heroTitle = computed(() => this.blocks.text('about', 'hero.title', 'Quiénes Somos'));
  readonly heroSubtitle = computed(() => this.blocks.text('about', 'hero.subtitle', ''));
  readonly historiaImage = computed(() => this.blocks.image('about', 'historia.image'));
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

  readonly team = computed(() =>
    TEAM_KEYS.map((key) => ({
      key,
      name: this.blocks.text('about', `equipo.${key}.name`),
      role: this.blocks.text('about', `equipo.${key}.role`),
      photo: this.blocks.image('about', `equipo.${key}.photo`),
    })),
  );
}