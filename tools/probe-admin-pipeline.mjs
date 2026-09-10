/**
 * Sonda del pipeline de carga lazy de /admin contra el BUILD DE PRODUCCIÓN local.
 *
 * Verifica (sin credenciales, no hace login):
 *   1. /admin (deep-link) → authGuard redirige a /admin/login
 *   2. /admin/login renderiza el formulario (layout público + chunk lazy del login)
 *   3. Los chunks lazy de rutas admin existen en el build y se sirven (200)
 *
 * Uso: node tools/probe-admin-pipeline.mjs   (sirve dist/ingesocc-web/browser en :4173)
 */
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const DIST = 'dist/ingesocc-web/browser';
const PORT = 4173;
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://x');
  let file = join(DIST, url.pathname);
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
    return;
  } catch {
    // SPA fallback (igual que el rewrite de Vercel): cualquier ruta → index.html
    const body = await readFile(join(DIST, 'index.html'));
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(body);
  }
});
await new Promise((resolve) => server.listen(PORT, resolve));

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
const jsErrors = [];
page.on('pageerror', (err) => jsErrors.push(err.message));

try {
  // 1. Deep-link a /admin: el guard debe mandar a /admin/login (Angular, no el servidor)
  await page.goto(`http://localhost:${PORT}/admin`, { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/admin\/login$/, { timeout: 20_000 });
  check('deep-link /admin → guard redirige a /admin/login', true);

  // 2. El formulario de login renderiza (chunk lazy del login ejecutado por el outlet)
  await page.locator('#email').waitFor({ state: 'visible', timeout: 20_000 });
  check('outlet renderiza el componente lazy de /admin/login', true);

  // 3. Los chunks lazy de las rutas admin existen en el build
  const index = await readFile(join(DIST, 'index.html'), 'utf8');
  void index;
  const { readdir } = await import('node:fs/promises');
  const files = await readdir(DIST);
  const lazyChunks = files.filter((f) => f.startsWith('chunk-') && f.endsWith('.js'));
  let served = 0;
  for (const chunk of lazyChunks) {
    const r = await fetch(`http://localhost:${PORT}/${chunk}`);
    if (r.ok) served++;
  }
  check('todos los chunks lazy del build se sirven (200)', served === lazyChunks.length, `${served}/${lazyChunks.length}`);

  const appErrors = jsErrors.filter((e) => !/net::|Failed to fetch/i.test(e));
  check('sin errores JS de la app', appErrors.length === 0, appErrors.slice(0, 2).join(' | '));
} catch (err) {
  check('flujo completó', false, err.message?.slice(0, 200));
} finally {
  await browser.close();
  server.close();
}

process.exit(results.some((r) => !r.ok) ? 1 : 0);
