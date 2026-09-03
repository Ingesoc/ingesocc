import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SeoService } from './core/seo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {
  // Instancia SeoService desde el arranque: mantiene <title>/meta/canonical
  // por ruta en cada navegación (Fase 9, SEO básico).
  private readonly seo = inject(SeoService);
}