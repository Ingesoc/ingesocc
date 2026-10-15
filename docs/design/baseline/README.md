# Línea base "antes" — Fase 00 (Brújula)

Fecha: 2026-10-14 · Rama: `feature/redesign` @ `357a11c`
Método: pruebas automáticas reales (Karma, Playwright, Lighthouse) + captura de
pantallas de producción local servida desde `dist/`. **El modelo no puede leer
imágenes**: las capturas quedan como evidencia para revisión humana; la
comparación se apoya en las métricas de `baseline-metrics.json`.

---

## 1. Estado del repositorio (preservación)

| Ítem | Valor |
|---|---|
| Rama | `feature/redesign` (el plan referencia `feat/visual-upgrade`; se conserva la rama real) |
| HEAD | `357a11c` — *clean repository and add directrices of desgin* |
| `git status` | limpio (sin cambios locales sin confirmar) |
| Remoto | `https://github.com/Ingesoc/ingesocc.git` |

No se descartó ni sobrescribió ningún cambio. Los prompts fuente `[A]`/`[B]`
(`PROMPT_REDISENO_VISUAL_INGESOCC.md`, `prompt-agente-visual-ingesocc.md`)
existen en disco y están en `.gitignore`.

## 2. Entorno y bloqueos conocidos

- **Supabase local no activo.** `src/environments/environment.ts` apunta a
  `http://127.0.0.1:64321` (no hay instancia corriendo). Por eso las consultas
  REST fallan y la app cae a los datos de respaldo (seed) — visible en consola
  como 400/404 de Supabase. **No es un defecto de UI.**
- **Credenciales admin ausentes** (`E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`): las
  rutas `/admin/*` autenticadas y su QA visual no se pudieron recorrer (3 tests
  e2e quedan `skipped`, fase admin de `test:visual` omitida).
- `pnpm install --frozen-lockfile` → *Already up to date* (pnpm 10.32.1, Node 24.14.0).

## 3. Comandos ejecutados y resultado

| Comando | Resultado |
|---|---|
| `pnpm build` | ✅ OK — **689.70 kB** inicial / **146.99 kB** transfer |
| `pnpm test:ci` | ✅ **164/164 SUCCESS** |
| `pnpm test:e2e` | ⚠️ **69 passed · 3 skipped · 1 failed** (ver §5) |
| `pnpm test:visual` | ✅ **0 FAIL · 0 WARN** |
| `pnpm test:perf` | ✅ Todos los presupuestos de nivel "error" se cumplen |
| `node tools/baseline-shots.mjs` | ✅ 21 capturas · 0 overflow horizontal |

## 4. Línea base de rendimiento (Lighthouse)

Medido con `tools/lighthouse-ci.mjs` sobre `dist/` (reportes JSON en
`.lighthouseci/`, ignorado por git).

| Escenario | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| Desktop · Home | 87 | 95 | 96 | 100 |
| Desktop · Proyectos | 91 | 95 | 96 | 100 |
| Mobile · Home | 61 | 95 | 96 | 100 |
| Mobile · Proyectos | 63 | 95 | 96 | 100 |

Transfer: `document` 14.6 kB · `script` 838.1 kB (WARN) · `total` 2.0–2.4 MB.

> **Nota vs. referencia histórica** (plan §2): la referencia de 2026-09 daba
> Desktop ~95–97, Mobile ~65–66 y **Accessibility = 100**. La medición actual da
> Accessibility **95** en `/` y `/proyectos`: hay un objetivo de a11y que aún no
> se cumple (Fase 11) y el rendimiento móvil está algo por debajo. Se toma la
> medición real de hoy como línea base.

## 5. Fallos preexistentes aislados (no atribuibles al rediseño)

1. **E2E `password-recovery.spec.ts` → 1 failure.**
   El test espera el texto *"Si el correo está registrado…"* tras solicitar el
   enlace. `AuthService.requestPasswordReset` lanza si Supabase responde error;
   con el Supabase **local caído** la llamada falla y la vista muestra el estado
   de error en vez de la confirmación. Depende del entorno (requiere Supabase
   vivo), no del componente. *(E2E con Supabase local activo debería dar 70
   passed, como registró el commit previo.)*
2. **Warning unitario:** `[testimonials] sin datos (se oculta la sección):
   relation "public.testimonials" does not exist` — migraciones no aplicadas;
   comportamiento previsto (se oculta la sección).
3. **REST 400/404** de Supabase (`projects` 400, `services` 400,
   `testimonials` 404) en todas las rutas — esquema remoto sin migrar; la
   interfaz usa el seed y renderiza correctamente.

Estos fallos quedan **aislados**: no se corregirán como parte del rediseño.

## 6. Capturas "antes"

- Carpeta: `docs/design/baseline/screenshots/` (21 PNG full-page).
- Rutas: `/`, `/quienes-somos`, `/servicios`, `/proyectos`,
  `/proyectos/casa-ladera`, `/contacto`, `/admin/login`.
- Viewports: **390 · 820 · 1440** px.
- Nombres: `<pagina>@<viewport>.png`.
- Métricas de geometría y overflow por página/viewport:
  `docs/design/baseline/baseline-metrics.json`.

## 7. Cómo reproducir la línea base

```bash
pnpm install
pnpm build
pnpm test:ci
pnpm test:e2e          # 3 skipped sin credenciales admin; 1 fallo con Supabase local caído
pnpm test:visual
pnpm test:perf
node tools/baseline-shots.mjs
```

## 8. Criterio de salida (Fase 00)

- [x] Rama, `git status` y commits recientes comprobados; nada sobrescrito.
- [x] Proyecto construido y recorrido (build + servidor estático + capturas).
- [x] Pruebas de referencia ejecutadas y registradas.
- [x] Fallos preexistentes aislados de la implementación nueva.
- [x] Screenshots "antes" en 390/820/1440 y métricas reproducibles.
