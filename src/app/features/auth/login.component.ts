import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './data-access/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  readonly error = signal('');
  readonly loading = signal(false);

  async ngOnInit(): Promise<void> {
    // Espera la restauración de sesión: si un admin ya tiene sesión persistida
    // y cae directo a /admin/login, se le redirige al panel sin pedir login.
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
      await this.auth.login(this.form.value.email ?? '', this.form.value.password ?? '');

      // La sesión es válida pero el usuario no tiene rol admin: no entrar al
      // panel (el guard lo bloquearía igual); se le informa y se cierra sesión
      // para que la cuenta no quede en un estado ambiguo.
      if (!this.auth.isAdmin()) {
        await this.auth.logout();
        this.error.set(
          'Tu usuario no tiene permisos de administración. Contacta al administrador del sitio.',
        );
        return;
      }

      await this.router.navigate(['/admin']);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      this.loading.set(false);
    }
  }
}