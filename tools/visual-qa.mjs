#!/usr/bin/env node
/**
 * QA visual del `--accent-deep` en el navegador (Playwright + build de
 * producción servido con tools/serve-dist.mjs).
 *
 * FASE PÚBLICA (sin credenciales): Home, Quiénes Somos, Servicios, Proyectos,
 * detalle, Contacto y /admin/login. Por página y viewport:
 *   1. Screenshot completo (test-results/visual-qa/).
 *   2. Overflow horizontal.
 *   3. Cada elemento con `text-accent-deep` estático: color == rgb(165,58,12)
 *      y contraste WCAG sobre su fondo EFECTIVO (componiendo alfa) >= 4.5:1.
 *   4. Estados interactivos: chip de filtro activo (/proyectos) y errores de
 *      validación (/contacto).
 *
 * FASE ADMIN (requiere E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD): login real y
 * recorrido por /admin, listados, formularios "nuevo", bandeja y contenido,
 * con las mismas comprobaciones. Intercepta SOLO la query de `profiles` para
 * devolver rol admin cuando el proyecto Supabase aún no tiene el esquema
 * aplicado (REST 404); todo lo demás va a la red real y es de solo lectura.
 *
 * Uso: node tools/visual-qa.mjs        (público)
 *      E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... node tools/visual-qa.mjs
 */
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const OUT = join(ROOT, 'test-results', 'visual-qa');
const PORT = 4173;
const BASE = `http://localhost:${PORT}`;

