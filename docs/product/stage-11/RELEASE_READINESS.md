# Raport gotowości kandydata do wydania

Data przeglądu: 2026-07-15. Zakres: etapy 9–11.

## Automatyczne bramy

- format, ESLint, TypeScript, testy jednostkowe, kontrakt health E2E i build wszystkich aplikacji;
- migracje Prisma wykonywane na czystym PostgreSQL w CI;
- audyt zależności produkcyjnych oraz skan sekretów;
- testy DST/quiet hours, dziennego limitu AI, grace period, fałszywego receiptu i duplikatu webhooka;
- bezpieczne nagłówki HTTP, ograniczony CORS, redakcja PII w Sentry i correlation ID.

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

Audyt produkcyjny z 2026-07-15 nie wykrył podatności high/critical. Pozostają 3 moderate w przechodnich narzędziach Hono/PostCSS/UUID oraz 1 low w developerskim serwerze esbuild; należy je usunąć aktualizacją zależności nadrzędnych po przejściu pełnej regresji, bez wymuszania niezgodnych override'ów.

Do czasu zamknięcia powyższych pozycji build pozostaje kandydatem do zamkniętej bety, nie publicznym release.
