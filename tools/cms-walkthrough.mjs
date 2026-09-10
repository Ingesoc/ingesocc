/**
 * Recorrido INTERACTIVO del CMS de contenido en producción (Chrome visible).
 *
 * Flujo (automático tras el login):
 *   1. /admin/contenido → tab Contacto → bloque "Nota de privacidad"
 *   2. Guarda un valor de prueba desde el CMS
 *   3. Abre /contacto y verifica que el cambio es visible
 *   4. Restaura el valor original y lo verifica también
 *
 * No imprime credenciales ni tokens. Screenshots en test-results/cms-walkthrough/.
 *
 *   node tools/cms-walkthrough.mjs
 *   BASE_URL=https://staging.example.com node tools/cms-walkthrough.mjs
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'https://ingesocc.vercel.app';
const STORAGE_STATE = process.env.STORAGE_STATE ?? '';
const PAGE_KEY = 'contact';
const PAGE_LABEL = 'Contacto';
const BLOCK_KEY = 'privacy_note';
const BLOCK_LABEL = 'Nota de privacidad';
const PROBE_VALUE = 'Prueba CMS — texto temporal de verificación.';
const SHOTS = 'test-results/cms-walkthrough';

mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

console.log(`\nAbriendo ${BASE}/admin/login en Chrome…`);
console.log('▶ Inicia sesión con tu cuenta admin; el resto del recorrido es automático.\n');

const browser = await chromium.launch({ channel: 'chrome', headless: process.env.HEADED !== '1' });
const context = await browser.newContext(
  STORAGE_STATE ? { storageState: STORAGE_STATE } : undefined,
);
const page = await context.newPage();

try {
  await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
  // Con storageState la sesión restaurada debe llevar directo al panel.
  // Sin ella, abre el login y espera el login manual (modo interactivo).
  if (STORAGE_STATE) {
    await page.waitForURL(/\/admin\/?$/, { timeout: 30_000 });
    check('sesión restaurada desde storageState → panel', true, page.url());
  } else {
    console.log('\n▶ Modo interactivo: inicia sesión en la ventana abierta.\n');
    const deadline = Date.now() + 8 * 60_000;
    let lastAlert = '';
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
    check('login admin → panel', true, page.url());
  }

  // 2. Abrir el CMS desde el sidebar
  await page.goto(`${BASE}/admin/contenido`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Contenido del sitio' }).waitFor({ timeout: 20_000 });
  check('CMS /admin/contenido renderiza', true);

  // Indicador de conexión (espera a que la carga inicial defina el estado)
  let pillOk = false;
  for (let i = 0; i < 20; i++) {
    if (await page.locator('text=Supabase conectado').first().isVisible().catch(() => false)) {
      pillOk = true;
      break;
    }
    if (await page.locator('text=Sin conexión').first().isVisible().catch(() => false)) break;
    await page.waitForTimeout(500);
  }
  check('indicador de conexión Supabase definido (conectado)', pillOk);

  // 3. Tab Contacto
  await page.getByRole('button', { name: new RegExp(`^${PAGE_LABEL}`) }).click();
  const blockLabel = page.locator('label', { hasText: BLOCK_LABEL }).first();
  await blockLabel.waitFor({ timeout: 15_000 });
  check(`bloque "${BLOCK_LABEL}" visible en tab ${PAGE_LABEL}`, true);

  // 4. Editar el bloque y guardar (el botón vive en el pie del bloque: se ancla al input)
  const input = page.locator(`#block-${PAGE_KEY}-${BLOCK_KEY}`);
  const blockWrapper = input.locator('xpath=ancestor::div[1]');
  const original = (await input.inputValue()).trim();
  console.log(`valor original: "${original}"`);
  await input.fill(PROBE_VALUE);
  const saveButton = blockWrapper.getByRole('button', { name: 'Guardar cambios' });
  await saveButton.click();
  await blockWrapper.locator('text=Guardado correctamente').first().waitFor({ timeout: 20_000 });
  check('guardado desde el CMS ("Guardado correctamente")', true);
  await page.screenshot({ path: `${SHOTS}/1-cms-guardado.png`, fullPage: true });

  // 5. Verificar el cambio en la página pública
  const publicPage = await context.newPage();
  await publicPage.goto(`${BASE}/contacto`, { waitUntil: 'domcontentloaded' });
  await publicPage.locator(`text=${PROBE_VALUE}`).first().waitFor({ timeout: 25_000 });
  check('cambio visible en la página pública /contacto', true);
  await publicPage.screenshot({ path: `${SHOTS}/2-publico-con-cambio.png`, fullPage: true });

  // 6. Restaurar el valor original desde el CMS
  await page.bringToFront();
  await input.fill(original);
  await saveButton.click();
  await page.locator('text=Guardado correctamente').first().waitFor({ timeout: 20_000 });
  check('valor original restaurado', true);

  await publicPage.bringToFront();
  await publicPage.reload({ waitUntil: 'domcontentloaded' });
  await publicPage.locator(`text=${original}`).first().waitFor({ timeout: 25_000 });
  check('página pública muestra de nuevo el valor original', true);
  await publicPage.screenshot({ path: `${SHOTS}/3-publico-restaurado.png`, fullPage: true });
  await publicPage.close();
} catch (err) {
  check('recorrido completó sin excepción', false, err.message?.slice(0, 300));
  await page.screenshot({ path: `${SHOTS}/error.png`, fullPage: true }).catch(() => {});
} finally {
  await browser.close().catch(() => {});
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks OK${failed.length ? ` — ${failed.length} FALLARON` : ''}`);
process.exit(failed.length ? 1 : 0);
