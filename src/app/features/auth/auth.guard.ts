import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './data-access/auth.service';
// DEBUG TEMPORAL (diagnóstico panel admin): remover con debug-logger.ts.
import { debugLog } from '../../core/debug-logger';

/**
 * Guard funcional de las rutas /admin/* (plan, sección 6):
 * exige sesión activa con rol `admin`; si no, redirige a /admin/login.
 *
 * Espera la restauración de la sesión persistida (whenReady) para que un
 * refresh/deep-link directo a /admin/* no rechace a un admin legítimo solo
 * porque la sesión aún se estaba restaurando.
 */
export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  debugLog.log(`guard: /admin → ${state.url} — esperando whenReady()…`);
  const t0 = Date.now();
  await auth.whenReady();
  debugLog.log(`guard: whenReady resolvió en ${Date.now() - t0}ms — isAuthenticated=${auth.isAuthenticated()} isAdmin=${auth.isAdmin()}`);

  if (auth.isAdmin()) {
    debugLog.log(`guard: PASS → ${state.url}`);
    return true;
  }

  debugLog.warn(`guard: BLOQUEA ${state.url} → redirigiendo a /admin/login`);
  return router.createUrlTree(['/admin/login']);
};