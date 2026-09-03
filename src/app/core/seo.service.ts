import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

export const SITE_NAME = 'Ingesocc S.A.S.';

/**
 * Dominio público del sitio. TODO Fase 9: reemplazar por el dominio real de
 * Ingesocc antes del despliegue (ver README → Despliegue).
 */
export const SITE_URL = 'https://ingesocc.com';

const DEFAULT_DESCRIPTION =
  'Ingesocc S.A.S. — arquitectura, ingeniería y construcción con propósito. Obras de infraestructura, industria y salud en Colombia.';

/**
 * SEO básico (plan, Fase 9): mantiene <title>, meta description, Open Graph y
 * canonical actualizados según la ruta activa (CSR). Cada ruta pública lleva
 * `title`/`description` en su `data` (app.routes.ts).
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        const data = this.currentRouteData();
        this.set(String(data['title'] ?? ''), String(data['description'] ?? DEFAULT_DESCRIPTION));
      });
  }

  /** Datos de la ruta hoja activa (la más profunda del árbol). */
  private currentRouteData(): Record<string, unknown> {
    let route = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.snapshot.data ?? {};
  }

  /**
   * Aplica título, descripción, Open Graph y canonical a la página actual.
   * `urlOverride` permite fijar la URL canónica distinta de la actual (p. ej. la home).
   */
  set(pageTitle: string, description: string, urlOverride?: string): void {
    const fullTitle = pageTitle
      ? `${pageTitle} · ${SITE_NAME}`
      : `${SITE_NAME} — Construcción, Ingeniería y Arquitectura`;
    const url = urlOverride ?? `${SITE_URL}${this.router.url}`;

    this.title.setTitle(fullTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: `${SITE_URL}/logo/logo.png` });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });

    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }
}