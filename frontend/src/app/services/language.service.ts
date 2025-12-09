import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

/**
 * Serwis do zarządzania językiem aplikacji
 * Obsługuje wielojęzyczność dla backendu django-parler i UI (ngx-translate)
 */
@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly STORAGE_KEY = 'language';
  private readonly DEFAULT_LANGUAGE = 'pl';
  private readonly SUPPORTED_LANGUAGES = ['pl', 'en'];

  private currentLanguageSubject: BehaviorSubject<string>;
  public currentLanguage$: Observable<string>;
  private translate?: TranslateService;

  constructor(private injector: Injector) {
    const savedLanguage = this.getStoredLanguage();
    
    this.currentLanguageSubject = new BehaviorSubject<string>(savedLanguage);
    this.currentLanguage$ = this.currentLanguageSubject.asObservable();
  }
  
  /**
   * Initialize TranslateService (called after construction)
   */
  private initTranslate(): void {
    if (!this.translate) {
      this.translate = this.injector.get(TranslateService);
    }
  }

  /**
   * Pobiera aktualnie wybrany język
   */
  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  /**
   * Ustawia nowy język
   * @param language Kod języka (np. 'pl', 'en')
   */
  setLanguage(language: string): void {
    if (this.SUPPORTED_LANGUAGES.includes(language)) {
      localStorage.setItem(this.STORAGE_KEY, language);
      
      // Zmień język w ngx-translate (natychmiastowo, bez przeładowania strony)
      this.initTranslate();
      if (this.translate) {
        this.translate.use(language);
      }
      
      this.currentLanguageSubject.next(language);
      
      console.log(`Language changed to: ${language}`);
    } else {
      console.warn(`Unsupported language: ${language}`);
    }
  }

  /**
   * Pobiera język z localStorage lub zwraca domyślny
   */
  private getStoredLanguage(): string {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored && this.SUPPORTED_LANGUAGES.includes(stored) 
      ? stored 
      : this.DEFAULT_LANGUAGE;
  }

  /**
   * Zwraca listę obsługiwanych języków
   */
  getSupportedLanguages(): string[] {
    return [...this.SUPPORTED_LANGUAGES];
  }

  /**
   * Resetuje język do domyślnego
   */
  resetToDefault(): void {
    this.setLanguage(this.DEFAULT_LANGUAGE);
  }
}
