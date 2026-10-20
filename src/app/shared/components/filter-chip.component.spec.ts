import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FilterChipComponent } from './filter-chip.component';

@Component({
  standalone: true,
  imports: [FilterChipComponent],
  template: `
    <app-filter-chip
      label="Edificaciones"
      [active]="active()"
      [tone]="tone()"
      (clicked)="count = count + 1"
    />
  `,
})
class HostComponent {
  readonly active = signal(true);
  readonly tone = signal<'primary' | 'accent'>('accent');
  count = 0;
}

describe('FilterChipComponent', () => {
  function create() {
    const fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('refleja el estado activo en aria-pressed y aplica el tono accent', () => {
    const fixture = create();
    const button = fixture.nativeElement.querySelector('button.chip') as HTMLButtonElement;
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.classList.contains('chip-active')).toBeTrue();
    expect(button.classList.contains('chip-accent')).toBeTrue();
  });

  it('emite clicked al pulsar', () => {
    const fixture = create();
    (fixture.nativeElement.querySelector('button.chip') as HTMLButtonElement).click();
    expect(fixture.componentInstance.count).toBe(1);
  });
});
