# Raport gotowości kandydata do wydania

Data przeglądu: 2026-07-15. Zakres: etapy 9–11.

## Automatyczne bramy

- format, ESLint, TypeScript, testy jednostkowe, build wszystkich aplikacji oraz testy HTTP;
- migracje Prisma wykonywane na czystym PostgreSQL w CI; tryb `RUN_DATABASE_E2E=true` sprawdza prawdziwe połączenie i przepływ auth/rotacji tokenu;
- testy DST/quiet hours, dziennego limitu AI, grace period, fałszywego receiptu i duplikatu webhooka;
- bezpieczne nagłówki HTTP, ograniczony CORS, redakcja PII w Sentry i correlation ID.

Konfiguracja CI zawiera osobne zadania `gitleaks` i `pnpm audit --prod --audit-level high`. Samo istnienie tych zadań nie potwierdza ich ostatniego wyniku ani braku podatności. Przed wydaniem należy zachować artefakt aktualnego przebiegu CI z datą i wynikiem obu kontroli.

## Macierz ręczna przed zamkniętą betą

| Obszar                    | iOS      | Android  | Kryterium                                       |
| ------------------------- | -------- | -------- | ----------------------------------------------- |
| Mały ekran / duży tekst   | wymagane | wymagane | brak ucięcia akcji i tajskich znaków            |
| Słaba sieć / retry        | wymagane | wymagane | brak podwójnej próby lub zakupu                 |
| VoiceOver / TalkBack      | wymagane | wymagane | logiczna kolejność, przełączniki ogłaszają stan |
| PL / EN / TH              | wymagane | wymagane | brak kluczy i błędnego składu tajskiego         |
| TTS EN / TH / tłumaczenie | wymagane | wymagane | fallback nie blokuje lekcji                     |
| App Store / Play sandbox  | wymagane | wymagane | purchase, restore, grace, expiry, refund        |

## Otwarte blokery zewnętrzne

- produkcyjne poświadczenia i adaptery weryfikacji Apple/Google;
- podłączenie dostawcy push do kolejki dostaw;
- test restore bazy na stagingu oraz podpis właściciela operacyjnego;
- testy na fizycznych urządzeniach i ekspercka regresja tajskiego.

Nie ma zweryfikowanych podstaw do deklaracji „brak podatności high/critical” bez wyniku aktualnego zadania `dependency-audit` z zaufanego CI. Raport z 2026-07-15 pozostaje historycznym zapisem, a nie bieżącą oceną bezpieczeństwa.

Do czasu zamknięcia powyższych pozycji build jest prototypem integracyjnym, nie kandydatem do zamkniętej bety ani publicznym release.
