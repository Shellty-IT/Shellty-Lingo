# Etap 12 — zamknięta beta i publikacja

## Dostarczony przyrost

- `GET /v1/release/config` zwraca kanał wydania i per-użytkownikowy stan flag;
- `POST /v1/release/telemetry` przyjmuje wyłącznie jawny, minimalny katalog zdarzeń aktywacji i nauki;
- `GET /v1/release/readiness?windowDays=30` agreguje kohortę beta, retencję D1/D7, ukończenie pierwszej lekcji/rozmowy i odsetek zgłoszeń AI;
- `PATCH /v1/release/flags/:key` pozwala administratorowi zatrzymać funkcję lub prowadzić stabilny rollout procentowy;
- rozmowy AI sprawdzają flagę po stronie API przed rozpoczęciem i przed każdą wiadomością;
- profile EAS `beta` i `production` budują podpisane paczki oraz przygotowują przekazanie do TestFlight lub wskazanej ścieżki Google Play;
- katalog `docs/store-listing` zawiera opisy PL/EN/TH, a runbook wydania opisuje rollout, go/no-go, dyżur i rollback.

## Bramy go/no-go

Domyślne progi w `release-engine.ts` to: co najmniej 30 testerów, aktywacja 60%, ukończenie pierwszej lekcji 55%, retencja D7 20%, zgłoszenia AI maksymalnie 5% oraz crash-free 99,5%. Brak danych crash-free daje `needs_data`, nigdy automatyczne `go`.

Progi są punktem startowym z Etapu 0. Właściciel produktu zatwierdza je przed rozpoczęciem bety i dokumentuje zmianę. System nie publikuje aplikacji automatycznie na podstawie samych metryk.

## Działania wymagające kont zewnętrznych

1. Utworzyć aplikacje i role w App Store Connect oraz Google Play Console.
2. Uzupełnić `projectId` przez `eas init` oraz poświadczenia podpisu i kont sklepów w EAS.
3. Wprowadzić grafiki sklepowe, politykę prywatności i deklaracje Data Safety/App Privacy.
4. Podłączyć eksport crash-free z Sentry do `release.crash_free_percent` lub zatwierdzonego adaptera.
5. Przeprowadzić macierz fizycznych urządzeń z raportu Etapu 11 i uzyskać podpis go/no-go.

Bez tych czynności repo jest kandydatem gotowym do zamkniętej bety, ale nie dowodem akceptacji sklepów.
