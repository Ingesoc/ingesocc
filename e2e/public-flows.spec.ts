import { expect, test } from '@playwright/test';
import { navigateTo } from './helpers';
/**
 * E2E públicos (solo lectura, sin credenciales): Home → Proyectos → Detalle,
 * navegación del sitio, ruta inexistente y SEO básico por ruta.
 *
 * Corren en toda la matriz de navegadores (E2E_BROWSERS=all): la navegación
 * usa el helper `navigateTo`, que elige el nav de desktop o el menú móvil
 * según el viewport del proyecto.
 */
test.describe('Sitio público', () => {
  test('Home carga con navegación, hero y footer', async ({ page }) => {
    await page.goto('/');

    // SEO: título base presente en el <head>.
    await expect(page).toHaveTitle(/Ingesocc/);

    // Navegación accesible según viewport: en desktop el nav principal; en
    // móvil el botón hamburguesa (el overlay "Menú móvil" tiene los mismos
    // enlaces y se abre bajo demanda).
    const desktopNav = page.getByRole('navigation', { name: 'Navegación principal' });
    if (await desktopNav.getByRole('link', { name: 'Inicio' }).isVisible()) {
      await expect(desktopNav.getByRole('link', { name: 'Proyectos' })).toBeVisible();
      await expect(desktopNav.getByRole('link', { name: 'Contacto' })).toBeVisible();
    } else {
      await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeVisible();
    }

    // El hero existe (título editable o fallback).
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Footer presente.
    await expect(page.locator('footer')).toContainText('Ingesocc');
  });

  test('navegación entre páginas públicas', async ({ page }) => {
    await page.goto('/');

    await navigateTo(page, 'Quiénes Somos', /\/quienes-somos$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await navigateTo(page, 'Servicios', /\/servicios$/);
    await expect(page.getByRole('heading', { name: 'Servicios' })).toBeVisible();

    await navigateTo(page, 'Contacto', /\/contacto$/);
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

  test('el filtro de categorías se sincroniza con ?categoria= y sobrevive un reload', async ({ page }) => {
    await page.goto('/proyectos');

    // El chip existe siempre (tabla `categories` o respaldo estático del servicio).
    const chip = page.getByRole('button', { name: 'Edificaciones', exact: true });
    await expect(chip).toBeVisible();

    // Filtrar escribe el query param en la URL.
    await chip.click();
    await expect(page).toHaveURL(/\/proyectos\?categoria=edificaciones$/);
    await expect(chip).toHaveAttribute('aria-pressed', 'true');

    // El estado sobrevive un refresh (F5 / enlace compartido).
    const cardsBefore = await page.locator('a[href^="/proyectos/"]').count();
    await page.reload();
    await expect(page).toHaveURL(/\/proyectos\?categoria=edificaciones$/);
    await expect(page.getByRole('button', { name: 'Edificaciones', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const cardsAfter = await page.locator('a[href^="/proyectos/"]').count();
    expect(cardsAfter).toBe(cardsBefore);

    // Deep link directo con otra categoría también inicializa el filtro.
    await page.goto('/proyectos?categoria=puentes');
    await expect(page.getByRole('button', { name: 'Puentes', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    // Volver a "Todos" elimina el query param.
    await page.getByRole('button', { name: 'Todos', exact: true }).click();
    await expect(page).toHaveURL(/\/proyectos$/);
    await expect(page.getByRole('button', { name: 'Todos', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
