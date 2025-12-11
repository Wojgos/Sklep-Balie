import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { LanguageService } from '../services/language.service';
import { authInterceptor } from './auth.interceptor';
import { Observable, of } from 'rxjs';

describe('authInterceptor', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let languageService: jasmine.SpyObj<LanguageService>;
  let mockHandler: HttpHandlerFn;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);
    const languageServiceSpy = jasmine.createSpyObj('LanguageService', ['getCurrentLanguage']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: LanguageService, useValue: languageServiceSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    languageService = TestBed.inject(LanguageService) as jasmine.SpyObj<LanguageService>;

    // Mock handler that returns a successful response
    mockHandler = jasmine.createSpy('HttpHandlerFn').and.returnValue(
      of({} as HttpEvent<unknown>)
    );

    // Default language
    languageService.getCurrentLanguage.and.returnValue('pl');
  });

  describe('Dodawanie tokena autoryzacji', () => {
    it('powinien dodać nagłówek Authorization gdy token istnieje', (done) => {
      const testToken = 'test-token-123';
      authService.getToken.and.returnValue(testToken);

      const request = new HttpRequest('GET', '/api/products');

      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockHandler).subscribe(() => {
          const callArgs = (mockHandler as jasmine.Spy).calls.mostRecent().args[0] as HttpRequest<unknown>;
          
          expect(callArgs.headers.get('Authorization')).toBe(`Bearer ${testToken}`);
          done();
        });
      });
    });

    it('powinien dodać Bearer prefix do tokena', (done) => {
      authService.getToken.and.returnValue('my-jwt-token');

      const request = new HttpRequest('POST', '/api/orders', {});

      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockHandler).subscribe(() => {
          const callArgs = (mockHandler as jasmine.Spy).calls.mostRecent().args[0] as HttpRequest<unknown>;
          
          expect(callArgs.headers.get('Authorization')).toContain('Bearer ');
          expect(callArgs.headers.get('Authorization')).toBe('Bearer my-jwt-token');
          done();
        });
      });
    });

    it('powinien sklonować request zamiast modyfikować oryginalny', (done) => {
      authService.getToken.and.returnValue('token');

      const originalRequest = new HttpRequest('GET', '/api/users');
      const originalHeaders = originalRequest.headers;

      TestBed.runInInjectionContext(() => {
        authInterceptor(originalRequest, mockHandler).subscribe(() => {
          // Oryginalny request nie powinien być zmodyfikowany
          expect(originalRequest.headers).toBe(originalHeaders);
          expect(originalRequest.headers.has('Authorization')).toBeFalse();
          done();
        });
      });
    });
  });

  describe('Brak tokena', () => {
    it('NIE powinien dodawać nagłówka Authorization gdy token nie istnieje', (done) => {
      authService.getToken.and.returnValue(null);

      const request = new HttpRequest('GET', '/api/products');

      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockHandler).subscribe(() => {
          const callArgs = (mockHandler as jasmine.Spy).calls.mostRecent().args[0] as HttpRequest<unknown>;
          
          expect(callArgs.headers.has('Authorization')).toBeFalse();
          done();
        });
      });
    });

    it('powinien przepuścić request bez zmian gdy użytkownik niezalogowany', (done) => {
      authService.getToken.and.returnValue(null);

      const request = new HttpRequest('POST', '/api/auth/login', {
        username: 'test',
        password: 'pass'
      });

      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockHandler).subscribe(() => {
          const callArgs = (mockHandler as jasmine.Spy).calls.mostRecent().args[0] as HttpRequest<unknown>;
          
          expect(callArgs.headers.has('Authorization')).toBeFalse();
          expect(callArgs.url).toBe('/api/auth/login');
          done();
        });
      });
    });

    it('powinien obsłużyć pusty string jako brak tokena', (done) => {
      authService.getToken.and.returnValue('');

      const request = new HttpRequest('GET', '/api/products');

      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockHandler).subscribe(() => {
          const callArgs = (mockHandler as jasmine.Spy).calls.mostRecent().args[0] as HttpRequest<unknown>;
          
          // Pusty string nie powinien być dodany jako token
          expect(callArgs.headers.has('Authorization')).toBeFalse();
          done();
        });
      });
    });
  });

  describe('Nagłówek Accept-Language', () => {
    it('powinien dodać nagłówek Accept-Language z aktualnym językiem', (done) => {
      authService.getToken.and.returnValue(null);
      languageService.getCurrentLanguage.and.returnValue('pl');

      const request = new HttpRequest('GET', '/api/products');

      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockHandler).subscribe(() => {
          const callArgs = (mockHandler as jasmine.Spy).calls.mostRecent().args[0] as HttpRequest<unknown>;
          
          expect(callArgs.headers.get('Accept-Language')).toBe('pl');
          done();
        });
      });
    });

    it('powinien dodać nagłówek Accept-Language dla języka angielskiego', (done) => {
      authService.getToken.and.returnValue(null);
      languageService.getCurrentLanguage.and.returnValue('en');

      const request = new HttpRequest('GET', '/api/products');

      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockHandler).subscribe(() => {
          const callArgs = (mockHandler as jasmine.Spy).calls.mostRecent().args[0] as HttpRequest<unknown>;
          
          expect(callArgs.headers.get('Accept-Language')).toBe('en');
          done();
        });
      });
    });

    it('powinien dodać zarówno Authorization jak i Accept-Language', (done) => {
      authService.getToken.and.returnValue('my-token');
      languageService.getCurrentLanguage.and.returnValue('pl');

      const request = new HttpRequest('GET', '/api/products');

      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockHandler).subscribe(() => {
          const callArgs = (mockHandler as jasmine.Spy).calls.mostRecent().args[0] as HttpRequest<unknown>;
          
          expect(callArgs.headers.get('Authorization')).toBe('Bearer my-token');
          expect(callArgs.headers.get('Accept-Language')).toBe('pl');
          done();
        });
      });
    });
  });

  describe('Różne typy requestów HTTP', () => {
    it('powinien obsłużyć GET request', (done) => {
      authService.getToken.and.returnValue('token');

      const request = new HttpRequest('GET', '/api/products');

      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockHandler).subscribe(() => {
          expect(mockHandler).toHaveBeenCalled();
          done();
        });
      });
    });

    it('powinien obsłużyć POST request', (done) => {
      authService.getToken.and.returnValue('token');

      const request = new HttpRequest('POST', '/api/orders', { productId: 1 });

      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockHandler).subscribe(() => {
          const callArgs = (mockHandler as jasmine.Spy).calls.mostRecent().args[0] as HttpRequest<unknown>;
          expect(callArgs.method).toBe('POST');
          expect(callArgs.headers.has('Authorization')).toBeTrue();
          done();
        });
      });
    });

    it('powinien obsłużyć PUT request', (done) => {
      authService.getToken.and.returnValue('token');

      const request = new HttpRequest('PUT', '/api/products/1', { name: 'Updated' });

      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockHandler).subscribe(() => {
          const callArgs = (mockHandler as jasmine.Spy).calls.mostRecent().args[0] as HttpRequest<unknown>;
          expect(callArgs.method).toBe('PUT');
          done();
        });
      });
    });

    it('powinien obsłużyć DELETE request', (done) => {
      authService.getToken.and.returnValue('token');

      const request = new HttpRequest('DELETE', '/api/products/1');

      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockHandler).subscribe(() => {
          const callArgs = (mockHandler as jasmine.Spy).calls.mostRecent().args[0] as HttpRequest<unknown>;
          expect(callArgs.method).toBe('DELETE');
          done();
        });
      });
    });
  });

  describe('Różne endpointy', () => {
    it('powinien dodać token dla endpoint produktów', (done) => {
      authService.getToken.and.returnValue('token');

      const request = new HttpRequest('GET', '/api/v1/shop/products');

      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockHandler).subscribe(() => {
          const callArgs = (mockHandler as jasmine.Spy).calls.mostRecent().args[0] as HttpRequest<unknown>;
          expect(callArgs.headers.has('Authorization')).toBeTrue();
          done();
        });
      });
    });

    it('powinien dodać token dla endpoint zamówień', (done) => {
      authService.getToken.and.returnValue('token');

      const request = new HttpRequest('GET', '/api/v1/orders');

      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockHandler).subscribe(() => {
          const callArgs = (mockHandler as jasmine.Spy).calls.mostRecent().args[0] as HttpRequest<unknown>;
          expect(callArgs.headers.has('Authorization')).toBeTrue();
          done();
        });
      });
    });

    it('powinien działać dla publicznych endpointów (brak tokena)', (done) => {
      authService.getToken.and.returnValue(null);

      const request = new HttpRequest('POST', '/api/v1/auth/login', {});

      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockHandler).subscribe(() => {
          const callArgs = (mockHandler as jasmine.Spy).calls.mostRecent().args[0] as HttpRequest<unknown>;
          expect(callArgs.headers.has('Authorization')).toBeFalse();
          done();
        });
      });
    });
  });

  describe('Zachowanie istniejących nagłówków', () => {
    it('powinien zachować istniejące nagłówki w request', (done) => {
      authService.getToken.and.returnValue('token');

      const request = new HttpRequest('GET', '/api/products', {
        headers: new HttpRequest('GET', '/api/test').headers
          .set('Custom-Header', 'custom-value')
          .set('Content-Type', 'application/json')
      });

      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockHandler).subscribe(() => {
          const callArgs = (mockHandler as jasmine.Spy).calls.mostRecent().args[0] as HttpRequest<unknown>;
          
          expect(callArgs.headers.get('Custom-Header')).toBe('custom-value');
          expect(callArgs.headers.get('Content-Type')).toBe('application/json');
          expect(callArgs.headers.get('Authorization')).toBe('Bearer token');
          done();
        });
      });
    });
  });
});
