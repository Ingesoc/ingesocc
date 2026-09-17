import { Injectable } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/**
 * Wrapper único del cliente supabase-js (plan, sección 5 — core/supabase.service.ts).
 *
 * App Angular CSR: se usa `@supabase/supabase-js` directamente (no `@supabase/ssr`,
 * que es específico de Next.js). La sesión de auth se persiste en el navegador
 * (localStorage) y se refresca automáticamente.
 *
 * El SDK (~220 KB gzipped) se carga con `import()` diferido: el sitio público se
 * renderiza desde los seeds y las queries a Supabase son refrescos de fondo, así
 * que el primer pintado no debe esperar a descargar/evaluar supabase-js. Todo el
 * código pasa por `await clientPromise` antes de tocar `client`.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private clientInstance: SupabaseClient | null = null;

  /** Resuelve cuando el cliente supabase-js está creado y listo para usarse. */
  readonly clientPromise: Promise<SupabaseClient> = this.initialize();

  private async initialize(): Promise<SupabaseClient> {
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    this.clientInstance = client;
    return client;
  }

  /**
   * Acceso al cliente ya inicializado. Lanza si aún no está listo: los métodos
   * async deben empezar con `await this.supabase.clientPromise`.
   */
  get client(): SupabaseClient {
    if (!this.clientInstance) {
      throw new Error(
        'SupabaseService aún no inicializado: usa `await supabase.clientPromise` antes de acceder a `client`.',
      );
    }
    return this.clientInstance;
  }

  /** true cuando hay credenciales configuradas. */
  get ready(): boolean {
    return Boolean(environment.supabaseUrl && environment.supabaseAnonKey);
  }

  /**
   * Resuelve una ruta de storage a su URL pública. Si el valor ya es una URL
   * completa (como en los seeds estáticos), se devuelve tal cual.
   */
  resolvePublicUrl(bucket: string, path: string | null | undefined): string {
    if (!path) return '';
    if (/^https?:\/\//.test(path)) return path;
    return this.client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
}