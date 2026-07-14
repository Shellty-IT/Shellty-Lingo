# Shellty Lingo — kontekst techniczny dla programisty

## 1. Przeznaczenie dokumentu

`CLOUDE.md` jest głównym technicznym punktem wejścia do projektu. Ma umożliwić programiście lub agentowi programistycznemu zrozumienie produktu, granic MVP, architektury, konwencji i kryteriów jakości bez ponownego analizowania materiałów źródłowych.

Dokument opisuje stan docelowy. Repozytorium startuje jako pusty folder, dlatego konkretne komendy i nazwy usług należy aktualizować wraz z bootstrapem projektu. Jeśli kod, migracje lub zatwierdzony ADR są sprzeczne z tym dokumentem, obowiązuje kolejność:

1. wymagania prawne i bezpieczeństwa;
2. zaakceptowany ADR lub decyzja właściciela produktu;
3. działający kontrakt API i migracje bazy;
4. ten dokument;
5. komentarze i nieaktualne notatki.

Nie zmieniaj istotnej decyzji architektonicznej „przy okazji”. Dodaj ADR, opisz wpływ i uzyskaj akceptację.

## 2. Repozytorium i produkt

- Nazwa produktu: **Shellty Lingo**.
- Repozytorium docelowe: <https://github.com/Shellty-IT/Shellty-Lingo.git>.
- Typ produktu: aplikacja mobilna do nauki języków z backendem i panelem administracyjnym.
- Grupa docelowa: osoby dorosłe 18–65 lat, od początkujących do zaawansowanych.
- Języki nauki w MVP: `en`, `th`.
- Języki interfejsu w MVP: `pl`, `en`, `th`.
- Język interfejsu, język wyjaśnień i język nauki są niezależnymi ustawieniami.
- Postęp, poziom, błędy, historia i plan są rozdzielone per kurs użytkownika.
- Szczegółowy harmonogram i bramy jakości: [`PLAN_BUDOWY.md`](./PLAN_BUDOWY.md).

## 3. Najważniejsze reguły domenowe

1. `User` reprezentuje konto, a `UserCourse` uczestnictwo w konkretnym kursie i jego ustawienia. Nie zapisuj postępu EN/TH bezpośrednio na użytkowniku.
2. Treści kursowe przechodzą przez `draft → review → published → archived`; tylko `published` trafia do ucznia.
3. Opublikowana treść jest wersjonowana. Zmiana nie może po cichu zmienić historycznego wyniku ćwiczenia.
4. Próby i zdarzenia postępu są append-only tam, gdzie wymaga tego audyt; agregaty można przebudować.
5. Zapis wyniku sesji musi być idempotentny — retry mobilny nie może naliczyć lekcji, XP lub powtórki dwa razy.
6. Harmonogram powtórek liczy się w strefie czasowej użytkownika, przechowywanej jako identyfikator IANA; znaczniki czasu przechowujemy w UTC.
7. Plan nauki ma deterministyczny fallback. Awaria AI nie może blokować lekcji ani powtórek.
8. Nie publikujemy automatycznie materiału wygenerowanego przez AI. Wymagany jest workflow przeglądu.
9. Ocena tonów tajskich w MVP jest ćwiczeniem wspierającym, nie obiektywnym certyfikatem wymowy.
10. Funkcje premium i limity są egzekwowane w API. Ukrycie przycisku w aplikacji nie jest kontrolą uprawnień.

## 4. Zakres funkcjonalny MVP

### Konto i profil

- rejestracja e-mail, weryfikacja, logowanie i reset hasła;
- bezpieczne sesje, wylogowanie i unieważnianie tokenów;
- onboarding, preferencje językowe, cel, czas i przypomnienia;
- zgody, eksport danych i usunięcie konta;
- role: `learner`, `editor`, `admin` (opcjonalnie później `support`).

### Nauka

