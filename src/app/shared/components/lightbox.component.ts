import { Component, computed, effect, ElementRef, HostListener, input, output, viewChild } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight, LucideX } from '@lucide/angular';

export interface LightboxImage {
  url?: string;
  src?: string;
  alt?: string;
  title?: string;
  description?: string;
  category?: string;
}

/** Distancia mínima (px) para considerar un gesto táctil como swipe. */
const SWIPE_THRESHOLD = 40;

@Component({
  selector: 'app-lightbox',
  standalone: true,
  imports: [LucideChevronLeft, LucideChevronRight, LucideX],
  templateUrl: './lightbox.component.html',
})
export class LightboxComponent {
  readonly images = input<LightboxImage[]>([]);
  readonly openIndex = input<number | null>(null);

  readonly lightboxClose = output<void>();
  readonly indexChange = output<number | null>();

  private readonly dialog = viewChild<ElementRef<HTMLElement>>('lightboxDialog');
  private lastFocused: HTMLElement | null = null;
  private touchStartX: number | null = null;

  readonly current = computed(() => {
    const idx = this.openIndex();
    const imgs = this.images();
    if (idx === null || idx < 0 || idx >= imgs.length) return null;
    return imgs[idx];
  });

  readonly total = computed(() => this.images().length);
  readonly hasMultiple = computed(() => this.total() > 1);

  /** Etiqueta accesible de la imagen actual: "Imagen X de N" + alt si existe. */
  readonly imageLabel = computed(() => {
    const idx = this.openIndex();
    if (idx === null || this.total() === 0) return '';
    const alt = this.imageAlt(this.current());
    return `Imagen ${idx + 1} de ${this.total()}${alt ? `: ${alt}` : ''}`;
  });

  constructor() {
    // Bloqueo del scroll del fondo mientras el diálogo está abierto.
    effect((onCleanup) => {
      const open = this.openIndex() !== null;
      if (typeof document === 'undefined') return;
      const body = document.body;
      body.style.overflow = open ? 'hidden' : '';
      onCleanup(() => {
        body.style.overflow = '';
      });
    });

    // Al abrir: guarda el foco previo y mueve el foco al diálogo.
    effect(() => {
      const open = this.openIndex() !== null;
      const dlg = this.dialog();
      if (open) {
        this.lastFocused = typeof document !== 'undefined' ? (document.activeElement as HTMLElement) : null;
        setTimeout(() => dlg?.nativeElement.focus({ preventScroll: true }));
      }
    });

    // Precarga las imágenes vecinas para navegar sin esperas.
    effect(() => {
      const idx = this.openIndex();
      const imgs = this.images();
      if (idx === null || imgs.length < 2 || typeof document === 'undefined' || typeof Image === 'undefined') {
        return;
      }
      for (const offset of [1, -1]) {
        const url = this.imageUrl(imgs[(idx + offset + imgs.length) % imgs.length]);
        if (url) {
          const preload = new Image();
          preload.decoding = 'async';
          preload.src = url;
        }
      }
    });
  }

  imageUrl(img: LightboxImage | null): string {
    if (!img) return '';
    return img.url ?? img.src ?? '';
  }

  imageAlt(img: LightboxImage | null): string {
    if (!img) return '';
    return img.alt ?? img.title ?? '';
  }

  position(idx: number | null, total: number): string {
    if (idx === null || total === 0) return '';
    return `${idx + 1} / ${total}`;
  }

  closeLightbox(): void {
    this.lightboxClose.emit();
    if (this.lastFocused) {
      this.lastFocused.focus();
      this.lastFocused = null;
    }
  }

  next(): void {
    const idx = this.openIndex();
    const t = this.total();
    if (idx === null || t === 0) return;
    const ni = (idx + 1) % t;
    this.indexChange.emit(ni);
  }

  prev(): void {
    const idx = this.openIndex();
    const t = this.total();
    if (idx === null || t === 0) return;
    const ni = (idx - 1 + t) % t;
    this.indexChange.emit(ni);
  }

  stop(event: Event): void {
    event.stopPropagation();
  }

  /** Swipe horizontal en móvil: derecha = anterior, izquierda = siguiente. */
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0]?.clientX ?? null;
  }

  onTouchEnd(event: TouchEvent): void {
    if (this.touchStartX === null) return;
    const dx = (event.changedTouches[0]?.clientX ?? 0) - this.touchStartX;
    this.touchStartX = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD || !this.hasMultiple()) return;
    if (dx < 0) this.next();
    else this.prev();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.openIndex() === null) return;
    if (event.key === 'Escape') {
      this.closeLightbox();
    } else if (event.key === 'ArrowRight') {
      this.next();
    } else if (event.key === 'ArrowLeft') {
      this.prev();
    } else if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  /** Atrapa el foco (Tab/Shift+Tab) dentro del diálogo mientras está abierto. */
  private trapFocus(event: KeyboardEvent): void {
    const dlg = this.dialog()?.nativeElement;
    if (!dlg) return;
    const focusables = Array.from(
      dlg.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
    ).filter((el) => !el.hasAttribute('disabled'));
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
    const focusInside = active ? dlg.contains(active) : false;
    if (event.shiftKey && (!focusInside || active === first)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (!focusInside || active === last)) {
      event.preventDefault();
      first.focus();
    }
  }
}
