import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildFolder,
  cloudinarySignature,
  isAllowedPublicId,
  isValidSegment,
  newAssetId,
  normalizeFolder,
} from './cloudinary';

describe('cloudinary/configuración de carpetas', () => {
  it('acepta solo las carpetas de la lista blanca', () => {
    for (const folder of ['projects', 'services', 'content', 'team', 'general']) {
      assert.equal(normalizeFolder(folder), folder);
    }
  });

  it('rechaza carpetas arbitrarias o traviesas', () => {
    for (const folder of [
      '../otro',
      'ingesocc',
      'projects/../admin',
      'PROJECTS',
      '',
      null,
      undefined,
      42,
      { toString: () => 'projects' },
    ]) {
      assert.equal(normalizeFolder(folder), null, `debía rechazar: ${String(folder)}`);
    }
  });

  it('compone la carpeta bajo la raíz ingesocc', () => {
    assert.equal(buildFolder('projects'), 'ingesocc/projects');
    assert.equal(buildFolder('content', 'abc-123'), 'ingesocc/content/abc-123');
  });

  it('acepta como entityId solo segmentos seguros', () => {
    assert.ok(isValidSegment('2f1a9b0c-1111-4222-8333-444444444444'));
    assert.ok(isValidSegment('hero-2026'));
    assert.equal(isValidSegment('con espacio'), false);
    assert.equal(isValidSegment('../escape'), false);
    assert.equal(isValidSegment('/leading'), false);
    assert.equal(isValidSegment('a/b'), false);
    assert.equal(isValidSegment(''), false);
    assert.equal(isValidSegment(undefined), false);
  });

  it('lanza si el entityId no es un segmento válido', () => {
    assert.throws(() => buildFolder('projects', 'a/b'), /entityId inválido/);
  });
});

describe('cloudinary/public_id permitido', () => {
  it('acepta assets del árbol del sitio', () => {
    const valid = [
      'ingesocc/projects/2f1a9b0c-1111-4222-8333-444444444444/9a8b7c6d-2222-4333-8444-555555555555',
      'ingesocc/services/2f1a9b0c-1111-4222-8333-444444444444/9a8b7c6d-2222-4333-8444-555555555555',
      'ingesocc/content/9a8b7c6d-2222-4333-8444-555555555555',
      'ingesocc/team/9a8b7c6d-2222-4333-8444-555555555555',
      'ingesocc/general/9a8b7c6d-2222-4333-8444-555555555555',
    ];
    for (const publicId of valid) {
      assert.ok(isAllowedPublicId(publicId), `debía aceptar: ${publicId}`);
    }
  });

  it('rechaza traversal, carpetas ajenas y basura', () => {
    const invalid = [
      'ingesocc/../admin/secret',
      'ingesocc/projects/../../admin',
      'ingesocc/secrets/abc',
      'other/projects/abc',
      'ingesocc',
      'ingesocc/projects',
      'ingesocc/content',
      'ingesocc/projects/a/b/c',
      'ingesocc/projects/abc def',
      'ingesocc/projects/abc?x=1',
      '/ingesocc/projects/abc',
      'ingesocc/projects/abc/',
      '',
      'a'.repeat(220),
      null,
      undefined,
      7,
    ];
    for (const publicId of invalid) {
      assert.equal(isAllowedPublicId(publicId), false, `debía rechazar: ${String(publicId)}`);
    }
  });
});

describe('cloudinary/firma', () => {
  it('ordena los params alfabéticamente y concatena el secret (SHA-1)', () => {
    // Ejemplo de la documentación oficial de Cloudinary:
    // public_id=sample&timestamp=1315060510 con api_secret=abcd.
    assert.equal(
      cloudinarySignature({ timestamp: 1315060510, public_id: 'sample' }, 'abcd'),
      'c3470533147774275dd37996cc4d0e68fd03cd4f',
    );
  });

  it('da la misma firma si los params llegan en otro orden', () => {
    const a = cloudinarySignature({ timestamp: 1700000000, folder: 'ingesocc/content' }, 's3cr3t');
    const b = cloudinarySignature({ folder: 'ingesocc/content', timestamp: 1700000000 }, 's3cr3t');
    assert.equal(a, b);
  });

  it('cambia si cambia cualquier param firmado', () => {
    const base = cloudinarySignature(
      { folder: 'ingesocc/projects/1', public_id: 'a', timestamp: 1 },
      's3cr3t',
    );
    assert.notEqual(
      base,
      cloudinarySignature({ folder: 'ingesocc/projects/2', public_id: 'a', timestamp: 1 }, 's3cr3t'),
    );
    assert.notEqual(
      base,
      cloudinarySignature({ folder: 'ingesocc/projects/1', public_id: 'b', timestamp: 1 }, 's3cr3t'),
    );
    assert.notEqual(
      base,
      cloudinarySignature({ folder: 'ingesocc/projects/1', public_id: 'a', timestamp: 2 }, 's3cr3t'),
    );
    assert.notEqual(
      base,
      cloudinarySignature({ folder: 'ingesocc/projects/1', public_id: 'a', timestamp: 1 }, 'otro'),
    );
  });

  it('nunca incluye el secret en el resultado', () => {
    const signature = cloudinarySignature({ timestamp: 1 }, 'mi-secret-real');
    assert.match(signature, /^[0-9a-f]{40}$/);
    assert.ok(!signature.includes('mi-secret-real'));
  });
});

describe('cloudinary/nombre de asset', () => {
  it('genera un UUID por asset (nunca el nombre del archivo del usuario)', () => {
    const first = newAssetId();
    const second = newAssetId();
    assert.match(first, /^[0-9a-f-]{36}$/);
    assert.notEqual(first, second);
  });
});
