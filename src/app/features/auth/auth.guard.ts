import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './data-access/auth.service';

/**
 * Guard funcional de las rutas /admin/* (plan, sección 6):
 * exige sesión activa con rol `admin`; si no, redirige a /admin/login.
 *
 * Espera la restauración de la sesión persistida (whenReady) para que un
 * refresh/deep-link directo a /admin/* no rechace a un admin legítimo solo
 * porque la sesión aún se estaba restaurando.
 */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.whenReady();

  if (auth.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/admin/login']);
};