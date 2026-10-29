# Sklep-Balie (EStore) Constitution

## Core Principles

### I. Rozdzielenie API i klienta (API-First)

- Backend (Django + Django REST Framework) jest jedynym źródłem logiki biznesowej i danych.
  Frontend (Angular) MUSI komunikować się z nim wyłącznie przez REST API pod `/api/v1/`.
- Każdy nowy lub zmieniony endpoint MUSI mieć serializer DRF i być widoczny w dokumentacji
  OpenAPI generowanej przez drf-spectacular.
- Zmiana kontraktu API (pola, kody odpowiedzi, ścieżki) MUSI zostać wprowadzona jednocześnie
  po stronie backendu i frontendu (modele w `frontend/src/app/models`, `api.service.ts`)
  albo zachować kompatybilność wstecz.
- Reguły cen, rabatów, punktów lojalnościowych i stanów magazynowych NIE MOGĄ być
  rozstrzygane po stronie frontendu — klient je jedynie wyświetla.

Uzasadnienie: jedna implementacja reguł biznesowych zapobiega rozjazdom między tym,
co widzi klient, a tym, co zapisuje się w zamówieniu.

### II. Testy są obowiązkowe (NON-NEGOTIABLE)

- Każda funkcjonalność backendu MUSI mieć testy pytest (`pytest-django`) w katalogu
  `tests/` danej aplikacji, korzystające ze wspólnych fixture'ów z `backend/conftest.py`.
- Poprawka błędu MUSI zawierać test, który odtwarza błąd i przechodzi po poprawce.
- Nowe serwisy i komponenty Angulara z logiką (stan, obliczenia, wywołania API) MUSZĄ mieć
  plik `*.spec.ts` (Jasmine/Karma).
- Zmiana NIE MOŻE trafić na `main`, jeśli `pytest` w `backend/` lub `ng test` we
  `frontend/` kończy się błędem.
- Testy NIE MOGĄ wymagać działającej infrastruktury zewnętrznej: używają SQLite
  (`USE_TEST_DB`), a Celery, e-mail i Elasticsearch są mockowane.

Uzasadnienie: sklep obsługuje płatności i zamówienia — regresje są kosztowne, a testy
na izolowanej bazie da się uruchomić na każdym komputerze.

### III. Spójność zamówień i pieniędzy

- Kwoty pieniężne MUSZĄ być przechowywane i liczone jako `Decimal`
  (`DecimalField(max_digits=10, decimal_places=2)`); użycie `float` do cen jest zabronione.
- Operacje zmieniające jednocześnie zamówienie, stan magazynowy, kupony lub punkty
  lojalnościowe MUSZĄ działać w `transaction.atomic()`, a odczyt wariantu do rezerwacji
  stanu MUSI używać `select_for_update()`.
- Cena pozycji zamówienia MUSI zostać zapisana w momencie złożenia zamówienia
  (`OrderItem.price`), niezależnie od późniejszych zmian cennika.
- Efekty uboczne po zapisie (e-maile, faktury PDF, reindeksacja) MUSZĄ być uruchamiane
  przez `transaction.on_commit(...)`, aby nie wykonały się dla wycofanej transakcji.

Uzasadnienie: chroni przed overbookingiem stanów, błędami zaokrągleń i wysyłaniem
potwierdzeń dla zamówień, które nie powstały.

### IV. Bezpieczeństwo i uprawnienia

- Każdy widok API MUSI mieć jawnie określone `permission_classes`; do zapisu danych
  sklepu służą uprawnienia z `EStore/permissions.py` (`IsAdminUser`,
  `IsAdminUserOrReadOnly`, `IsOrderOwnerOrAdmin`) lub ich odpowiedniki w aplikacjach.
- Użytkownik NIE MOŻE odczytać ani zmienić zamówień, zgłoszeń supportu ani danych konta
  innego użytkownika; każde takie ograniczenie MUSI być pokryte testem.
- Uwierzytelnianie odbywa się przez JWT (SimpleJWT); po stronie Angulara dostęp do tras
  chronią guardy, a token dołącza interceptor — guard nie zastępuje kontroli na backendzie.
