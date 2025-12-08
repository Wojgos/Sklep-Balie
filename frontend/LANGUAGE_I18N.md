# Implementacja wielojęzyczności (i18n) z django-parler

## Problem
Backend Django używa **django-parler** do obsługi wielojęzyczności, który oczekuje nagłówka `Accept-Language` w żądaniach HTTP. Frontend Angular nie wysyłał tego nagłówka, co mogło powodować niespójności w tłumaczeniach produktów, kategorii i innych treści.

## Rozwiązanie
Dodano kompleksową obsługę wielojęzyczności poprzez:

### 1. Language Service (`language.service.ts`)
Centralny serwis zarządzający językiem aplikacji:
- Przechowuje aktualny język w `localStorage`
- Domyślny język: `pl`
- Obsługiwane języki: `pl`, `en`
- Observable do reaktywnego nasłuchiwania zmian języka
- Metody do zmiany i zarządzania językiem

```typescript
// Użycie
constructor(private languageService: LanguageService) {}

// Zmiana języka
this.languageService.setLanguage('en');

// Pobranie aktualnego języka
const currentLang = this.languageService.getCurrentLanguage();

// Nasłuchiwanie zmian
this.languageService.currentLanguage$.subscribe(lang => {
  console.log('Language changed to:', lang);
});
```

### 2. Auth Interceptor - rozszerzony
Zaktualizowano istniejący `AuthInterceptor`, aby automatycznie dodawał nagłówek `Accept-Language` do **wszystkich** żądań HTTP:

```typescript
headers: {
  'Accept-Language': 'pl',  // dynamicznie z LanguageService
  'Authorization': 'Bearer ...'  // jeśli użytkownik zalogowany
}
```

**Zalety tego podejścia:**
- ✅ Jeden punkt konfiguracji dla całej aplikacji
- ✅ Automatyczne dodawanie do wszystkich requestów
- ✅ Brak potrzeby modyfikacji każdego wywołania API
- ✅ Łatwe w utrzymaniu i testowaniu
- ✅ Lazy loading serwisów zapobiega circular dependency

### 3. Language Switcher Component
Komponent UI do przełączania języka:
- ✅ **Dodany do header'a aplikacji**
- Standalone component
- Wizualna indykacja aktualnego języka
- **Automatyczne przeładowanie strony** po zmianie języka
- Wskaźnik ładowania podczas przełączania
- Disabled state podczas zmiany

**Funkcjonalność:**
- Po kliknięciu przycisku języka zmienia się `Accept-Language` header
- Strona automatycznie się przeładowuje (300ms delay dla UX)
- Wszystkie dane z API są pobierane ponownie w nowym języku
- Spinner pokazuje się podczas przeładowania

## Pliki zmodyfikowane

### Nowe pliki:
1. `frontend/src/app/services/language.service.ts` - Serwis języka
2. `frontend/src/app/components/language-switcher/language-switcher.component.ts` - Komponent UI
3. `frontend/LANGUAGE_I18N.md` - Ta dokumentacja

### Zmodyfikowane pliki:
1. `frontend/src/app/interceptors/auth.interceptor.ts` - Dodano obsługę Accept-Language

## Jak działa flow

```
1. Użytkownik otwiera aplikację
   ↓
2. LanguageService inicjalizuje się i pobiera język z localStorage (domyślnie: 'pl')
   ↓
3. Angular wykonuje żądanie HTTP do backendu
   ↓
4. AuthInterceptor przechwytuje request
   ↓
5. Interceptor dodaje nagłówek: Accept-Language: pl
   ↓
6. Backend Django (django-parler) otrzymuje nagłówek
   ↓
7. Backend zwraca treści w odpowiednim języku
   ↓
8. Frontend wyświetla przetłumaczone dane
```

## Backend - django-parler (przypomnienie)

Backend jest już skonfigurowany:

```python
# backend/EStore/settings.py
LANGUAGE_CODE = 'pl'

LANGUAGES = (
    ('pl', 'Polski'),
    ('en', 'English'),
)

PARLER_LANGUAGES = {
    1: (
        {'code': 'pl'},
        {'code': 'en'},
    ),
    'default': {
        'fallback': 'pl',
        'hide_untranslated': False,
    }
}
```

