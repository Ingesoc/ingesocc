import { expect, type Page } from '@playwright/test';

/** Credenciales admin opcionales: activan los flujos de escritura (admin CRUD, bandeja). */
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? '';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? '';
export const hasAdminCredentials = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);

/** Origen del dev server que levanta Playwright (playwright.config.ts). */
export const baseURL = 'http://localhost:4200';

/** Slug en el mismo formato que la app (core/slugify.ts). */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Sufijo único por ejecución para no chocar con datos previos. */
export function uniqueSuffix(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Inicia sesión en el panel desde la UI. */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/admin/login');
  await page.locator('#email').fill(ADMIN_EMAIL);
  await page.locator('#password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

/** Acepta el window.confirm de Angular para las eliminaciones. */
export function acceptDialogs(page: Page): void {
  page.on('dialog', (dialog) => void dialog.accept());
}

/**
 * Navega a una ruta pública usando el nav disponible según el viewport:
 * en desktop (≥lg) usa "Navegación principal"; en móvil el nav está detrás
 * del botón hamburguesa ("Menú móvil" a pantalla completa). El menú móvil se
 * cierra solo al hacer clic en un enlace (toggleMenu en el propio enlace).
 */
export async function navigateTo(page: Page, label: string, targetPath: RegExp): Promise<void> {
  const desktopLink = page
    .getByRole('navigation', { name: 'Navegación principal' })
    .getByRole('link', { name: label });

  if (await desktopLink.isVisible()) {
    await desktopLink.click();
  } else {
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await page
      .getByRole('navigation', { name: 'Menú móvil' })
      .getByRole('link', { name: label })
      .click();
    // El overlay del menú desaparece al navegar (@if sobre menuOpen).
    await expect(page.getByRole('button', { name: 'Cerrar menú' })).toHaveCount(0);
  }

  await expect(page).toHaveURL(targetPath);
}