- test poziomujący osobno dla EN i TH;
- kursy, moduły, lekcje, słownictwo, gramatyka i audio;
- typy ćwiczeń: single/multiple choice, matching, gap fill, typed answer, ordering, listening;
- system spaced repetition, trudne/zapisane słowa i historia błędów;
- podstawowy plan dzienny i panel postępów;
- alfabet i tony tajskie, transliteracja, formy grzecznościowe i kontekst kulturowy.

### AI

- rozmowy tekstowe w scenariuszach;
- poziom, rola, długość i tryb korekty jako parametry serwerowe;
- tryby: natychmiastowy, tylko poważne błędy, podsumowanie na końcu, bez korekty;
- ustrukturyzowane podsumowanie rozmowy i rekomendacje;
- limity, moderacja, walidacja, ewaluacje, zgłaszanie odpowiedzi i koszt.

### Operacje

- panel administracyjny treści, tłumaczeń, plików, zgłoszeń AI i użytkowników;
- push reminders, analityka, monitoring i audit log;
- freemium i podstawowe subskrypcje przed publicznym wydaniem płatnym.

Poza MVP są m.in. rozmowy głosowe realtime, zaawansowana fonetyka, offline, społeczność i certyfikaty.

## 5. Zalecana architektura

```text
Expo mobile ───────┐
                   ├── HTTPS ──> NestJS REST API ──> PostgreSQL
Next.js admin ─────┘                   │       ├────> S3-compatible storage
                                      │       ├────> e-mail / push / billing
                                      │       └────> queue/cache (gdy potrzebne)
                                      └────────────> AI provider adapters
```

- Klient nie posiada sekretów serwerowych i nie wywołuje AI bezpośrednio.
- API jest jedyną warstwą autoryzacji, limitów, audytu i logiki domenowej.
- PostgreSQL jest źródłem prawdy. JSONB stosujemy dla wersjonowanych wyników AI lub rzadkich rozszerzeń, nie jako zamiennik modelu relacyjnego.
- Pliki trafiają do magazynu S3 przez krótko ważne podpisane URL; baza przechowuje klucz obiektu i metadane, nie trwały publiczny URL.
- Redis/BullMQ dodajemy dopiero dla zadań asynchronicznych, które faktycznie tego wymagają: eksport, usunięcie, e-mail, push, przetwarzanie audio, ciężkie analizy AI.
- Integracje zewnętrzne są ukryte za portami/adapters i mają timeout, ograniczony retry, monitoring oraz możliwość wyłączenia.

## 6. Stos technologiczny

### Wymagany

- TypeScript w trybie strict;
- mobile: React Native + Expo + Expo Router;
- API: Node.js + NestJS + REST;
- baza: PostgreSQL + Prisma;
- admin: Next.js + React + TypeScript;
- dane serwerowe klienta: TanStack Query;
- stan lokalny aplikacji: Zustand, tylko gdy nie jest to stan serwerowy lub formularza;
- formularze: React Hook Form + Zod;
- lokalizacja: i18next/react-i18next + Expo Localization;
- sekrety mobilne: Expo SecureStore;
- testy mobilne: Jest + React Native Testing Library;
- build mobilny: Expo EAS;
- multimedia: magazyn zgodny z S3.

### Decyzje startowe do zatwierdzenia w ADR

- package manager i narzędzie monorepo (rekomendacja: `pnpm` workspaces; Turborepo tylko jeśli daje realną wartość);
- dostawcy hostingu, AI, e-mail, analityki, monitoringu, push i płatności;
- biblioteka E2E mobilnego oraz sposób uruchamiania PostgreSQL lokalnie;
- algorytm spaced repetition i wersjonowanie jego parametrów;
- minimalnie wspierane wersje Android/iOS;
- progi jakości AI, SLO i budżety kosztowe.

Nie przypinaj w tym dokumencie numerów wersji. Źródłem prawdy będą lockfile, `package.json` i obrazy CI.

## 7. Docelowa struktura monorepo