// Contraste WCAG entre dos colores #rrggbb.
function lum(hex) {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
function toHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

const VIEWPORTS = [
  { width: 320, height: 568, label: 'small' },
  { width: 360, height: 800, label: 'phone-s' },
  { width: 390, height: 844, label: 'phone' },
  { width: 430, height: 932, label: 'phone-l' },
  { width: 768, height: 1024, label: 'tablet' },
  { width: 1024, height: 768, label: 'landscape' },
  { width: 1280, height: 800, label: 'laptop' },
  { width: 1440, height: 900, label: 'desktop' },
];

const PAGES = [
  { path: '/', ready: 'section#inicio', file: 'home' },
  { path: '/quienes-somos', ready: 'main section h1', file: 'about' },
  { path: '/servicios', ready: 'main h1', file: 'servicios' },
  { path: '/servicios/proyectos-de-infraestructura', ready: 'main h1', file: 'servicio-detalle' },
  { path: '/proyectos', ready: 'main h1', file: 'proyectos' },
  { path: '/proyectos/casa-ladera', ready: 'main h1', file: 'proyecto-detalle' },
  { path: '/contacto', ready: 'main form', file: 'contacto' },
  { path: '/no-encontrada', ready: 'main h1', file: 'no-encontrada' },
  { path: '/admin/login', ready: 'form', file: 'admin-login' },
];

// Rutas admin de solo lectura para la fase autenticada.
const ADMIN_ROUTES = [
  { path: '/admin', file: 'admin-dashboard' },
  { path: '/admin/proyectos', file: 'admin-proyectos' },
  { path: '/admin/proyectos/nuevo', file: 'admin-proyecto-form' },
  { path: '/admin/servicios', file: 'admin-servicios' },
  { path: '/admin/servicios/nuevo', file: 'admin-servicio-form' },
  { path: '/admin/mensajes', file: 'admin-mensajes' },
  { path: '/admin/contenido', file: 'admin-contenido' },
];

const DEEP = '#a53a0c'; // --accent-deep
const BRAND = '#f25623'; // --accent

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

/** Comprobaciones núcleo sobre la página actual: overflow + accent-deep estáticos. */
async function runCoreChecks(page, tag) {
  const results = [];
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  if (overflow) results.push({ tag, level: 'FAIL', msg: 'overflow horizontal' });

  const deepChecks = await page.evaluate(() => {
    const out = [];
    const seen = new Set();
    for (const el of Array.from(document.querySelectorAll('[class*="accent-deep"]'))) {
      if (seen.has(el)) continue;
      seen.add(el);
      const cls = String(el.className.baseVal ?? el.className);
      if (!cls.split(/\s+/).includes('text-accent-deep')) continue; // solo hover: color de otra clase
      const cs = getComputedStyle(el);
      if (cs.color === 'rgba(0, 0, 0, 0)') continue;
      // fondo efectivo componiendo alfa hacia arriba
      let bg = { r: 0, g: 0, b: 0, a: 0 };
      let node = el;
      while (node && bg.a < 0.99) {
        const m = getComputedStyle(node).backgroundColor.match(
          /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/,
        );
        if (m) {
          const a = m[4] === undefined ? 1 : parseFloat(m[4]);
          if (a > 0) {
            const r = +m[1], g = +m[2], b = +m[3];
            const na = a + bg.a * (1 - a);
            if (na > 0) {
              bg = {
                r: Math.round((r * a + bg.r * bg.a * (1 - a)) / na),
                g: Math.round((g * a + bg.g * bg.a * (1 - a)) / na),
                b: Math.round((b * a + bg.b * bg.a * (1 - a)) / na),
                a: na,
              };
            }
          }
        }
        node = node.parentElement;
      }
      if (bg.a < 0.99) bg = { r: 246, g: 246, b: 244, a: 1 }; // fondo del <body>
      out.push({
        color: cs.color,
        bg: `rgb(${bg.r}, ${bg.g}, ${bg.b})`,
        cls: cls.slice(0, 90),
        text: (el.textContent ?? '').trim().slice(0, 40),
      });
    }
    return out;
  });

  for (const c of deepChecks) {
    const m = c.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    const colorHex = m ? toHex([+m[1], +m[2], +m[3]]) : c.color;
    const bgHex = c.bg;
    const ratio = /^#[0-9a-f]{6}$/i.test(colorHex) ? contrast(colorHex, bgHex) : null;
    if (colorHex.toLowerCase() !== DEEP) {
      results.push({ tag, level: 'FAIL', msg: `accent-deep con color ${colorHex} (no es ${DEEP}) | ${c.cls} | "${c.text}"` });
    } else if (ratio !== null && ratio < 4.5) {
      results.push({ tag, level: 'FAIL', msg: `contraste ${ratio.toFixed(2)}:1 < 4.5 sobre ${bgHex} | ${c.cls} | "${c.text}"` });
    }
  }
  return results;
}

/**
 * Comprobaciones de layout responsive (sin overflow de página):
 * un solo <main>, barra inferior cubierta por su spacer, chips que no superan
 * su fila, grids del formulario que no invaden el padding del panel y hero
 * contenido en 320×568.
 */
async function runLayoutChecks(page, tag) {
  const issues = await page.evaluate(() => {
    const out = [];
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    if (document.documentElement.scrollWidth > vw + 1) out.push('overflow horizontal');

    const mains = document.querySelectorAll('main').length;
    if (mains !== 1) out.push(`${mains} <main> (esperado 1)`);

    const bar = document.querySelector('nav[aria-label="Acciones rápidas"]');
    if (bar && getComputedStyle(bar).display !== 'none') {
      const spacer = bar.closest('app-mobile-action-bar')?.previousElementSibling;
      const barHeight = bar.getBoundingClientRect().height;
      const spacerHeight = spacer?.getBoundingClientRect().height ?? 0;
      if (spacerHeight < barHeight - 1) {
        out.push(`barra ${barHeight.toFixed(1)}px > spacer ${spacerHeight.toFixed(1)}px`);
      }
    }

    for (const row of document.querySelectorAll('.chips-row')) {
      const rowWidth = row.clientWidth;
      for (const child of row.children) {
        const width = child.getBoundingClientRect().width;
        if (width > rowWidth + 1) {
          out.push(`chip ${width.toFixed(0)}px > fila ${rowWidth}px`);
          break;
        }
      }
    }

    for (const grid of document.querySelectorAll('form div')) {
      if (!String(grid.className).includes('minmax')) continue;
      const panel = grid.closest('.panel');
      if (!panel) continue;
      const panelRect = panel.getBoundingClientRect();
      const innerRight = panelRect.right - parseFloat(getComputedStyle(panel).paddingRight);
      for (const child of grid.children) {
        const overflow = child.getBoundingClientRect().right - innerRight;
        if (overflow > 1) {
          out.push(`form grid invade ${overflow.toFixed(0)}px del padding`);
          break;
        }
      }
    }

    const hero = document.querySelector('section#inicio');
    if (hero && vw <= 320) {
      const heroHeight = hero.getBoundingClientRect().height;
      if (heroHeight > vh * 1.15) {
        out.push(`hero ${heroHeight.toFixed(0)}px > ${(vh * 1.15).toFixed(0)}px`);
      }
    }
    return out;
  });

  return issues.map((msg) => ({ tag, level: 'FAIL', msg }));
}

/** Menú móvil: foco inicial, scroll interno, CTA alcanzable, trap y Esc. */
async function runMenuChecks(page, tag) {
  const button = page.locator('button[aria-controls="mobile-menu"]');
  if (!(await button.count()) || !(await button.isVisible().catch(() => false))) return [];

  const results = [];
  await button.click();
  await page.waitForSelector('#mobile-menu', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);

  const info = await page.evaluate(() => {
    const menu = document.querySelector('#mobile-menu');
    if (!menu) return null;
    const cta = menu.querySelector('a.btn-accent');
    const ctaRect = cta?.getBoundingClientRect();
    const active = document.activeElement;
    const buttonEl = document.querySelector('button[aria-controls="mobile-menu"]');
    return {
      initialFocus: !!menu.contains(active) || active === buttonEl,
      scrollHeight: menu.scrollHeight,
      clientHeight: menu.clientHeight,
      overflowY: getComputedStyle(menu).overflowY,
      ctaVisible: ctaRect ? ctaRect.top >= 0 && ctaRect.bottom <= window.innerHeight + 1 : false,
    };
  });

  if (!info) {
    results.push({ tag, level: 'FAIL', msg: 'el menú móvil no renderizó' });
    return results;
  }
  if (!info.initialFocus) results.push({ tag, level: 'FAIL', msg: 'el menú no recibe foco inicial' });
  if (info.scrollHeight > info.clientHeight + 1 && info.overflowY !== 'auto') {
    results.push({ tag, level: 'FAIL', msg: 'el menú no tiene scroll interno' });
  }
  if (!info.ctaVisible) {
    await page.evaluate(() => {
      const menu = document.querySelector('#mobile-menu');
      if (menu) menu.scrollTop = menu.scrollHeight;
    });
    await page.waitForTimeout(150);
    const ctaAfter = await page.evaluate(() => {
      const cta = document.querySelector('#mobile-menu a.btn-accent');
      if (!cta) return false;
      const rect = cta.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight + 1;
    });
    if (!ctaAfter) results.push({ tag, level: 'FAIL', msg: 'el CTA del menú es inalcanzable' });
  }

  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(() => {
      const menu = document.querySelector('#mobile-menu');
      const buttonEl = document.querySelector('button[aria-controls="mobile-menu"]');
      return !!menu && (menu.contains(document.activeElement) || document.activeElement === buttonEl);
    });
    if (!inside) {
      results.push({ tag, level: 'FAIL', msg: 'el foco escapa del menú' });
      break;
    }
  }

  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const closed = await page.evaluate(() => ({
    gone: !document.querySelector('#mobile-menu'),
    focusOnButton: document.activeElement === document.querySelector('button[aria-controls="mobile-menu"]'),
  }));
  if (!closed.gone) results.push({ tag, level: 'FAIL', msg: 'Esc no cierra el menú' });
  if (!closed.focusOnButton) results.push({ tag, level: 'FAIL', msg: 'el foco no vuelve al botón del menú' });
  return results;
}

