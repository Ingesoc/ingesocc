/**
 * Diagnóstico visual del panel admin (temporal).
 * 1. Renderiza /admin con sesión admin simulada (sin escribir en Supabase).
 * 2. Mide la geometría real del DOM (layout, sidebar, main, dashboard).
 * 3. Saca screenshot y analiza los píxeles: ¿página realmente en blanco o
 *    sí hay contenido renderizado?
 */
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'https://ingesocc.vercel.app';
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

/** Analiza un PNG: proporción de píxeles casi-blancos y colores dominantes. */
async function analyzePng(pngPath) {
  const page = await browser.newPage();
  const b64 = readFileSync(pngPath).toString('base64');
  const result = await page.evaluate(async (dataUrl) => {
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = dataUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let nearWhite = 0;
    let total = 0;
    const buckets = new Map();
    for (let i = 0; i < data.length; i += 4) {
      total++;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (r > 245 && g > 245 && b > 245) nearWhite++;
      const key = `${r >> 4},${g >> 4},${b >> 4}`; // cubetas de 16 niveles
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    const top = [...buckets.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, n]) => `${k}: ${(n / total * 100).toFixed(1)}%`);
    return { width: img.width, height: img.height, nearWhitePct: (nearWhite / total * 100).toFixed(1), topColors: top };
  }, `data:image/png;base64,${b64}`);
  await page.close();
  return result;
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 844 }]) {
  const ctx = await browser.newContext({ viewport });
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
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((s) => {
    localStorage.setItem('sb-ietjikoddwpdybarcwfk-auth-token', JSON.stringify(s));
  }, SESSION);

  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle', timeout: 30000 }).catch((e) => errors.push(`goto: ${e.message}`));
  await page.waitForTimeout(2500);

  const diag = await page.evaluate(() => {
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        display: cs.display,
        visibility: cs.visibility,
        opacity: cs.opacity,
        overflow: cs.overflow,
        childCount: el.children.length,
      };
    };
    const layout = document.querySelector('app-admin-layout');
    const main = layout?.querySelector('main');
    const outlet = main?.querySelector('router-outlet');
    return {
      url: location.href,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      mdMatches: matchMedia('(min-width: 768px)').matches,
      bodyScrollHeight: document.body.scrollHeight,
      bodyChildTags: [...document.body.children].map((c) => c.tagName.toLowerCase()).join(','),
      appRoot: box(document.querySelector('app-root')),
      adminLayout: box(layout),
      sidebar: box(layout?.querySelector('aside')),
      header: box(layout?.querySelector('header')),
      main: box(main),
      dashboard: box(document.querySelector('app-admin-dashboard')),
      dashboardTextLen: document.querySelector('app-admin-dashboard')?.innerText?.length ?? -1,
      dashboardTextHead: document.querySelector('app-admin-dashboard')?.innerText?.slice(0, 200) ?? null,
      nextAfterOutlet: box(outlet?.nextElementSibling),
      htmlFontFamily: getComputedStyle(document.body).fontFamily.slice(0, 60),
      bodyColor: getComputedStyle(document.body).color,
      bodyBg: getComputedStyle(document.body).backgroundColor,
    };
  });

  const shot = `/tmp/admin-${viewport.width}.png`;
  await page.screenshot({ path: shot, fullPage: true });
  const pixels = await analyzePng(shot);

  console.log(`\n===== VIEWPORT ${viewport.width}x${viewport.height} =====`);
  console.log(JSON.stringify(diag, null, 2));
  console.log('PIXELES:', JSON.stringify(pixels, null, 2));
  console.log(`Errores JS (${errors.length}):`);
  for (const e of errors.slice(0, 5)) console.log(`  ${e.slice(0, 200)}`);
  await ctx.close();
}

await browser.close();
console.log('\nOK — screenshots en /tmp/admin-1440.png y /tmp/admin-375.png');
