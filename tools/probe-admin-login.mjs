/**
 * Sonda E2E del flujo /admin/login contra un entorno desplegado (default: producción).
 *
 * Uso:
 *   node tools/probe-admin-login.mjs
 *   BASE_URL=https://staging.example.com node tools/probe-admin-login.mjs
 *
 * Con credenciales reales (opcional) prueba además el login completo:
 *   E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... node tools/probe-admin-login.mjs
 *
 * No imprime credenciales. Screenshots en test-results/admin-login-probe/ (gitignored).
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'https://ingesocc.vercel.app';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? '';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? '';
const SHOTS = 'test-results/admin-login-probe';

mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext();
const page = await context.newPage();

const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

try {
  // 1. La página renderiza el formulario
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#email').waitFor({ state: 'visible', timeout: 30_000 });
  check('formulario visible', true, await page.title());

  await page.screenshot({ path: `${SHOTS}/1-login.png`, fullPage: true });

  // 2. Credenciales inválidas → mensaje traducido de Supabase Auth
  await page.locator('#email').fill('no.existe@ingesocc.test');
  await page.locator('#password').fill('contrasena-invalida-123');
  await page.getByRole('button', { name: 'Ingresar' }).click();

  const alert = page.locator('[role="alert"]');
  await alert.waitFor({ state: 'visible', timeout: 25_000 });
  const alertText = (await alert.textContent())?.trim() ?? '';
  check(
    'credenciales inválidas → error claro',
    /Credenciales inválidas/i.test(alertText),
    alertText,
  );
  check('sigue en /admin/login', page.url().includes('/admin/login'), page.url());

  // Estado de sesión tras intento fallido (no debe haber sesión)
  const storage = await page.evaluate(() =>
    Object.keys(localStorage).filter((k) => k.startsWith('sb-')),
  );
  const hasSession = await page.evaluate(() =>
    Object.keys(localStorage)
      .filter((k) => k.startsWith('sb-'))
      .some((k) => {
        try {
          return Boolean(JSON.parse(localStorage.getItem(k) ?? '')?.access_token);
        } catch {
          return false;
        }
      }),
  );
  check('sin sesión persistida tras fallo', !hasSession, `claves sb-: ${storage.join(', ') || '(ninguna)'}`);

  // 3. Login real (solo con credenciales provistas)
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    await page.locator('#email').fill(ADMIN_EMAIL);
    await page.locator('#password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Ingresar' }).click();

    // Éxito → URL /admin; si no, el alert dirá por qué (rol, rate limit, etc.)
    const outcome = await Promise.race([
      page
        .waitForURL(/\/admin\/?$/, { timeout: 25_000 })
        .then(() => 'panel'),
      page
        .locator('[role="alert"]')
        .waitFor({ state: 'visible', timeout: 25_000 })
        .then(() => 'alert'),
    ]);

    if (outcome === 'panel') {
      check('login admin → redirige a /admin', true, page.url());
      await page.screenshot({ path: `${SHOTS}/2-panel.png`, fullPage: true });
    } else {
      const t = (await page.locator('[role="alert"]').textContent())?.trim() ?? '';
      check('login admin → redirige a /admin', false, t);
      await page.screenshot({ path: `${SHOTS}/2-login-error.png`, fullPage: true });
    }
  } else {
    console.log('SKIP  login admin (sin E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD)');
  }

  // 4. Errores de consola (ruido de red 400 de Supabase esperado en el test 2)
  const relevant = consoleErrors.filter((e) => !/supabase\.co\/auth\/v1\/token|Failed to load resource.*40[0-9]/i.test(e));
  check('sin errores JS de la app', relevant.length === 0, relevant.slice(0, 3).join(' | '));
} catch (err) {
  check('flujo completó sin excepción', false, err.message?.slice(0, 300));
  await page.screenshot({ path: `${SHOTS}/error.png`, fullPage: true }).catch(() => {});
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks OK${failed.length ? ` — ${failed.length} FALLARON` : ''}`);
process.exit(failed.length ? 1 : 0);
