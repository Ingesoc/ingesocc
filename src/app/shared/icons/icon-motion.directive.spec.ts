import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IconMotionDirective } from './icon-motion.directive';

@Component({
  standalone: true,
  imports: [IconMotionDirective],
  template: '<svg appIconMotion="nudge-x" iconTrigger="hover"></svg>'
})
class HostComponent {}

describe('IconMotionDirective', () => {
  it('establece atributos data-*', () => {
    const fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(HostComponent);
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('data-icon-motion')).toBe('nudge-x');
    expect(svg.getAttribute('data-icon-trigger')).toBe('hover');
  });
});