async function auditPage(page, { path, file, ready }, viewport) {
  const tag = `${file}@${viewport.label}`;
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector(ready ?? 'app-root', { timeout: 30000 });
  await page.waitForTimeout(1800);
  const results = await runCoreChecks(page, tag);
  results.push(...(await runLayoutChecks(page, tag)));
  results.push(...(await runMenuChecks(page, tag)));

  if (path === '/quienes-somos' && viewport.width < 640) {
    const columns = await page.evaluate(() => {
      const gallery = document.querySelector('[class*="auto-rows-"]');
      return gallery
        ? getComputedStyle(gallery).gridTemplateColumns.split(' ').filter(Boolean).length
        : 0;
    });
    if (columns !== 2) {
      results.push({ tag, level: 'FAIL', msg: `galería con ${columns} columnas (esperado 2)` });
    }
  }

  // Chip de filtro activo de /proyectos (relleno naranja + texto oscuro).
  if (path === '/proyectos') {
    const chip = page.locator('section.px-5 button.chip', { hasText: 'Edificaciones' }).first();
    if (await chip.count()) {
      await chip.click();
      await page.waitForTimeout(300);
      const active = await chip.evaluate((el) => {
        const cs = getComputedStyle(el);
        const re = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/;
        const rgbToHex = (m) => (m ? `#${m.slice(1).map((v) => (+v).toString(16).padStart(2, '0')).join('')}` : null);
        return { bg: rgbToHex(cs.backgroundColor.match(re)) ?? cs.backgroundColor, fg: rgbToHex(cs.color.match(re)) ?? cs.color };
      });
      const ok = active.bg?.toLowerCase() === BRAND && contrast(active.bg, active.fg) >= 4.5;
      if (!ok) {
        results.push({ tag, level: 'FAIL', msg: `chip activo: bg ${active.bg} fg ${active.fg} (esperado bg ${BRAND} con texto ≥4.5:1)` });
      }
    }
  }

  // Errores de validación de /contacto tras submit vacío.
  if (path === '/contacto') {
    const submit = page.locator('button[type="submit"]').first();
    if (await submit.count()) {
      await submit.click();
      await page.waitForTimeout(400);
      const errs = await page.evaluate(() => {
        const out = [];
        for (const el of Array.from(document.querySelectorAll('form p.field-error, form p.text-accent-deep'))) {
          const m = getComputedStyle(el).color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          if (m) out.push(`#${m.slice(1).map((v) => (+v).toString(16).padStart(2, '0')).join('')}`);
        }
        return out;
      });
      if (errs.length === 0) {
        results.push({ tag, level: 'WARN', msg: 'no aparecieron errores de validación' });
      } else if (errs.some((c) => c.toLowerCase() !== DEEP)) {
        results.push({ tag, level: 'FAIL', msg: `errores con color ${errs.join(', ')} (esperado ${DEEP})` });
      }
    }
  }

  await page.screenshot({ path: join(OUT, `${tag}.png`), fullPage: true });
  return results;
}

