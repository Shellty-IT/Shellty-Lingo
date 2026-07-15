# Audyt projektu Shellty Lingo

**Data audytu:** 2026-07-15  
**Punkt odniesienia:** gałąź `main`, commit `d1c1b0e`  
**Dokumenty normatywne:** `PLAN_BUDOWY.md`, `CLOUDE.md`  
**Werdykt:** projekt nie został wykonany w całości zgodnie z planem i nie jest ukończonym MVP ani kandydatem do zamkniętej bety. Jest rozbudowanym prototypem integracyjnym, który realizuje istotną część pionów technicznych etapów 2–13, ale nie zamyka ich bram jakości.

## 1. Odpowiedzi na pytania audytu

### 1.1. Czy projekt wykonano zgodnie z planem budowy?

Nie w pełni. Architektura monorepo, główne modele domenowe, podstawowe przepływy konta i nauki, wersjonowanie treści, deterministyczny SRS, panel postępów oraz część mechanizmów operacyjnych są zgodne z kierunkiem planu. Implementacja powstała jednak szeroko i przekrojowo, zanim formalnie zamknięto etapy 0–1 oraz bramy etapów wcześniejszych. W efekcie repozytorium zawiera fragmenty aż do etapu 13, ale nie ma kompletnego, produkcyjnego pionu MVP.

Żadne z 12 łącznych kryteriów ukończenia MVP z sekcji 7 planu nie ma pełnego dowodu end-to-end. Najbliżej ukończenia jest rozdzielenie postępu EN/TH i techniczny rdzeń nauki, lecz nadal nie przeszły pełnej macierzy urządzeń i akceptacji treści.

### 1.2. Jakie problemy znaleziono?

Najważniejsze problemy początkowe obejmowały:

- konfigurację produkcyjną dopuszczającą wartości przykładowe sekretów i tryb billing sandbox;
- niewystarczająco rygorystyczną weryfikację JWT i nieatomową rotację refresh tokenów;
- brak jednolitego, bezpiecznego kontraktu błędów API;
- możliwość zmiany treści lekcji w trakcie aktywnej sesji oraz wyścigi przy zapisie postępu;
- niepełną semantykę idempotencji prób, rozmów, odsłuchu i powtórek;
- możliwość zapisania do SRS danych słownikowych dostarczonych przez klienta bez ponownej weryfikacji serwerowej;
- niepoprawny workflow publikacji i rollbacku w przypadkach brzegowych;
- panel administracyjny oparty na fikcyjnych danych, bez realnego logowania i operacji API;
- błędy sesji mobilnej, retry żądań 4xx, niepełne stany ładowania oraz niespójne teksty lokalizowane;
- CI nieuruchamiające testów E2E z rzeczywistym PostgreSQL;
- dokumentację zawyżającą gotowość etapów 3, 4, 6, 7, 9, 10 i 12;
- niespełnioną kontrolę formatowania w 51 plikach już przed zmianami audytowymi.

Problemy możliwe do bezpiecznego rozwiązania w kodzie zostały naprawione. Braki zależne od dostawców, kont sklepowych, ekspertów, prawników, prawdziwych użytkowników lub infrastruktury zewnętrznej pozostają jawnie opisane w sekcji 6.

### 1.3. Jakie poprawki stylistyczne i UX/UI wniesiono?

- zastąpiono statyczny panel administracyjny rzeczywistym, responsywnym Content Operations;
- dodano logowanie, stan ładowania, komunikaty błędów z correlation ID, stan niedostępnego API, wylogowanie oraz czytelne role;
- dodano realne metryki workspace, listę kursów, kolejkę rewizji i operacje submit/approve/return/publish;
- poprawiono hierarchię wizualną, kontrast, focus ring, minimalne cele dotykowe, układ na małych ekranach i `prefers-reduced-motion`;
- mobilny ekran startowy rozdziela rejestrację i logowanie istniejącego konta, pokazuje odtwarzanie sesji i poprawnie obsługuje wylogowanie;
- onboarding zapisuje strefę IANA, aktywny kurs i oferuje sensowne warianty 5/10/15/30 minut;
- ujednolicono lokalizację etykiet postępu, planu dnia, komunikatów offline i opisów kursów;
- kolejka offline nie ponawia trwałych błędów 4xx i informuje użytkownika o odrzuconej próbie;
- finalny render panelu sprawdzono przy 1440×1000 oraz w emulowanym viewportcie 390×844; mobilny pomiar wykazał `clientWidth = scrollWidth = 390`, bez poziomego przepełnienia.

