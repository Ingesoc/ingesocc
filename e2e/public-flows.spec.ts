import { expect, test } from '@playwright/test';

/**
 * E2E públicos (solo lectura, sin credenciales): Home → Proyectos → Detalle,
 * navegación del sitio, ruta inexistente y SEO básico por ruta.
 */
test.describe('Sitio público', () => {
  test('Home carga con navegación, hero y footer', async ({ page }) => {
    await page.goto('/');

    // SEO: título base presente en el <head>.
    await expect(page).toHaveTitle(/Ingesocc/);

    // Navegación principal visible.
    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    await expect(nav.getByRole('link', { name: 'Inicio' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Proyectos' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Contacto' })).toBeVisible();

    // El hero existe (título editable o fallback).
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Footer presente.
    await expect(page.locator('footer')).toContainText('Ingesocc');
  });

  test('navegación entre páginas públicas', async ({ page }) => {
    await page.goto('/');

    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    await nav.getByRole('link', { name: 'Quiénes Somos' }).click();
    await expect(page).toHaveURL(/\/quienes-somos$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Servicios' }).click();
    await expect(page).toHaveURL(/\/servicios$/);
    await expect(page.getByRole('heading', { name: 'Servicios' })).toBeVisible();

    await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Contacto' }).click();
    await expect(page).toHaveURL(/\/contacto$/);
    await expect(page.getByRole('heading', { name: 'Contacto' })).toBeVisible();
  });

  test('Proyectos → detalle del primer proyecto publicado', async ({ page }) => {
    await page.goto('/proyectos');

    // El listado puede venir de DB (con o sin proyectos) o del seed estático.
    // La tarjeta enlaza a /proyectos/:slug.
    const cards = page.locator('a[href^="/proyectos/"]');
    const count = await cards.count();

    if (count === 0) {
      await expect(page.getByText(/No hay proyectos publicados|Todavía no hay proyectos/)).toBeVisible();
      return;
    }

    const first = cards.first();
    // El título de la tarjeta es h2 (los niveles de encabezado no se saltan del h1).
    const title = (await first.locator('h2').innerText()).trim();
    await first.click();

    await expect(page).toHaveURL(/\/proyectos\/[a-z0-9-]+$/);
    await expect(page.getByRole('heading', { name: title, exact: false })).toBeVisible();
    await expect(page.getByRole('link', { name: /Volver a proyectos/ })).toBeVisible();
  });

  test('proyecto inexistente muestra estado 404 propio', async ({ page }) => {
    await page.goto('/proyectos/no-existe-este-proyecto-xyz');
    await expect(page.getByRole('heading', { name: 'Proyecto no encontrado' })).toBeVisible();
  });

  test('sin overflow horizontal en viewport móvil (Home y Proyectos)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const overflowHome = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflowHome).toBe(false);

    await page.goto('/proyectos');
    const overflowProjects = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflowProjects).toBe(false);
  });
});
