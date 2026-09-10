import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './data-access/auth.service';

/**
 * CU-18 (paso 1): solicitud de recuperación de contraseña.
 *
 * Pide el email y llama a `AuthService.requestPasswordReset`. Supabase envía
 * el correo con el enlace de recuperación; por seguridad la respuesta es la
 * misma exista o no la cuenta, así que se muestra siempre la confirmación
 * genérica (nunca se revela si el email está registrado).
 */
@Component({
  selector: 'app-recovery-request',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './recovery-request.component.html',
})
export class RecoveryRequestComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  readonly error = signal('');
  readonly loading = signal(false);
  readonly sent = signal(false);

  async ngOnInit(): Promise<void> {
    // La pantalla es pública: si un admin con sesión activa cae aquí, lo llevamos
    // al panel (misma convención que /admin/login).
    await this.auth.whenReady();
    if (this.auth.isAdmin()) {
      await this.router.navigate(['/admin']);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      await this.auth.requestPasswordReset(this.form.value.email ?? '');
      this.sent.set(true);
    } catch (err) {
      this.error.set(
        err instanceof Error ? err.message : 'No se pudo enviar el correo de recuperación.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  async backToLogin(): Promise<void> {
    await this.router.navigate(['/admin/login']);
  }
}