## 2. Zakres i metoda

Audyt objął:

1. pełną treść `PLAN_BUDOWY.md` i `CLOUDE.md`;
2. strukturę monorepo, aplikacje `mobile`, `api`, `admin`, wspólne pakiety, migracje Prisma, seed, CI/CD, Docker/Render/EAS i dokumentację etapów;
3. kontrolery, serwisy, kontrakty, konfigurację środowiskową, przechowywanie sesji i krytyczne ścieżki danych;
4. testy statyczne, jednostkowe, HTTP E2E, buildy produkcyjne oraz render panelu;
5. lokalne wyszukiwanie popularnych wzorców sekretów wyłącznie po nazwach dopasowanych plików.

Ograniczenia audytu:

- usługa Docker była zatrzymana, a port PostgreSQL `5432` niedostępny, więc nowej migracji nie wykonano lokalnie na prawdziwej bazie;
- test auth z bazą jest przygotowany i uruchamiany w CI z `RUN_DATABASE_E2E=true`, ale lokalnie został poprawnie pominięty;
- nie wykonano zewnętrznego SCA (`pnpm audit`), ponieważ wymagałby wysłania metadanych zależności do zewnętrznego rejestru, na co środowisko nie udzieliło zgody;
- nie było dostępu do App Store Connect, Google Play, EAS, Render, Sentry, dostawcy AI, push, e-mail ani S3;
- nie można było zastąpić badań użytkowników, przeglądu prawnego, recenzji eksperta tajskiego ani testów na fizycznych urządzeniach.

## 3. Macierz zgodności etapów 0–13

| Etap                         | Stan po audycie                  | Zrealizowane                                                                                | Brak do zamknięcia bramy                                                                                       |
| ---------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 0 — decyzje i sukces         | częściowy                        | persony, hipotezy, backlog, KPI, mapa zdarzeń, wstępna DPIA i ADR                           | 12 realnych wywiadów, akceptacja PO, prawnik/IOD, budżet i podpisy właścicieli                                 |
| 1 — UX i prototyp            | częściowy                        | IA, przepływy, tokeny, klikalny prototyp PL/EN/TH, stany async                              | badania z użytkownikami, VoiceOver/TalkBack, urządzenia, native speaker i formalna akceptacja                  |
| 2 — fundament                | w dużej części technicznej       | monorepo, Expo/Nest/Next/Prisma, walidacja env, CI, health, correlation ID, Docker Compose  | dowód działającego stagingu, sprawdzony deploy właściciela, pełna polityka sekretów/SCA                        |
| 3 — konto i i18n             | częściowy                        | register/login/logout/refresh, SecureStore, onboarding, UserCourse, RBAC, audyt, rate limit | weryfikacja e-mail, reset/zmiana hasła, workery eksportu/usunięcia, kompletna macierz E2E i i18n CI            |
| 4 — treść i admin            | częściowy                        | model treści, rewizje, workflow, rollback, kompletność PL/EN/TH, realny panel z RBAC        | pełny edytor CRUD, import/eksport, signed S3, media, podgląd mobile, obsługa zgłoszeń, recenzowany katalog     |
| 5 — silnik nauki             | zaawansowany pion, brama otwarta | 7 typów zadań, placement EN/TH, zamrożone rewizje, SRS, słownik, TTS, kolejka offline       | mobilne testy automatyczne/E2E, pełne testy DB i urządzeń, słownik z rozmowy, większy katalog treści           |
| 6 — tajski                   | prototyp                         | ThaiScriptUnit, transliteracja, ton/klasa, TTS, ustawienie per kurs                         | kompletna ścieżka alfabetu/tonów, prawdziwa recenzja eksperta, font/audio/urządzenia/a11y                      |
| 7 — AI                       | prototyp developerski            | neutralny port, wersja promptu/schematu, walidacja, limity, raportowanie, idempotency       | produkcyjny provider, streaming/cancel, dojrzała moderacja, ewaluacje PL/EN/TH, alert kosztu i testy injection |
| 8 — plan i postęp            | częściowy                        | deterministyczny plan, fallback bez AI, oddzielne metryki EN/TH i dashboard                 | test wielourządzeniowy, pełna spójność metryk, walidacja produktu i dostępności                                |
| 9 — operacje/GDPR/push       | częściowy                        | granularne preferencje, IANA/quiet hours, scheduler, retencja, runbooki, support            | tokeny urządzeń, worker/provider push, workery GDPR, test backup/restore, alerty kolejek i kosztów             |
| 10 — billing                 | sandbox domenowy                 | katalog, limity serwerowe, model uprawnień, podpis/idempotency wewnętrznego webhooka        | natywne IAP, Apple/Google verification, restore, prawdziwe webhooki i oba sklepowe sandboxy                    |
| 11 — jakość i bezpieczeństwo | częściowy                        | format/lint/types/unit/build, testy HTTP, CI z PostgreSQL, nagłówki i redakcja błędów       | mobile E2E, macierz urządzeń, load test, SCA, profesjonalny secret scan, OWASP/cloud review, AI evals          |
| 12 — beta i publikacja       | niezrealizowany wynik etapu      | EAS profiles, feature flags, readiness metrics, teksty listingów i runbook rollout          | realna beta, testerzy i zgody, grafiki/polityki sklepowe, go/no-go, monitoring produkcji i publikacja          |
| 13 — po MVP                  | eksperyment                      | Listening Lab i wyłączone flagi funkcji głosowych/offline/social                            | decyzja na danych z bety; funkcje nie powinny wyprzedzać ukończenia MVP                                        |

