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

  /**
   * Resuelve cuando la sesión persistida se restauró (o se confirmó que no
   * existe). El guard lo espera para no rechazar un deep-link a /admin por un
   * simple tema de sincronización (restoreSession es asíncrono).
   */
  private readonly readyPromise: Promise<void>;

  constructor() {
    this.readyPromise = this.initialize().catch(() => undefined);
  }

  /**
   * Espera al cliente supabase-js (import diferido) y restaura la sesión.
   * El registro de onAuthStateChange se hace aquí, después de inicializar.
   */
  private async initialize(): Promise<void> {
    const client = await this.supabase.clientPromise;

    // Mantiene la señal al día con la sesión de Supabase (login, logout, refresh).
    client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void this.loadUser(session.user.id, session.user.email);
      } else {
        this.userSignal.set(null);
      }
    });

    const { data } = await client.auth.getSession();
    if (data.session?.user) {
      await this.loadUser(data.session.user.id, data.session.user.email);
    }
  }

  /** Espera a que la sesión inicial se restaure antes de decidir (guard). */
  whenReady(): Promise<void> {
    return this.readyPromise;
  }

  /** Inicia sesión con Supabase Auth (email + password). */
  async login(email: string, password: string): Promise<void> {
    await this.supabase.clientPromise;
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      throw new Error(this.mapAuthError(error?.code ?? error?.message ?? ''));
    }
    // onAuthStateChange también disparará loadUser; aquí se hace explícito.
    await this.loadUser(data.user.id, data.user.email);
  }

  /** Traduce errores comunes de Supabase Auth a mensajes claros en español. */
  private mapAuthError(codeOrMessage: string): string {
    if (/invalid_credentials|Invalid login credentials/i.test(codeOrMessage)) {
      return 'Credenciales inválidas. Revisa el correo y la contraseña.';
    }
    if (/email_not_confirmed/i.test(codeOrMessage)) {
      return 'Confirma tu correo electrónico antes de ingresar.';
    }
    if (/user_already_exists/i.test(codeOrMessage)) {
      return 'Ya existe una cuenta con ese correo.';
    }
    if (/rate_limit|too_many/i.test(codeOrMessage)) {
      return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
    }
    return codeOrMessage || 'No se pudo iniciar sesión.';
  }

  async logout(): Promise<void> {
    await this.supabase.clientPromise;
    await this.supabase.client.auth.signOut();
    this.userSignal.set(null);
  }

  /** Lee el rol desde `profiles`; si la tabla no existe o no hay fila, rol 'user'. */
  private async loadUser(id: string, email: string | undefined): Promise<void> {
    let role: AuthRole = 'user';

    try {
      // loadUser solo se invoca después de clientPromise (initialize/login), pero
      // se espera explícitamente por seguridad ante un futuro call site nuevo.
      const client = await this.supabase.clientPromise;
      const { data } = await client.from('profiles').select('role').eq('id', id).maybeSingle();

      if (data?.role === 'admin' || data?.role === 'user') {
        role = data.role;
      }
    } catch {
      // Sin tabla profiles aún: el usuario no tiene rol admin.
    }

    this.userSignal.set({ id, email: email ?? '', role });
  }
}