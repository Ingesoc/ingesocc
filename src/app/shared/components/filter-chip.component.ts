import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-filter-chip',
  standalone: true,
  templateUrl: './filter-chip.component.html',
})
export class FilterChipComponent {
  readonly active = input(false);
  readonly label = input('');
  readonly ariaLabel = input<string>('');
  /** 'primary' (fondo `--primary`) o 'accent' (fondo `--accent`, texto oscuro). */
  readonly tone = input<'primary' | 'accent'>('primary');

  readonly clicked = output<void>();
}