## 4. Kryteria ukończenia MVP

| Kryterium planu                                           | Ocena          | Uzasadnienie                                                                                                                   |
| --------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Android i iOS                                             | brak dowodu    | istnieje projekt Expo/EAS, brak macierzy urządzeń i podpisanych wyników                                                        |
| kompletne PL/EN/TH                                        | częściowo      | główne teksty są lokalizowane, ale część treści/komunikatów jest kodowana lokalnie i nie ma CI kompletności wszystkich ekranów |
| EN/TH bez mieszania postępu                               | w dużej części | dane są rozdzielone przez UserCourse i aktywny kurs, brak testu drugiego urządzenia                                            |
| konto → test → plan → lekcja → SRS → AI → postęp          | częściowo      | pion działa z adapterem deterministycznym i treścią demo, nie z produkcyjnym AI oraz pełnym kontem                             |
| słownik/tłumaczenie/TTS/zapis z zadania, lekcji i rozmowy | częściowo      | działa w lekcji/ćwiczeniu; pełne użycie z rozmowy i urządzeniowe TTS nie są dowiedzione                                        |
| prywatność, zgody, eksport, usunięcie                     | częściowo      | zgody i żądania są zapisane; brakuje workerów wykonujących eksport i usunięcie                                                 |
| AI moderowane, walidowane, limitowane, zgłaszane          | częściowo      | kontrakt i limity istnieją, lecz nie ma produkcyjnego modelu, moderacji ani ewaluacji                                          |
| tajski zatwierdzony ekspercko                             | niespełnione   | flaga w seedzie nie jest dowodem recenzji eksperta                                                                             |
| monitoring, backup/restore, alerty, rollback              | częściowo      | są integracje i runbooki, brak dowodu restore i konfiguracji alertów staging/production                                        |
| brak P0/P1 w automatyce i macierzy urządzeń               | niespełnione   | brak macierzy urządzeń, load/security/mobile E2E                                                                               |
| zamknięta beta                                            | niespełnione   | brak danych i dowodów z TestFlight/Google Play                                                                                 |
| akceptacja PO jakości/kosztu/operacji                     | niespełnione   | repozytorium nie zawiera zatwierdzonego go/no-go                                                                               |

## 5. Znalezione i naprawione problemy

### 5.1. Bezpieczeństwo i konfiguracja

