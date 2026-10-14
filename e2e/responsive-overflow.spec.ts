import { expect, test, type Page } from '@playwright/test';
import { hasAdminCredentials, loginAsAdmin } from './helpers';

/**
 * Responsive UI · sin desbordamiento horizontal (E2E visual).
 *
 * Barrido COMPLETO del sitio público: TODAS las rutas, TODAS las fichas de
 * servicio/proyecto, TODOS los filtros, FAQ desplegada, lightbox abierto,
 * errores de validación de /contacto, campos con texto largo, menú móvil
 * abierto y zoom de texto al 150% — en una matriz de 12 viewports (móvil
 * pequeño → landscape → tableta → portátiles → escritorio grande).
 *
 * Verifica por cada estado:
 *   1. Ni el documento ni el <body> desbordan en horizontal
 *      (scrollWidth <= clientWidth): nada de scroll horizontal.
 *   2. Ningún elemento visible (no clipped por un ancestro overflow-x
 *      hidden/clip, no absolute decorativo) queda fuera del viewport.
 *
 * Con E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD también recorre los módulos del panel.
 */

const VIEWPORTS = [
  { width: 320, height: 568, label: '320-móvil' },
  { width: 360, height: 640, label: '360-android' },
  { width: 390, height: 844, label: '390-iPhone' },
  { width: 414, height: 896, label: '414-iPhoneMax' },
  { width: 568, height: 320, label: '568-landscape' },
  { width: 844, height: 390, label: '844-landscape' },
  { width: 768, height: 1024, label: '768-tablet' },
  { width: 1024, height: 768, label: '1024-tablet-h' },
  { width: 1280, height: 800, label: '1280-desktop' },
  { width: 1366, height: 768, label: '1366-desktop' },
  { width: 1440, height: 900, label: '1440-desktop' },
  { width: 1920, height: 1080, label: '1920-desktop' },
];

/** Viewports representativos para la cobertura exhaustiva (todas las fichas/filtros). */
const KEY_VIEWPORTS = [VIEWPORTS[0], VIEWPORTS[6], VIEWPORTS[10]];

/** Rutas públicas + de autenticación (todas las que no exigen sesión). */
const PUBLIC_ROUTES = [
  '/',
  '/quienes-somos',
  '/servicios',
  '/proyectos',
  '/contacto',
  '/no-encontrada',
  '/ruta-inexistente-404', // comodín ** → no-encontrada
  '/admin/login',
  '/admin/recuperar',
  '/admin/nueva-contrasena',
];

interface OverflowReport {
  htmlDelta: number;
  bodyDelta: number;
  offenders: string[];
}

/** Detecta overflow horizontal: píxeles del documento/body y elementos visibles fuera del viewport. */
async function measureOverflow(page: Page): Promise<OverflowReport> {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;

    const isClipped = (el: Element): boolean => {
      let n = el.parentElement;
      while (n && n !== document.body) {
        const cs = getComputedStyle(n);
        if (cs.overflowX === 'hidden' || cs.overflowX === 'clip') return true;
        n = n.parentElement;
      }
      return false;
    };

    const found: { by: number; tag: string; text: string }[] = [];
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      const cs = getComputedStyle(el);
      if (
        cs.display === 'none' ||
        cs.visibility === 'hidden' ||
        cs.opacity === '0' ||
        cs.position === 'fixed' ||
        cs.position === 'absolute'
      ) {
        continue;
      }
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const over = Math.max(r.right - vw, -r.left);
      if (over <= 1) continue;
      if (isClipped(el)) continue;
      const cls =
        typeof el.className === 'string'
          ? el.className
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 3)
              .join('.')
          : '';
      const tag = el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + (cls ? `.${cls}` : '');
      found.push({
        by: Math.round(over),
        tag: tag.slice(0, 140),
        text: (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 48),
      });
    }
    found.sort((a, b) => b.by - a.by);

    return {
      htmlDelta: document.documentElement.scrollWidth - vw,
      bodyDelta: document.body.scrollWidth - vw,
      offenders: found.slice(0, 5).map((f) => `+${f.by}px ${f.tag} "${f.text}"`),
    };
  });
}

