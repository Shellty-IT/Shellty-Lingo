# Architektura informacji

## Zasady organizacji

- na pierwszym planie jest zadanie użytkownika, nie struktura katalogu;
- aktywny kurs EN/TH jest stale widoczny i nie miesza postępu;
- ekran „Dziś” jest domyślnym punktem powrotu i zawsze proponuje wykonalne działanie;
- funkcje prywatności oraz dostępności nie są ukryte pod niejasnymi etykietami;
- rozmowa AI jest oddzielona od lekcji, ale może przyjąć kontekst ukończonej lekcji;
- ustawienia kursu tajskiego należą do kursu, a nie do globalnego profilu.

## Mapa aplikacji

```text
Przed zalogowaniem
├── Start
├── Rejestracja
│   ├── E-mail i hasło
│   └── Potwierdzenie adresu
├── Logowanie
│   └── Reset hasła
└── Informacje prawne

Konfiguracja pierwszego kursu
├── Język interfejsu
├── Język nauki: EN / TH
├── Cel nauki
├── Czas i harmonogram
├── Deklarowany poziom
└── Test poziomujący
    ├── Pytania
    ├── Wynik z zastrzeżeniem
    └── Pominięcie testu

Główna aplikacja
├── Dziś
│   ├── Przełącznik kursu
│   ├── Plan 10–15 min
│   ├── Należne powtórki
│   └── Skrót do Tutora AI
├── Nauka
│   ├── Moduły i lekcje
│   ├── Lekcja
│   │   ├── Ćwiczenie
│   │   ├── Słownik kontekstowy
│   │   ├── TTS źródła i tłumaczenia
│   │   └── Podsumowanie
│   ├── Powtórki
│   └── Tajski: alfabet i tony
├── Tutor AI
│   ├── Scenariusze
│   ├── Tryb korekty
│   ├── Rozmowa
│   ├── Zgłoszenie odpowiedzi
│   └── Podsumowanie rozmowy
├── Postępy
│   ├── Kurs EN / TH
│   ├── Tydzień i seria
│   ├── Umiejętności i słowa
│   └── Historia błędów
└── Profil
    ├── Konto i bezpieczeństwo
    ├── Język interfejsu i wyjaśnień
    ├── Kursy i harmonogram
    ├── Dostępność
    ├── Powiadomienia
    ├── Prywatność i zgody
    ├── Eksport danych
    └── Usunięcie konta / wylogowanie
```

## Model nawigacji

Po onboardingu używamy pięciu kart. Zagnieżdżone widoki lekcji i rozmowy otwierają się ponad kartami i ukrywają dolną nawigację, aby ograniczyć rozproszenie. Zamknięcie takiego widoku wymaga potwierdzenia tylko wtedy, gdy istnieje niezapisana odpowiedź.

| Karta | Cel | Główna akcja |
|---|---|---|
| Dziś | zdecydować, co zrobić teraz | rozpocząć rekomendowaną sesję |
| Nauka | świadomie wybrać materiał | otworzyć lekcję lub powtórkę |
| Tutor AI | ćwiczyć praktyczną rozmowę | wybrać scenariusz i tryb korekty |
| Postępy | zrozumieć wynik i kolejny krok | przejść do rekomendowanej aktywności |
| Profil | zarządzać kontem i preferencjami | zapisać konkretną zmianę |

## Widoczność kontekstu kursu

- `Dziś`, `Nauka` i `Postępy` zawsze pokazują nazwę i flagę aktywnego kursu.
- Przełączenie kursu wymaga jednego działania, ale nigdy nie kopiuje celu, poziomu, SRS ani ustawień transliteracji.
- Tutor AI startuje w aktywnym kursie; zmianę kursu pokazuje przed rozpoczęciem rozmowy, nie w jej trakcie.
- Po przełączeniu kursu pusty plan otrzymuje deterministyczny fallback: „Wybierz pierwszą lekcję”, nie pustą kartę.

## Głębokie linki planowane dla Expo Router

| Cel | Ścieżka logiczna |
|---|---|
| Dzisiaj | `/(app)/today` |
| Lista lekcji | `/(app)/learn` |
| Lekcja | `/lesson/:lessonId` |
| Powtórka | `/review/:sessionId` |
| Scenariusze AI | `/(app)/tutor` |
| Rozmowa | `/conversation/:conversationId` |
| Postęp | `/(app)/progress` |
| Profil | `/(app)/profile` |
| Prywatność | `/settings/privacy` |

Są to identyfikatory projektowe, a nie gotowa implementacja routera. Guard auth/onboarding powinien być centralny, zgodnie z `CLOUDE.md`.
