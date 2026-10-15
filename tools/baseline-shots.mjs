#!/usr/bin/env node
/**
 * Captura de línea base "antes" (Fase 00 — Brújula).
 *
 * Sirve dist/ingesocc-web/browser con tools/serve-dist.mjs y guarda un
 * screenshot full-page de cada ruta pública (y /admin/login) en tres anchos:
 * 390 (móvil), 820 (tablet) y 1440 (escritorio), en docs/design/baseline/screenshots/.
 *
 * También registra dimensiones del documento y si hay overflow horizontal por
 * página/viewport en docs/design/baseline/baseline-metrics.json, para que la
 * comparación "después" sea reproducible sin depender de inspección visual.
 *
 * Requiere dist/ construido (pnpm build).
 *
 * Uso: node tools/baseline-shots.mjs
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const OUT = join(ROOT, 'docs', 'design', 'baseline');
const SHOTS = join(OUT, 'screenshots');
const PORT = 4174;
const BASE = `http://localhost:${PORT}`;

const VIEWPORTS = [
  { width: 390, height: 844, label: '390' },
  { width: 820, height: 1180, label: '820' },
  { width: 1440, height: 900, label: '1440' },
];

const PAGES = [
  { path: '/', ready: 'section#inicio', file: 'home' },
  { path: '/quienes-somos', ready: 'main section h1', file: 'quienes-somos' },
  { path: '/servicios', ready: 'main h1', file: 'servicios' },
  { path: '/proyectos', ready: 'main h1', file: 'proyectos' },
  { path: '/proyectos/casa-ladera', ready: 'main h1', file: 'proyecto-detalle' },
  { path: '/contacto', ready: 'main form', file: 'contacto' },
  { path: '/admin/login', ready: 'form', file: 'admin-login' },
];

function startServer() {
  const child = spawn(process.execPath, ['tools/serve-dist.mjs'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: String(PORT) },
  });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server timeout')), 15000);
    child.stdout.on('data', (d) => {
      if (String(d).includes('Serving')) {
        clearTimeout(timer);
        resolve(child);
      }
    });
    child.on('exit', (code) => reject(new Error(`server exit ${code}`)));
  });
}

async function capture(page, { path, file, ready }, viewport) {
  const tag = `${file}@${viewport.label}`;
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector(ready ?? 'app-root', { timeout: 30000 });
  await page.waitForTimeout(1500);
  const metrics = await page.evaluate(() => {
    const de = document.documentElement;
    return {
      scrollWidth: de.scrollWidth,
      clientWidth: de.clientWidth,
      scrollHeight: de.scrollHeight,
      overflowX: de.scrollWidth > de.clientWidth + 1,
      title: document.title,
      h1: document.querySelector('h1')?.textContent?.trim().slice(0, 120) ?? null,
    };
  });
  await page.screenshot({ path: join(SHOTS, `${tag}.png`), fullPage: true });
  return { tag, path, viewport: viewport.label, ...metrics };
}

async function main() {
  if (!existsSync(join(ROOT, 'dist', 'ingesocc-web', 'browser', 'index.html'))) {
    console.log('No se encontró dist/. Ejecuta pnpm build primero.');
    process.exit(1);
  }
  await mkdir(SHOTS, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      for (const p of PAGES) {
        results.push(await capture(page, p, vp));
      }
      await page.close();
    }
  } finally {
    await browser.close();
    server.kill();
  }

  const generatedAt = new Date().toISOString();
  await writeFile(
    join(OUT, 'baseline-metrics.json'),
    JSON.stringify({ generatedAt, viewports: VIEWPORTS.map((v) => v.label), pages: results }, null, 2),
  );

  const overflows = results.filter((r) => r.overflowX);
  console.log(`Capturas: ${results.length} → ${SHOTS}`);
  console.log(`Overflow horizontal: ${overflows.length}`);
  for (const o of overflows) console.log('  ✗', o.tag, `scrollWidth=${o.scrollWidth} clientWidth=${o.clientWidth}`);
  console.log(`Métricas: ${join(OUT, 'baseline-metrics.json')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
