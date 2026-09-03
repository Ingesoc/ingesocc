import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-admin-placeholder',
  standalone: true,
  templateUrl: './admin-placeholder.component.html',
})
export class AdminPlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  readonly title = toSignal(this.route.data.pipe(map((data) => data['title'] ?? 'Módulo')));
  readonly phase = toSignal(this.route.data.pipe(map((data) => data['phase'] ?? '')));
  readonly description = toSignal(this.route.data.pipe(map((data) => data['description'] ?? '')));
}