Modele z tłumaczeniami:
- `Product` - name, slug, description
- `Category` - name, slug, description
- `ProductAttribute` - name
- `AttributeValue` - value
- `ProductVariant` - name

## Testowanie

### 1. Sprawdzenie nagłówka w DevTools:
```
1. Otwórz DevTools (F12)
2. Zakładka Network
3. Wykonaj dowolne żądanie do API
4. Sprawdź Request Headers - powinien być: Accept-Language: pl
```

### 2. Zmiana języka programowo (konsola):
```javascript
// W konsoli przeglądarki:
localStorage.setItem('language', 'en');
location.reload();

// Lub przez komponent:
// languageService.setLanguage('en');
```

### 3. Weryfikacja w bazie danych:
```bash
cd backend
python manage.py shell

from products.models import Product
p = Product.objects.first()
p.set_current_language('pl')
print(p.name)  # Polska nazwa
p.set_current_language('en')
print(p.name)  # Angielska nazwa (jeśli dodana)
```

## ✅ Co zostało zaimplementowane

1. ✅ **Language Service** - centralne zarządzanie językiem
2. ✅ **Auth Interceptor** - automatyczne dodawanie `Accept-Language` header
3. ✅ **Language Switcher Component** - przycisk przełączania języka w headerze
4. ✅ **Automatyczne przeładowanie** - strona odświeża się po zmianie języka
5. ✅ **UX improvements** - spinner, disabled state, tooltips

## Następne kroki (opcjonalne)

1. **Dodać tłumaczenia UI (ngx-translate):**
   - Obecnie tylko treści z API są tłumaczone
   - UI (przyciski, etykiety) są twardo zakodowane po polsku
   - Możesz dodać `@ngx-translate/core` dla pełnej wielojęzyczności

3. ~~**Automatyczne przeładowanie danych po zmianie języka**~~ - ✅ **ZAIMPLEMENTOWANE**
   - Strona automatycznie się przeładowuje po zmianie języka
   - Wszystkie komponenty pobierają świeże dane w nowym języku

4. **Dodać tłumaczenia angielskie w Django Admin:**
   - Zaloguj się do /admin/
   - Edytuj produkty/kategorie
   - Dodaj tłumaczenia w zakładkach języków

## Podsumowanie różnic Backend vs Frontend

| Aspekt | Backend (Django) | Frontend (Angular) | Status |
|--------|------------------|-------------------|--------|
| **Model danych** | TranslatableModel z django-parler | TypeScript interfaces | ✅ Kompatybilne |
| **Tłumaczenia** | Pole `translations` w bazie | Otrzymuje z API | ✅ Działa |
| **Nagłówek HTTP** | Oczekuje `Accept-Language` | **Teraz wysyła** przez interceptor | ✅ **NAPRAWIONE** |
| **Domyślny język** | `pl` | `pl` | ✅ Zgodne |
| **Fallback** | `pl` | `pl` | ✅ Zgodne |
| **Serializer** | `translation.get_language()` | Transparentne | ✅ Działa |

## FAQ

**Q: Czy muszę dodawać komponent language-switcher?**  
A: Nie, to opcjonalne. Nagłówek `Accept-Language: pl` jest już zawsze wysyłany.

**Q: Jak dodać nowy język?**  
A: Zaktualizuj `SUPPORTED_LANGUAGES` w `language.service.ts` i `LANGUAGES` w Django settings.

**Q: Czy to wpływa na wydajność?**  
A: Nie, dodanie jednego nagłówka HTTP jest pomijalne. Interceptor działa efektywnie.

**Q: Co jeśli backend nie ma tłumaczenia?**  
A: django-parler używa fallback language ('pl'), więc zawsze coś zwróci.

**Q: Czy trzeba restartować aplikację?**  
A: Nie, zmiana przez `languageService.setLanguage()` działa od razu. Możesz opcjonalnie dodać logikę do odświeżenia danych.
