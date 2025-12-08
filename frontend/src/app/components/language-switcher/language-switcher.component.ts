import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';

/**
 * Komponent do przełączania języka aplikacji
 * Można go dodać do header'a lub innego miejsca w UI
 */
@Component({
  selector: 'bg-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="language-switcher">
      <button
        *ngFor="let lang of languages"
        (click)="changeLanguage(lang)"
        [class.active]="currentLanguage === lang"
        [disabled]="isChanging"
        class="language-button"
        [attr.aria-label]="'Switch to ' + lang"
        [title]="'Przełącz na ' + (lang === 'pl' ? 'polski' : 'angielski')"
      >
        {{ lang.toUpperCase() }}
      </button>
      <div *ngIf="isChanging" class="loading-indicator">
        <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    </div>
  `,
  styles: [`
    .language-switcher {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .language-button {
      padding: 0.25rem 0.75rem;
      border: 1px solid var(--border);
      background: var(--background);
      color: var(--foreground);
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .language-button:hover:not(:disabled) {
      background: var(--muted);
    }

    .language-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .language-button.active {
      background: var(--primary);
      color: var(--primary-foreground);
      border-color: var(--primary);
    }

    .loading-indicator {
      display: flex;
      align-items: center;
      color: var(--primary);
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }
  `]
})
export class LanguageSwitcherComponent {
  currentLanguage: string;
  languages: string[];
  isChanging = false;

  constructor(private languageService: LanguageService) {
    this.currentLanguage = this.languageService.getCurrentLanguage();
    this.languages = this.languageService.getSupportedLanguages();

    // Subscribe to language changes
    this.languageService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
    });
  }

  changeLanguage(language: string): void {
    const previousLanguage = this.currentLanguage;
    
    // Jeśli to ten sam język, nie rób nic
    if (previousLanguage === language) {
      return;
    }
    
    // Ustaw flagę ładowania
    this.isChanging = true;
    
    // Zmień język w serwisie
    this.languageService.setLanguage(language);
    
    console.log(`Language switched from ${previousLanguage} to ${language}, reloading page...`);
    
    // Krótkie opóźnienie dla płynnego UX, potem przeładuj stronę
    setTimeout(() => {
      window.location.reload();
    }, 300);
  }
}
