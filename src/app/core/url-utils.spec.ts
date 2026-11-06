import { isAllowedHref, safeHref, toMailtoHref, toTelHref } from './url-utils';

describe('url-utils', () => {
  describe('isAllowedHref / safeHref', () => {
    it('acepta http(s), mailto y tel', () => {
      expect(isAllowedHref('https://example.com')).toBeTrue();
      expect(isAllowedHref('http://example.com')).toBeTrue();
      expect(isAllowedHref('mailto:hola@example.com')).toBeTrue();
      expect(isAllowedHref('tel:+573127370811')).toBeTrue();
    });

    it('acepta rutas relativas y anclas', () => {
      expect(isAllowedHref('/proyectos')).toBeTrue();
      expect(isAllowedHref('#contacto')).toBeTrue();
    });

    it('rechaza esquemas peligrosos y cadenas vacías', () => {
      expect(isAllowedHref('javascript:alert(1)')).toBeFalse();
      expect(isAllowedHref('data:text/html,<script>alert(1)</script>')).toBeFalse();
      expect(isAllowedHref('  ')).toBeFalse();
      expect(isAllowedHref(null)).toBeFalse();
      expect(isAllowedHref(undefined)).toBeFalse();
    });

    it('safeHref recorta y devuelve null para valores no permitidos', () => {
      expect(safeHref('  https://example.com  ')).toBe('https://example.com');
      expect(safeHref('javascript:alert(1)')).toBeNull();
      expect(safeHref('')).toBeNull();
    });
  });

  describe('toTelHref', () => {
    it('deja dígitos y el + inicial', () => {
      expect(toTelHref('+57 312 737 0811')).toBe('tel:+573127370811');
    });

    it('devuelve null sin dígitos', () => {
      expect(toTelHref('—')).toBeNull();
      expect(toTelHref(null)).toBeNull();
    });
  });

  describe('toMailtoHref', () => {
    it('crea mailto para correos válidos', () => {
      expect(toMailtoHref(' gerencia.ingesocc@gmail.com ')).toBe('mailto:gerencia.ingesocc@gmail.com');
    });

    it('rechaza correos inválidos o con saltos de línea', () => {
      expect(toMailtoHref('sin-arroba')).toBeNull();
      expect(toMailtoHref('a@b.com\nBcc: evil@example.com')).toBeNull();
      expect(toMailtoHref('')).toBeNull();
    });
  });
});