```text
apps/
  mobile/                 # Expo/React Native
  api/                    # NestJS
  admin/                  # Next.js
packages/
  api-contracts/          # schematy DTO i typy generowane/udostępniane klientom
  config/                 # współdzielone eslint/tsconfig/test config
  domain/                 # czyste typy i logika bez frameworków, jeśli współdzielenie jest zasadne
  i18n/                   # klucze/typy lokalizacji; teksty admin i mobile mogą pozostać osobne
  ui/                     # tylko rzeczywiście współdzielone tokeny/komponenty
prisma/
  schema.prisma
  migrations/
  seed/
docs/
  adr/
  api/
  runbooks/
.github/workflows/
PLAN_BUDOWY.md
CLOUDE.md
README.md
.env.example
```

Nie twórz pakietu współdzielonego dla pojedynczej funkcji. Kod zależny od React Native nie może przeciekać do admina lub API.

## 8. Uruchamianie projektu

Po bootstrapie README i skrypty głównego `package.json` muszą zapewniać jeden spójny interfejs. Docelowe nazwy:

```bash
pnpm install
pnpm dev                 # uruchamia potrzebne aplikacje w trybie developerskim
pnpm dev:mobile
pnpm dev:api
pnpm dev:admin
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm db:up               # lokalne zależności
pnpm db:migrate
pnpm db:seed
pnpm db:studio
```

Wymagania dla skryptów:

- mają działać z katalogu głównego;
- CI używa tych samych poleceń co lokalny developer;
- migracje produkcyjne są nieinteraktywne i nigdy nie używają `db push`;
- seed development jest deterministyczny i nie zawiera danych produkcyjnych;
- README podaje wymagane wersje Node/package managera oraz konfigurację emulatorów.

## 9. Konfiguracja i sekrety

Każda aplikacja waliduje konfigurację przy starcie. `.env.example` zawiera nazwy i bezpieczne przykłady, nigdy prawdziwe sekrety.

Przewidywane grupy zmiennych (ostateczne nazwy ustala implementacja):

```dotenv
NODE_ENV=development
APP_ENV=development
API_PORT=3000
PUBLIC_API_URL=http://localhost:3000

DATABASE_URL=postgresql://...
REDIS_URL=redis://...

AUTH_ACCESS_TOKEN_SECRET=replace_me
AUTH_REFRESH_TOKEN_SECRET=replace_me
AUTH_ACCESS_TOKEN_TTL=...
AUTH_REFRESH_TOKEN_TTL=...

S3_ENDPOINT=...
S3_REGION=...
S3_BUCKET=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...

AI_PROVIDER=...
AI_API_KEY=...
AI_MODEL_CHAT=...
AI_MODEL_EVALUATION=...
AI_DAILY_BUDGET=...

EMAIL_PROVIDER=...
EMAIL_API_KEY=...
PUSH_PROJECT_ID=...

ERROR_REPORTING_DSN=...
ANALYTICS_WRITE_KEY=...
```

Zasady:

- zmienne publiczne są jawnie oznaczone zgodnie z wymaganiami Expo/Next.js;
- wszystko w bundle mobilnym lub webowym jest publiczne, niezależnie od nazwy;
- sekrety znajdują się w managerze sekretów danego środowiska;
- development/staging/production mają osobne konta, bazy, buckety, klucze i identyfikatory aplikacji;
- rotacja sekretów nie wymaga wydania nowej aplikacji mobilnej;
- logi i komunikaty błędów nie ujawniają sekretów ani pełnych tokenów.

## 10. API i kontrakty

- REST pod prefiksem `/v1`; niekompatybilne zmiany wymagają nowej wersji lub okresu migracji.
- OpenAPI generowane z API i publikowane jako artefakt CI.
- DTO wejściowe walidowane; nie przekazujemy modeli Prisma bezpośrednio przez API.
- Daty w ISO 8601 UTC, identyfikatory nieprzewidywalne (UUID/CUID), języki jako BCP 47.
- Paginacja kursorowa dla historii i dużych kolekcji.
- Standardowy błąd zawiera stabilny `code`, bezpieczny `message`, opcjonalne `details` i `correlationId`.
- Operacje zapisu wyników, płatności, webhooków i zadań eksportu używają klucza idempotencji.
- Uprawnienia są sprawdzane na poziomie zasobu; ID w URL nie jest dowodem dostępu.
- Klient generowany lub typowany na podstawie jednego kontraktu, bez ręcznego duplikowania interfejsów.