- Sekrety (klucze, hasła, dane SMTP, dane bazy) MUSZĄ pochodzić z `.env` i NIE MOGĄ być
  commitowane do repozytorium.

Uzasadnienie: dane klientów i zamówień są danymi osobowymi; kontrola dostępu musi być
egzekwowana na serwerze.

### V. Dwujęzyczność i prostota

- Sklep MUSI działać w języku polskim (domyślny) i angielskim. Treści katalogu
  tłumaczone są przez `django-parler` (`TranslatedFields`), a teksty interfejsu przez
  `@ngx-translate` — każdy nowy tekst w UI MUSI mieć klucz w `pl.json` i `en.json`.
- Nowe zadania asynchroniczne i okresowe MUSZĄ być zadaniami Celery (`tasks.py`,
  `CELERY_BEAT_SCHEDULE`), a nie wątkami ani cronem poza Dockerem.
- Nowa zależność lub nowa usługa w `docker-compose.yml` wymaga uzasadnienia w planie
  (`/speckit-plan`); preferowane jest rozwiązanie istniejącymi narzędziami (YAGNI).

Uzasadnienie: obecny stos jest już rozbudowany (Postgres, Redis, Elasticsearch, Celery,
MailHog); każda kolejna część zwiększa koszt utrzymania projektu.

## Stos technologiczny i ograniczenia

- Backend: Python, Django 5.2, Django REST Framework, SimpleJWT, django-allauth/dj-rest-auth,
  django-filter, django-parler, drf-spectacular, Celery + Redis, WeasyPrint (faktury PDF).
- Wyszukiwanie: Elasticsearch 8 przez `django-elasticsearch-dsl` (synonimy w
  `backend/elasticsearch/config/synonyms.txt`).
- Baza danych: PostgreSQL 15; w testach SQLite. Zmiany schematu WYŁĄCZNIE przez migracje
  Django commitowane razem z modelem.
- Frontend: Angular 18 z komponentami standalone, Tailwind CSS, Chart.js (panel admina),
  RxJS. Struktura: `components/`, `pages/`, `services/`, `guards/`, `interceptors/`,
  `models/`, `resolvers/`.
- Środowisko uruchomieniowe: `docker-compose.yml` jest referencyjnym sposobem
  uruchomienia całego systemu; e-maile w środowisku deweloperskim trafiają do MailHog.
- Zależności backendu są przypięte do dokładnych wersji w `backend/requirements.txt`.

## Proces wytwórczy i bramki jakości

- Nowe funkcjonalności powstają według Spec Kit: `/speckit-specify` → `/speckit-plan` →
  `/speckit-tasks` → `/speckit-implement`. Plan MUSI zawierać sekcję „Constitution Check”
  potwierdzającą zgodność z zasadami I–V.
- Praca odbywa się na osobnych gałęziach i trafia na `main` przez pull request.
- Przed scaleniem: testy backendu i frontendu przechodzą, migracje są wygenerowane
  (`makemigrations --check` bez zmian), a nowe teksty UI mają tłumaczenia PL i EN.
- Skrypty jednorazowe (seedy, diagnostyka) należy umieszczać jako komendy zarządzania
  (`management/commands/`), a nie luźne pliki w katalogu `backend/`.

## Governance

- Konstytucja ma pierwszeństwo przed innymi praktykami w repozytorium. W przypadku
  konfliktu obowiązuje konstytucja, a plan lub kod należy dostosować.
- Zmiana konstytucji wymaga pull requesta z opisem zmiany i jej wpływu na istniejące
  specyfikacje, plany i kod; zmianę wprowadza się przez `/speckit-constitution`.
- Wersjonowanie semantyczne: MAJOR — usunięcie lub przedefiniowanie zasady; MINOR —
  nowa zasada lub sekcja albo istotne rozszerzenie; PATCH — doprecyzowania i redakcja.
- Każdy przegląd PR MUSI sprawdzić zgodność z zasadami; odstępstwo jest dopuszczalne
  tylko z uzasadnieniem w sekcji „Complexity Tracking” planu.

**Version**: 1.0.0 | **Ratified**: 2026-10-29 | **Last Amended**: 2026-10-29
