import { test } from '@playwright/test';

const OUT = 'test-results/audit';

test('capturas de auditoría', async ({ page }) => {
  const shots: Array<{ path: string; name: string; full?: boolean; width: number; height: number }> = [
    { path: '/', name: 'home', full: false, width: 1440, height: 900 },
    { path: '/proyectos', name: 'proyectos-1440', full: true, width: 1440, height: 900 },
    { path: '/proyectos', name: 'proyectos-390', full: false, width: 390, height: 844 },
    { path: '/servicios', name: 'servicios-1440', full: false, width: 1440, height: 1200 },
    { path: '/quienes-somos', name: 'about-1440', full: false, width: 1440, height: 900 },
    { path: '/contacto', name: 'contacto-1440', full: false, width: 1440, height: 1200 },
    { path: '/contacto', name: 'contacto-390', full: false, width: 390, height: 844 },
  ];

  for (const shot of shots) {
    await page.setViewportSize({ width: shot.width, height: shot.height });
    await page.goto(shot.path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/${shot.name}.png`, fullPage: shot.full ?? false });
  }
});