Przykład błędu:

```json
{
  "error": {
    "code": "AI_DAILY_LIMIT_REACHED",
    "message": "Daily conversation limit reached.",
    "correlationId": "..."
  }
}
```

Komunikat API nie musi być tekstem końcowym UI; aplikacja mapuje stabilny kod na PL/EN/TH.

## 11. Model danych — rdzeń

Minimalne obszary encji:

### Tożsamość

- `User`, `UserProfile`, `Session`/`RefreshToken`, `Consent`, `UserRole`;
- `DataExportRequest`, `AccountDeletionRequest`, `AuditLog`.

### Kurs i treść

- `Language`, `Course`, `CourseVersion`, `Module`, `Lesson`, `Exercise`;
- `VocabularyItem`, `GrammarTopic`, `MediaAsset`, `Translation`;
- `ThaiCharacter`, `ThaiTone`, `ThaiReadingRule`;
- status publikacji, autor, recenzent i znaczniki wersji.

### Nauka

- `UserCourse`, `PlacementTest`, `TestAttempt`, `ExerciseAttempt`;
- `VocabularyProgress`, `ReviewSchedule`, `SkillProgress`;
- `LearningPlan`, `LearningPlanItem`, `LearningSession`, `Streak`;
- `LearnerError` ze znormalizowanym typem i źródłem.

### AI

- `Conversation`, `ConversationMessage`, `ConversationSummary`;
- `AiRequestUsage`, `PromptVersion`, `AiEvaluation`, `AiFeedbackReport`.

### Operacje

- `NotificationPreference`, `NotificationDelivery`;
- `Subscription`, `Entitlement`, `BillingEvent`;
- `FeatureFlag` lub integracja z zewnętrznym systemem flag.

Przed pierwszą migracją przygotuj diagram ER i sprawdź: relacje usuwania, unikalności, indeksy dla zapytań użytkownika, politykę retencji, wersjonowanie treści i możliwość odbudowy agregatów.

## 12. Uwierzytelnianie i autoryzacja

- hasła hashowane nowoczesnym, konfigurowalnym algorytmem (preferowany Argon2id) z odpowiednimi parametrami;
- krótki access token i rotowany refresh token; refresh token zapisany jako hash;
- wykrycie ponownego użycia starego refresh tokenu unieważnia rodzinę tokenów;
- token mobilny w SecureStore, nie w zwykłym AsyncStorage;
- weryfikacja e-mail i reset hasła używają jednorazowych, krótko ważnych tokenów;
- komunikaty logowania/resetu nie ujawniają, czy konto istnieje;
- RBAC dla panelu, dodatkowo autoryzacja konkretnego zasobu;
- operacje administracyjne i dostęp do danych użytkownika trafiają do audit logu;
- rate limiting per IP/użytkownik/operacja oraz ochrona przed credential stuffing;
- social login dopiero po MVP, ale model `Identity` może przewidzieć wielu dostawców.

## 13. Warstwa AI

### Interfejs dostawcy

Kod domenowy wywołuje własne porty, np. `ConversationAi`, `ErrorAnalysisAi`, `RecommendationAi`, a nie SDK dostawcy. Adapter odpowiada za uwierzytelnienie, mapowanie modelu, timeout, retry i metryki.

### Dane wejściowe

Przekazuj wyłącznie potrzebny kontekst:

- język nauki i wyjaśnień;
- poziom i cel ćwiczenia;
- scenariusz, rola, tryb korekty i limit długości;
- istotne ostatnie błędy oraz ustawienia tajskiego;
- dozwolony fragment historii rozmowy.

Nie wysyłaj e-maila, danych płatniczych, tokenów ani niepotrzebnych identyfikatorów.

### Dane wyjściowe

