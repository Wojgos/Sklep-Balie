# Implementacja ngx-translate - Dokumentacja

## ✅ Co zostało zaimplementowane

### 1. **Instalacja pakietów**
```bash
npm install @ngx-translate/core @ngx-translate/http-loader --save
```

Zainstalowane biblioteki:
- `@ngx-translate/core` - główna biblioteka do tłumaczeń
- `@ngx-translate/http-loader` - loader do ładowania plików JSON z tłumaczeniami

---

### 2. **Utworzono pliki tłumaczeń**

#### `frontend/src/assets/i18n/pl.json`
Plik z tłumaczeniami polskimi (domyślny język).

#### `frontend/src/assets/i18n/en.json`
Plik z tłumaczeniami angielskimi.

**Struktura tłumaczeń:**
```json
{
  "COMMON": {
    "CANCEL": "Anuluj" / "Cancel",
    "CONFIRM": "Potwierdź" / "Confirm",
    "SAVE": "Zapisz" / "Save",
    ...
  },
  "MODAL": {
    "SUCCESS_TITLE": "Sukces" / "Success",
    "ERROR_TITLE": "Błąd" / "Error",
    ...
  },
  "NAVIGATION": {...},
  "PRODUCT": {...},
  "CART": {...},
  "AUTH": {...},
  "FORM": {...},
  "SEARCH": {...},
  "FOOTER": {...},
  "ADMIN": {...},
  "CHATBOT": {...}
}
```

---

### 3. **Konfiguracja w `main.ts`**

Dodano:
```typescript
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function createTranslateLoader(http: HttpClient) {
  return new (TranslateHttpLoader as any)(http, './assets/i18n/', '.json');
}

// W providers:
importProvidersFrom(
  TranslateModule.forRoot({
    loader: {
      provide: TranslateLoader,
      useFactory: createTranslateLoader,
      deps: [HttpClient]
    }
  })
)
```

---

### 4. **Aktualizacja `LanguageService`**

**Zmiany:**
- ✅ Dodano import `TranslateService`
- ✅ Konfiguracja ngx-translate w konstruktorze
- ✅ **USUNIĘTO `window.location.reload()`** - język zmienia się natychmiastowo!
- ✅ Integracja z `translate.use(language)`

**Przed:**
```typescript
setLanguage(language: string): void {
  localStorage.setItem(this.STORAGE_KEY, language);
  this.currentLanguageSubject.next(language);
  
  setTimeout(() => {
    window.location.reload(); // ❌ Przeładowanie
  }, 300);
}
```

**Po:**
```typescript
setLanguage(language: string): void {
  localStorage.setItem(this.STORAGE_KEY, language);
  
  // Zmień język w ngx-translate (natychmiastowo)
  this.translate.use(language); // ✅ Bez przeładowania!
  
  this.currentLanguageSubject.next(language);
}
```

---

### 5. **Aktualizacja `LanguageSwitcherComponent`**

**Zmiany:**
- ✅ Usunięto `window.location.reload()`
- ✅ Dodano płynne przejście z flagą `isChanging`

**Efekt:**
- Przełącznik języka działa **natychmiastowo**
- Brak migania/przeładowania strony
- Płynna animacja przejścia

---

### 6. **Aktualizacja `ModalService`**

**Zmiany:**
- ✅ Dodano inject `TranslateService`
- ✅ Wszystkie domyślne teksty używają `translate.instant()`

**Przykład:**
```typescript
showSuccess(message: string, title?: string): void {
  const modal: Modal = {
    type: 'success',
    title: title || this.translate.instant('MODAL.SUCCESS_TITLE'), // ✅
    message
  };
  this.addModal(modal);
}
```

**Efekt:**
- Tytuły modali automatycznie tłumaczone
- "Sukces" → "Success" po zmianie języka
- Przyciski "Tak"/"Nie" → "Yes"/"No"

---

### 7. **Aktualizacja `ModalContainerComponent`**

**Zmiany:**
- ✅ Dodano `TranslateModule` do imports
- ✅ Dodano `| translate` pipe do przycisków

**Przed:**
```html
<button>{{ modal.cancelText || 'Anuluj' }}</button>
```

**Po:**
```html
<button>{{ modal.cancelText || ('COMMON.CANCEL' | translate) }}</button>
```

---

## 🎯 Jak używać w innych komponentach

### **W Template (HTML):**
```html
<!-- Prosta interpolacja -->
<h1>{{ 'PRODUCT.DETAILS' | translate }}</h1>

<!-- Z parametrami -->
<p>{{ 'FORM.MIN_LENGTH' | translate: {value: 8} }}</p>

<!-- W atrybutach -->
<input [placeholder]="'SEARCH.PLACEHOLDER' | translate">

<!-- Z fallback -->
<span>{{ someText || ('COMMON.NO_RESULTS' | translate) }}</span>
```

### **W TypeScript:**
```typescript
import { TranslateService } from '@ngx-translate/core';

constructor(private translate: TranslateService) {}

// Synchronicznie (instant)
const text = this.translate.instant('COMMON.SUCCESS');

// Asynchronicznie (Observable)
this.translate.get('PRODUCT.NAME').subscribe(text => {
  console.log(text);
});

// Z parametrami
const msg = this.translate.instant('FORM.MIN_LENGTH', { value: 8 });
```

### **W Standalone Components:**
```typescript
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  imports: [CommonModule, TranslateModule], // ✅ Dodaj TranslateModule
  template: `<h1>{{ 'TITLE' | translate }}</h1>`
})
```

