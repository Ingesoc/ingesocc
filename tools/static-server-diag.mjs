/** Servidor estático con MIME correcto para módulos ES (uso temporal de diagnóstico). */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const DIST = 'dist/ingesocc-web/browser';
const PORT = 4174;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    const filePath = join(DIST, urlPath);
    const info = await stat(filePath).catch(() => null);
    if (info && info.isFile()) {
      res.writeHead(200, { 'content-type': MIME[extname(filePath)] ?? 'application/octet-stream' });
      res.end(await readFile(filePath));
      return;
    }
    // Fallback SPA: cualquier ruta devuelve index.html.
    res.writeHead(200, { 'content-type': MIME['.html'] });
    res.end(await readFile(join(DIST, 'index.html')));
  } catch (err) {
    res.writeHead(500);
    res.end(String(err));
  }
}).listen(PORT, () => console.log(`static server on :${PORT}`));
