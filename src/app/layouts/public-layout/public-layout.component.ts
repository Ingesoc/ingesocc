import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeaderComponent } from './site-header.component';
import { SiteFooterComponent } from './site-footer.component';
import { MobileActionBarComponent } from './mobile-action-bar.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, SiteHeaderComponent, SiteFooterComponent, MobileActionBarComponent],
  templateUrl: './public-layout.component.html',
})
export class PublicLayoutComponent {}