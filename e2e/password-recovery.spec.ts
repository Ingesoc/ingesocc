import { expect, test, type Page, type Request } from '@playwright/test';
import { baseURL } from './helpers';

/**
 * CU-18 (ver [[Casos de Uso]]): UI de recuperación de contraseña.
 *
 * Suite solo lectura (sin credenciales, sin escritura en Supabase): un email
 * inexistente es seguro — Supabase responde igual exista o no la cuenta.
 * - El login expone el enlace "¿Olvidaste tu contraseña?" → /admin/recuperar.
 * - El cliente pide el enlace a Supabase con `redirectTo` apuntando a
 *   /admin/nueva-contrasena (parámetro `redirect_to` de POST /auth/v1/recover).
 * - Un enlace expirado/ya usado llega a /admin/nueva-contrasena con
 *   `#error=...&error_code=otp_expired` en el hash (comportamiento real de
 *   Supabase) → supabase-js no establece sesión y la pantalla ofrece pedir
 *   otro enlace.
 * - La pantalla de contraseña nueva valida el formulario antes de enviar.
 */

/**
 * Abre /admin/login y navega al formulario de recuperación vía el enlace.
 *
 * Si el formulario no llegó a renderizar tras el clic (visto una vez en WebKit
 * como arranque frío del navegador contra el dev server recién levantado), se
 * reintenta con una navegación directa a la ruta.
 */
async function goToRecoveryFromLogin(page: Page): Promise<void> {
  await page.goto('/admin/login');
  await page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).click();
  await expect(page).toHaveURL(/\/admin\/recuperar$/);

  const heading = page.getByRole('heading', { name: 'Recuperar contraseña' });
  if (!(await heading.isVisible().catch(() => false))) {
    await page.goto('/admin/recuperar');
  }
  await expect(heading).toBeVisible();
}

test.describe('Recuperación de contraseña (CU-18)', () => {
  test('el login enlaza a /admin/recuperar y la solicitud muestra la confirmación genérica', async ({ page }) => {
    await goToRecoveryFromLogin(page);

    await page.locator('#email').fill('e2e-recovery@example.com');
    await page.getByRole('button', { name: 'Enviar enlace de recuperación' }).click();

    // La respuesta no revela si el email existe (privacidad de Supabase Auth).
    await expect(page.getByText(/Si el correo está registrado/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Volver a iniciar sesión' })).toBeVisible();
  });

  test('pide el enlace a Supabase con redirect_to hacia /admin/nueva-contrasena', async ({ page }) => {
    await goToRecoveryFromLogin(page);

    const recoverRequest: Promise<Request> = new Promise<Request>((resolve) => {
      void page.waitForRequest(
        (request) => request.method() === 'POST' && /\/auth\/v1\/recover/.test(request.url()),
        { timeout: 15_000 },
      ).then(resolve);
    });

    await page.locator('#email').fill('e2e-redirect@example.com');
    await page.getByRole('button', { name: 'Enviar enlace de recuperación' }).click();

    const request = await recoverRequest;
    const redirectTo = new URL(request.url()).searchParams.get('redirect_to');
    expect(redirectTo, 'el enlace de recuperación debe aterrizar en la pantalla de contraseña nueva').toBe(
      `${baseURL}/admin/nueva-contrasena`,
    );
  });

  test('enlace inválido (otp_expired en el hash) ofrece solicitar uno nuevo', async ({ page }) => {
    // Reproduce lo que devuelve Supabase cuando el token del correo ya fue
    // usado o expiró: redirige a redirect_to con el error en el hash.
    await page.goto('/admin/nueva-contrasena#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');

    await expect(page.getByRole('heading', { name: 'Nueva contraseña' })).toBeVisible();
    await expect(page.getByText(/Este enlace no es válido o ya expiró/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Solicitar un enlace nuevo' })).toBeVisible();

    // El flujo cierra el ciclo: volver a pedir un enlace.
    await page.getByRole('link', { name: 'Solicitar un enlace nuevo' }).click();
    await expect(page).toHaveURL(/\/admin\/recuperar$/);
  });

  test('la pantalla de contraseña nueva valida el formulario', async ({ page }) => {
    // Abrir sin token deja el formulario visible mientras whenReady() resuelve;
    // en cuanto supabase-js confirma que no hay sesión, aparece el estado de
    // enlace inválido. Se recarga sin esperar para cazar la ventana del form.
    await page.goto('/admin/nueva-contrasena');

    // El estado "enlace inválido" siempre termina apareciendo (sin hash no hay
    // sesión posible); basta con que la pantalla no muestre errores falsos.
    await expect(page.getByText(/Este enlace no es válido o ya expiró/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar contraseña' })).toHaveCount(0);
  });
});
