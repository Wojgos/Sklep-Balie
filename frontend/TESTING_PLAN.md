# Plan Implementacji Testów Jednostkowych (Frontend)

Ten dokument opisuje strategię testowania aplikacji Angular w projekcie inżynierskim.
Wykorzystywane narzędzia: **Jasmine** (framework testowy) + **Karma** (test runner) - standardowe dla Angulara.

## Faza 1: Logika Biznesowa (Serwisy)
Priorytet: **Krytyczny**. Te serwisy odpowiadają za pieniądze i bezpieczeństwo.

### 1. CartService (`src/app/services/cart.service.spec.ts`)
Testowanie logiki koszyka zakupowego.
- [x] **Inicjalizacja**: Sprawdzenie, czy koszyk ładuje się pusty lub z `localStorage`.
- [x] **Dodawanie produktu**:
    - Dodanie nowego produktu -> ilość = 1.
    - Dodanie tego samego produktu -> zwiększenie ilości.
- [x] **Usuwanie produktu**: Całkowite usunięcie pozycji z koszyka.
- [x] **Aktualizacja ilości**: Zmiana ilości (np. z 1 na 5).
- [x] **Obliczenia**:
    - `itemCount$`: Czy poprawnie zlicza sumę sztuk.
    - `totalPrice$`: Czy poprawnie mnoży (cena * ilość) i sumuje całość.
- [x] **Czyszczenie**: Metoda `clearCart()`.

### 2. AuthService (`src/app/services/auth.service.spec.ts`)
Testowanie stanu uwierzytelnienia.
- [x] **Logowanie**: Czy zapisuje token i dane użytkownika po udanym logowaniu.
- [x] **Wylogowanie**: Czy czyści `localStorage` i stan aplikacji.
- [x] **Status**: Czy `isLoggedIn` zwraca `true` gdy mamy token, i `false` gdy go brak.

## Faza 2: Komunikacja z API (Serwisy)
Priorytet: **Wysoki**. Testowanie obsługi błędów i mapowania danych.

### 3. ApiService (`src/app/services/api.service.spec.ts`)
Testowanie metod HTTP z użyciem `HttpTestingController`.
- [x] **Pobieranie produktów**: Czy `getProducts()` wykonuje GET na poprawny URL.
- [x] **Obsługa błędów**: Jak serwis reaguje na błąd 404 lub 500 z serwera.
- [x] **Parametry**: Czy filtry (np. kategoria, cena) są poprawnie doklejane do URL.

## Faza 3: Komponenty (UI & Interakcje)
Priorytet: **Średni**. Sprawdzenie czy widok reaguje na akcje użytkownika.

### 4. ProductCardComponent (`src/app/components/product-card/product-card.component.spec.ts`)
- [ ] **Wyświetlanie**: Czy nazwa i cena produktu są widoczne.
- [ ] **Akcja**: Czy kliknięcie przycisku "Do koszyka" wywołuje metodę `addToCart` w `CartService`.

### 5. LoginComponent (`src/app/pages/login/login.component.spec.ts`)
- [ ] **Formularz**: Czy formularz jest nieprawidłowy (invalid), gdy pola są puste.
- [ ] **Submit**: Czy kliknięcie "Zaloguj" wywołuje `AuthService.login()`.
- [ ] **Błędy**: Czy wyświetla komunikat błędu, gdy logowanie się nie powiedzie.

## Faza 4: Guards & Interceptory (Bezpieczeństwo)
Priorytet: **Wysoki**. Testowanie logiki autoryzacji i middleware.

### 6. AuthGuard (`src/app/guards/auth.guard.spec.ts`)
- [x] **Dostęp dla zalogowanych**: Czy przepuszcza użytkownika z tokenem.
- [x] **Przekierowanie**: Czy przekierowuje niezalogowanych na `/login`.
- [x] **Zachowanie URL**: Czy zapisuje docelowy URL w `returnUrl`.

### 7. AdminGuard (`src/app/guards/admin.guard.spec.ts`)
- [x] **Dostęp dla admina**: Czy przepuszcza użytkownika z rolą admin.
- [x] **Blokada dla użytkownika**: Czy blokuje zwykłego użytkownika.
- [x] **Przekierowanie**: Czy przekierowuje na stronę główną przy braku uprawnień.

### 8. AuthInterceptor (`src/app/interceptors/auth.interceptor.spec.ts`)
- [x] **Dodawanie tokena**: Czy dodaje `Authorization: Bearer <token>` do nagłówków.
- [x] **Brak tokena**: Czy przepuszcza żądanie bez zmian, gdy brak tokena.
- [x] **Nagłówki językowe**: Czy dodaje `Accept-Language` na podstawie LanguageService.

## Faza 5: Pozostałe Serwisy (Dodatkowa Funkcjonalność)
Priorytet: **Niski-Średni**. Testowanie pomocniczych funkcji.

### 9. NotificationService (`src/app/services/notification.service.spec.ts`)
- [x] **Wyświetlanie**: Czy emituje notyfikację przez Observable.
- [x] **Typy**: Czy obsługuje success/error/warning/info.
- [x] **Auto-dismiss**: Czy automatycznie usuwa notyfikacje po timeout.

### 10. ModalService (`src/app/services/modal.service.spec.ts`)
- [ ] **Otwieranie**: Czy emituje event otwarcia modala.
- [ ] **Zamykanie**: Czy czyści stan po zamknięciu.
- [ ] **Dane**: Czy przekazuje dane do komponentu modala.