| Problem                                              | Ryzyko                                          | Naprawa                                                                                     |
| ---------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| przykładowe sekrety akceptowane w staging/production | przejęcie sesji i fałszowanie billing webhooków | konfiguracja odrzuca placeholdery; Render generuje auth/refresh/billing secrets             |
| billing sandbox mógł pozostać aktywny na produkcji   | przyznanie premium bez sklepu                   | domyślnie wyłączony; production odrzuca sandbox                                             |
| liberalny CORS                                       | nieautoryzowane origins                         | ścisła lista origins, produkcyjne HTTPS                                                     |
| ręczny JWT bez pełnej kontroli nagłówka/struktury    | tokeny o nieoczekiwanym algorytmie lub polach   | dokładnie trzy segmenty, `typ=JWT`, `alg=HS256`, stałoczasowy podpis, rola i `exp`          |
| rotacja refresh tokenu podatna na wyścig/reuse       | kilka aktywnych tokenów lub przejęta rodzina    | atomowy claim, relacja tokenów, unieważnienie całej rodziny przy reuse                      |
| niespójne błędy i możliwość ujawnienia 5xx           | wyciek szczegółów i trudna diagnostyka          | globalny filtr `{error:{code,message,details?,correlationId}}`, bezpieczne 5xx i Sentry/log |
| brak nagłówków ochronnych panelu                     | clickjacking/MIME/referrer leakage              | `DENY`, `nosniff`, `no-referrer`, Permissions-Policy                                        |
| nieograniczony rozrost mapy rate limitera            | zużycie pamięci                                 | limit i czyszczenie rekordów; rozproszony limiter nadal pozostaje P1                        |
| przewidywalne/fikcyjne konto admina                  | niebezpieczny wzorzec operacyjny                | brak domyślnego admina; jawne narzędzie promocji roli z audit logiem                        |

### 5.2. Spójność danych i idempotencja

| Problem                                                | Ryzyko                                                    | Naprawa                                                                              |
| ------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| aktywna lekcja czytała bieżący pointer publikacji      | zmiana pytań i ocen w połowie sesji                       | sesja zapisuje `contentRevisionId` i używa zamrożonej rewizji do końca               |
| dowolna kolejność i wielokrotna odpowiedź na ćwiczenie | sztuczny wynik i podwójny postęp                          | kontrola bieżącego ćwiczenia, unikalność session/exercise, hash żądania i transakcja |
| ukończenie nie wymagało wszystkich zadań               | nieprawdziwe zakończenie lekcji                           | liczba prób musi odpowiadać liczbie ćwiczeń; status zmieniany warunkowo              |
| równoległe ukończenie mogło obniżyć bestScore          | utrata najlepszego wyniku                                 | atomowe `GREATEST` i warunkowa finalizacja                                           |
| placement akceptował częściowy/nieznany zestaw         | błędne przypisanie poziomu                                | komplet unikalnych, poprawnych odpowiedzi albo jawne pominięcie                      |
| klient mógł zapisać arbitralny wynik słownika          | zatrucie SRS                                              | serwer ponownie oblicza znaczenie z exercise/selection/locale                        |
| SRS nie przechowywał wersji i finalnego interwału      | niemożliwy audyt/regresja                                 | wersja algorytmu, interval, lastResult i optymistyczny claim powtórki                |
| AI start/turn nie porównywały semantyki retry          | duplikaty rozmów lub inna wiadomość pod tym samym kluczem | idempotency key + request hash dla rozmowy i tury                                    |
| Listening Lab sprawdzał inne properties niż zapisywał  | błędna odpowiedź retry                                    | stabilny klucz, zapis challenge/option i zgodna walidacja                            |
| zgoda była nadpisywana przez unikalny rekord           | utrata historii prawnej                                   | append-only consent history z indeksem chronologicznym                               |

Migracja `20260715020000_audit_hardening` dodaje powyższe pola, indeksy i relacje. Dla starych sesji rewizja jest backfillowana z aktualnego pointera lekcji; historycznej rewizji nie da się odtworzyć, jeśli wcześniej nie była zapisana. Migrację należy przećwiczyć na kopii stagingowej i sprawdzić ewentualne duplikaty prób przed produkcją.

### 5.3. Workflow treści

- endpointy publiczne zwracają tylko rewizję o rzeczywistym statusie `published`, nie sam niepusty pointer;
- submit jest dozwolony wyłącznie z `draft`;
- odrzucenie review usuwa poprzednie dane zatwierdzenia;
- publish wymaga zatwierdzonej rewizji i aktora;
- rollback przywraca tylko wcześniej sprawdzoną publikację;
- kompletność obejmuje tłumaczenia tytułu i promptów ćwiczeń PL/EN/TH;
- retry workflow zwraca osiągnięty stan zamiast tworzyć kolejne skutki uboczne;
- seed używa wyłączonego aktora systemowego do technicznego audytu publikacji, bez udawania realnego eksperta.

### 5.4. Mobile i sesja

