import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated: false
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Mock route and state
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/protected-route' } as RouterStateSnapshot;
  });

  describe('Dostęp dla zalogowanych użytkowników', () => {
    it('powinien zezwolić na dostęp gdy użytkownik jest zalogowany', () => {
      // Setup: user is authenticated
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => true,
        configurable: true
      });

      const result = TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, mockState)
      );

      expect(result).toBeTrue();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('powinien przepuścić użytkownika z ważnym tokenem', () => {
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => true,
        configurable: true
      });

      const result = TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });
  });

  describe('Blokowanie niezalogowanych użytkowników', () => {
    it('powinien zablokować dostęp gdy użytkownik nie jest zalogowany', () => {
      // Setup: user is NOT authenticated
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => false,
        configurable: true
      });

      const result = TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, mockState)
      );

      expect(result).toBeFalse();
    });

    it('powinien przekierować na stronę logowania', () => {
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => false,
        configurable: true
      });

      TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, mockState)
      );

      expect(router.navigate).toHaveBeenCalledWith(
        ['/login'],
        { queryParams: { returnUrl: '/protected-route' } }
      );
    });

    it('powinien zapisać URL docelowy w returnUrl', () => {
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => false,
        configurable: true
      });

      const customState = { url: '/admin/dashboard' } as RouterStateSnapshot;

      TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, customState)
      );

      expect(router.navigate).toHaveBeenCalledWith(
        ['/login'],
        { queryParams: { returnUrl: '/admin/dashboard' } }
      );
    });
  });

  describe('Różne scenariusze tras', () => {
    it('powinien obsłużyć trasę z parametrami', () => {
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => false,
        configurable: true
      });

      const stateWithParams = { 
        url: '/products/123?search=laptop' 
      } as RouterStateSnapshot;

      TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, stateWithParams)
      );

      expect(router.navigate).toHaveBeenCalledWith(
        ['/login'],
        { queryParams: { returnUrl: '/products/123?search=laptop' } }
      );
    });

    it('powinien obsłużyć trasę główną', () => {
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => true,
        configurable: true
      });

      const homeState = { url: '/' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, homeState)
      );

      expect(result).toBeTrue();
    });
  });

  describe('Edge cases', () => {
    it('powinien obsłużyć pusty URL', () => {
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => false,
        configurable: true
      });

      const emptyState = { url: '' } as RouterStateSnapshot;

      TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, emptyState)
      );

      expect(router.navigate).toHaveBeenCalledWith(
        ['/login'],
        { queryParams: { returnUrl: '' } }
      );
    });

    it('powinien zwrócić false dla niezalogowanego użytkownika bez względu na trasę', () => {
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => false,
        configurable: true
      });

      const states = [
        { url: '/account' },
        { url: '/admin' },
        { url: '/checkout' }
      ];

      states.forEach(state => {
        const result = TestBed.runInInjectionContext(() => 
          authGuard(mockRoute, state as RouterStateSnapshot)
        );
        expect(result).toBeFalse();
      });
    });
  });
});
