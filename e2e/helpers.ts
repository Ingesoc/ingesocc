import { expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Credenciales admin opcionales: activan los flujos de escritura (admin CRUD, bandeja). */
export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? '';
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? '';
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

/** Lee las credenciales públicas de Supabase desde environment.ts (build de dev). */
export function readEnvironment(): { url: string; anonKey: string } {
  const source = readFileSync(join(process.cwd(), 'src/environments/environment.ts'), 'utf8');
  const url = source.match(/supabaseUrl:\s*'([^']+)'/)?.[1] ?? '';
  const anonKey = source.match(/supabaseAnonKey:\s*'([^']+)'/)?.[1] ?? '';
  if (!url || !anonKey) {
    throw new Error('No se pudieron leer las credenciales de src/environments/environment.ts');
  }
  return { url, anonKey };
}

/**
 * Cliente Supabase autenticado como admin, para limpieza/verificación de datos
 * vía API después de los flujos de UI (nunca reemplaza la verificación visual).
 */
export async function createAdminClient() {
  const { url, anonKey } = readEnvironment();
  const client = createClient(url, anonKey);
  const { error } = await client.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (error) {
    throw new Error(`No se pudo autenticar el cliente de limpieza E2E: ${error.message}`);
  }
  return client;
}

/** Acepta el window.confirm de Angular para las eliminaciones. */
export function acceptDialogs(page: Page): void {
  page.on('dialog', (dialog) => void dialog.accept());
}
