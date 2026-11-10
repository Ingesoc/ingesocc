import { Component, DestroyRef, ElementRef, HostListener, computed, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { LucideArrowUpRight } from '@lucide/angular';
import { ContentBlocksService } from '../../features/content-blocks/data-access/content-blocks.service';
import { MorphIconComponent, CLOSE_PATH, MENU_PATH } from '../../core/morph-icon.component';

/** Navegación única del sitio, 100% en español. */
const NAV_ITEMS = [
  { label: 'Inicio', link: '/' },
  { label: 'Quiénes Somos', link: '/quienes-somos' },
  { label: 'Servicios', link: '/servicios' },
  { label: 'Proyectos', link: '/proyectos' },
  { label: 'Contacto', link: '/contacto' },
];

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [NgClass, RouterLink, RouterLinkActive, LucideArrowUpRight, MorphIconComponent],
  templateUrl: './site-header.component.html',
})
export class SiteHeaderComponent {
  private readonly blocks = inject(ContentBlocksService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly menuButton = viewChild<ElementRef<HTMLButtonElement>>('menuButton');
  private readonly mobileMenu = viewChild<ElementRef<HTMLElement>>('mobileMenu');

  readonly navItems = NAV_ITEMS;
  readonly menuOpen = signal(false);

  /** True cuando la página se ha desplazado: el header pasa a sólido (sticky). */
  readonly isScrolled = signal(false);

  /** Iconos del botón de menú móvil (morph ☰ ↔ ✕). */
  readonly menuIcon = MENU_PATH;
  readonly closeIcon = CLOSE_PATH;

  /** Label único del botón de cotizar, reutilizado en todos los headers. */
  readonly ctaLabel = computed(() => this.blocks.text('global', 'cta_label', 'Solicitar Cotización'));

  /** Umbral en píxeles a partir del cual el header deja de ser transparente. */
  private readonly solidAt = 24;

  private scrollQueued = false;

  constructor() {
    // El menú móvil se cierra al navegar a otra ruta.
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.menuOpen.set(false));

    // Bloquea el scroll del documento mientras el menú móvil está abierto (WCAG 2.4.11).
    effect((onCleanup) => {
      if (typeof document === 'undefined') return;
      document.body.style.overflow = this.menuOpen() ? 'hidden' : '';
      onCleanup(() => {
        document.body.style.overflow = '';
      });
    });

    // Al abrir, lleva el foco al primer enlace del menú (el `viewChild` se
    // resuelve después del render; el efecto se reevalúa cuando aparece).
    effect(() => {
      if (!this.menuOpen()) return;
      const menu = this.mobileMenu()?.nativeElement;
      menu?.querySelector<HTMLElement>('a[href], button:not([disabled])')?.focus();
    });
  }

  @HostListener('window:scroll', [])
  private onScroll(): void {
    if (this.scrollQueued) return;
    this.scrollQueued = true;
    requestAnimationFrame(() => {
      this.scrollQueued = false;
      this.isScrolled.set(window.scrollY > this.solidAt);
    });
  }

  @HostListener('document:keydown.escape')
  private onEscape(): void {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    this.menuButton()?.nativeElement.focus();
  }

  @HostListener('document:keydown.tab', ['$event'])
  private onDocumentTab(event: KeyboardEvent): void {
    this.onMenuKeydown(event);
  }

  /**
   * Mantiene el foco dentro del menú móvil mientras está abierto (WCAG 2.4.3).
   * El ciclo incluye el botón de cierre, que vive en la barra superior.
   */
  onMenuKeydown(event: KeyboardEvent): void {
    if (!this.menuOpen() || event.key !== 'Tab') return;
    const menu = this.mobileMenu()?.nativeElement;
    if (!menu) return;

    const items = [
      this.menuButton()?.nativeElement,
      ...Array.from(
        menu.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ),
    ].filter((el): el is HTMLElement => el !== undefined && el.getClientRects().length > 0);

    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement as HTMLElement | null;
    const outside = !active || (!menu.contains(active) && active !== first);

    if (event.shiftKey) {
      if (outside || active === first) {
        event.preventDefault();
        last.focus();
      }
    } else if (outside || active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }
}
