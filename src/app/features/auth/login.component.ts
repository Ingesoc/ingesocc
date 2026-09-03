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

  ngOnInit(): void {
    if (this.auth.isAdmin()) {
      this.router.navigate(['/admin']);
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
      await this.router.navigate(['/admin']);
    } catch {
      this.error.set('Credenciales inválidas. Revisa el correo y la contraseña.');
    } finally {
      this.loading.set(false);
    }
  }
}