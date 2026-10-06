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

  // La Holanda en el portafolio corporativo. Es condicional: el entorno E2E
  // puede apuntar a una base con o sin el proyecto sembrado, y en modo sin DB
  // el seed estático siempre lo trae — así el test solo corre si es visible.
  test('La Holanda: listado → detalle → CTA al sitio oficial', async ({ page }) => {
    await page.goto('/proyectos');
    const card = page.locator('a', { has: page.locator('h2', { hasText: 'La Holanda' }) });
    if ((await card.count()) === 0) {
      test.skip(true, 'La Holanda no está publicada en este entorno (seed/DB sin el proyecto).');
    }

    // El listado enlaza al DETALLE corporativo (no directo al micrositio).
    await expect(card.first()).toHaveAttribute('href', /\/proyectos\/la-holanda$/);
    await card.first().click();

    await expect(page).toHaveURL(/\/proyectos\/la-holanda$/);
    await expect(page.getByRole('heading', { level: 1, name: 'La Holanda' })).toBeVisible();

    // CTA al micrositio oficial, nueva pestaña y sin exponer el opener.
    const cta = page.getByRole('link', { name: /Conocer La Holanda/i });
    await expect(cta.first()).toBeVisible();
    await expect(cta.first()).toHaveAttribute('href', 'https://laholanda.ingesocc.com/');
    await expect(cta.first()).toHaveAttribute('target', '_blank');
    await expect(cta.first()).toHaveAttribute('rel', /noopener/);

    // La ubicación de la OBRA se muestra como dato del proyecto y nunca se
    // confunde con la dirección corporativa (Armenia / vía La Tebaida).
    const ficha = page.locator('dt', { hasText: 'Ubicación' });
    if (await ficha.count()) {
      await expect(page.locator('dd').filter({ hasText: 'Quimbaya' }).first()).toBeVisible();
      await expect(ficha.locator('xpath=following-sibling::dd[1]')).not.toContainText('Tebaida');
    }
  });

  test('galería: cada imagen tiene su propio texto alternativo', async ({ page }) => {
    await page.goto('/proyectos/la-holanda');
    const h1 = page.getByRole('heading', { level: 1, name: 'La Holanda' });
    if (!(await h1.isVisible().catch(() => false))) {
      test.skip(true, 'La Holanda no está publicada en este entorno.');
    }

    const galleryImages = page.locator('section img[loading="lazy"]');
    const count = await galleryImages.count();
    if (count === 0) {
      test.skip(true, 'El proyecto no tiene imágenes de galería en este entorno.');
    }

    // Ninguna imagen puede tener alt vacío: un alt vacío no lo anuncia el
    // lector de pantalla y deja la imagen sin descripción.
    const alts = await galleryImages.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLImageElement).getAttribute('alt') ?? ''),
    );
    for (const alt of alts) {
      expect(alt.trim().length).toBeGreaterThan(0);
    }
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
