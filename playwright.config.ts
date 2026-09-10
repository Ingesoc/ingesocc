import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración E2E (plan maestro de pruebas — Fase 3).
 *
 * - Levanta el dev server de Angular (http://localhost:4200) automáticamente.
 * - Navegadores: por defecto solo Chromium (rápido). Con `E2E_BROWSERS=all`
 *   se añaden Firefox y WebKit (requiere `pnpm exec playwright install`)
 *   más los viewports móviles — matriz del plan §30:
 *
 *     E2E_BROWSERS=all pnpm test:e2e
 *
 * - Usa el Chrome instalado en el sistema (`channel: 'chrome'`). Si no hay
 *   Chrome, instala Chromium de Playwright y corre con `E2E_CHROMIUM=1`.
 *
 * Flujos de escritura (admin CRUD, formulario de contacto + bandeja) solo se
 * ejecutan si se proveen credenciales admin:
 *
 *   E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... pnpm test:e2e
 *
 * IMPORTANTE: esos flujos crean/borran datos reales en el proyecto Supabase al
 * que apunta src/environments/environment.ts → usar un proyecto de PRUEBAS.
 */
const useBundledChromium = process.env.E2E_CHROMIUM === '1';
const fullMatrix = process.env.E2E_BROWSERS === 'all';

/** Desktop Chrome del sistema (o Chromium de Playwright con E2E_CHROMIUM=1). */
const desktopChromium = {
  ...devices['Desktop Chrome'],
  ...(useBundledChromium ? {} : { channel: 'chrome' }),
};

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: desktopChromium,
    },

    // ── Matriz completa (E2E_BROWSERS=all): Firefox, WebKit y móviles ──────
    // Firefox/WebKit siempre usan el bundle de Playwright (`pnpm exec
    // playwright install`); la flag E2E_CHROMIUM solo afecta a la familia
    // Chromium (desktop y móvil Android).
    ...(fullMatrix
      ? [
          {
            name: 'firefox',
            use: devices['Desktop Firefox'],
          },
          {
            name: 'webkit',
            use: devices['Desktop Safari'],
          },
          {
            name: 'mobile-chrome',
            use: { ...devices['Pixel 7'], ...(useBundledChromium ? {} : { channel: 'chrome' }) },
          },
          {
            name: 'mobile-safari',
            use: { ...devices['iPhone 14'] },
          },
        ]
      : []),
  ],
  webServer: {
    command: 'pnpm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
