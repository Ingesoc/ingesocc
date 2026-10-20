import { Component, input } from '@angular/core';

@Component({
  selector: 'app-section-heading',
  standalone: true,
  templateUrl: './section-heading.component.html',
})
export class SectionHeadingComponent {
  readonly eyebrow = input<string>('');
  readonly title = input<string>('');
  readonly description = input<string>('');
  readonly align = input<'left' | 'center'>('left');
  readonly id = input<string>('');
}
