import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeaderComponent } from './site-header.component';
import { SiteFooterComponent } from './site-footer.component';
import { EditModeToggleComponent } from '../../features/content-blocks/edit-mode-toggle.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, SiteHeaderComponent, SiteFooterComponent, EditModeToggleComponent],
  templateUrl: './public-layout.component.html',
})
export class PublicLayoutComponent {}