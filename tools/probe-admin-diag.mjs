/**
 * Diagnóstico temporal: simula sesión admin (localStorage + intercept de
 * profiles) para renderizar el panel sin credenciales reales. NO escribe
 * nada en Supabase: solo GET interceptado con Playwright.
 */
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:4200';
const SUPABASE_URL = 'https://ietjikoddwpdybarcwfk.supabase.co';

const FAKE_USER = {
  id: '00000000-0000-4000-8000-0000000000ff',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'diag-admin@ingesocc.test',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
  created_at: '2026-01-01T00:00:00Z',
};

const SESSION = {
  access_token: 'fake-access-token-diag',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'fake-refresh-token-diag',
  user: FAKE_USER,
};

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const consoleMsgs = [];
page.on('console', (msg) => {
  if (['error', 'warning'].includes(msg.type())) consoleMsgs.push(`[console.${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', (err) => consoleMsgs.push(`[pageerror] ${err.message}`));

// Solo GET: profiles devuelve fila admin (con auth header); el resto pasa.
await ctx.route(`${SUPABASE_URL}/rest/v1/profiles*`, (route) => {
  const headers = route.request().headers();
  if ((headers.apikey ?? '') && route.request().method() === 'GET') {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'content-range': '0-0/1' },
      body: JSON.stringify([{ id: FAKE_USER.id, email: FAKE_USER.email, role: 'admin' }]),
    });
  }
  return route.fallback();
});

// Carga el app una vez para poblar localStorage con la sesión fake.
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await page.evaluate((session) => {
  const key = 'sb-ietjikoddwpdybarcwfk-auth-token';
  localStorage.setItem(key, JSON.stringify(session));
  localStorage.setItem(key + '-code-verifier', '');
}, SESSION);

for (const path of ['/admin', '/admin/proyectos', '/admin/servicios', '/admin/contenido', '/admin/mensajes']) {
  consoleMsgs.length = 0;
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    consoleMsgs.push(`[goto] ${String(e?.message).slice(0, 160)}`);
  }
  await page.waitForTimeout(1500);
  const url = page.url();
  const text = (await page.locator('body').innerText().catch(() => '<no body>')) ?? '';
  const outletText = (await page.locator('main').innerText().catch(() => '(sin main)')) ?? '';
  console.log(`\n===== ${path} =====`);
  console.log(`URL final: ${url}`);
  console.log(`Texto del <main> (${outletText.length} chars):\n${outletText.slice(0, 400)}`);
  console.log(`Errores (${consoleMsgs.length}):`);
  for (const m of consoleMsgs) console.log(`  ${m.slice(0, 240)}`);
}

await browser.close();
