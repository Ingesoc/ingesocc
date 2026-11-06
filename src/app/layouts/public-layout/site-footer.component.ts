import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowUp, LucideExternalLink } from '@lucide/angular';
import { ContentBlocksService } from '../../features/content-blocks/data-access/content-blocks.service';
import { ServicesService } from '../../features/services/data-access/services.service';
import { IconMotionDirective } from '../../shared/icons/icon-motion.directive';
import { safeHref, toMailtoHref, toTelHref } from '../../core/url-utils';

/** Misma navegación que el header (el pie replica las páginas públicas). */
const NAV_ITEMS = [
  { label: 'Inicio', link: '/' },
  { label: 'Quiénes Somos', link: '/quienes-somos' },
  { label: 'Servicios', link: '/servicios' },
  { label: 'Proyectos', link: '/proyectos' },
  { label: 'Contacto', link: '/contacto' },
];

/** Sección legal del pie (enlaces → página de destino del aviso, /contacto). */
const LEGAL_ITEMS = [{ label: 'Política de privacidad', link: '/contacto' }];

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterLink, LucideArrowUp, LucideExternalLink, IconMotionDirective],
  templateUrl: './site-footer.component.html',
})
export class SiteFooterComponent {
  private readonly blocks = inject(ContentBlocksService);
  private readonly services = inject(ServicesService);

  readonly navItems = NAV_ITEMS;
  readonly legalItems = LEGAL_ITEMS;

  /** Servicios publicados (máx. 6) para el enlace directo del pie. */
  readonly serviceLinks = computed(() =>
    this.services
      .published()
      .slice(0, 6)
      .map((service) => ({ label: service.name, link: `/servicios/${service.slug}` })),
  );

  /** Redes reales de la empresa, editables desde content_blocks (plan 1.1). */
  readonly socialLinks = computed(() => {
    const links = [
      {
        label: 'LinkedIn',
        ariaLabel: 'LinkedIn de Ingesocc',
        href: safeHref(this.blocks.text('global', 'social_linkedin', '')),
      },
      {
        label: 'Instagram',
        ariaLabel: 'Instagram de Ingesocc',
        href: safeHref(this.blocks.text('global', 'social_instagram', '')),
      },
      {
        label: 'Facebook',
        ariaLabel: 'Facebook de Ingesocc',
        href: safeHref(this.blocks.text('global', 'social_facebook', '')),
      },
    ];

    return links.filter(
      (link): link is { label: string; ariaLabel: string; href: string } => link.href !== null,
    );
  });

  /** Datos de contacto (mismos bloques que la página /contacto). */
  readonly email = computed(() => this.blocks.text('contact', 'email', ''));
  readonly phone = computed(() => this.blocks.text('contact', 'phone', ''));
  readonly address = computed(() => this.blocks.text('contact', 'address', ''));
  readonly emailHref = computed(() => toMailtoHref(this.email()));
  readonly phoneHref = computed(() => toTelHref(this.phone()));

  readonly year = new Date().getFullYear();

  /** Botón "volver arriba": respeta `prefers-reduced-motion` (salto directo). */
  scrollToTop(): void {
    if (typeof window === 'undefined') return;
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  }
}