async function expectNoOverflow(page: Page, context: string): Promise<void> {
  const r = await measureOverflow(page);
  const detail =
    r.offenders.length > 0
      ? ` Elementos fuera del viewport: ${r.offenders.join(' | ')}`
      : '';
  expect(r.htmlDelta, `${context} → html desborda +${r.htmlDelta}px.${detail}`).toBeLessThanOrEqual(1);
  expect(r.bodyDelta, `${context} → body desborda +${r.bodyDelta}px.${detail}`).toBeLessThanOrEqual(1);
  expect(r.offenders, `${context} → hay contenido visible fuera del viewport`).toHaveLength(0);
}

/** Espera el bootstrap (main, si existe) + fuentes + un margen para consultas/estado. */
async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.locator('main').first().waitFor({ timeout: 6_000 }).catch(() => undefined);
  await page.evaluate(() =>
    Promise.race([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      new Promise((resolve) => setTimeout(resolve, 1200)),
    ]),
  );
  await page.waitForTimeout(300);
}

/** Recorre toda la página (carga imágenes lazy) y vuelve arriba. */
async function scrollThrough(page: Page): Promise<void> {
  await page.evaluate(() =>
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
  );
  await page.waitForTimeout(250);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(150);
}

async function gotoAndCheck(page: Page, path: string, context: string): Promise<void> {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await settle(page);
  await scrollThrough(page);
  await expectNoOverflow(page, context);
}

