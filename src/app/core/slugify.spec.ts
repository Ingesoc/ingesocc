import { slugify } from './slugify';

describe('slugify', () => {
  it('convierte a minúsculas y reemplaza espacios por guiones', () => {
    expect(slugify('Casa Ladera')).toBe('casa-ladera');
    expect(slugify('Puente Metálico Veredal "El Progreso"')).toBe(
      'puente-metalico-veredal-el-progreso',
    );
  });

  it('elimina acentos (NFD)', () => {
    expect(slugify('Edificaciones áéíóú')).toBe('edificaciones-aeiou');
    expect(slugify('Consultoría y Diseño')).toBe('consultoria-y-diseno');
  });

  it('descarta caracteres especiales y colapsa guiones', () => {
    expect(slugify('Torre de Oficinas — Centro!')).toBe('torre-de-oficinas-centro');
    expect(slugify('A  B   C')).toBe('a-b-c');
  });

  it('recorta guiones al inicio y al final', () => {
    expect(slugify('  --Hola--  ')).toBe('hola');
  });

  it('devuelve vacío para entrada vacía o sin caracteres válidos', () => {
    expect(slugify('')).toBe('');
    expect(slugify('???')).toBe('');
  });
});
