/**
 * Prueba INTERACTIVA del login admin (Chrome visible).
 *
 * Abre https://ingesocc.vercel.app/admin/login, el usuario escribe sus
 * credenciales reales en el navegador (nunca en la terminal) y al terminar se
 * inspecciona el resultado: URL final, sesión persistida y rol en `profiles`.
 * No imprime tokens ni contraseñas.
 *
 *   node tools/login-headed.mjs
 *   BASE_URL=https://staging.example.com node tools/login-headed.mjs
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'https://ingesocc.vercel.app';
const SUPABASE_URL = 'https://ietjikoddwpdybarcwfk.supabase.co';
const ANON_KEY = 'sb_publishable_LVu592zBe0VKIhL3Cd6Vtg__9wGRXqv';

mkdirSync('test-results/admin-login-probe', { recursive: true });

console.log(`\nAbriendo ${BASE}/admin/login en Chrome…`);
console.log('▶ Escribe tus credenciales y pulsa "Ingresar".');
console.log('▶ El diagnóstico aparecerá aquí al terminar (límite: 5 minutos).\n');

const browser = await chromium.launch({ channel: 'chrome', headless: false, slowMo: 50 });
const page = await browser.newPage();

try {
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded' });
} catch (err) {
  console.error('No se pudo abrir la página:', err.message?.slice(0, 200));
  await browser.close();
  process.exit(1);
}

const deadline = Date.now() + 5 * 60_000;
let lastAlert = '';
let outcome = 'timeout';

while (Date.now() < deadline) {
  if (/\/admin\/?$/.test(new URL(page.url()).pathname)) {
    outcome = 'panel';
    break;
  }
  const alert = page.locator('[role="alert"]');
  if (await alert.isVisible().catch(() => false)) {
    const t = (await alert.textContent())?.trim() ?? '';
    if (t && t !== lastAlert) {
      lastAlert = t;
      console.log(`[alerta en pantalla] ${t}`);
    }
  }
  await page.waitForTimeout(500);
}

if (outcome === 'panel') {
  console.log(`\n✓ Login OK — el guard dejó pasar a: ${page.url()}`);
  await page.waitForTimeout(1500); // deja que el panel cargue sus datos
  await page
    .screenshot({ path: 'test-results/admin-login-probe/3-panel-headed.png', fullPage: true })
    .catch(() => {});

  // Sesión persistida por supabase-js (sin imprimir el access_token).
  const sess = await page.evaluate(() => {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('sb-') && k.includes('-auth-token')) {
        try {
          const raw = JSON.parse(localStorage.getItem(k) ?? '');
          const s = raw?.currentSession ?? raw; // compat formas viejas de storage
          if (s?.access_token) {
            return {
              key: k,
              email: s.user?.email ?? '(sin email)',
              uid: s.user?.id ?? '(sin id)',
              expiresAt: s.expires_at ?? null,
              token: s.access_token,
            };
          }
        } catch {
          /* clave no-JSON: ignorar */
        }
      }
    }
    return null;
  });

  if (!sess) {
    console.log('✗ No hay sesión supabase en localStorage (inesperado tras entrar al panel).');
  } else {
    const exp = sess.expiresAt ? new Date(sess.expiresAt * 1000).toLocaleString() : '?';
    console.log(`Sesión OK   → key=${sess.key}`);
    console.log(`            → usuario=${sess.email} (id ${sess.uid.slice(0, 8)}…, expira ${exp})`);

    // Lectura de profiles con el access_token del usuario (mismo camino que la app).
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${sess.uid}&select=id,email,role`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${sess.token}` } },
    );
    const body = await r.json().catch(() => null);
    const rows = Array.isArray(body) ? body : null;
    if (rows === null) {
      console.log('profiles    → respuesta no-JSON (¿RLS bloqueando o tabla ausente?)');
    } else if (rows.length === 0) {
      console.log(
        'profiles    → 0 filas para tu usuario: sin fila en profiles o RLS la oculta → el guard nunca te daría rol admin',
      );
    } else {
      console.log(`profiles    → role='${rows[0].role}' ${rows[0].role === 'admin' ? '✓ admin confirmado' : '✗ NO es admin'}`);
    }
  }
} else if (outcome === 'timeout') {
  console.log('\n✗ Tiempo agotado sin entrar al panel.');
  if (lastAlert) console.log(`Último error mostrado en pantalla: ${lastAlert}`);
} else {
  console.log(`\n✗ Fin inesperado: ${outcome}`);
}

await browser.close().catch(() => {});
console.log('\n(ventana cerrada — fin de la prueba)');
