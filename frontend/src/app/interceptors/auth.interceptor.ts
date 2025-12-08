import { Injectable, Injector } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { LanguageService } from '../services/language.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService?: AuthService;
  private languageService?: LanguageService;

  constructor(private injector: Injector) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Lazy load services to avoid circular dependency
    if (!this.authService) {
      this.authService = this.injector.get(AuthService);
    }
    if (!this.languageService) {
      this.languageService = this.injector.get(LanguageService);
    }

    const token = this.authService.getToken();
    const language = this.languageService.getCurrentLanguage();

    // Klonuj request i dodaj nagłówki
    const headers: { [key: string]: string } = {
      'Accept-Language': language
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    request = request.clone({
      setHeaders: headers
    });

    return next.handle(request);
  }
}

