import {
  CLOUDINARY_TRANSFORMS,
  cloudinaryPublicIdFromUrl,
  isAbsoluteUrl,
  isCloudinaryUrl,
  withCloudinaryTransform,
} from './cloudinary-urls';

/** URL de upload real (formato que devuelve la API de Cloudinary). */
const CLOUD_URL =
  'https://res.cloudinary.com/ingesocc/image/upload/v1699999999/ingesocc/projects/abc/9f1e-uuid.jpg';

describe('cloudinary-urls', () => {
  describe('isCloudinaryUrl', () => {
    it('reconoce la secure_url de la API de imágenes', () => {
      expect(isCloudinaryUrl(CLOUD_URL)).toBe(true);
    });

    it('rechaza las URLs legacy de Supabase Storage', () => {
      const legacy = 'https://proyecto.supabase.co/storage/v1/object/public/project-images/a/b.jpg';
      expect(isCloudinaryUrl(legacy)).toBe(false);
    });

    it('rechaza CDN externo (seeds) y rutas relativas', () => {
      expect(isCloudinaryUrl('https://images.unsplash.com/photo-x?w=1400')).toBe(false);
      expect(isCloudinaryUrl('project-images/abc/def.jpg')).toBe(false);
    });

    it('rechaza http plano y valores vacíos', () => {
      expect(isCloudinaryUrl('http://res.cloudinary.com/x/image/upload/v1/a/b.jpg')).toBe(false);
      expect(isCloudinaryUrl('')).toBe(false);
      expect(isCloudinaryUrl(null)).toBe(false);
      expect(isCloudinaryUrl(undefined)).toBe(false);
    });
  });

  describe('isAbsoluteUrl', () => {
    it('distingue URL absoluta de ruta de storage relativa', () => {
      expect(isAbsoluteUrl('https://res.cloudinary.com/a/b.jpg')).toBe(true);
      expect(isAbsoluteUrl('http://res.cloudinary.com/a/b.jpg')).toBe(true);
      expect(isAbsoluteUrl('content/abc.jpg')).toBe(false);
      expect(isAbsoluteUrl(null)).toBe(false);
    });
  });

  describe('cloudinaryPublicIdFromUrl', () => {
    it('extrae el public_id quitando versión, transforms y extensión', () => {
      expect(cloudinaryPublicIdFromUrl(CLOUD_URL)).toBe('ingesocc/projects/abc/9f1e-uuid');
    });

    it('conserva las carpetas del subárbol en el public_id', () => {
      const url = 'https://res.cloudinary.com/ingesocc/image/upload/v123/ingesocc/content/uuid.png';
      expect(cloudinaryPublicIdFromUrl(url)).toBe('ingesocc/content/uuid');
    });

    it('ignora las transformaciones que ya venían en la URL', () => {
      const url =
        'https://res.cloudinary.com/ingesocc/image/upload/c_fill,w_960,h_720,q_auto/v123/ingesocc/services/s/uuid.webp';
      expect(cloudinaryPublicIdFromUrl(url)).toBe('ingesocc/services/s/uuid');
    });

    it('salta las transformaciones previas usando la versión como ancla', () => {
      const url = 'https://res.cloudinary.com/x/image/upload/c_fill/v123/a.jpg';
      expect(cloudinaryPublicIdFromUrl(url)).toBe('a');
    });

    it('devuelve null si no puede saber el public_id con certeza', () => {
      // Sin versión no se puede distinguir el transform del public_id.
      expect(cloudinaryPublicIdFromUrl('https://res.cloudinary.com/x/image/upload/a/b.jpg')).toBeNull();
      expect(cloudinaryPublicIdFromUrl('https://images.unsplash.com/photo-x')).toBeNull();
      expect(cloudinaryPublicIdFromUrl(null)).toBeNull();
    });
  });

  describe('withCloudinaryTransform', () => {
    it('inserta la transformación en una URL limpia', () => {
      const result = withCloudinaryTransform(CLOUD_URL, CLOUDINARY_TRANSFORMS.cover);
      expect(result).toBe(
        'https://res.cloudinary.com/ingesocc/image/upload/' +
          'c_fill,g_auto,w_960,h_720,q_auto,f_auto/v1699999999/ingesocc/projects/abc/9f1e-uuid.jpg',
      );
    });

    it('reemplaza la transformación que ya traía la URL', () => {
      const already =
        'https://res.cloudinary.com/ingesocc/image/upload/c_scale,w_100/v1699999999/ingesocc/content/uuid.jpg';
      const result = withCloudinaryTransform(already, CLOUDINARY_TRANSFORMS.hero);
      expect(result).toBe(
        'https://res.cloudinary.com/ingesocc/image/upload/' +
          'c_fill,g_auto,w_1600,h_1000,q_auto,f_auto/v1699999999/ingesocc/content/uuid.jpg',
      );
      expect(result).not.toContain('c_scale');
    });

    it('devuelve intactas las imágenes legacy (compatibilidad)', () => {
      const legacy = 'https://proyecto.supabase.co/storage/v1/object/public/service-images/a/b.jpg';
      expect(withCloudinaryTransform(legacy, CLOUDINARY_TRANSFORMS.service)).toBe(legacy);
    });

    it('devuelve intactos los CDN externos y normaliza vacío a cadena', () => {
      const external = 'https://images.unsplash.com/photo-x?w=1400';
      expect(withCloudinaryTransform(external, CLOUDINARY_TRANSFORMS.cover)).toBe(external);
      expect(withCloudinaryTransform(null, CLOUDINARY_TRANSFORMS.cover)).toBe('');
      expect(withCloudinaryTransform(undefined, CLOUDINARY_TRANSFORMS.cover)).toBe('');
    });

    it('es idempotente: aplicar dos veces da la misma URL', () => {
      const once = withCloudinaryTransform(CLOUD_URL, CLOUDINARY_TRANSFORMS.gallery);
      expect(withCloudinaryTransform(once, CLOUDINARY_TRANSFORMS.gallery)).toBe(once);
    });
  });
});
