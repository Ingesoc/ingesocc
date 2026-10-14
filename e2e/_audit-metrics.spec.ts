import { test } from '@playwright/test';

async function report(page: import('@playwright/test').Page, label: string) {
  const data = await page.evaluate(() => {
    const out: Record<string, unknown> = {};
    const doc = document.documentElement;
    out.docScrollWidth = doc.scrollWidth;
    out.innerWidth = window.innerWidth;
    out.horizontalOverflow = doc.scrollWidth - window.innerWidth;

    const offenders: Array<{ tag: string; cls: string; right: number; w: number }> = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > window.innerWidth + 1) {
        offenders.push({ tag: el.tagName, cls: el.className?.toString().slice(0, 80) ?? '', right: Math.round(r.right), w: Math.round(r.width) });
      }
    }
    out.overflowOffenders = offenders.slice(0, 8);
    return out;
  });
  console.log(`METRICS ${label} ${JSON.stringify(data)}`);
}

test('métricas de layout', async ({ page }) => {
  for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }, { w: 320, h: 568 }]) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.goto('/proyectos', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await report(page, `proyectos-${vp.w}`);

    const grid = page.locator('section .wrap > div.grid').first();
    const boxes = await grid.locator(':scope > *').evaluateAll((nodes) =>
      nodes.map((n) => {
        const r = (n as HTMLElement).getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), left: Math.round(r.left) };
      }),
    );
    const autoRows = await grid.evaluate((n) => getComputedStyle(n).gridAutoRows);
    console.log(`GRID proyectos-${vp.w} autoRows=${autoRows} ${JSON.stringify(boxes)}`);
  }
});
