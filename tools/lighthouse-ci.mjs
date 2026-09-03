#!/usr/bin/env node
/**
 * Auditoría Lighthouse con presupuestos para las páginas públicas clave,
 * en modo escritorio y modo móvil.
 *
 * Sustituye a LHCI CLI: chrome-launcher falla en Windows (EPERM al limpiar su
 * directorio temporal), mientras que esta versión usa lighthouse programático
 * y tolera ese fallo de limpieza. En CI (Linux) funciona igual.
 *
 * Uso:
 *   pnpm test:perf   → hace build y audita / y /proyectos en escritorio y móvil
 *                      contra los presupuestos definidos abajo (exit 1 si falla
 *                      algún presupuesto de nivel "error").
 *   node tools/lighthouse-ci.mjs [desktop|mobile]   → asume dist/ construido;
 *                      un argumento opcional filtra el modo a ejecutar.
 *
 * Los reportes JSON completos se guardan en .lighthouseci/.
 *
 * IMPORTANTE: el modo escritorio exige throttling explícito — sin él,
 * Lighthouse aplica los valores MÓVILES por defecto (RTT 150 ms, 1.6 Mbps,
 * CPU 4×) y las métricas no reflejan un escritorio real.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist', 'ingesocc-web', 'browser');
const OUT_DIR = join(ROOT, '.lighthouseci');
const PORT = Number(process.env.PORT ?? 4173);
const BASE = `http://localhost:${PORT}`;

const PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Proyectos', path: '/proyectos' },
];

// Presupuestos. kind: 'category' (score 0..1, más alto es mejor) o
// 'transfer' (bytes, más bajo es mejor). error → exit 1; warn → aviso.
//
// Calibrados con el estado actual (sept 2026): Performance escritorio ~92-97;
// móvil ~62-66 (throttling real 1.6 Mbps/CPU 4×: el peso JS y las imágenes
// pesan más); JS total ~707 KB (Angular + supabase-js diferido); transfer
// total 1.6-2.2 MB según cuántas portadas cargue la página. Los umbrales
// dejan margen para fluctuación y avisan antes de que un cambio degrade la
// página.
function makeBudgets(perfError, perfWarn) {
  return [
    { id: 'performance', label: 'Performance', kind: 'category', error: perfError, warn: perfWarn },
    { id: 'accessibility', label: 'Accessibility', kind: 'category', warn: 0.9 },
    { id: 'best-practices', label: 'Best practices', kind: 'category', warn: 0.9 },
    { id: 'seo', label: 'SEO', kind: 'category', warn: 0.9 },
    { id: 'document', label: 'document (transfer)', kind: 'transfer', warn: 25_000, error: 40_000 },
    { id: 'script', label: 'script (transfer)', kind: 'transfer', warn: 800_000, error: 1_000_000 },
    { id: 'total', label: 'total (transfer)', kind: 'transfer', warn: 2_800_000, error: 3_500_000 },
  ];
}

// Modos de auditoría (presets de throttling de Lighthouse).
const MODES = [
  {
    id: 'desktop',
    label: 'DESKTOP (1440×900 · 10 Mbps · CPU 1×)',
    settings: {
      formFactor: 'desktop',
      screenEmulation: {
        mobile: false,
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        disabled: false,
      },
      throttlingMethod: 'simulate',
      throttling: { rttMs: 40, throughputKbps: 10_000, cpuSlowdownMultiplier: 1 },
    },
    budgets: makeBudgets(0.8, 0.9),
  },
  {
    id: 'mobile',
    label: 'MOBILE (412×823 · 1.6 Mbps · CPU 4×)',
    settings: {
      formFactor: 'mobile',
      screenEmulation: {
        mobile: true,
        width: 412,
        height: 823,
        deviceScaleFactor: 1.75,
        disabled: false,
      },
      throttlingMethod: 'simulate',
      throttling: { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 },
    },
    // Móvil real: 62-66 con el estado actual (sept 2026). warn 0.6 avisa cuando
    // la página cae por debajo de su rango típico; error 0.5 marca regresiones.
    budgets: makeBudgets(0.5, 0.6),
  },
];

const CHROME_FLAGS = [
  '--headless=new',
  '--disable-crash-reporter',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-networking',
  '--disable-component-update',
  '--disable-extensions',
  '--disable-gpu',
  '--no-sandbox',
];

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['tools/serve-dist.mjs'], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PORT: String(PORT) },
    });
    let out = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('El servidor estático no arrancó a tiempo'));
    }, 15_000);

    child.stdout.on('data', (d) => {
      out += d;
      if (out.includes('Serving')) {
        clearTimeout(timer);
        resolve(child);
      }
    });
    child.stderr.on('data', (d) => {
      out += d;
    });
    child.on('exit', (code) => {
      clearTimeout(timer);
      if (code !== 0 && !out.includes('Serving')) {
        reject(new Error(`El servidor estático terminó antes de tiempo (exit ${code})`));
      }
    });
  });
}

async function waitForServer() {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/`);
      if (res.ok) return;
    } catch {
      /* todavía arrancando */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('El servidor estático no responde');
}