/** Recoge los hrefs únicos que empiezan por `prefix/` en la página actual. */
async function collectDetailLinks(page: Page, listPath: string): Promise<string[]> {
  await page.goto(listPath, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await settle(page);
  return page
    .locator(`a[href^="${listPath}/"]`)
    .evaluateAll((els) =>
      Array.from(
        new Set(
          els
            .map((e) => (e as HTMLAnchorElement).getAttribute('href') ?? '')
            .filter((h) => h && h.startsWith('/') && !h.includes('#'))
            .map((h) => h.split('?')[0]),
        ),
      ),
    );
}

test.describe('Responsive UI · sin desbordamiento', () => {
  for (const vp of VIEWPORTS) {
    test.describe(`${vp.width}x${vp.height} · ${vp.label}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test('todas las rutas públicas y de autenticación', async ({ page }) => {
        for (const path of PUBLIC_ROUTES) {
          await gotoAndCheck(page, path, `${vp.width}px · ${path}`);
        }
      });

      test('ficha de servicio (FAQ), ficha de proyecto (lightbox) y lightbox de "Quiénes somos"', async ({ page }) => {
        // Servicio: primera ficha + FAQ desplegada.
        await page.goto('/servicios', { waitUntil: 'domcontentloaded' });
        await settle(page);
        const serviceCard = page.locator('a[href^="/servicios/"]').first();
        if ((await serviceCard.count()) > 0) {
          await serviceCard.click();
          await settle(page);
          await scrollThrough(page);
          await expectNoOverflow(page, `${vp.width}px · /servicios/:slug`);

          const faqs = page.locator('details');
          const n = await faqs.count();
          for (let i = 0; i < n; i++) {
            await faqs.nth(i).locator('summary').click();
          }
          if (n > 0) {
            await page.waitForTimeout(150);
            await expectNoOverflow(page, `${vp.width}px · /servicios/:slug + FAQ abierta`);
          }
        }

        // Proyecto: primera ficha + lightbox de la galería.
        await page.goto('/proyectos', { waitUntil: 'domcontentloaded' });
        await settle(page);
        const projectCard = page.locator('a[href^="/proyectos/"]').first();
        if ((await projectCard.count()) > 0) {
          await projectCard.click();
          await settle(page);
          await scrollThrough(page);
          await expectNoOverflow(page, `${vp.width}px · /proyectos/:slug`);
          await expectLightbox(page, `${vp.width}px · /proyectos/:slug lightbox`);
        }

        // Quiénes somos: lightbox de la galería de operaciones.
        await page.goto('/quienes-somos', { waitUntil: 'domcontentloaded' });
        await settle(page);
        await expectLightbox(page, `${vp.width}px · /quienes-somos lightbox`);
      });

      test('estados interactivos (todos los filtros, contacto, menú móvil)', async ({ page }) => {
        // Todos los chips de filtro de /proyectos (categoría y ubicación).
        await page.goto('/proyectos', { waitUntil: 'domcontentloaded' });
        await settle(page);
        const chips = page.locator('button[aria-pressed]');
        const chipCount = await chips.count();
        for (let i = 0; i < chipCount; i++) {
          await chips.nth(i).click();
          await page.waitForTimeout(120);
          await expectNoOverflow(page, `${vp.width}px · /proyectos filtro #${i}`);
        }
        // Paginación (si hay más proyectos).
        const loadMore = page.getByRole('button', { name: /Cargar más proyectos/i });
        if ((await loadMore.count()) > 0) {
          await loadMore.click();
          await page.waitForTimeout(200);
          await expectNoOverflow(page, `${vp.width}px · /proyectos "Cargar más"`);
        }

        // /contacto: errores tras submit vacío + campos con texto larguísimo.
        await page.goto('/contacto', { waitUntil: 'domcontentloaded' });
        await settle(page);
        const submit = page.locator('button[type="submit"]').first();
        if ((await submit.count()) > 0) {
          await submit.click();
          await page.waitForTimeout(250);
          await expect(
            page.locator('form p.text-accent-deep').filter({ hasText: /\S/ }).first(),
            'tras enviar el formulario vacío debe mostrarse al menos un mensaje de validación',
          ).toBeVisible();
          await expectNoOverflow(page, `${vp.width}px · /contacto (errores)`);

          await page.locator('#name').fill('Nombre '.repeat(20));
          await page.locator('#email').fill('correo.muy.largo.de.prueba@subdominio-extenso.example.com');
          await page.locator('#subject').fill('Asunto extremadamente largo '.repeat(10));
          await page.locator('#message').fill('Mensaje muy largo sin espacios '.repeat(40));
          await page.waitForTimeout(150);
          await expectNoOverflow(page, `${vp.width}px · /contacto (texto largo)`);
        }

        // Menú móvil abierto: overlay a pantalla completa sin desbordar.
        if (vp.width < 1024) {
          await page.goto('/', { waitUntil: 'domcontentloaded' });
          await settle(page);
          const open = page.getByRole('button', { name: 'Abrir menú' });
          if ((await open.count()) > 0) {
            await open.click();
            await expect(page.getByRole('navigation', { name: 'Menú móvil' })).toBeVisible();
            await expectNoOverflow(page, `${vp.width}px · menú móvil abierto`);
            await page.getByRole('button', { name: 'Cerrar menú' }).click();
            await expect(page.getByRole('button', { name: 'Cerrar menú' })).toHaveCount(0);
          }
        }
      });

      test('zoom de texto 150% (accesibilidad) sin desbordamiento', async ({ page, browserName }) => {
        // Aprobado en Chromium (emulación fiable); en otros motores se omite.
        test.skip(browserName !== 'chromium', 'Emulación de zoom solo en Chromium.');
        for (const path of ['/', '/servicios', '/proyectos', '/contacto', '/quienes-somos']) {
          await page.goto(path, { waitUntil: 'domcontentloaded' });
          await settle(page);
          await page.addStyleTag({ content: 'html { font-size: 150% !important; }' });
          await page.waitForTimeout(150);
          await scrollThrough(page);
          await expectNoOverflow(page, `${vp.width}px · ${path} (zoom 150%)`);
        }
      });
    });
  }
});

