import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CounterDirective } from './counter.directive';

@Component({
  standalone: true,
  imports: [CounterDirective],
  template: '<span [appCounter]="42" counterSuffix="k"></span>'
})
class HostComponent {}

describe('CounterDirective', () => {
  it('muestra valor final bajo reduced-motion', () => {
    const fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('span');
    expect(el.textContent).toContain('42');
  });
});