function valueFor(kind, id, lhr) {
  if (kind === 'category') {
    return lhr.categories[id]?.score ?? null;
  }
  const items = lhr.audits['resource-summary']?.details?.items ?? [];
  const item = items.find((i) => i.resourceType === id);
  return item?.transferSize ?? null;
}

function formatValue(kind, value) {
  if (value === null) return 'n/a';
  if (kind === 'category') return (value * 100).toFixed(0);
  return `${(value / 1024).toFixed(1)} KB`;
}

function runAudit(url, settings) {
  return import('lighthouse').then(({ default: lighthouse }) => {
    return import('chrome-launcher').then(async (mod) => {
      const chromeLauncher = mod.default ?? mod;
      const chrome = await chromeLauncher.launch({ chromeFlags: CHROME_FLAGS });
      try {
        const result = await lighthouse(
          url,
          {
            port: chrome.port,
            output: 'json',
            logLevel: 'error',
            onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
          },
          { extends: 'lighthouse:default', settings },
        );
        if (!result?.lhr) {
          throw new Error(`Lighthouse no produjo resultados para ${url}`);
        }
        return result.lhr;
      } finally {
        try {
          await chrome.kill();
        } catch {
          // chrome-launcher en Windows puede lanzar EPERM al limpiar su temp
          // dir; el navegador ya cerró, así que el error es inocuo.
        }
      }
    });
  });
}

function evaluate(mode, page, lhr) {
  const checks = [];
  for (const b of mode.budgets) {
    const value = valueFor(b.kind, b.id, lhr);
    let status;
    if (value === null) {
      status = 'MISSING';
    } else if (b.error !== undefined && (b.kind === 'category' ? value < b.error : value > b.error)) {
      status = 'FAIL';
    } else if (b.kind === 'category' ? value < b.warn : value > b.warn) {
      status = 'WARN';
    } else {
      status = 'PASS';
    }
    const op = b.kind === 'category' ? '≥' : '≤';
    const threshold =
      b.error !== undefined
        ? `${op} ${formatValue(b.kind, b.error)}`
        : `${op} ${formatValue(b.kind, b.warn)}`;
    checks.push({ budget: b.id, label: b.label, kind: b.kind, value, threshold, status });
  }
  return checks;
}

async function main() {
  if (!existsSync(join(DIST, 'index.html'))) {
    log(`No se encontró ${DIST}/index.html. Ejecuta "pnpm build" primero.`);
    process.exit(1);
  }

  const filter = process.argv[2];
  const modes = filter ? MODES.filter((m) => m.id === filter) : MODES;
  if (modes.length === 0) {
    log(`Modo desconocido: "${filter}" (usa desktop | mobile).`);
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  log(`Sirviendo ${DIST} en ${BASE} …`);
  const server = await startServer();
  let failures = 0;

  try {
    await waitForServer();

    for (const mode of modes) {
      for (const page of PAGES) {
        const url = `${BASE}${page.path}`;
        log(`\n=== ${mode.label} — ${page.name} (${url}) ===`);
        const lhr = await runAudit(url, mode.settings);
        const checks = evaluate(mode, page, lhr);

        for (const check of checks) {
          if (check.status === 'FAIL') failures += 1;
          log(
            `  ${check.label.padEnd(26)} ${formatValue(check.kind, check.value).padStart(9)}   (${check.threshold})  ${check.status}`,
          );
        }

        const report = {
          mode: mode.id,
          page: page.name,
          url,
          categories: lhr.categories,
          audits: lhr.audits,
          checks,
        };
        const slug = `${mode.id}-${page.name.toLowerCase().replace(/\s+/g, '-')}`;
        await writeFile(join(OUT_DIR, `${slug}.json`), JSON.stringify(report, null, 2));
      }
    }
  } finally {
    server.kill();
  }

  log(`\nReportes JSON en ${OUT_DIR}/`);
  if (failures > 0) {
    log(`✗ ${failures} presupuesto(s) de nivel "error" superado(s).`);
    process.exit(1);
  }
  log('✓ Todos los presupuestos de nivel "error" se cumplen.');
}

main().catch((err) => {
  log(`\nError: ${err.message}`);
  process.exit(1);
});