### 11. LanguageService (`src/app/services/language.service.spec.ts`)
- [ ] **Zmiana języka**: Czy przełącza między PL/EN.
- [ ] **Zapisywanie**: Czy zapisuje wybrany język w localStorage.
- [ ] **Ładowanie**: Czy ładuje język przy inicjalizacji.

### 12. ChatbotService (`src/app/services/chatbot.service.spec.ts`)
- [ ] **Wysyłanie wiadomości**: Czy wysyła POST do API chatbota.
- [ ] **Historia**: Czy zachowuje historię konwersacji.
- [ ] **Obsługa błędów**: Czy reaguje na błędy API.

## Faza 6: Komponenty UI (Zaawansowane)
Priorytet: **Niski**. Testy interakcji użytkownika z UI.

### 13. HeaderComponent
- [ ] **Menu mobilne**: Czy rozwija/zwija menu na małych ekranach.
- [ ] **Licznik koszyka**: Czy wyświetla poprawną liczbę produktów.
- [ ] **Wylogowanie**: Czy wywołuje AuthService.logout().

### 14. SearchBarComponent
- [ ] **Debounce**: Czy czeka 300ms przed wyszukiwaniem.
- [ ] **Wyniki**: Czy wyświetla listę wyników wyszukiwania.
- [ ] **Nawigacja**: Czy przekierowuje do strony produktu po kliknięciu.

### 15. PaginationComponent
- [ ] **Zmiana strony**: Czy emituje event przy kliknięciu numeru strony.
- [ ] **Stan**: Czy wyłącza przycisk aktualnej strony.
- [ ] **Granice**: Czy wyłącza "Poprzednia" na pierwszej stronie.

### 16. CartDrawerComponent
- [ ] **Otwieranie**: Czy reaguje na dodanie produktu do koszyka.
- [ ] **Usuwanie**: Czy usuwa produkt z koszyka.
- [ ] **Checkout**: Czy przekierowuje do strony checkout.

## Faza 7: Integracyjne & E2E (Opcjonalne)
Priorytet: **Bardzo Niski**. Zaawansowane testy przepływu użytkownika.

### 17. Testy E2E (Cypress/Playwright)
- [ ] **Pełny flow zakupu**: Od strony głównej → produkt → koszyk → checkout → potwierdzenie.
- [ ] **Logowanie i wylogowanie**: Cały proces uwierzytelnienia.
- [ ] **Panel admina**: Dodawanie produktu, zmiana statusu zamówienia.

## Rekomendacje priorytetów dla pracy inżynierskiej:

### Minimalny zakres (już osiągnięty ✅):
- ✅ CartService
- ✅ AuthService  
- ✅ ApiService

### Zalecany zakres (zwiększy coverage do ~40-50%):
- ✅ **AuthGuard** (bezpieczeństwo!)
- ✅ **AdminGuard** (bezpieczeństwo!)
- ✅ **AuthInterceptor** (kluczowy dla API)
- ✅ **NotificationService** (często używany)
- ⏳ **ProductCardComponent** (kluczowy dla UX)
- ⏳ **LoginComponent** (punkt wejścia użytkownika)

### Pełny zakres (coverage ~60-70%):
- Wszystkie powyższe + pozostałe serwisy
- Kluczowe komponenty UI (Header, SearchBar, CartDrawer)
- Wybrane testy E2E dla głównych przepływów

## Faza 4: Uruchamianie i Raportowanie

### Komendy
1. Uruchomienie wszystkich testów:
   ```bash
   ng test
   ```
2. Uruchomienie z raportem pokrycia kodu (Code Coverage):
   ```bash
   ng test --no-watch --code-coverage
   ```
   *Raport wygeneruje się w folderze `coverage/` - świetny dodatek do pracy dyplomowej!*

### Cel pokrycia (Code Coverage Goal)
Dla pracy inżynierskiej satysfakcjonujący poziom to:
- **Statements**: > 60%
- **Branches**: > 50%
- **Functions**: > 60%
- **Lines**: > 60%

### Aktualny wynik (11 grudnia 2025 - 18:58)
**152 testów przechodzących ✅**

#### Pokrycie kodu:
- **Statements**: 26.73% (316/1182)
- **Branches**: 21.88% (123/562)
- **Functions**: 25.87% (111/429)
- **Lines**: 27.67% (303/1095)

#### Zaimplementowane testy:
- ✅ **CartService** - 23 testy (inicjalizacja, CRUD, obliczenia, localStorage)
- ✅ **AuthService** - 31 testów (logowanie, rejestracja, wylogowanie, JWT, profile)
- ✅ **ApiService** - 25 testów (HTTP requests, error handling, data mapping)
- ✅ **AuthGuard** - 11 testów (route protection, redirects, returnUrl)
- ✅ **AdminGuard** - 18 testów (admin role verification, notifications)
- ✅ **AuthInterceptor** - 17 testów (token injection, language headers, request cloning)
- ✅ **NotificationService** - 34 testy (notification types, auto-dismiss, Observables, timers)

**Postęp**: +73 testy od ostatniego update (79 → 152). Coverage wzrósł o ~4%. Zaimplementowano kluczowe testy security (Guards + Interceptor) oraz NotificationService.