---

## 🔄 Flow działania wielojęzyczności

```
1. Użytkownik klika przycisk języka (PL/EN)
   ↓
2. LanguageSwitcher wywołuje languageService.setLanguage('en')
   ↓
3. LanguageService:
   - Zapisuje język w localStorage
   - Wywołuje translate.use('en')
   - Emituje zmianę przez BehaviorSubject
   ↓
4. ngx-translate:
   - Ładuje plik en.json
   - Aktualizuje wszystkie pipe'y | translate w całej aplikacji
   ↓
5. AuthInterceptor:
   - Dodaje header 'Accept-Language: en' do requestów
   ↓
6. Backend django-parler:
   - Zwraca dane produktów w języku angielskim
   ↓
7. Frontend wyświetla:
   - UI teksty z en.json (ngx-translate)
   - Dane produktów z API (django-parler)
```

**Cały proces bez przeładowania strony!** ⚡

---

## 📊 Co jest tłumaczone

### ✅ **Przez ngx-translate (frontend/UI):**
- Przyciski: Zapisz, Usuń, Anuluj, Potwierdź
- Etykiety: Nazwa, Cena, Opis, Ilość
- Nawigacja: Strona główna, Produkty, Koszyk
- Komunikaty: Sukces, Błąd, Informacja
- Walidacje: "To pole jest wymagane"
- Placeholdery: "Szukaj produktów..."

### ✅ **Przez django-parler (backend/API):**
- Nazwy produktów
- Opisy produktów
- Nazwy kategorii
- Opisy kategorii
- Atrybuty produktów
- Inne dane z bazy

---

## 🚀 Następne kroki (TODO)

### **Priorytet 1 - Krytyczne komponenty:**
- [ ] `ProductQuickViewComponent` - "Dodaj do koszyka", "Szczegóły"
- [ ] `CartDrawerComponent` - "Koszyk", "Suma", "Do kasy"
- [ ] `SearchBarComponent` - placeholder "Szukaj..."
- [ ] `HeaderComponent` - linki nawigacji

### **Priorytet 2 - Strony użytkownika:**
- [ ] `LoginComponent` - formularz logowania
- [ ] `RegisterComponent` - formularz rejestracji
- [ ] `CheckoutComponent` - proces zamówienia
- [ ] `ProductsComponent` - lista produktów, filtry

### **Priorytet 3 - Panel admina:**
- [ ] `AdminComponent` - wszystkie sekcje panelu
- [ ] Komunikaty sukcesu/błędu (już częściowo zrobione)

### **Priorytet 4 - Pozostałe:**
- [ ] `FooterComponent` - linki stopki
- [ ] `NotFoundComponent` - strona 404
- [ ] `SupportComponent` - formularz wsparcia
- [ ] `ChatbotComponent` - asystent

---

## 🛠️ Jak dodać nowe tłumaczenie

### 1. Dodaj klucz do plików JSON:

**`pl.json`:**
```json
{
  "PRODUCT": {
    "NEW_KEY": "Nowy tekst po polsku"
  }
}
```

**`en.json`:**
```json
{
  "PRODUCT": {
    "NEW_KEY": "New text in English"
  }
}
```

### 2. Użyj w komponencie:

**HTML:**
```html
<p>{{ 'PRODUCT.NEW_KEY' | translate }}</p>
```

**TypeScript:**
```typescript
const text = this.translate.instant('PRODUCT.NEW_KEY');
```

---

## ⚠️ Uwagi techniczne

### **Circular Dependency Warning:**
Jeśli zobaczysz ostrzeżenie o circular dependency:
```
WARNING: Circular dependency detected
```

**Rozwiązanie:** 
- Używamy lazy loading `inject()` w interceptorze
- TranslateService jest dostarczany przez `providedIn: 'root'`
- To jest bezpieczne i nie powoduje problemów runtime

### **TranslateHttpLoader Constructor Issue:**
Starsze wersje `@ngx-translate/http-loader` mogą mieć problemy z TypeScript.

**Rozwiązanie zastosowane:**
```typescript
return new (TranslateHttpLoader as any)(http, './assets/i18n/', '.json');
```

To obejście problemu z typami TypeScript - działa poprawnie w runtime.

---

## 📈 Korzyści z implementacji

✅ **Bez przeładowania strony** - natychmiastowa zmiana języka  
✅ **Separacja odpowiedzialności** - UI (frontend) vs Dane (backend)  
✅ **Runtime switching** - elastyczność  
✅ **Łatwe zarządzanie** - pliki JSON  
✅ **Integracja z backend** - współpraca z django-parler  
✅ **Skalowalność** - łatwe dodanie kolejnych języków  
✅ **Developer-friendly** - czytelna składnia  

---

## 🎉 Status implementacji

**✅ PODSTAWA GOTOWA (80% infrastruktury)**

Zaimplementowano:
- ✅ Instalacja i konfiguracja ngx-translate
- ✅ Pliki tłumaczeń (pl.json, en.json)
- ✅ LanguageService z pełną integracją
- ✅ ModalService z tłumaczeniami
- ✅ ModalContainerComponent
- ✅ Usunięcie window.location.reload()
- ✅ Płynne przełączanie języków

**Następny krok:** Systematyczne dodawanie tłumaczeń do pozostałych komponentów.

---

Data implementacji: 9 grudnia 2024  
Wersja: 1.0.0