/** Fase admin: login real y recorrido de solo lectura. */
async function auditAdmin(browser, all) {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('(admin omitido — define E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD)');
    return;
  }

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    // Intercepta SOLO la lectura de profiles para que el guard vea rol admin
    // cuando el proyecto Supabase aún no tiene el esquema aplicado (REST 404).
    await context.route('**/rest/v1/profiles**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ role: 'admin' }]) }),
    );
    const page = await context.newPage();

    const loginTag = `admin-login@${vp.label}`;
    await page.goto(BASE + '/admin/login', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('form input[type="email"]', { timeout: 20000 });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    try {
      await page.waitForURL('**/admin', { timeout: 15000 });
    } catch {
      const errMsg = await page
        .locator('form p')
        .allInnerTexts()
        .then((t) => t.join(' · '))
        .catch(() => '');
      all.push({ tag: loginTag, level: 'FAIL', msg: `login no llegó a /admin: ${errMsg}` });
      await context.close();
      continue;
    }
    await page.waitForTimeout(1500);

    for (const route of ADMIN_ROUTES) {
      const tag = `${route.file}@${vp.label}`;
      await page.goto(BASE + route.path, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1600); // bootstrap + restauración de sesión + queries
      if (page.url().includes('/admin/login')) {
        all.push({ tag, level: 'FAIL', msg: 'redirigió a /admin/login (guard rechazó la sesión)' });
        continue;
      }
      // En los formularios "nuevo", dispara la validación (sin escribir datos).
      if (route.path.endsWith('/nuevo')) {
        const submit = page.locator('button[type="submit"]').first();
        if (await submit.count()) {
          await submit.click();
          await page.waitForTimeout(400);
        }
      }
      all.push(...(await runCoreChecks(page, tag)));
      await page.screenshot({ path: join(OUT, `${tag}.png`), fullPage: true });
    }
    await context.close();
  }
}

async function main() {
  if (!existsSync(join(ROOT, 'dist', 'ingesocc-web', 'browser', 'index.html'))) {
    console.log('No se encontró dist/. Ejecuta pnpm build primero.');
    process.exit(1);
  }
  await mkdir(OUT, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const all = [];
  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      // Red externa abortada: datos semilla/defaults y layout determinista.
      await page.route('**/*', (route) => {
        const url = route.request().url();
        if (url.startsWith(BASE) || url.startsWith('http://127.0.0.1')) return route.continue();
        return route.abort();
      });
      for (const p of PAGES) {
        all.push(...(await auditPage(page, p, vp)));
      }
      await page.close();
    }
    await auditAdmin(browser, all);
  } finally {
    await browser.close();
    server.kill();
  }

  const fails = all.filter((r) => r.level === 'FAIL');
  const warns = all.filter((r) => r.level === 'WARN');
  const adminEnabled = Boolean(process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD);
  const pagesAudited = PAGES.length * VIEWPORTS.length + (adminEnabled ? ADMIN_ROUTES.length * VIEWPORTS.length : 0);
  console.log(`\nQA visual completo: ${pagesAudited} páginas auditadas · ${warns.length} warn · ${fails.length} FAIL`);
  for (const w of warns) console.log('⚠', w.tag, '-', w.msg);
  for (const f of fails) console.log('✗', f.tag, '-', f.msg);
  console.log(`Screenshots en ${OUT}/`);
  process.exit(fails.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});