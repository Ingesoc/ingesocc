import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '../../../core/supabase.service';

export type AuthRole = 'admin' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  role: AuthRole;
}

/**
 * Sesión de administración vía Supabase Auth (plan, Fase 3).
 *
 * El rol se lee de la tabla `profiles` (columna `role`, plan 3.6). Para darle
 * rol admin a un usuario: crearlo en Supabase (Authentication → Users) y luego
 * `update public.profiles set role = 'admin' where id = '<user id>';`
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);

  private readonly userSignal = signal<AuthUser | null>(null);

  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);

  /** Rol del usuario autenticado (columna `role` de `profiles`, plan 3.6). */
  readonly role = computed<AuthRole | null>(() => this.userSignal()?.role ?? null);

  readonly isAdmin = computed(() => this.role() === 'admin');

  constructor() {
    // Mantiene la señal al día con la sesión de Supabase (login, logout, refresh).
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void this.loadUser(session.user.id, session.user.email);
      } else {
        this.userSignal.set(null);
      }
    });

    void this.restoreSession();
  }

  /** Inicia sesión con Supabase Auth (email + password). */
  async login(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      throw new Error('Credenciales inválidas');
    }
    // onAuthStateChange también disparará loadUser; aquí se hace explícito.
    await this.loadUser(data.user.id, data.user.email);
  }

  async logout(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this.userSignal.set(null);
  }

  private async restoreSession(): Promise<void> {
    const { data } = await this.supabase.client.auth.getSession();
    if (data.session?.user) {
      await this.loadUser(data.session.user.id, data.session.user.email);
    }
  }

  /** Lee el rol desde `profiles`; si la tabla no existe o no hay fila, rol 'user'. */
  private async loadUser(id: string, email: string | undefined): Promise<void> {
    let role: AuthRole = 'user';

    try {
      const { data } = await this.supabase.client
        .from('profiles')
        .select('role')
        .eq('id', id)
        .maybeSingle();

      if (data?.role === 'admin' || data?.role === 'user') {
        role = data.role;
      }
    } catch {
      // Sin tabla profiles aún: el usuario no tiene rol admin.
    }

    this.userSignal.set({ id, email: email ?? '', role });
  }
}