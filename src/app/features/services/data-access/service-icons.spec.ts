import { SERVICE_ICONS, SERVICE_ICON_NAMES, serviceIconFor } from './service-icons';

describe('service icons', () => {
  it('registra los icon_name usados por la semilla', () => {
    for (const name of ['building-2', 'heart-pulse', 'factory', 'ruler', 'frame', 'home']) {
      expect(SERVICE_ICONS[name]).toBeDefined();
    }
  });

  it('expone los nombres para el selector del formulario admin', () => {
    expect(SERVICE_ICON_NAMES.length).toBeGreaterThan(0);
    expect(SERVICE_ICON_NAMES).toContain('factory');
  });

  it('mapea un icon_name conocido a su componente', () => {
    expect(serviceIconFor('factory')).toBe(SERVICE_ICONS['factory']);
  });

  it('devuelve null para icon_name desconocido o ausente', () => {
    expect(serviceIconFor('no-existe')).toBeNull();
    expect(serviceIconFor(null)).toBeNull();
    expect(serviceIconFor(undefined)).toBeNull();
    expect(serviceIconFor('')).toBeNull();
  });
});
