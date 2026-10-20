import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LineDrawDirective } from './line-draw.directive';

@Component({
  standalone: true,
  imports: [LineDrawDirective],
  template: '<span appLineDraw></span>',
})
class HostComponent {}

describe('LineDrawDirective', () => {
  it('siempre añade la clase base "line-draw"', () => {
    const fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('span');
    expect(el.classList.contains('line-draw')).toBeTrue();
  });

  it('con reduced-motion dibuja la línea completa sin animación', () => {
    const fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('span');
    expect(el.classList.contains('line-drawn')).toBeTrue();
    expect(el.classList.contains('line-scroll')).toBeFalse();
  });

  it('desconecta el observer al destruir (sin fugas)', () => {
    const fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(HostComponent);
    fixture.detectChanges();
    expect(() => fixture.destroy()).not.toThrow();
  });
});
