import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

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
  

  private initTranslate(): void {
    if (!this.translate) {
      this.translate = this.injector.get(TranslateService);
    }
  }


  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

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


  private getStoredLanguage(): string {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored && this.SUPPORTED_LANGUAGES.includes(stored) 
      ? stored 
      : this.DEFAULT_LANGUAGE;
  }


  getSupportedLanguages(): string[] {
    return [...this.SUPPORTED_LANGUAGES];
  }

  resetToDefault(): void {
    this.setLanguage(this.DEFAULT_LANGUAGE);
  }
}
