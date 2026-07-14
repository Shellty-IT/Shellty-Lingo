# Etap 1 — UX, system projektowy i prototyp

**Wersja:** 0.1

**Data:** 2026-07-14
**Status:** artefakty projektowe gotowe do walidacji; badania z użytkownikami i recenzja native speakera pozostają otwarte

Ten katalog realizuje zakres Etapu 1 z [`PLAN_BUDOWY.md`](../../../PLAN_BUDOWY.md). Materiały rozwijają baseline wizualny z Etapu 0 i są kontraktem wejściowym dla implementacji Expo w Etapie 2 oraz funkcji z Etapów 3–8.

## Rezultaty

| Rezultat | Artefakt | Stan |
|---|---|---|
| Mapa informacji i nawigacja | [Architektura informacji](./information-architecture.md) | gotowe do walidacji |
| Kluczowe przepływy i ekrany | [Przepływy i specyfikacja ekranów](./flows-and-screens.md) | gotowe do walidacji |
| Tokeny i biblioteka komponentów | [System projektowy](./design-system.md) | gotowe do implementacji |
| Stany asynchroniczne i komunikacja AI | [Stany i zaufanie](./states-and-ai.md) | gotowe do implementacji |
| Prototyp Android/iOS, PL/EN/TH i 100/200% tekstu | [Uruchom prototyp](./prototype/index.html) | kluczowy pion jest klikalny |
| Scenariusz badań, audyt a11y i recenzja tajskiego | [Plan walidacji](./validation-plan.md) | gotowy; wykonanie wymaga uczestników |

## Zakres klikalnego prototypu

Prototyp obejmuje pion wymagany przez bramę jakości:

`start → język UI → kurs → cel → czas → test poziomujący → Dzisiaj → pierwsza lekcja → wynik → scenariusz AI → rozmowa`

Dolna nawigacja prowadzi także do ekranów Nauka, Tutor AI, Postępy i Profil. Panel narzędzi pozwala bez przeładowania zmienić:

- ramkę i zachowanie wizualne iOS/Android;
- język interfejsu PL/EN/TH;
- skalę tekstu 100%/200%;
- stan danych: treść, ładowanie, pusty, offline, błąd, limit i wygasła sesja.

Prototyp jest samowystarczalny, nie wysyła danych, nie wywołuje AI i nie wymaga backendu. Dane rozmowy i wyniki są fikcyjne.

## Referencyjne rendery QA

| Przypadek | Render |
|---|---|
| iOS, PL, ekran Dziś | [today-ios-pl.png](./prototype/screenshots/today-ios-pl.png) |
| Android, TH, rozmowa AI, tekst 200% | [chat-android-th-200.png](./prototype/screenshots/chat-android-th-200.png) |
| iOS, EN, stan offline | [offline-ios-en.png](./prototype/screenshots/offline-ios-en.png) |

Rendery służą do kontroli regresji kierunku wizualnego. Nie zastępują testów na fizycznym urządzeniu ani oceny native speakera.

## Jak uruchomić

Najprościej otworzyć plik [`prototype/index.html`](./prototype/index.html) w przeglądarce. Jeśli przeglądarka ogranicza lokalne skrypty, uruchom z katalogu repozytorium dowolny statyczny serwer, na przykład:

```powershell
python -m http.server 4173
```

i przejdź do `http://localhost:4173/docs/product/stage-1/prototype/`.

Szybki test kompletności artefaktu:

```powershell
node docs/product/stage-1/prototype/smoke-test.mjs
```

## Decyzje obowiązujące dla implementacji

1. Język interfejsu, język wyjaśnień i aktywny kurs to trzy osobne ustawienia.
2. Główna nawigacja po onboardingu ma pięć pozycji: Dziś, Nauka, Tutor AI, Postępy, Profil.
3. Każdy ekran zależny od danych ma jawne stany opisane w `states-and-ai.md`.
4. Tajski używa `Noto Sans Thai` albo systemowego fontu o potwierdzonym pokryciu; transliteracja jest opcjonalna i drugorzędna.
5. Główne cele dotykowe mają minimum 44×44 pt na iOS i 48×48 dp na Androidzie.
6. Interfejs działa przy 200% tekstu przez reflow i przewijanie, bez utraty głównej akcji.
7. AI jest zawsze opisane jako narzędzie mogące się mylić; poprawka pokazuje poziom pewności i możliwość zgłoszenia.

## Brama jakości

| Kryterium | Stan | Dowód / następny krok |
|---|---|---|
| Samodzielny onboarding | gotowe do badania | scenariusz V-01 w `validation-plan.md` |
| Ukończenie pierwszej lekcji | gotowe do badania | scenariusz V-02 |
| Rozpoczęcie rozmowy AI | gotowe do badania | scenariusz V-03 |
| PL/EN/TH i długie teksty | pokryte w prototypie | przełączniki języka i 200% tekstu |
| Stany empty/loading/offline/error/limit/session | pokryte w prototypie | selektor „Stan” |
| Brak krytycznych problemów dostępności | niezakończone | wymagane testy VoiceOver/TalkBack na urządzeniach |
| Czytelność tajskiego | niezakończone | wymagana recenzja native speakera |
| Testy z użytkownikami | niezakończone | minimum 5 osób na główny segment, 12 łącznie |

Etap można przekazać do implementacji technicznej, lecz formalne słowo „zatwierdzony” wymaga podpisania raportu badań przez Product Ownera, UX Lead i Thai Language Lead.
