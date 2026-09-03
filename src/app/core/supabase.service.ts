import { Injectable } from '@angular/core';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/**
 * Wrapper único del cliente supabase-js (plan, sección 5 — core/supabase.service.ts).
 *
 * App Angular CSR: se usa `@supabase/supabase-js` directamente (no `@supabase/ssr`,
 * que es específico de Next.js). La sesión de auth se persiste en el navegador
 * (localStorage) y se refresca automáticamente.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

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