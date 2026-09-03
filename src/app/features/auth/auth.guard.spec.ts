import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './data-access/auth.service';
import { authGuard } from './auth.guard';

const ROUTE = {} as ActivatedRouteSnapshot;
const STATE = {} as RouterStateSnapshot;

describe('authGuard', () => {
  async function setup(isAdmin: boolean) {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isAdmin: () => isAdmin,
            whenReady: () => Promise.resolve(),
          },
        },
      ],
    }).compileComponents();
  }

  it('permite el acceso a un administrador', async () => {
    await setup(true);
    const result = await TestBed.runInInjectionContext(() => authGuard(ROUTE, STATE));
    expect(result).toBeTrue();
  });

  it('redirige a /admin/login a un usuario sin rol admin', async () => {
    await setup(false);
    const result = await TestBed.runInInjectionContext(() => authGuard(ROUTE, STATE));
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/admin/login');
  });
});
