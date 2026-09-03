import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './data-access/auth.service';

/**
 * Guard funcional de las rutas /admin/* (plan, sección 6):
 * exige sesión activa con rol `admin`; si no, redirige a /admin/login.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/admin/login']);
};