import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from './data-access/auth.service';

describe('LoginComponent', () => {
  let authStub: {
    whenReady: jasmine.Spy;
    isAdmin: () => boolean;
    login: jasmine.Spy;
    logout: jasmine.Spy;
  };
  let routerSpy: { navigate: jasmine.Spy };

  function createComponent(): LoginComponent {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    fixture.autoDetectChanges();
    return component;
  }

  beforeEach(() => {
    authStub = {
      whenReady: jasmine.createSpy('whenReady').and.resolveTo(undefined),
      isAdmin: () => false,
      login: jasmine.createSpy('login'),
      logout: jasmine.createSpy('logout').and.resolveTo(undefined),
    };
    routerSpy = { navigate: jasmine.createSpy('navigate').and.resolveTo(true) };

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authStub },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  it('credenciales inválidas muestran el mensaje de error del servicio', fakeAsync(() => {
    authStub.login.and.rejectWith(new Error('Credenciales inválidas.'));
    const component = createComponent();
    component.form.setValue({ email: 'admin@test.com', password: 'wrong-pass' });

    component.onSubmit();
    tick();

    expect(component.error()).toBe('Credenciales inválidas.');
    expect(component.noAdmin()).toBeFalse();
    expect(authStub.logout).not.toHaveBeenCalled();
  }));

  it('usuario sin rol admin: mensaje claro, logout y sin navegación al panel', fakeAsync(() => {
    authStub.login.and.resolveTo(undefined); // login OK, isAdmin() = false
    const component = createComponent();
    component.form.setValue({ email: 'nonadmin@test.com', password: 'secret123' });

    component.onSubmit();
    tick();

    expect(authStub.logout).toHaveBeenCalled();
    expect(component.noAdmin()).toBeTrue();
    expect(component.error()).toContain('no tiene permisos de administración');
    expect(routerSpy.navigate).not.toHaveBeenCalledWith(['/admin']);
  }));

  it('admin: navega al panel sin mensaje de error', fakeAsync(() => {
    authStub.login.and.resolveTo(undefined);
    authStub.isAdmin = () => true;
    const component = createComponent();
    component.form.setValue({ email: 'admin@test.com', password: 'secret123' });

    component.onSubmit();
    tick();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin']);
    expect(component.error()).toBe('');
    expect(authStub.logout).not.toHaveBeenCalled();
  }));

  it('un error nuevo tras un caso no-admin limpia la señal noAdmin', async () => {
    const component = createComponent();

    // Primer intento: cuenta válida sin rol admin.
    authStub.login.and.resolveTo(undefined);
    component.form.setValue({ email: 'nonadmin@test.com', password: 'secret123' });
    await component.onSubmit();
    expect(component.noAdmin()).toBeTrue();

    // Segundo intento: credenciales inválidas.
    authStub.login.and.rejectWith(new Error('Credenciales inválidas.'));
    component.form.setValue({ email: 'x@y.z', password: 'whatever' });
    await component.onSubmit();

    expect(component.noAdmin()).toBeFalse();
  });
});
