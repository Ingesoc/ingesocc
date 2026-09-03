import { Component, inject } from '@angular/core';
import { ServiceCardComponent } from './service-card.component';
import { ServicesService } from '../data-access/services.service';

@Component({
  selector: 'app-services-page',
  standalone: true,
  imports: [ServiceCardComponent],
  templateUrl: './services-page.component.html',
})
export class ServicesPageComponent {
  readonly services = inject(ServicesService).published;
}