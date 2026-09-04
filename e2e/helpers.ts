import { expect, type Page } from '@playwright/test';

/** Credenciales admin opcionales: activan los flujos de escritura (admin CRUD, bandeja). */
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? '';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? '';
export const hasAdminCredentials = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);

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
