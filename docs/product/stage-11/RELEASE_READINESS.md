# Raport gotowości kandydata do wydania

Data przeglądu: 2026-07-15. Zakres: etapy 9–11.

## Automatyczne bramy

- format, ESLint, TypeScript, testy jednostkowe, build wszystkich aplikacji oraz testy HTTP;
- migracje Prisma wykonywane na czystym PostgreSQL w CI; tryb `RUN_DATABASE_E2E=true` sprawdza prawdziwe połączenie i przepływ auth/rotacji tokenu;
- testy DST/quiet hours, dziennego limitu AI, grace period, fałszywego receiptu i duplikatu webhooka;
- bezpieczne nagłówki HTTP, ograniczony CORS, redakcja PII w Sentry i correlation ID.

Audyt zależności względem bieżącej bazy advisory i profesjonalny skan sekretów nie są obecnie bramą CI. Lokalny audyt 2026-07-15 sprawdził jedynie wzorce kluczy prywatnych i popularnych tokenów w śledzonych źródłach; nie zastępuje to skanera sekretów ani SCA.

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

Nie ma zweryfikowanych podstaw do deklaracji „brak podatności high/critical”: sprawdzenie rejestru advisory nie zostało wykonane w tym środowisku, ponieważ wymaga wysłania metadanych zależności do zewnętrznego rejestru. Należy wykonać zatwierdzone SCA w zaufanym CI i zapisać artefakt z datą oraz źródłem bazy podatności.

Do czasu zamknięcia powyższych pozycji oraz braków wskazanych w `AUDYT_PROJEKTU.md` build jest prototypem integracyjnym, nie kandydatem do zamkniętej bety ani publicznym release.
