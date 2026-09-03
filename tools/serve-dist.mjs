// Servidor estático mínimo para servir dist/ingesocc-web/browser con fallback
// SPA (mismo comportamiento que vercel.json: rewrites a index.html). Lo usa
// Lighthouse CI (lighthouserc.json → collect.startServerCommand) para auditar
// la build de producción localmente o en CI.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = join(process.cwd(), 'dist', 'ingesocc-web', 'browser');
const PORT = Number(process.env.PORT ?? 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    let filePath = normalize(join(ROOT, pathname === '/' ? 'index.html' : pathname));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    let data;
    let resolvedPath = filePath;
    try {
      data = await readFile(filePath);
    } catch {
      // Fallback SPA: rutas profundas (/proyectos/:slug, /admin/…) sirven index.html.
      resolvedPath = join(ROOT, 'index.html');
      data = await readFile(resolvedPath);
    }

    res.writeHead(200, {
      'Content-Type': MIME[extname(resolvedPath)] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  } catch {
    res.writeHead(500);
    res.end('Internal server error');
  }
}).listen(PORT, () => {
  console.log(`Serving ${ROOT} at http://localhost:${PORT}`);
});