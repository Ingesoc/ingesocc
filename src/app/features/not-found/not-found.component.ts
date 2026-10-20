import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowUpRight, LucideArrowLeft } from '@lucide/angular';
import { IconMotionDirective, RevealDirective } from '../../shared/icons';

/** Página 404: mantiene el chrome del sitio (header/footer) y ofrece salidas. */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, LucideArrowUpRight, LucideArrowLeft, IconMotionDirective, RevealDirective],
  templateUrl: './not-found.component.html',
})
export class NotFoundComponent {}