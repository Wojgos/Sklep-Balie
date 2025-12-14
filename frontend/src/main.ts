import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/interceptors/auth.interceptor';
import { AuthService } from './app/services/auth.service';

export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string): Observable<any> {
    return this.http.get(`/assets/i18n/${lang}.json`);
  }
}

export function createTranslateLoader(http: HttpClient) {
  return new CustomTranslateLoader(http);
}

export function initializeTranslate(translate: TranslateService) {
  return (): Promise<any> => {
    translate.setDefaultLang('pl');
    const savedLang = localStorage.getItem('language') || 'pl';
    console.log('[i18n] Initializing translations with language:', savedLang);
    return new Promise((resolve) => {
      translate.use(savedLang).subscribe({
        next: (translations) => {
          console.log('[i18n] Translations loaded successfully:', Object.keys(translations));
          resolve(true);
        },
        error: (err) => {
          console.error('[i18n] Failed to load translations:', err);
          resolve(true);
        }
      });
    });
  };
}

function initializeApp(authService: AuthService) {
  return () => authService.initializeSession();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(
      BrowserAnimationsModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient]
        }
      })
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTranslate,
      deps: [TranslateService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthService],
      multi: true
    }
  ]
}).catch(err => console.error(err));
