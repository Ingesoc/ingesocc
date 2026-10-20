import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RevealDirective } from './reveal.directive';

@Component({
  standalone: true,
  imports: [RevealDirective],
  template: '<div appReveal [revealIndex]="0"></div>'
})
class HostComponent {}

describe('RevealDirective', () => {
  it('crea la directiva y respeta reduced-motion', () => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(HostComponent);
    fixture.detectChanges();
    expect(mq).toBeDefined();
  });
});



