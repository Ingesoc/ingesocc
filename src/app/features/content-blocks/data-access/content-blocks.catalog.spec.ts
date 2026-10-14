import { blockLabel, sectionGroupLabel } from './content-blocks.catalog';

describe('content-blocks catalog (certificaciones)', () => {
  it('etiqueta cada cupo de certificación de forma amigable', () => {
    expect(blockLabel('about', 'certificaciones.item1.title')).toBe('Certificación 1 · Nombre');
    expect(blockLabel('about', 'certificaciones.item1.issuer')).toBe('Certificación 1 · Entidad emisora');
    expect(blockLabel('about', 'certificaciones.item1.link')).toBe('Certificación 1 · Enlace de soporte');
    expect(blockLabel('about', 'certificaciones.item1.logo')).toBe('Certificación 1 · Logo');
    expect(blockLabel('about', 'certificaciones.item4.logo')).toBe('Certificación 4 · Logo');
  });

  it('agrupa los cupos bajo el grupo Certificaciones', () => {
    expect(sectionGroupLabel('certificaciones.item1.title')).toBe('Certificaciones');
    expect(sectionGroupLabel('certificaciones.item4.logo')).toBe('Certificaciones');
  });
});