- preferuj wynik według wersjonowanego schematu JSON/Zod;
- oddziel tekst rozmowy od metadanych korekty;
- odrzuć/napraw ograniczoną liczbę razy odpowiedź niezgodną ze schematem;
- nie wykonuj instrukcji, URL-i ani kodu zwróconego przez model;
- przechowuj wersję promptu, model, czas, status, jednostki użycia i koszt szacowany;
- odpowiedź widoczna użytkownikowi ma możliwość zgłoszenia.

### Bezpieczeństwo i koszt

- limity wejścia, historii, tur, czasu i budżetu na plan użytkownika;
- moderacja wejścia i wyjścia, ze ścieżką bezpiecznej odmowy;
- timeout, ograniczony retry z jitterem, circuit breaker i fallback;
- żadnego nieograniczonego wywołania AI z pętli lub kolejki;
- feature flag/kill switch per funkcja i dostawca;
- alerty kosztowe oraz dashboard kosztu per funkcja, użytkownik i środowisko;
- cache wyłącznie dla treści niepersonalnych, gdy nie narusza prywatności i jakości.

### Ewaluacja

Każda zmiana promptu/modelu przechodzi wersjonowany zestaw przypadków dla EN i TH. Oceniamy poprawność, naturalność, poziom trudności, jakość korekty, formy grzecznościowe, stabilność schematu, bezpieczeństwo i koszt. Tajski wymaga okresowego przeglądu native speakera. Nie wdrażaj zmiany tylko na podstawie kilku ręcznych przykładów.

## 14. Silnik nauki i spaced repetition

- algorytm musi być deterministyczny, wersjonowany i pokryty testami;
- próba zapisuje pytanie/wersję treści, odpowiedź, ocenę, czas i źródło;
- harmonogram zawiera co najmniej `dueAt`, `interval`, `ease/difficulty`, `lastResult`, `algorithmVersion`;
- zmiana algorytmu nie może bez migracji interpretować starych pól inaczej;
- ocena odpowiedzi tekstowej normalizuje Unicode i białe znaki świadomie dla danego języka;
- nie stosuj angielskich reguł tokenizacji do tajskiego;
- wynik AI może dostarczać wskazówkę, ale podstawowe zaliczenie ćwiczeń MVP powinno być powtarzalne i audytowalne;
- postęp kursu liczymy z wersjonowanych wymagań, a nie wyłącznie z liczby kliknięć.

## 15. Lokalizacja i język tajski

- żadnych tekstów UI wpisanych na stałe w komponentach;
- stabilne, semantyczne klucze tłumaczeń i kontrola brakujących kluczy w CI;
- fallback języka jest jawny i monitorowany; w produkcji nie pokazujemy surowego klucza;
- formaty dat, godzin, liczb i liczby mnogiej korzystają z API `Intl`;
- wszystkie trzy lokalizacje testujemy z długim tekstem oraz dużą czcionką;
- język tajski wymaga poprawnej normalizacji Unicode, fontów z pełnym pokryciem, testów diakrytyków i łamania linii;
- transliteracja jest metadanym dydaktycznym, nie zamiennikiem poprawnego zapisu tajskiego;
- ustawienia pisma/transliteracji/tonów należą do `UserCourse` dla tajskiego;
- copy i treść tajska przed publikacją wymagają weryfikacji eksperta.

## 16. Aplikacja mobilna

- Expo Router zarządza trasami; wymagania auth/onboarding są egzekwowane w jednym miejscu;
- TanStack Query jest źródłem prawdy dla danych API; nie kopiuj odpowiedzi do Zustand bez potrzeby;
- Zustand służy do krótkotrwałego stanu UI/sesji, nie do trwałej kopii całego backendu;
- formularze używają wspólnych schematów Zod, ale komunikaty błędów są lokalizowane;
- SecureStore przechowuje tokeny; dane wrażliwe nie trafiają do logów, cache diagnostycznego lub analityki;
- obsłuż jawnie: brak sieci, wolną sieć, retry, anulowanie, odświeżenie tokenu i konflikt sesji;
- zapis prób ma lokalny identyfikator idempotencji i bezpieczne ponowienie;
- uprawnienia push/mikrofonu są proszone „just in time” z wyjaśnieniem; mikrofon dopiero dla funkcji audio;
- każdy ekran ma stany loading/empty/error/content i dostępne etykiety;
- funkcje niedostępne dla planu nie mogą udawać błędu technicznego.

