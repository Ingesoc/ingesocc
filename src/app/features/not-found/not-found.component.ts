import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowUpRight, LucideArrowLeft } from '@lucide/angular';

/** Página 404: mantiene el chrome del sitio (header/footer) y ofrece salidas. */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, LucideArrowUpRight, LucideArrowLeft],
  templateUrl: './not-found.component.html',
})
export class NotFoundComponent {}