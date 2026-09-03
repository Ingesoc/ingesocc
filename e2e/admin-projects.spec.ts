import { expect, test, type Page } from '@playwright/test';
import {
  acceptDialogs,
  hasAdminCredentials,
  loginAsAdmin,
  slugify,
  uniqueSuffix,
} from './helpers';

/**
 * Flujo completo admin de proyectos (plan Fase 4): login → crear → editar →
 * publicar → verificar público → eliminar. Requiere credenciales admin.
 */
test.describe('Admin · CRUD de proyectos', () => {
  test.skip(!hasAdminCredentials, 'Requiere E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD (proyecto Supabase de pruebas).');

  async function openProjects(page: Page): Promise<void> {
    await loginAsAdmin(page);
    await page.getByRole('navigation', { name: 'Navegación del panel' }).getByRole('link', { name: 'Proyectos' }).click();
    await expect(page).toHaveURL(/\/admin\/proyectos$/);
  }

  /** Fila del listado admin que contiene el título del proyecto. */
  function rowForProject(page: Page, title: string) {
    return page
      .locator('div.grid')
      .filter({ has: page.getByText(title, { exact: true }) })
      .first();
  }

  test('crea, edita, publica, verifica en público y elimina un proyecto', async ({ page }) => {
    const suffix = uniqueSuffix();
    const title = `E2E Proyecto ${suffix}`;
    const slug = `e2e-proyecto-${slugify(suffix)}`;
    const description = 'Proyecto creado por la suite E2E para validar el flujo completo del CRUD.';
    const editedDescription = 'Descripción editada por la suite E2E para validar la edición.';

    await openProjects(page);
    acceptDialogs(page);

    // ---- Crear ----
    await page.getByRole('button', { name: 'Nuevo proyecto' }).click();
    await expect(page).toHaveURL(/\/admin\/proyectos\/nuevo$/);

    await page.locator('#title').fill(title);
    await page.locator('#description').fill(description);
    await page.locator('#status').selectOption('published');
    await page.getByText('Destacado en el Home').click();
    await page.getByRole('button', { name: 'Crear proyecto' }).click();

    // Vuelve al listado con el proyecto creado.
    await expect(page).toHaveURL(/\/admin\/proyectos$/);
    await expect(page.getByText(title)).toBeVisible();

    // ---- Verificar publicación en el sitio público ----
    await page.goto(`/proyectos/${slug}`);
    await expect(page.getByRole('heading', { name: title, exact: false })).toBeVisible();
    await expect(page.getByText('Valor de la obra:', { exact: false }).or(page.getByText(description, { exact: false }))).toBeVisible();

    // ---- Editar (desde el listado admin) ----
    await page.goto('/admin/proyectos');
    const row = rowForProject(page, title);
    await row.getByRole('link', { name: 'Editar' }).click();
    await expect(page).toHaveURL(/\/admin\/proyectos\/[0-9a-f-]+$/);

    await page.locator('#description').fill(editedDescription);
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page).toHaveURL(/\/admin\/proyectos$/);

    // La edición quedó persistida (visible en el sitio público).
    await page.goto(`/proyectos/${slug}`);
    await expect(page.getByText(editedDescription)).toBeVisible();

    // ---- Eliminar ----
    await page.goto('/admin/proyectos');
    await rowForProject(page, title).getByRole('button', { name: 'Eliminar' }).click();

    await expect(page.getByText(title)).toHaveCount(0);

    // El proyecto borrado ya no está público.
    await page.goto(`/proyectos/${slug}`);
    await expect(page.getByRole('heading', { name: 'Proyecto no encontrado' })).toBeVisible();
  });
});
