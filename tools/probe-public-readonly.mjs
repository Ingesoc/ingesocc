/**
 * Sonda de solo-lectura del sitio público (plan de corrección: SIN controles admin).
 *
 * Verifica contra el build de producción local:
 *   1. Ninguna página pública contiene "Modo edición", botones de edición ni contenteditable.
 *   2. El contenido gestionado desde /admin/contenido se renderiza en el sitio público.
 *
 *   node tools/probe-public-readonly.mjs
 */
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

// BASE_URL=https://... → sondea ese sitio (producción) sin servidor local.
const BASE = process.env.BASE_URL ?? '';
const DIST = 'dist/ingesocc-web/browser';
const PORT = 4174;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

let server = null;
if (!BASE) {
  server = createServer(async (req, res) => {
  try {
    const body = await readFile(join(DIST, new URL(req.url ?? '/', 'http://x').pathname));
    res.writeHead(200, { 'content-type': MIME[extname(join(DIST, req.url ?? ''))] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    const body = await readFile(join(DIST, 'index.html'));
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(body);
  }
});
await new Promise((resolve) => server.listen(PORT, resolve));
}

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();

try {
  for (const path of ['/', '/quienes-somos', '/contacto', '/proyectos', '/servicios']) {
    await page.goto(`${BASE || `http://localhost:${PORT}`}${path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(BASE ? 2500 : 1200);

    const bodyText = (await page.locator('body').innerText()) || '';
    check(`${path} sin "Modo edición"`, !/Modo edición|Terminar edición/i.test(bodyText));
    // El formulario de contacto PÚBLICO es legítimo; lo que no puede haber
    // son controles de edición de contenido: contenteditable, subidas de
    // archivo o botones guardar/cancelar de bloques.
    check(`${path} sin controles de edición`,
      (await page.locator('[contenteditable], input[type=file], button:has-text("Guardar cambios"), button:has-text("Cambiar imagen")').count()) === 0);
  }

  // El contenido del CMS se refleja en el sitio público (datos de seed en el build local).
  await page.goto(`${BASE || `http://localhost:${PORT}`}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(BASE ? 2500 : 1200);
  const home = (await page.locator('body').innerText()) || '';
  check('/ renderiza contenido de content_blocks', home.length > 200 && /Construimos espacios/i.test(home));
} catch (err) {
  check('sonda completó', false, err.message?.slice(0, 200));
} finally {
  await browser.close().catch(() => {});
  if (server) server.close();
}

process.exit(results.some((r) => !r.ok) ? 1 : 0);
