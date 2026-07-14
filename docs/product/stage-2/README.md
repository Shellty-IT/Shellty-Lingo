# Etap 2 — Foundation Release

## Rezultat

Repozytorium jest monorepo TypeScript z jednym lockfile i trzema uruchamialnymi aplikacjami:

- `apps/mobile` — Expo Router z ekranem Foundation Release zgodnym z tokenami źródłowego designu oraz demonstracją PL/EN/TH;
- `apps/api` — NestJS, Prisma i PostgreSQL z endpointami `GET /v1/health/live` i `GET /v1/health/ready`;
- `apps/admin` — responsywny panel Next.js pokazujący stan pionu;
- `packages/*` — kontrakty API, walidacja konfiguracji, lokalizacje i tokeny UI.

## Brama jakości

| Wymaganie                        | Dowód                                                                            |
| -------------------------------- | -------------------------------------------------------------------------------- |
| Jedno polecenie instalacji       | `pnpm install --frozen-lockfile`                                                 |
| Powtarzalna baza lokalna         | `docker compose up -d postgres`, migracja i idempotentny seed                    |
| Format/lint/typecheck/test/build | `pnpm check`; ten sam zestaw w GitHub Actions                                    |
| Walidacja środowiska             | `@shellty/config` (Zod), bez logowania wartości                                  |
| Obserwowalność                   | JSON logs, `x-correlation-id`, readiness DB i Sentry opt-in bez PII              |
| Development/staging              | profile EAS, Render Blueprint i ręczny workflow z GitHub Environments            |
| Sekrety                          | wyłącznie puste `.env.example`; wartości wdrożeniowe przez secret store          |
| Design                           | `@shellty/ui` odwzorowuje tokeny z Etapu 1; mobile/admin używają wspólnej palety |

## Demonstracja pionu

1. Skopiuj przykładowe pliki środowiskowe zgodnie z głównym README.
2. Uruchom bazę, migrację i seed.
3. Uruchom `pnpm dev`, a osobno `pnpm dev:mobile`.
4. Otwórz `http://localhost:3002` i naciśnij „Sprawdź połączenie”.
5. W aplikacji mobilnej zmień PL/EN/TH i wykonaj ten sam healthcheck.
6. `GET http://localhost:3001/v1/health/ready` powinien zwrócić `database: "connected"` i correlation ID.

## Strategia migracji

- development: `pnpm db:migrate` tworzy i stosuje migrację;
- CI/staging/production: tylko `pnpm db:migrate:deploy` przed uruchomieniem nowej wersji;
- `prisma db push` jest zabronione poza jednorazowym eksperymentem na bazie disposable;
- migracje rozwijające są oddzielane od migracji usuwających; rollback aplikacji musi tolerować poprzedni schemat;
- seed jest demonstracyjny, idempotentny i nie zawiera danych osobowych.

## Pozostałe działania zewnętrzne

Kod i automatyzacja są gotowe, lecz fizyczne utworzenie usług staging, GitHub Environments, sekretów Render/Sentry i projektu EAS wymaga dostępu właściciela organizacji. Instrukcja znajduje się w `docs/runbooks/foundation-deployment.md`.
