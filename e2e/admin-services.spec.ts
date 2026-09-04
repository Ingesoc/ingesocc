import { expect, test, type Page } from '@playwright/test';
import {
  acceptDialogs,
  hasAdminCredentials,
  loginAsAdmin,
  slugify,
  uniqueSuffix,
} from './helpers';

/**
 * Flujo completo admin de servicios (plan Fase 4): login → crear (con ícono y
 * foto) → verificar en público → editar (descripción e ícono) → quitar foto →
 * verificar fallback de ícono → eliminar. Requiere credenciales admin.
 *
 * Si el test falla a mitad de camino puede dejar un servicio huérfano en el
 * proyecto de pruebas (igual que el spec de proyectos); se limpia al completar.
 */
test.describe('Admin · CRUD de servicios', () => {
  test.skip(!hasAdminCredentials, 'Requiere E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD (proyecto Supabase de pruebas).');

  /** PNG 1×1 válido (imagen mínima para el upload; se comprime igual que una real). */
  const TEST_PHOTO = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );

  async function openServices(page: Page): Promise<void> {
    await loginAsAdmin(page);
    await page.getByRole('navigation', { name: 'Navegación del panel' }).getByRole('link', { name: 'Servicios' }).click();
    await expect(page).toHaveURL(/\/admin\/servicios$/);
  }

  /** Fila del listado admin que contiene el nombre del servicio. */
  function rowForService(page: Page, name: string) {
    return page
      .locator('div.grid')
      .filter({ has: page.getByText(name, { exact: true }) })
      .first();
  }

  /** Card del servicio en el sitio público (/servicios). */
  function publicCard(page: Page, name: string) {
    return page.locator('article', { hasText: name }).first();
  }

  test('crea (con ícono y foto), edita, verifica el fallback de ícono y elimina un servicio', async ({ page }) => {
    const suffix = uniqueSuffix();
    const name = `E2E Servicio ${suffix}`;
    const slug = `e2e-servicio-${slugify(suffix)}`;
    const description = 'Servicio creado por la suite E2E para validar el CRUD completo con foto e ícono.';
    const editedDescription = 'Descripción editada por la suite E2E para validar la edición.';

    await openServices(page);
    acceptDialogs(page);

    // ---- Crear (con ícono de respaldo + foto) ----
    await page.getByRole('button', { name: 'Nuevo servicio' }).click();
    await expect(page).toHaveURL(/\/admin\/servicios\/nuevo$/);

    await page.locator('#name').fill(name);
    await page.locator('#description').fill(description);
    await page.locator('#iconName').selectOption('hard-hat');
    await page.locator('#status').selectOption('published');
    await page.locator('input[type="file"]').setInputFiles({
      name: 'servicio-e2e.png',
      mimeType: 'image/png',
      buffer: TEST_PHOTO,
    });
    // Espera a que la foto quede procesada (el botón se deshabilita mientras
    // se comprime; la preview solo aparece cuando photo() ya está asignada).
    await expect(page.locator('img[alt="Foto del servicio"]')).toBeVisible();
    await page.getByRole('button', { name: 'Crear servicio' }).click();

    // Vuelve al listado con el servicio creado y su foto persistida.
    await expect(page).toHaveURL(/\/admin\/servicios$/);
    await expect(page.getByText(name, { exact: true })).toBeVisible();

    // ---- Verificar publicación en el sitio público (card con foto) ----
    await page.goto('/servicios');
    const card = publicCard(page, name);
    await expect(card.getByRole('heading', { name, exact: false })).toBeVisible();
    await expect(card.getByText(description, { exact: false })).toBeVisible();
    await expect(card.locator('img[alt="' + name + '"]')).toBeVisible();

    // ---- Editar (descripción + cambio de ícono de respaldo) ----
    await page.goto('/admin/servicios');
    await rowForService(page, name).getByRole('link', { name: 'Editar' }).click();
    await expect(page).toHaveURL(/\/admin\/servicios\/[0-9a-f-]+$/);

    await page.locator('#description').fill(editedDescription);
    await page.locator('#iconName').selectOption('warehouse');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page).toHaveURL(/\/admin\/servicios$/);

    // La edición quedó persistida (visible en el sitio público).
    await page.goto('/servicios');
    await expect(publicCard(page, name).getByText(editedDescription, { exact: false })).toBeVisible();

    // ---- Quitar la foto: debe mostrarse el ícono de respaldo en la card ----
    await page.goto('/admin/servicios');
    await rowForService(page, name).getByRole('link', { name: 'Editar' }).click();
    await page.getByTitle('Quitar foto').click();
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page).toHaveURL(/\/admin\/servicios$/);

    await page.goto('/servicios');
    const iconCard = publicCard(page, name);
    await expect(iconCard.getByRole('heading', { name, exact: false })).toBeVisible();
    // Sin foto: la card no debe contener <img> (usa el ícono de respaldo).
    await expect(iconCard.locator('img')).toHaveCount(0);

    // ---- Eliminar ----
    await page.goto('/admin/servicios');
    await rowForService(page, name).getByRole('button', { name: 'Eliminar' }).click();

    await expect(page.getByText(name, { exact: true })).toHaveCount(0);

    // El servicio borrado ya no está público.
    await page.goto('/servicios');
    await expect(page.locator('article', { hasText: name })).toHaveCount(0);
  });
});