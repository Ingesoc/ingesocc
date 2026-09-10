/**
 * FASE 1 del recorrido del CMS: login manual + guardado de sesión.
 *
 * Abre Chrome en /admin/login; cuando el login llega a /admin guarda el
 * estado de la sesión (localStorage de supabase-js) en un archivo local
 * gitignored y cierra. La FASE 2 (cms-walkthrough con STORAGE_STATE=...)
 * reutiliza esa sesión sin volver a pedir credenciales.
 *
 *   node tools/login-save-state.mjs
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'https://ingesocc.vercel.app';
const OUT = 'test-results/admin-storage-state.json';

mkdirSync('test-results', { recursive: true });

console.log(`\nAbriendo ${BASE}/admin/login en Chrome…`);
console.log('▶ Inicia sesión; al entrar al panel la sesión se guarda y la ventana se cierra sola.\n');

const browser = await chromium.launch({ channel: 'chrome', headless: false, slowMo: 40 });
const context = await browser.newContext();
const page = await context.newPage();

let lastAlert = '';
try {
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded' });
  const deadline = Date.now() + 8 * 60_000;
  while (Date.now() < deadline) {
    if (/\/admin\/?$/.test(new URL(page.url()).pathname)) break;
    const alert = page.locator('[role="alert"]');
    if (await alert.isVisible().catch(() => false)) {
      const t = (await alert.textContent())?.trim() ?? '';
      if (t && t !== lastAlert) {
        lastAlert = t;
        console.log(`[alerta] ${t}`);
      }
    }
    await page.waitForTimeout(500);
  }
  if (!/\/admin\/?$/.test(new URL(page.url()).pathname)) {
    throw new Error(`Login no completado (última alerta: ${lastAlert || 'ninguna'})`);
  }
  await page.waitForTimeout(1500); // deja que supabase-js persista la sesión
  await context.storageState({ path: OUT });
  console.log(`\n✓ Login OK — sesión guardada en ${OUT} (gitignored, bórrala al terminar)`);
  console.log('▶ Ahora ejecuta la FASE 2: STORAGE_STATE=test-results/admin-storage-state.json node tools/cms-walkthrough.mjs');
} catch (err) {
  console.error(`\n✗ ${err.message?.slice(0, 300)}`);
  process.exitCode = 1;
} finally {
  await browser.close().catch(() => {});
}
