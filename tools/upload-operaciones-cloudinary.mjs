#!/usr/bin/env node
/**
 * Sube la galería de "Operaciones en ejecución" a Cloudinary (one-off).
 *
 * Replica las convenciones del upload firmado del admin (`api/_lib/cloudinary.ts`):
 * - carpeta raíz `ingesocc/`, aquí `ingesocc/content/operaciones`
 * - firma SHA-1 sobre los params ordenados alfabéticamente + api_secret
 * - `public_id` determinista: nombre de archivo sin extensión (slugs seguros,
 *   sin espacios ni acentos) → re-ejecutar el script es idempotente
 *
 * Lee credenciales de `.env.local` (gitignored) y NUNCA las imprime.
 * Imágenes → /image/upload, video → /video/upload.
 *
 * Uso:
 *   node tools/upload-operaciones-cloudinary.mjs            # sube y actualiza el manifiesto
 *   node tools/upload-operaciones-cloudinary.mjs --dry-run  # solo lista lo que subiría
 *   node tools/upload-operaciones-cloudinary.mjs --delete   # borra TODO lo subido (¡no toca el manifiesto!)
 *
 * Reemplazar fotos por versiones mejores:
 *   - Mismos nombres de archivo → corre el script de nuevo: sobrescribe cada
 *     public_id y el manifiesto queda apuntando a la versión nueva.
 *   - Nombres nuevos → corre con --delete (limpia la carpeta en Cloudinary)
 *     y después vuelve a subir. Borrar sin resubir rompe la galería.
 */

import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'public', 'images', 'operaciones');
const ENV_FILE = path.join(ROOT, '.env.local');
const MANIFEST = path.join(ROOT, 'src', 'app', 'features', 'about', 'operaciones.data.ts');
const DRY_RUN = process.argv.includes('--dry-run');
const DELETE = process.argv.includes('--delete');

/** Carpeta destino dentro de la cuenta de Cloudinary. */
const FOLDER = 'ingesocc/content/operaciones';

const MANIFEST_PATH_PREFIX = '/images/operaciones/';

// ─────────────────────────────────────────────────────────── credenciales

async function readEnvLocal(file) {
  const text = await readFile(file, 'utf8');
  const vars = {};
  for (const line of text.split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match) vars[match[1]] = match[2].trim();
  }
  return vars;
}

/** Lee y valida las credenciales de .env.local (gitignored). */
async function loadConfig() {
  const vars = await readEnvLocal(ENV_FILE);
  const cloudName = vars['CLOUDINARY_CLOUD_NAME'];
  const apiKey = vars['CLOUDINARY_API_KEY'];
  const apiSecret = vars['CLOUDINARY_API_SECRET'];
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Faltan credenciales: añade CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET a .env.local',
    );
  }
  return { cloudName, apiKey, apiSecret };
}

const { cloudName, apiKey, apiSecret } = await loadConfig();

// ─────────────────────────────────────────────────────────────── firma

/** Misma firma que `api/_lib/cloudinary.ts`: SHA-1 de params ordenados + secret. */
function cloudinarySignature(params, apiSecret) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${String(params[key])}`)
    .join('&');
  return createHash('sha1').update(payload + apiSecret, 'utf8').digest('hex');
}

// ────────────────────────────────────────────────────────────── upload

async function uploadFile(config, fileName) {
  const publicId = fileName.replace(/\.[A-Za-z0-9]+$/, '');
  const resourceType = fileName.toLowerCase().endsWith('.mp4') ? 'video' : 'image';
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinarySignature(
    { folder: FOLDER, public_id: publicId, timestamp },
    config.apiSecret,
  );

  const bytes = await readFile(path.join(SOURCE_DIR, fileName));
  const form = new FormData();
  form.append('file', new Blob([bytes]), fileName);
  form.append('api_key', config.apiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('folder', FOLDER);
  form.append('public_id', publicId);

  const url = `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/${resourceType}/upload`;
  const response = await fetch(url, { method: 'POST', body: form });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.secure_url) {
    throw new Error(`${fileName}: ${payload?.error?.message ?? `HTTP ${response.status}`}`);
  }
  return { file: fileName, public_id: payload.public_id, secure_url: payload.secure_url };
}

// ─────────────────────────────────────────────────────── manifiesto

/** Sustituye `/images/operaciones/<file>` por la secure_url en el manifiesto. */
async function rewriteManifest(results) {
  let text = await readFile(MANIFEST, 'utf8');
  let replaced = 0;
  for (const result of results) {
    const localPath = `${MANIFEST_PATH_PREFIX}${result.file}`;
    if (text.includes(localPath)) {
      text = text.split(localPath).join(result.secure_url);
      replaced++;
    }
  }
  await writeFile(MANIFEST, text, 'utf8');
  return replaced;
}

/**
 * Borra TODOS los assets bajo `FOLDER` vía la Admin API (`delete_by_prefix`).
 * Solo para reemplazos completos: NO actualiza el manifiesto — si borras sin
 * volver a subir, la galería quedará rota.
 */
async function deleteByPrefix(config) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinarySignature({ prefix: FOLDER, timestamp }, config.apiSecret);
  const form = new FormData();
  form.append('prefix', FOLDER);
  form.append('invalidate', 'true'); // pide purgar las URLs del CDN
  form.append('api_key', config.apiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);

  const url = `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/delete_by_prefix`;
  const response = await fetch(url, { method: 'POST', body: form });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `HTTP ${response.status}`);
  }
  return payload;
}

// ─────────────────────────────────────────────────────────────── main

async function main() {
  const config = await loadConfig();

  if (DELETE) {
    if (DRY_RUN) {
      console.log(`→ (dry-run) borraría todos los assets bajo "${FOLDER}"`);
      return;
    }
    const result = await deleteByPrefix(config);
    const count = Object.keys(result?.deleted ?? {}).length;
    console.log(`✓ ${count} assets eliminados bajo "${FOLDER}" (invalidación de CDN solicitada).`);
    console.log('  OJO: el manifiesto NO se toca; vuelve a subir para restaurar la galería.');
    return;
  }

  let files;
  try {
    files = (await readdir(SOURCE_DIR)).sort();
  } catch {
    throw new Error(
      `No existe ${SOURCE_DIR}: crea la carpeta con las fotos nuevas (.webp / .mp4) antes de subir.`,
    );
  }

  if (files.length === 0) {
    throw new Error(`No hay archivos en ${SOURCE_DIR}`);
  }

  const images = files.filter((f) => f.endsWith('.webp'));
  const videos = files.filter((f) => f.endsWith('.mp4'));
  console.log(`→ ${images.length} imágenes y ${videos.length} videos a carpeta "${FOLDER}"`);
  if (DRY_RUN) {
    for (const file of files) console.log(`  · ${file}`);
    return;
  }

  const results = [];
  for (const [index, file] of files.entries()) {
    const result = await uploadFile(config, file);
    results.push(result);
    console.log(`  [${index + 1}/${files.length}] ✓ ${file} → ${result.secure_url}`);
  }

  const replaced = await rewriteManifest(results);
  console.log(`\n✓ ${results.length} assets en Cloudinary; manifiesto actualizado (${replaced} rutas).`);
}

main().catch((error) => {
  console.error(`✗ ${error.message}`);
  process.exit(1);
});
