import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { User, LoginRequest, RegisterRequest } from '../models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  
  const AUTH_URL = 'http://localhost:8000/api/v1/auth';
  const USERS_URL = 'http://localhost:8000/api/v1/users';

  // Mock user data
  const mockUser: User = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: '123456789',
    address: 'Test Street 1',
    city: 'Test City',
    postalCode: '12-345',
    role: 'user',
    createdAt: new Date()
  };

  const mockBackendUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    phone: '123456789',
    address: 'Test Street 1',
    city: 'Test City',
    postal_code: '12-345',
    is_staff: false,
    date_joined: new Date().toISOString()
  };

  const mockAdminUser: User = {
    ...mockUser,
    id: '2',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin'
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verify that no unmatched requests are outstanding
    localStorage.clear();
  });

  describe('Inicjalizacja', () => {
    it('powinien zostać utworzony', () => {
      expect(service).toBeTruthy();
    });

    it('powinien załadować użytkownika z localStorage', () => {
      const userToStore = { ...mockUser };
      localStorage.setItem('current_user', JSON.stringify(userToStore));
      localStorage.setItem('access_token', 'test-token');
      
      const newService = new AuthService(TestBed.inject(HttpClientTestingModule) as any);
      
      const loadedUser = newService.currentUserValue;
      expect(loadedUser).toBeTruthy();
      expect(loadedUser?.username).toBe('testuser');
      expect(loadedUser?.email).toBe('test@example.com');
      // Don't check createdAt as it gets serialized/deserialized
    });

    it('powinien mieć pusty stan gdy brak danych w localStorage', () => {
      expect(service.currentUserValue).toBeNull();
    });

    it('powinien obsłużyć nieprawidłowe dane JSON w localStorage', () => {
      localStorage.setItem('current_user', 'invalid json');
      localStorage.setItem('access_token', 'test-token');
      
      const newService = new AuthService(TestBed.inject(HttpClientTestingModule) as any);
      
      expect(newService.currentUserValue).toBeNull();
    });
  });

  describe('Logowanie', () => {
    const loginRequest: LoginRequest = {
      username: 'test@example.com',
      password: 'password123'
    };

    it('powinien zalogować użytkownika i zapisać token', (done) => {
      const mockLoginResponse = {
        access: 'access-token-123',
        refresh: 'refresh-token-456',
        user: mockBackendUser
      };

      service.login(loginRequest).subscribe(response => {
        expect(response.user.username).toBe('testuser');
        expect(response.user.email).toBe('test@example.com');
        expect(localStorage.getItem('access_token')).toBe('access-token-123');
        expect(localStorage.getItem('refresh_token')).toBe('refresh-token-456');
        done();
      });

      const req = httpMock.expectOne(`${AUTH_URL}/login/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.email).toBe(loginRequest.username);
      expect(req.request.body.password).toBe(loginRequest.password);
      req.flush(mockLoginResponse);
    });

    it('powinien obsłużyć błąd logowania 400', (done) => {
      const errorResponse = {
        non_field_errors: ['Unable to log in with provided credentials.']
      };

      service.login(loginRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Unable to log in');
          done();
        }
      });

      const req = httpMock.expectOne(`${AUTH_URL}/login/`);
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });

    it('powinien obsłużyć błąd niezweryfikowanego emaila', (done) => {
      const errorResponse = {
        email: ['E-mail is not verified.']
      };

      service.login(loginRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Email');
          done();
        }
      });

      const req = httpMock.expectOne(`${AUTH_URL}/login/`);
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });

    it('powinien zaktualizować currentUser$ po zalogowaniu', (done) => {
      const mockLoginResponse = {
        access: 'access-token',
        refresh: 'refresh-token',
        user: mockBackendUser
      };

      service.currentUser$.subscribe(user => {
        if (user) {
          expect(user.username).toBe('testuser');
          done();
        }
      });

      service.login(loginRequest).subscribe();

      const req = httpMock.expectOne(`${AUTH_URL}/login/`);
      req.flush(mockLoginResponse);
    });

    it('powinien pobrać użytkownika gdy odpowiedź nie zawiera user', (done) => {
      const mockLoginResponse = {
        access: 'access-token',
        refresh: 'refresh-token'
      };

      service.login(loginRequest).subscribe(response => {
        expect(response.user.username).toBe('testuser');
        done();
      });

      const loginReq = httpMock.expectOne(`${AUTH_URL}/login/`);
      loginReq.flush(mockLoginResponse);

      const profileReq = httpMock.expectOne(`${USERS_URL}/profile/`);
      profileReq.flush(mockBackendUser);
    });
  });

  describe('Rejestracja', () => {
    const registerRequest: RegisterRequest = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      firstName: 'New',
      lastName: 'User'
    };

    it('powinien zarejestrować nowego użytkownika', (done) => {
      const mockRegisterResponse = {
        access: 'access-token',
        refresh: 'refresh-token',
        user: mockBackendUser
      };

      service.register(registerRequest).subscribe(response => {
        expect(response.user.username).toBe('testuser');
        expect(localStorage.getItem('access_token')).toBe('access-token');
        done();
      });

      const req = httpMock.expectOne(`${AUTH_URL}/registration/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.username).toBe('newuser');
      expect(req.request.body.email).toBe('new@example.com');
      expect(req.request.body.password1).toBe('password123');
      expect(req.request.body.password2).toBe('password123');
      expect(req.request.body.first_name).toBe('New');
      expect(req.request.body.last_name).toBe('User');
      req.flush(mockRegisterResponse);
    });

    it('powinien obsłużyć rejestrację wymagającą weryfikacji email', (done) => {
      const mockRegisterResponse = {
        detail: 'Verification e-mail sent.'
      };

      service.register(registerRequest).subscribe(response => {
        expect(response.detail).toBe('Verification e-mail sent.');
        expect(localStorage.getItem('access_token')).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${AUTH_URL}/registration/`);
      req.flush(mockRegisterResponse);
    });

    it('powinien obsłużyć błędy walidacji podczas rejestracji', (done) => {
      const errorResponse = {
        username: ['Username already exists.']
      };

      service.register(registerRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne(`${AUTH_URL}/registration/`);
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('Wylogowanie', () => {
    beforeEach(() => {
      localStorage.setItem('access_token', 'test-token');
      localStorage.setItem('refresh_token', 'refresh-token');
      localStorage.setItem('current_user', JSON.stringify(mockUser));
    });

    it('powinien wyczyścić localStorage', () => {
      service.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('current_user')).toBeNull();
    });

    it('powinien ustawić currentUser na null', (done) => {
      service.logout();

      service.currentUser$.subscribe(user => {
        expect(user).toBeNull();
        done();
      });
    });

    it('powinien wyczyścić currentUserValue', () => {
      service.logout();

      expect(service.currentUserValue).toBeNull();
    });
  });

  describe('Status uwierzytelnienia', () => {
    it('isAuthenticated powinien zwrócić false gdy brak użytkownika', () => {
      expect(service.isAuthenticated).toBeFalse();
    });

    it('isAuthenticated powinien zwrócić false gdy brak tokena', () => {
      localStorage.setItem('current_user', JSON.stringify(mockUser));
      
      const newService = new AuthService(TestBed.inject(HttpClientTestingModule) as any);
      
      expect(newService.isAuthenticated).toBeFalse();
    });

    it('isAuthenticated powinien zwrócić true gdy użytkownik i token istnieją', () => {
      localStorage.setItem('current_user', JSON.stringify(mockUser));
      localStorage.setItem('access_token', 'test-token');
      
      const newService = new AuthService(TestBed.inject(HttpClientTestingModule) as any);
      
      expect(newService.isAuthenticated).toBeTrue();
    });

    it('isAdmin powinien zwrócić false dla zwykłego użytkownika', () => {
      localStorage.setItem('current_user', JSON.stringify(mockUser));
      localStorage.setItem('access_token', 'test-token');
      
      const newService = new AuthService(TestBed.inject(HttpClientTestingModule) as any);
      
      expect(newService.isAdmin).toBeFalse();
    });

    it('isAdmin powinien zwrócić true dla administratora', () => {
      localStorage.setItem('current_user', JSON.stringify(mockAdminUser));
      localStorage.setItem('access_token', 'test-token');
      
      const newService = new AuthService(TestBed.inject(HttpClientTestingModule) as any);
      
      expect(newService.isAdmin).toBeTrue();
    });
  });

  describe('Pobieranie tokena', () => {
    it('getToken() powinien zwrócić null gdy token nie istnieje', () => {
      expect(service.getToken()).toBeNull();
    });

    it('getToken() powinien zwrócić token z localStorage', () => {
      localStorage.setItem('access_token', 'test-token-123');
      
      expect(service.getToken()).toBe('test-token-123');
    });

    it('getRefreshToken() powinien zwrócić refresh token', () => {
      localStorage.setItem('refresh_token', 'refresh-token-456');
      
      expect(service.getRefreshToken()).toBe('refresh-token-456');
    });
  });

  describe('Aktualizacja profilu', () => {
    beforeEach(() => {
      localStorage.setItem('access_token', 'test-token');
      localStorage.setItem('current_user', JSON.stringify(mockUser));
    });

    it('powinien zaktualizować profil użytkownika', (done) => {
      const updateData: Partial<User> = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '987654321'
      };

      const mockResponse = {
        ...mockBackendUser,
        first_name: 'Updated',
        last_name: 'Name',
        phone: '987654321'
      };

      service.updateUserProfile(updateData).subscribe(user => {
        expect(user.firstName).toBe('Updated');
        expect(user.lastName).toBe('Name');
        expect(user.phone).toBe('987654321');
        done();
      });

      const req = httpMock.expectOne(`${AUTH_URL}/user/`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body.first_name).toBe('Updated');
      expect(req.request.body.last_name).toBe('Name');
      expect(req.request.body.phone).toBe('987654321');
      req.flush(mockResponse);
    });

    it('powinien zaktualizować localStorage po aktualizacji profilu', (done) => {
      const updateData: Partial<User> = {
        firstName: 'Updated'
      };

      const mockResponse = {
        ...mockBackendUser,
        first_name: 'Updated'
      };

      service.updateUserProfile(updateData).subscribe(() => {
        const storedUser = JSON.parse(localStorage.getItem('current_user') || '{}');
        expect(storedUser.firstName).toBe('Updated');
        done();
      });

      const req = httpMock.expectOne(`${AUTH_URL}/user/`);
      req.flush(mockResponse);
    });
  });

  describe('Zmiana hasła', () => {
    beforeEach(() => {
      localStorage.setItem('access_token', 'test-token');
    });

    it('powinien wysłać żądanie zmiany hasła', (done) => {
      service.changePassword('oldPassword', 'newPassword').subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${AUTH_URL}/password/change/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.old_password).toBe('oldPassword');
      expect(req.request.body.new_password1).toBe('newPassword');
      expect(req.request.body.new_password2).toBe('newPassword');
      req.flush({});
    });
  });

  describe('Weryfikacja email', () => {
    it('powinien wysłać klucz weryfikacyjny', (done) => {
      const verificationKey = 'abc123xyz';

      service.verifyEmail(verificationKey).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${AUTH_URL}/registration/verify-email/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.key).toBe(verificationKey);
      req.flush({ detail: 'ok' });
    });
  });

  describe('Pobieranie aktualnego użytkownika', () => {
    beforeEach(() => {
      localStorage.setItem('access_token', 'test-token');
    });

    it('powinien pobrać aktualnego użytkownika z API', (done) => {
      service.loadCurrentUser().subscribe(user => {
        expect(user.username).toBe('testuser');
        expect(user.email).toBe('test@example.com');
        done();
      });

      const req = httpMock.expectOne(`${USERS_URL}/profile/`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush(mockBackendUser);
    });

    it('powinien zapisać użytkownika do localStorage', (done) => {
      service.loadCurrentUser().subscribe(() => {
        const storedUser = JSON.parse(localStorage.getItem('current_user') || '{}');
        expect(storedUser.username).toBe('testuser');
        done();
      });

      const req = httpMock.expectOne(`${USERS_URL}/profile/`);
      req.flush(mockBackendUser);
    });

    it('powinien zaktualizować currentUser$', (done) => {
      let emissionCount = 0;
      
      service.currentUser$.subscribe(user => {
        emissionCount++;
        if (emissionCount === 2 && user) { // First emission is null, second is the user
          expect(user.username).toBe('testuser');
          done();
        }
      });

      service.loadCurrentUser().subscribe();

      const req = httpMock.expectOne(`${USERS_URL}/profile/`);
      req.flush(mockBackendUser);
    });
  });
});
