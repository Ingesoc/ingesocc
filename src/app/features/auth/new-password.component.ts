import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './data-access/auth.service';

/**
 * CU-18 (paso 2): definición de la contraseña nueva.
 *
 * Supabase redirige aquí desde el correo de recuperación; con
 * `detectSessionInUrl: true` supabase-js consume el token del hash, establece
 * una sesión (evento PASSWORD_RECOVERY) y esta pantalla aparece ya con sesión.
 * Si no hay sesión (enlace expirado, ya usado o abierto en otro navegador), se
 * ofrece solicitar un enlace nuevo.
 */
@Component({
  selector: 'app-new-password',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './new-password.component.html',
})
export class NewPasswordComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = new FormGroup({
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    confirm: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  readonly error = signal('');
  readonly loading = signal(false);
  readonly done = signal(false);
  /** true cuando el enlace no dejó sesión válida (expirado, usado u otro navegador). */
  readonly noSession = signal(false);

  async ngOnInit(): Promise<void> {
    // El token del hash se consume durante la restauración de la sesión; si al
    // terminar no hay sesión, el enlace no sirve y se ofrece pedir otro.
    await this.auth.whenReady();
    if (!this.auth.isAuthenticated()) {
      this.noSession.set(true);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const password = this.form.value.password ?? '';
    if (password !== (this.form.value.confirm ?? '')) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      await this.auth.updatePassword(password);
      this.done.set(true);
      // El admin sigue al panel; una cuenta sin rol admin vuelve al login
      // (el guard redirige igual, pero aquí se hace explícito y sin sesión ambigua).
      const destination = this.auth.isAdmin() ? '/admin' : '/admin/login';
      if (!this.auth.isAdmin()) {
        await this.auth.logout();
      }
      setTimeout(() => void this.router.navigate([destination]), 2500);
    } catch (err) {
      this.error.set(
        err instanceof Error ? err.message : 'No se pudo actualizar la contraseña.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  async requestNewLink(): Promise<void> {
    await this.router.navigate(['/admin/recuperar']);
  }
}
