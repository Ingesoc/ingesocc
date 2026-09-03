import { expect, test } from '@playwright/test';
import { hasAdminCredentials, loginAsAdmin, uniqueSuffix } from './helpers';

/**
 * Flujo completo del formulario de contacto (plan Fase 7): envío público →
 * bandeja admin → marcar leído → eliminar. Requiere credenciales admin para
 * inspeccionar la bandeja (RLS) y limpiar el mensaje al final.
 */
test.describe('Contacto → Bandeja admin', () => {
  test.skip(!hasAdminCredentials, 'Requiere E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD (proyecto Supabase de pruebas).');

  test('envía mensaje desde el sitio y lo gestiona en /admin/mensajes', async ({ page }) => {
    const suffix = uniqueSuffix();
    const email = `e2e-${suffix}@example.com`;
    const name = 'Usuario E2E';
    const subject = `Mensaje E2E ${suffix}`;
    const message = 'Mensaje enviado por la suite E2E para validar el flujo de contacto y bandeja.';

    // ---- Envío público ----
    await page.goto('/contacto');
    await page.locator('#name').fill(name);
    await page.locator('#email').fill(email);
    await page.locator('#phone').fill('+57 300 000 0000');
    await page.locator('#subject').fill(subject);
    await page.locator('#message').fill(message);
    await page.getByRole('button', { name: 'Enviar mensaje' }).click();

    await expect(page.getByText('¡Gracias por escribirnos!')).toBeVisible();

    // ---- Bandeja admin ----
    await loginAsAdmin(page);
    await page.getByRole('navigation', { name: 'Navegación del panel' }).getByRole('link', { name: 'Mensajes' }).click();
    await expect(page).toHaveURL(/\/admin\/mensajes$/);

    const messageCard = page.locator('article', { hasText: email }).first();
    await expect(messageCard).toBeVisible();
    await expect(messageCard.getByText(subject)).toBeVisible();
    await expect(messageCard.getByText(message)).toBeVisible();

    // ---- Marcar leído ----
    await messageCard.getByRole('button', { name: 'Marcar leído' }).click();
    await expect(messageCard.getByRole('button', { name: 'Marcar no leído' })).toBeVisible();

    // Persistencia tras recargar.
    await page.reload();
    const reloadedCard = page.locator('article', { hasText: email }).first();
    await expect(reloadedCard).toBeVisible();
    await expect(reloadedCard.getByRole('button', { name: 'Marcar no leído' })).toBeVisible();

    // ---- Eliminar (cierra el ciclo sin dejar datos) ----
    page.on('dialog', (dialog) => void dialog.accept());
    await reloadedCard.getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.locator('article', { hasText: email })).toHaveCount(0);
  });
});