## 17. Panel administracyjny i treść

- panel jest osobną aplikacją i korzysta z tego samego API/RBAC;
- role rozdzielają tworzenie, recenzję, publikację i administrację użytkownikami;
- publikacja wymaga walidacji schematu, tłumaczeń, audio, poziomu i recenzenta;
- podgląd pokazuje treść tak, jak mobilny renderer dla PL/EN/TH;
- import jest walidowany, raportuje błędy wierszy i nie publikuje częściowo uszkodzonej paczki;
- usunięcie opublikowanej wersji preferuje archiwizację, aby zachować historię prób;
- wszystkie operacje uprzywilejowane mają autora, czas, zakres zmiany i correlation ID;
- zgłoszenia AI pokazują potrzebny kontekst, ale respektują zasady dostępu i retencji.

## 18. Prywatność i GDPR

Projektuj privacy-by-default:

- zbieraj wyłącznie dane potrzebne do funkcji i mierników;
- dokumentuj cel, podstawę prawną, retencję i odbiorców każdej kategorii danych;
- zgody są granularne, wersjonowane, możliwe do cofnięcia i nie są domyślnie zaznaczone;
- eksport generowany asynchronicznie, szyfrowany w tranzycie i dostępny krótko przez podpisany URL;
- usunięcie konta obejmuje bazę, pliki, system analityczny i dostawców zgodnie z polityką; wyjątki prawne są dokumentowane;
- conversation content i przyszłe nagrania mają osobną, możliwie krótką retencję;
- logi/analytics nie zawierają treści rozmów, nagrań, haseł, tokenów ani pełnego PII;
- środowiska nieprodukcyjne nie używają skopiowanych danych produkcyjnych;
- dostęp support/admin do danych jest minimalny, audytowany i ograniczony czasowo;
- przed uruchomieniem audio/realtime voice ponów DPIA i zaktualizuj zgodę.

## 19. Dostępność i UX

Minimalny standard projektowy: WCAG 2.2 AA tam, gdzie ma zastosowanie do aplikacji mobilnej.

- poprawny kontrast, focus order, etykiety czytników i role kontrolek;
- cele dotykowe co najmniej zgodne z wytycznymi platform;
- Dynamic Type/powiększenie tekstu bez ucinania kluczowych informacji;
- redukcja ruchu i brak informacji przekazywanej wyłącznie kolorem;
- napisy/transkrypcje dla materiałów audio i kontrola prędkości, gdy zostaną wdrożone;
- zrozumiałe komunikaty błędu wskazujące sposób naprawy;
- testy VoiceOver i TalkBack dla kluczowych przepływów;
- brak wymuszonych krótkich limitów czasu w ćwiczeniach bez możliwości dostosowania.

## 20. Testowanie

### Piramida testów

- jednostkowe: logika domenowa, SRS, uprawnienia, walidacja i mapowania;
- integracyjne: repozytoria z PostgreSQL, moduły NestJS, storage i adaptery przez stuby;
- kontraktowe: OpenAPI, adapter AI, webhooki płatności/e-mail/push;
- komponentowe: ekrany i formularze mobilne/admin;
- E2E: najważniejsze piony na stagingu, z kontrolowanymi usługami zewnętrznymi;
- eksploracyjne: urządzenia fizyczne, słaba sieć, uprawnienia, PL/EN/TH i dostępność.

### Obowiązkowe przypadki regresji

