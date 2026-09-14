/** Recorrido debug del panel: captura los logs [ingesocc-debug] del build local. */
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:4174';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();

const logs = [];
page.on('console', (msg) => {
  const t = msg.text();
  if (t.includes('ingesocc-debug') || t.includes('Router Event') || t.includes('NavigationError')) {
    logs.push(t.slice(0, 220));
  }
});
page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message.slice(0, 220)}`));

for (const path of ['/admin', '/admin/login']) {
  logs.length = 0;
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 30000 });
  } catch {
    /* networkidle puede no llegar; seguimos */
  }
  await page.waitForTimeout(2500);
  console.log(`\n===== ${path} → ${page.url()} =====`);
  for (const l of logs.slice(0, 40)) console.log(`  ${l}`);
}

await browser.close();