/** Abre el lightbox (si existe una galería) y comprueba su contenido. */
async function expectLightbox(page: Page, context: string): Promise<void> {
  const trigger = page.locator('button.media-zoom').first();
  if ((await trigger.count()) === 0) return;
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: /ampliada/i });
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(300); // carga de la imagen ampliada
  await expectNoOverflow(page, `${context} (abierto)`);
  await dialog.getByRole('button', { name: 'Cerrar galería' }).click();
  await expect(dialog).toHaveCount(0);
}

// Cobertura exhaustiva: TODAS las fichas y TODOS los filtros en viewports clave.
test.describe('Responsive UI · cobertura total de contenido', () => {
  for (const vp of KEY_VIEWPORTS) {
    test.describe(`${vp.width}x${vp.height} · ${vp.label}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test('todas las fichas de servicio', async ({ page }) => {
        const links = await collectDetailLinks(page, '/servicios');
        expect(links.length, 'el listado de servicios debe tener fichas').toBeGreaterThan(0);
        for (const href of links) {
          await gotoAndCheck(page, href, `${vp.width}px · ${href}`);
        }
      });

      test('todas las fichas de proyecto', async ({ page }) => {
        const links = await collectDetailLinks(page, '/proyectos');
        expect(links.length, 'el listado de proyectos debe tener fichas').toBeGreaterThan(0);
        for (const href of links) {
          await gotoAndCheck(page, href, `${vp.width}px · ${href}`);
        }
      });
    });
  }
});

// Regresión: las tarjetas de proyecto no deben solaparse verticalmente.
// El grid de /proyectos no puede fijar alto de fila menor que el contenido
// de la tarjeta (imagen + texto), o una fila invade la siguiente.
test.describe('Proyectos · tarjetas sin solape vertical', () => {
  for (const vp of [VIEWPORTS[0], VIEWPORTS[6], VIEWPORTS[10]]) {
    test(`${vp.width}px`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/proyectos', { waitUntil: 'domcontentloaded' });
      await settle(page);

      const boxes = await page.locator('app-project-card').evaluateAll((nodes) =>
        nodes.map((n) => {
          const r = (n as HTMLElement).getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, left: r.left };
        }),
      );
      expect(boxes.length, 'debe haber tarjetas de proyecto').toBeGreaterThan(0);

      for (let i = 1; i < boxes.length; i++) {
        for (let j = 0; j < i; j++) {
          const above = boxes[j];
          const below = boxes[i];
          const sameColumn = Math.abs(above.left - below.left) < 8;
          expect(
            sameColumn && below.top < above.bottom - 1,
            `tarjeta #${i} (top ${Math.round(below.top)}) se solapa con la #${j} (bottom ${Math.round(above.bottom)}) en ${vp.width}px`,
          ).toBe(false);
        }
      }
    });
  }
});

// Panel admin (solo con credenciales: login real contra el proyecto Supabase de pruebas).
if (hasAdminCredentials) {
  const ADMIN_ROUTES = [
    '/admin',
    '/admin/proyectos',
    '/admin/proyectos/nuevo',
    '/admin/servicios',
    '/admin/servicios/nuevo',
    '/admin/testimonios',
    '/admin/testimonios/nuevo',
    '/admin/mensajes',
    '/admin/contenido',
  ];

  test.describe('Panel admin · sin desbordamiento', () => {
    for (const vp of [
      { width: 320, height: 568, label: '320-móvil' },
      { width: 768, height: 1024, label: '768-tablet' },
      { width: 1440, height: 900, label: '1440-desktop' },
    ]) {
      test.describe(`${vp.label}`, () => {
        test.use({ viewport: { width: vp.width, height: vp.height } });

        test('recorrido de módulos admin sin desbordamiento', async ({ page }) => {
          await loginAsAdmin(page);
          for (const path of ADMIN_ROUTES) {
            await gotoAndCheck(page, path, `${vp.label} · ${path}`);
          }
        });
      });
    }
  });
}