- rejestracja, weryfikacja, reset, rotacja tokenu i wylogowanie;
- onboarding oraz przełączanie kursu/języka UI bez utraty danych;
- test → plan → lekcja → retry zapisu → powtórka → progres;
- przerwanie połączenia podczas rozmowy AI i bezpieczne wznowienie/zakończenie;
- niepoprawna/moderowana odpowiedź AI oraz osiągnięcie limitu;
- eksport i usunięcie konta;
- publikacja/rollback treści i autoryzacja admina;
- strefy czasowe, zmiana czasu letniego i quiet hours;
- zakupy: duplikat webhooka, refund, wygaśnięcie i restore.

Test nie może wywoływać płatnej usługi AI bez jawnego oznaczenia. CI używa stubów/recorded fixtures; okresowe ewaluacje online mają osobny budżet i raport.

## 21. CI/CD i środowiska

### Pull request

Wymagane: instalacja z zamrożonego lockfile, format/lint, typecheck, testy, build, kontrola migracji, skan sekretów/zależności i walidacja i18n. Zmieniony kontrakt powinien pokazać diff OpenAPI/migracji.

### Środowiska

- `development`: lokalne/stabilne dane testowe, stuby integracji;
- `staging`: konfiguracja zbliżona do produkcji, osobne konta sandbox i anonimowe dane;
- `production`: najmniejsze uprawnienia, kontrolowane migracje, approval i możliwość rollbacku.

### Wdrożenie

- backend/admin jako niezmienne artefakty; ten sam artefakt jest promowany między środowiskami;
- migracja wykonuje się przed uruchomieniem kodu wymagającego nowego schematu i jest kompatybilna z rolloutem;
- EAS profile osobne dla development/preview/production;
- feature flags oddzielają deployment od release;
- release notes, numer wersji, source maps i commit SHA są możliwe do odnalezienia;
- publiczne wydanie etapowe z obserwacją metryk i udokumentowanym rollbackiem.

## 22. Obserwowalność i operacje

Każde żądanie posiada correlation ID przechodzący przez API, kolejkę i integracje. Logi są strukturalne i zredagowane.

Monitoruj co najmniej:

- dostępność, p50/p95/p99 czasu odpowiedzi, 4xx/5xx i wykorzystanie zasobów;
- błędy/crashe mobilne powiązane z wersją i platformą;
- połączenia bazy, wolne zapytania, błędy migracji, rozmiar i backup;
- kolejki: lag, retry, dead letter i czas zadania;
- AI: timeout, status, walidacja schematu, moderacja, jednostki użycia i koszt;
- dostarczanie e-mail/push i webhooki płatności;
- metryki produktu bez wrażliwej treści.

Runbooki w `docs/runbooks/` powinny obejmować: awarię API/bazy, wzrost kosztu AI, kompromitację klucza, problemy z płatnościami, wycofanie buildu, restore backupu i obsługę incydentu danych.

## 23. Bezpieczeństwo aplikacyjne

- TLS wszędzie; bezpieczne nagłówki dla admina i poprawna konfiguracja CORS;
- parametryzowane zapytania przez ORM, walidacja plików i limity payloadu;
- ochrona przed IDOR/BOLA, brute force, CSRF dla sesji webowej i XSS w treści admin/AI;
- treść Markdown/HTML z AI lub CMS jest sanitizowana albo renderowana jako tekst;
- podpisane URL mają krótki TTL, ograniczony typ/rozmiar i klucz generowany przez serwer;
- zależności są regularnie skanowane, ale aktualizacje nadal przechodzą testy;
- brak szczegółowych stack trace w odpowiedzi produkcyjnej;
- konta i usługi mają least privilege, osobne role oraz udokumentowaną rotację;
- webhooki weryfikują podpis i chronią przed replay;
- przed betą wykonaj threat model i przegląd OWASP MASVS/ASVS adekwatny do zakresu.

## 24. Git i standard pracy

