import { TestBed } from '@angular/core/testing';
import { SupabaseService } from '../../../core/supabase.service';
import { AuthService } from './auth.service';
import { EditModeService } from '../../content-blocks/edit-mode.service';

interface FakeAuthOptions {
  /** Usuario que devuelven getSession() y signInWithPassword() (null = sin sesión). */
  sessionUser?: { id: string; email: string } | null;
  /** Rol que devuelve profiles para ese usuario. */
  profileRole?: string;
  /** Error que devuelve resetPasswordForEmail (p. ej. red caída, CU-18). */
  resetError?: string;
  /** Error que devuelve updateUser (p. ej. sesión de recuperación ausente, CU-18). */
  updateError?: string;
}

/**
 * Cliente Supabase simulado: `auth` con onAuthStateChange (captura el listener
 * para poder emitir eventos de sesión), getSession y signInWithPassword; y
 * `from('profiles')` con la cadena select/eq/maybeSingle que usa AuthService
 * para leer el rol.
 */
function createFakeClient(options: FakeAuthOptions) {
  const listeners: ((event: string, session: unknown) => void)[] = [];
  const user = options.sessionUser ?? null;
  /** Emails pasados a resetPasswordForEmail (CU-18). */
  const resetEmails: string[] = [];
  /** Atributos pasados a updateUser (CU-18). */
  const passwordUpdates: { password: string }[] = [];

  const auth = {
    onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
      listeners.push(callback);
      return { data: { subscription: { unsubscribe: () => undefined } } };
    },
    getSession: async () => ({ data: { session: user ? { user } : null } }),
    signInWithPassword: async () =>
      user ? { data: { user }, error: null } : { data: { user: null }, error: null },
    signOut: async () => ({ error: null }),
    resetPasswordForEmail: async (email: string) => {
      resetEmails.push(email);
      return options.resetError
        ? { data: {}, error: { message: options.resetError } }
        : { data: {}, error: null };
    },
    updateUser: async (attributes: { password: string }) => {
      passwordUpdates.push(attributes);
      // Sin sesión (enlace expirado/ya usado) Supabase rechaza el cambio.
      if (options.updateError || !user) {
        return { data: { user: null }, error: { message: options.updateError ?? 'session_missing' } };
      }
      return { data: { user }, error: null };
    },
  };

  const from = (table: string) => {
    const result = () =>
      table === 'profiles' && options.profileRole
        ? { data: { role: options.profileRole }, error: null }
        : { data: null, error: null };
    const chain = {
      select: () => chain,
      eq: () => chain,
      maybeSingle: () => chain,
      then: (resolve: (value: unknown) => void) => Promise.resolve(result()).then(resolve),
    };
    return chain;
  };

  return {
    client: { auth, from },
    /** Emite un evento de sesión como lo haría supabase-js (p. ej. sesión expirada → null). */
    emit: (event: string, session: unknown) => {
      for (const callback of listeners) callback(event, session);
    },
    resetEmails,
    passwordUpdates,
  };
}

describe('AuthService', () => {
  function setup(options: FakeAuthOptions) {
    const fake = createFakeClient(options);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SupabaseService,
          useValue: {
            client: fake.client,
            clientPromise: Promise.resolve(fake.client),
            ready: true,
          },
        },
      ],
    });
    return { fake, auth: TestBed.inject(AuthService) };
  }

  it('restaura una sesión admin persistida y expone isAdmin', async () => {
    const { auth } = setup({
      sessionUser: { id: 'u1', email: 'admin@test.com' },
      profileRole: 'admin',
    });

    await auth.whenReady();

    expect(auth.isAuthenticated()).toBeTrue();
    expect(auth.role()).toBe('admin');
    expect(auth.isAdmin()).toBeTrue();
    expect(auth.user()?.email).toBe('admin@test.com');
  });

  it('CU-19: al expirar la sesión (onAuthStateChange con null) limpia el usuario y pierde isAdmin', async () => {
    const { auth, fake } = setup({
      sessionUser: { id: 'u1', email: 'admin@test.com' },
      profileRole: 'admin',
    });
    await auth.whenReady();
    expect(auth.isAdmin()).toBeTrue();

    // El refresh token expiró o fue revocado: supabase-js emite la sesión como null.
    fake.emit('SIGNED_OUT', null);

    expect(auth.isAuthenticated()).toBeFalse();
    expect(auth.role()).toBeNull();
    expect(auth.isAdmin()).toBeFalse();
    expect(auth.user()).toBeNull();
  });

  it('CU-19: la expiración de sesión desactiva el modo edición', async () => {
    const { auth, fake } = setup({
      sessionUser: { id: 'u1', email: 'admin@test.com' },
      profileRole: 'admin',
    });
    const editMode = TestBed.inject(EditModeService);
    await auth.whenReady();

    // El admin activa el modo edición…
    editMode.toggle();
    expect(editMode.isEditing()).toBeTrue();

    // …y al expirar la sesión se desactiva automáticamente (efecto de EditModeService).
    fake.emit('SIGNED_OUT', null);
    TestBed.flushEffects();

    expect(editMode.isEditing()).toBeFalse();
    expect(editMode.canEdit()).toBeFalse();
  });

  it('CU-19: tras expirar, un nuevo login vuelve a establecer la sesión admin', async () => {
    const { auth, fake } = setup({
      sessionUser: { id: 'u1', email: 'admin@test.com' },
      profileRole: 'admin',
    });
    await auth.whenReady();

    fake.emit('SIGNED_OUT', null);
    expect(auth.isAuthenticated()).toBeFalse();

    // El admin vuelve a ingresar (CU-06): la sesión se restablece con su rol.
    await auth.login('admin@test.com', 'password');
    expect(auth.isAuthenticated()).toBeTrue();
    expect(auth.isAdmin()).toBeTrue();
  });

  it('CU-18: requestPasswordReset envía el correo de recuperación', async () => {
    const { auth, fake } = setup({ sessionUser: null });
    await auth.whenReady();

    await auth.requestPasswordReset('admin@test.com');

    expect(fake.resetEmails).toEqual(['admin@test.com']);
  });

  it('CU-18: requestPasswordReset propaga los errores de envío', async () => {
    const { auth } = setup({ sessionUser: null, resetError: 'Failed to fetch' });
    await auth.whenReady();

    await expectAsync(auth.requestPasswordReset('admin@test.com')).toBeRejected();
  });

  it('CU-18: updatePassword actualiza la contraseña de la sesión de recuperación', async () => {
    const { auth, fake } = setup({
      sessionUser: { id: 'u1', email: 'admin@test.com' },
      profileRole: 'admin',
    });
    await auth.whenReady();

    await auth.updatePassword('nueva-clave-1');

    expect(fake.passwordUpdates).toEqual([{ password: 'nueva-clave-1' }]);
  });

  it('CU-18: updatePassword se rechaza si el enlace no dejó sesión válida', async () => {
    // Enlace expirado/ya usado: no hay sesión y Supabase rechaza el cambio.
    const { auth } = setup({ sessionUser: null });
    await auth.whenReady();

    await expectAsync(auth.updatePassword('nueva-clave-1')).toBeRejected();
  });
});