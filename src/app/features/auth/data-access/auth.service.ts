import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '../../../core/supabase.service';
// DEBUG TEMPORAL (diagnóstico panel admin): remover con debug-logger.ts.
import { debugLog } from '../../../core/debug-logger';

type AuthRole = 'admin' | 'user';

interface AuthUser {
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
    debugLog.log('auth: initialize() — esperando clientPromise…');
    const client = await this.supabase.clientPromise;
    debugLog.log('auth: cliente supabase listo');

    // Mantiene la señal al día con la sesión de Supabase (login, logout, refresh).
    client.auth.onAuthStateChange((event, session) => {
      debugLog.log('auth: onAuthStateChange →', event ?? '(sin evento)', session?.user ? `user=${session.user.email}` : 'sin user');
      if (session?.user) {
        void this.loadUser(session.user.id, session.user.email);
      } else {
        this.userSignal.set(null);
      }
    });

    const { data, error } = await client.auth.getSession();
    debugLog.log(
      'auth: getSession →',
      data.session?.user ? `sesión de ${data.session.user.email}` : 'sin sesión',
      error ? `error: ${error.message}` : '',
    );
    if (data.session?.user) {
      await this.loadUser(data.session.user.id, data.session.user.email);
    }
    debugLog.log('auth: initialize() completo — isAdmin =', this.isAdmin());
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

  /**
   * Solicita el correo de recuperación de contraseña (CU-18). Supabase envía un
   * enlace con token; al abrirlo, supabase-js establece una sesión con el
   * evento PASSWORD_RECOVERY (detectSessionInUrl) y la app muestra la vista de
   * contraseña nueva.
   *
   * Resuelve siempre (Supabase no revela si el email existe); si el envío falla
   * por red/configuración, se lanza el error para mostrarlo en la UI.
   */
  async requestPasswordReset(email: string): Promise<void> {
    await this.supabase.clientPromise;
    // El enlace del correo debe aterrizar en la pantalla de contraseña nueva;
    // si se omite, Supabase usa el Site URL del dashboard (raíz del sitio) y el
    // admin perdería el hash del token sin la UI que lo consume. El origen se
    // toma del navegador para que funcione igual en dev, preview y producción
    // (el dominio debe estar en la lista "Redirect URLs" de Supabase Auth).
    const { error } = await this.supabase.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/nueva-contrasena`,
    });
    if (error) {
      throw new Error(this.mapAuthError(error.code ?? error.message ?? ''));
    }
  }

  /**
   * Actualiza la contraseña del usuario con sesión activa (paso final de
   * CU-18: el enlace de recuperación dejó una sesión de solo recuperación).
   */
  async updatePassword(password: string): Promise<void> {
    await this.supabase.clientPromise;
    const { error } = await this.supabase.client.auth.updateUser({ password });
    if (error) {
      throw new Error(this.mapAuthError(error.code ?? error.message ?? ''));
    }
  }

  async logout(): Promise<void> {
    await this.supabase.clientPromise;
    await this.supabase.client.auth.signOut();
    this.userSignal.set(null);
  }

  /** Lee el rol desde `profiles`; si la tabla no existe o no hay fila, rol 'user'. */
  private async loadUser(id: string, email: string | undefined): Promise<void> {
    debugLog.log('auth: loadUser →', email ?? '(sin email)', 'id=', id.slice(0, 8) + '…');
    let role: AuthRole = 'user';

    try {
      // loadUser solo se invoca después de clientPromise (initialize/login), pero
      // se espera explícitamente por seguridad ante un futuro call site nuevo.
      const client = await this.supabase.clientPromise;
      const { data, error } = await client.from('profiles').select('role').eq('id', id).maybeSingle();

      debugLog.log('auth: profiles →', JSON.stringify(data), error ? `error: ${error.message} (code ${error.code ?? '?'})` : 'sin error');

      if (data?.role === 'admin' || data?.role === 'user') {
        role = data.role;
      }
    } catch (err) {
      // Sin tabla profiles aún: el usuario no tiene rol admin.
      debugLog.warn('auth: profiles lanzó excepción (¿tabla ausente?):', err);
    }

    debugLog.log('auth: rol resuelto =', role);
    this.userSignal.set({ id, email: email ?? '', role });
  }
}