- dodano single-flight refresh, timeouty żądań i bezpieczne czyszczenie sesji tylko dla trwałych błędów refresh;
- usunięto błąd, w którym stara odpowiedź profilu mogła nadpisać świeżo odnowioną sesję;
- logout unieważnia sesję serwerowo, a dopiero potem czyści SecureStore;
- aktywny kurs jest odtwarzany z profilu po ponownym logowaniu;
- stabilne klucze startu lekcji, rozmowy i Listening Lab pozwalają odzyskać wynik po utracie odpowiedzi;
- permanentne błędy offline 4xx nie są zapętlane; retry pozostaje dla sieci, 408, 429 i 5xx;
- dodano role/labels/autocomplete, czytelne stany ładowania i poprawione teksty PL/EN/TH.

### 5.5. CI, deploy i dokumentacja

- CI uruchamia `test:e2e` z PostgreSQL i `RUN_DATABASE_E2E=true` po migracji i seedzie;
- dodano E2E rejestracja → onboarding → rotacja → wykrycie reuse tokenu;
- API Dockerfile generuje klienta Prisma i uruchamia `prisma migrate deploy` przed startem;
- Render generuje sekrety i jawnie wyłącza billing sandbox;
- README określa projekt jako prototyp integracyjny i dokumentuje bezpieczną promocję admina;
- raport gotowości nie deklaruje już niezweryfikowanego SCA/secret scan;
- README etapów odróżniają kod demonstracyjny od zamkniętej bramy, recenzji eksperta, bety i integracji produkcyjnych;
- całe repozytorium sformatowano zgodnie z istniejącą konfiguracją Prettier.

## 6. Otwarte niezgodności i priorytety

### P0 — blokują zamkniętą betę lub publiczne MVP

1. **Pełne konto:** brak weryfikacji e-mail, resetu/zmiany hasła oraz workerów eksportu i usunięcia konta.
2. **Produkcja AI:** brak prawdziwego providera, streamingu, dojrzałej moderacji, ewaluacji i alarmów kosztowych. Kod poprawnie failuje zamknięciem funkcji na produkcji.
3. **Płatności:** brak Apple/Google IAP, server API, restore i webhooków dostawców. Istniejący adapter jest wyłącznie sandboxem domenowym.
4. **Powiadomienia:** brak tokenów urządzeń, workera i providera Expo/APNs/FCM.
5. **Treść/media:** brak pełnego studia CRUD/import/export, signed S3 oraz produkcyjnego katalogu EN/TH sprawdzonego przez ekspertów.
6. **Tajski:** brak kompletnej ścieżki oraz udokumentowanego zatwierdzenia native speakera.
7. **Jakość urządzeń:** brak mobilnych testów automatycznych, iOS/Android E2E, VoiceOver/TalkBack, dynamic text, słabej sieci i TTS na urządzeniach.
8. **Operacje:** brak wykonanego restore, potwierdzonego stagingu, alertów i monitoringu kosztów/kolejek.
9. **Beta/release:** brak realnych testerów, danych KPI, go/no-go, grafik/polityk sklepów i publikacji.

### P1 — wymagane przed skalowaniem lub produkcją

1. Rate limiter jest procesowy; wiele instancji API nie współdzieli limitu. Potrzebny Redis/gateway albo `@nestjs/throttler` ze wspólnym storage.
2. Brak OpenAPI i pełnych testów kontraktowych/IDOR dla API.
3. Brak rezerwacji tury AI przed wywołaniem providera; równoległe żądania mogą wykonać kosztowną pracę dwa razy. Ryzyko jest obecnie ograniczone przez produkcyjny fail-closed.
4. Mutacje „find then create” dla części kolejek operacyjnych powinny obsługiwać konflikt unikalności jako oczekiwany retry.
5. Brak load testów API/bazy/limitów i profilowania mobile.
6. Brak zatwierdzonego SCA, profesjonalnego secret scan, OWASP/cloud/IAM review i dowodu braku high/critical.
7. Aplikacja mobilna deklaruje TanStack Query, Zustand, React Hook Form i i18next, ale bieżące ekrany korzystają głównie z lokalnego stanu i własnej warstwy tekstów; architektura klienta wymaga uporządkowania przed rozrostem.
8. Część komunikatów domenowych API pozostaje angielska; klient powinien mapować kody błędów na kompletne PL/EN/TH.

### P2 — jakość produktu i utrzymanie