- domyślna gałąź: `main`, zawsze wdrażalna;
- krótkie gałęzie funkcjonalne i pull request z powiązanym zadaniem;
- conventional commits są zalecane, jeśli zostaną włączone konsekwentnie;
- PR opisuje: problem, rozwiązanie, wpływ na dane/API, sposób testu, screenshoty UI i ryzyko rollbacku;
- zmiana schematu zawiera migrację i plan kompatybilności;
- zmiana widocznego tekstu zawiera PL/EN/TH albo jawnie blokuje publikację;
- zmiana AI zawiera prompt/schema version i wynik ewaluacji;
- nie zatwierdzamy `.env`, kluczy, dumpów bazy, danych użytkowników ani nagrań;
- nie obchodzimy CI przez osłabienie reguły bez ADR/uzasadnienia.

## 25. Definition of Done

Zadanie jest ukończone, gdy stosownie do zakresu:

- spełnia kryteria akceptacji i nie rozszerza niejawnie MVP;
- zawiera typy, walidację, autoryzację i obsługę błędów;
- ma testy na poziomie odpowiadającym ryzyku;
- działa w PL/EN/TH i uwzględnia dostępność;
- nie ujawnia PII/sekretów i respektuje retencję;
- dodaje potrzebne logi, metryki i zdarzenia analityczne;
- aktualizuje OpenAPI, migracje, seed, `.env.example`, README/ADR/runbook;
- przechodzi lint, typecheck, testy i build;
- zostało sprawdzone na właściwym środowisku/urządzeniu;
- ma opisany rollout i rollback dla zmiany wysokiego ryzyka.

## 26. Zakazane skróty

- bezpośredni klucz AI/S3/admin w aplikacji mobilnej;
- przechowywanie tokenów w AsyncStorage;
- logowanie haseł, tokenów, pełnych promptów z PII lub treści nagrań;
- `prisma db push` na staging/production;
- ręczne poprawianie bazy produkcyjnej bez migracji i audytu;
- używanie modelu Prisma jako publicznego DTO;
- zaufanie do odpowiedzi AI bez walidacji/moderacji;
- publikacja treści językowej bez recenzji;
- wspólny bucket/baza/sekret dla development i production;
- egzekwowanie limitu premium wyłącznie w UI;
- używanie danych produkcyjnych w testach;
- obietnica dokładnej oceny tonów tajskich bez potwierdzonej walidacji.

## 27. Otwarte decyzje przed implementacją produkcyjną

Należy zapisać je jako ADR lub decyzje produktowe:

1. zakres treści startowej per język/poziom i właściciele recenzji;
2. algorytm SRS i sposób kalibracji testu poziomującego TH;
3. dostawcy chmury, AI, e-mail, analityki, monitoringu i płatności;
4. model subskrypcji i limity darmowe/premium;
5. okresy retencji rozmów, promptów, logów, eksportów i przyszłych nagrań;
6. SLO, RPO/RTO, budżet AI i progi alertów;
7. minimalne wersje systemów i macierz urządzeń;
8. dokładny model zgód i dokumenty prawne dla rynków docelowych;
9. progi automatycznych i eksperckich ewaluacji AI;
10. czy płatności wchodzą do zamkniętej bety, czy dopiero do publicznego MVP.

Do czasu decyzji implementuj interfejsy i konfigurację umożliwiające zmianę dostawcy, ale nie buduj wielodostawczej abstrakcji wykraczającej poza faktyczną potrzebę.

## 28. Checklista pierwszego bootstrapu

- [ ] zainicjalizować repozytorium i podłączyć właściwy remote;
- [ ] zatwierdzić package manager, wersję Node i strukturę monorepo;
- [ ] utworzyć `apps/mobile`, `apps/api`, `apps/admin` i minimalne pakiety;
- [ ] dodać strict TypeScript, lint, format, test i build;
- [ ] dodać PostgreSQL, Prisma, pierwszą migrację i seed;
- [ ] dodać health/readiness endpoint i correlation ID;
- [ ] skonfigurować PL/EN/TH oraz test brakujących kluczy;
- [ ] dodać `.env.example` i walidację konfiguracji;
- [ ] dodać GitHub Actions dla pull requestów;
- [ ] utworzyć development/staging i pierwszy wdrażalny pion;
- [ ] dodać README z uruchomieniem od zera;
- [ ] zapisać pierwsze ADR-y i właścicieli otwartych decyzji.
