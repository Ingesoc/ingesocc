/**
 * Diagnóstico headless del guardado en el CMS (usa STORAGE_STATE).
 * Vuelca el estado visible del bloque tras pulsar "Guardar cambios".
 *
 *   STORAGE_STATE=test-results/admin-storage-state.json node tools/cms-diagnose.mjs
 */
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'https://ingesocc.vercel.app';
const STORAGE_STATE = process.env.STORAGE_STATE ?? '';
if (!STORAGE_STATE) {
  console.error('Define STORAGE_STATE=test-results/admin-storage-state.json');
  process.exit(1);
}

const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ storageState: STORAGE_STATE });
const page = await context.newPage();

const consoleMsgs = [];
page.on('console', (msg) => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));
page.on('response', (res) => {
  if (res.url().includes('supabase.co') && res.status() >= 300) {
    consoleMsgs.push(`[HTTP ${res.status()}] ${res.request().method()} ${res.url().slice(0, 120)}`);
  }
});

try {
  await page.goto(`${BASE}/admin/contenido`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Contenido del sitio' }).waitFor({ timeout: 20_000 });
  await page.waitForTimeout(2500); // deja terminar la carga inicial

  // Estado del indicador de conexión
  for (const t of ['Supabase conectado', 'Sin conexión', 'Verificando']) {
    if (await page.locator(`text=${t}`).first().isVisible().catch(() => false)) {
      console.log(`pill: ${t}`);
      break;
    }
  }

  await page.getByRole('button', { name: /^Contacto/ }).click();
  const input = page.locator('#block-contact-privacy_note');
  await input.waitFor({ timeout: 15_000 });

  const blockWrapper = input.locator('xpath=ancestor::div[1]');
  console.log(`valor antes: "${(await input.inputValue()).trim()}"`);
  console.log(`botón Guardar habilitado: ${await blockWrapper.getByRole('button', { name: 'Guardar cambios' }).isEnabled()}`);

  await input.fill('Diagnóstico CMS — prueba temporal.');
  const btn = blockWrapper.getByRole('button', { name: 'Guardar cambios' });
  console.log(`botón Guardar habilitado tras editar: ${await btn.isEnabled()}`);
  await btn.click();

  await page.waitForTimeout(6000);

  console.log(`\n--- estado visible del bloque tras guardar ---`);
  console.log((await blockWrapper.innerText()).slice(0, 800));
  console.log('--- alerts en página ---');
  const alerts = await page.locator('[role="alert"]').allTextContents();
  console.log(alerts.length ? alerts.join('\n') : '(ninguna)');

  console.log('\n--- red/consola relevante ---');
  const rel = consoleMsgs.filter((m) => !/DevTools/i.test(m));
  console.log(rel.length ? rel.slice(0, 12).join('\n') : '(nada)');
} catch (err) {
  console.error('error:', err.message?.slice(0, 300));
} finally {
  await browser.close().catch(() => {});
}
