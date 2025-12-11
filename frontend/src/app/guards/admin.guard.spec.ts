import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { adminGuard } from './admin.guard';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { NotificationType } from '../models';

describe('adminGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated: false,
      isAdmin: false
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['show']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

    // Mock route and state
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/admin/dashboard' } as RouterStateSnapshot;
  });

  describe('Dostęp dla administratorów', () => {
    it('powinien zezwolić na dostęp gdy użytkownik jest zalogowany jako admin', () => {
      // Setup: user is authenticated AND is admin
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => true,
        configurable: true
      });
      Object.defineProperty(authService, 'isAdmin', {
        get: () => true,
        configurable: true
      });

      const result = TestBed.runInInjectionContext(() => 
        adminGuard(mockRoute, mockState)
      );

      expect(result).toBeTrue();
      expect(router.navigate).not.toHaveBeenCalled();
      expect(notificationService.show).not.toHaveBeenCalled();
    });

    it('powinien przepuścić admina bez wyświetlania notyfikacji', () => {
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => true,
        configurable: true
      });
      Object.defineProperty(authService, 'isAdmin', {
        get: () => true,
        configurable: true
      });

      TestBed.runInInjectionContext(() => 
        adminGuard(mockRoute, mockState)
      );

      expect(notificationService.show).not.toHaveBeenCalled();
    });
  });

  describe('Blokowanie niezalogowanych użytkowników', () => {
    it('powinien zablokować dostęp gdy użytkownik nie jest zalogowany', () => {
      // Setup: user is NOT authenticated
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => false,
        configurable: true
      });
      Object.defineProperty(authService, 'isAdmin', {
        get: () => false,
        configurable: true
      });

      const result = TestBed.runInInjectionContext(() => 
        adminGuard(mockRoute, mockState)
      );

      expect(result).toBeFalse();
    });

    it('powinien przekierować niezalogowanego na stronę logowania', () => {
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => false,
        configurable: true
      });

      TestBed.runInInjectionContext(() => 
        adminGuard(mockRoute, mockState)
      );

      expect(router.navigate).toHaveBeenCalledWith(
        ['/login'],
        { queryParams: { returnUrl: '/admin/dashboard' } }
      );
    });

    it('powinien wyświetlić ostrzeżenie dla niezalogowanego użytkownika', () => {
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => false,
        configurable: true
      });

      TestBed.runInInjectionContext(() => 
        adminGuard(mockRoute, mockState)
      );

      expect(notificationService.show).toHaveBeenCalledWith(
        'Musisz być zalogowany, aby uzyskać dostęp do panelu administracyjnego',
        NotificationType.WARNING
      );
    });

    it('powinien zapisać URL docelowy w returnUrl dla późniejszego przekierowania', () => {
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => false,
        configurable: true
      });

      const customState = { url: '/admin/products' } as RouterStateSnapshot;

      TestBed.runInInjectionContext(() => 
        adminGuard(mockRoute, customState)
      );

      expect(router.navigate).toHaveBeenCalledWith(
        ['/login'],
        { queryParams: { returnUrl: '/admin/products' } }
      );
    });
  });

  describe('Blokowanie zwykłych użytkowników', () => {
    it('powinien zablokować dostęp zalogowanemu użytkownikowi bez uprawnień admin', () => {
      // Setup: user IS authenticated but is NOT admin
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => true,
        configurable: true
      });
      Object.defineProperty(authService, 'isAdmin', {
        get: () => false,
        configurable: true
      });

      const result = TestBed.runInInjectionContext(() => 
        adminGuard(mockRoute, mockState)
      );

      expect(result).toBeFalse();
    });

    it('powinien przekierować zwykłego użytkownika na stronę główną', () => {
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => true,
        configurable: true
      });
      Object.defineProperty(authService, 'isAdmin', {
        get: () => false,
        configurable: true
      });

      TestBed.runInInjectionContext(() => 
        adminGuard(mockRoute, mockState)
      );

      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('powinien wyświetlić błąd o braku uprawnień', () => {
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => true,
        configurable: true
      });
      Object.defineProperty(authService, 'isAdmin', {
        get: () => false,
        configurable: true
      });

      TestBed.runInInjectionContext(() => 
        adminGuard(mockRoute, mockState)
      );

      expect(notificationService.show).toHaveBeenCalledWith(
        'Nie masz uprawnień do dostępu do panelu administracyjnego',
        NotificationType.ERROR
      );
    });

    it('NIE powinien zapisywać returnUrl przy braku uprawnień (przekierowanie na home)', () => {
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => true,
        configurable: true
      });
      Object.defineProperty(authService, 'isAdmin', {
        get: () => false,
        configurable: true
      });

      TestBed.runInInjectionContext(() => 
        adminGuard(mockRoute, mockState)
      );

      // Sprawdzamy że NIE ma queryParams z returnUrl
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('Różne scenariusze tras admina', () => {
    it('powinien chronić różne trasy panelu admina', () => {
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => true,
        configurable: true
      });
      Object.defineProperty(authService, 'isAdmin', {
        get: () => true,
        configurable: true
      });

      const adminRoutes = [
        '/admin/dashboard',
        '/admin/products',
        '/admin/orders',
        '/admin/users',
        '/admin/analytics'
      ];

      adminRoutes.forEach(url => {
        const state = { url } as RouterStateSnapshot;
        const result = TestBed.runInInjectionContext(() => 
          adminGuard(mockRoute, state)
        );
        expect(result).toBeTrue();
      });
    });
  });

  describe('Logika warunkowa', () => {
    it('powinien sprawdzić isAuthenticated PRZED sprawdzeniem isAdmin', () => {
      // Niezalogowany użytkownik nie powinien przejść dalej
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => false,
        configurable: true
      });
      Object.defineProperty(authService, 'isAdmin', {
        get: () => true, // nawet jeśli to true, nie powinno mieć znaczenia
        configurable: true
      });

      const result = TestBed.runInInjectionContext(() => 
        adminGuard(mockRoute, mockState)
      );

      expect(result).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(
        ['/login'],
        jasmine.any(Object)
      );
    });

    it('powinien wyświetlić tylko JEDNĄ notyfikację w każdym przypadku', () => {
      // Case 1: Niezalogowany
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => false,
        configurable: true
      });

      TestBed.runInInjectionContext(() => 
        adminGuard(mockRoute, mockState)
      );

      expect(notificationService.show).toHaveBeenCalledTimes(1);

      // Reset
      notificationService.show.calls.reset();

      // Case 2: Zalogowany ale nie admin
      Object.defineProperty(authService, 'isAuthenticated', {
        get: () => true,
        configurable: true
      });
      Object.defineProperty(authService, 'isAdmin', {
        get: () => false,
        configurable: true
      });

      TestBed.runInInjectionContext(() => 
        adminGuard(mockRoute, mockState)
      );

      expect(notificationService.show).toHaveBeenCalledTimes(1);
    });
  });
});
