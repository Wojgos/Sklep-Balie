import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { LanguageService } from '../services/language.service';

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const languageService = inject(LanguageService);

  const token = authService.getToken();
  const language = languageService.getCurrentLanguage();

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

  return next(request);
};

