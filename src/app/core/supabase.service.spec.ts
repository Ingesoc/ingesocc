import { TestBed } from '@angular/core/testing';
import { SupabaseService } from './supabase.service';

describe('SupabaseService', () => {
  let service: SupabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SupabaseService);
  });

  it('indica ready cuando hay credenciales configuradas', () => {
    // En el entorno de tests las credenciales vienen de environment.ts.
    expect(service.ready).toBeDefined();
  });

  it('devuelve vacío para rutas nulas o vacías', () => {
    expect(service.resolvePublicUrl('project-images', null)).toBe('');
    expect(service.resolvePublicUrl('project-images', undefined)).toBe('');
    expect(service.resolvePublicUrl('project-images', '')).toBe('');
  });

  it('deja intactas las URLs absolutas (seeds estáticos)', () => {
    const url = 'https://images.unsplash.com/photo-x?w=1400';
    expect(service.resolvePublicUrl('project-images', url)).toBe(url);
  });

  it('convierte una storage path a URL pública del bucket', async () => {
    // El cliente se crea con import() diferido; hay que esperar a clientPromise.
    await service.clientPromise;
    const resolved = service.resolvePublicUrl('project-images', 'abc/def.jpg');
    expect(resolved).toMatch(/\/storage\/v1\/object\/public\/project-images\/abc\/def\.jpg$/);
  });
});