1. Rozdzielić duże komponenty `page.tsx`, `index.tsx` i `product-home.tsx` na testowalne moduły.
2. Dodać testy wizualne kluczowych stanów i automatyczny audyt dostępności panelu.
3. Uzupełnić pełną obsługę zgłoszeń AI (przypisanie, komentarz, resolve, historia).
4. Ustalić licencję projektu i formalną politykę zgłaszania podatności.
5. Wprowadzić dashboard jakości danych/treści zamiast polegania wyłącznie na flagach w seedzie.

## 7. Wyniki weryfikacji po poprawkach

| Kontrola                                | Wynik                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------ |
| `pnpm check`                            | zaliczone w całości: format, lint, typecheck, 64 testy i build                       |
| `pnpm lint`                             | zaliczone, 0 ostrzeżeń                                                               |
| `pnpm typecheck`                        | zaliczone dla 7 projektów workspace                                                  |
| `pnpm test`                             | 18 plików, 64/64 testy zaliczone; w tym API 15 plików i 57 testów                    |
| `pnpm test:e2e` lokalnie                | 2 testy health zaliczone; 1 test auth+DB pominięty z powodu braku PostgreSQL         |
| `pnpm build`                            | zaliczone: pakiety, Nest API, Next admin i Expo web export                           |
| wizualne QA panelu                      | desktop 1440×1000 i mobile 390×844; brak overflow w mobile                           |
| `git diff --check`                      | zaliczone                                                                            |
| lokalne wzorce sekretów w tracked files | 0 dopasowanych plików; nie zastępuje profesjonalnego skanera                         |
| zewnętrzne SCA                          | niewykonane — brak zgody na egress metadanych zależności                             |
| migracja na PostgreSQL                  | niewykonana lokalnie — Docker `Stopped`, port 5432 niedostępny; skonfigurowana do CI |

Build Expo zgłasza ostrzeżenie o braku lokalnych parametrów projektu Sentry oraz wymuszone zakończenie procesu po eksporcie, ale sam eksport kończy się kodem 0. Te komunikaty należy zweryfikować w docelowym EAS/CI, nie ignorować w release telemetry.

## 8. Zalecana kolejność dalszych prac

1. Uruchomić migrację i pełne E2E na czystym oraz zanonimizowanym stagingowym PostgreSQL; sprawdzić duplikaty prób i backfill rewizji.
2. Dokończyć konto/GDPR, a następnie realne push i e-mail — bez tego testerzy zewnętrzni nie mają bezpiecznego lifecycle konta.
3. Dokończyć studio treści, S3 oraz mały, naprawdę recenzowany katalog EN/TH.
4. Zintegrować i ewaluować produkcyjnego providera AI; utrzymać flagę wyłączoną do przejścia progów jakości/kosztu.
5. Zintegrować oba sklepy i wykonać ich prawdziwe scenariusze sandbox.
6. Wykonać SCA/secret scan/OWASP/load test oraz zamknąć P0/P1 z raportem dowodowym.
7. Przeprowadzić macierz fizycznych urządzeń, testy dostępności i recenzję tajskiego.
8. Dopiero wtedy rozpocząć zamkniętą betę, zebrać KPI i przeprowadzić formalne go/no-go.

## 9. Kontrola kompletności raportu

- [x] przeanalizowano oba wymagane dokumenty;
- [x] sprawdzono kod źródłowy, modele, migracje, CI/deploy i dokumentację;
- [x] oceniono każdy etap planu 0–13;
- [x] oceniono wszystkie łączne kryteria ukończenia MVP;
- [x] naprawione problemy oddzielono od pozostałych braków;
- [x] opisano zmiany stylistyczne i UX/UI;
- [x] podano wyniki testów oraz ich ograniczenia bez zawyżania dowodów;
- [x] nie zadeklarowano gotowości usług, sklepów, ekspertów ani bezpieczeństwa, których nie zweryfikowano;
- [x] raport sprawdzono względem aktualnego stanu zmian i wyników poleceń z 2026-07-15.

**Wniosek końcowy:** po audycie techniczny rdzeń jest wyraźnie bezpieczniejszy i bardziej spójny, a lokalna brama jakości jest zielona. Projekt nadal wymaga zamknięcia kluczowych integracji, treści, operacji, testów urządzeń i dowodów zewnętrznych. Nie powinien być przedstawiany jako ukończone MVP, beta-ready ani production-ready.
