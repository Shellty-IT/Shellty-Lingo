# Shellty Lingo — kontekst dla agentów programistycznych

Aplikacja mobilna do nauki języków (EN, TH) z backendem i panelem admina.
Monorepo pnpm. Pełne wytyczne: [docs/engineering-guidelines.md](./docs/engineering-guidelines.md)
(odwołania „§N" w komentarzach kodu wskazują sekcje tego dokumentu).
Harmonogram i bramy jakości: [PLAN_BUDOWY.md](./PLAN_BUDOWY.md). Decyzje: `docs/adr/`.

## Struktura

- `apps/api` — NestJS + Prisma (PostgreSQL). Moduły funkcjonalne w `src/<domena>/`
  (auth, learning, growth, billing, content, listening, operations, release, ai)
  plus globalny `src/core/` (env, logger, correlation, Prisma, filtr wyjątków).
  W domenach pary `*.service.ts` (I/O, Prisma) + `*-engine.ts` (czysta logika).
  Klient Prisma generowany do `src/generated/prisma` (`pnpm db:generate`).
- `apps/admin` — Next.js (App Router), panel treści i operacji.
- `apps/mobile` — Expo + Expo Router; tokeny w SecureStore, nigdy AsyncStorage.
- `packages/api-contracts` — typy DTO współdzielone przez API i klienty;
  nie duplikuj interfejsów ręcznie. `packages/config` — walidacja env (Zod).
  `packages/i18n`, `packages/ui` — lokalizacja i tokeny UI.

## Komendy (z katalogu głównego)

```bash
pnpm db:up            # PostgreSQL przez docker compose
pnpm db:migrate       # prisma migrate dev (nigdy `db push`)
pnpm db:seed
pnpm dev              # api + admin;  dev:mobile / dev:api / dev:admin osobno
pnpm lint             # buduje pakiety, potem eslint --max-warnings=0
pnpm typecheck
pnpm test             # unit (vitest);  test:e2e wymaga bazy
pnpm check            # format + lint + typecheck + test + build (jak CI)
```

Po zmianie `schema.prisma` zawsze: `pnpm db:generate` + migracja.

## Reguły domenowe (niezmienne)

1. Postęp należy do `UserCourse` (para user+język), nie do `User`.
2. Treść przechodzi `draft → review → published → archived`; uczeń widzi tylko
   `published`. Treść jest wersjonowana (`ContentRevision`) — zmiana nie może
   zmienić historycznego wyniku ćwiczenia.
3. Zapisy wyników (próby, powtórki, sesje) są idempotentne — klient wysyła
   `idempotencyKey`, retry nie nalicza nic podwójnie.
4. SRS jest deterministyczny i wersjonowany (`SRS_ALGORITHM_VERSION`);
   niezgodna wersja = konflikt, nie cicha reinterpretacja.
5. Awaria AI nie blokuje nauki: łańcuch providerów (Gemini → Groq →
   deterministyczny fallback) z circuit breakerami; tłumaczenie dynamiczne
   degraduje się do „brak tłumaczenia".
6. Limity premium egzekwuje API (`BillingService.assert*`), nigdy samo UI.
7. Czas w UTC; strefa użytkownika jako identyfikator IANA w `UserCourse`.
8. Treść AI nie staje się automatycznie treścią opublikowaną; wynik dynamiczny
   jest oznaczony flagą `dynamic`.

## Konwencje

- TypeScript strict; błędy API zawsze `{ error: { code, message, correlationId } }` —
  stabilny `code` mapowany na PL/EN/TH po stronie klienta.
- Żadnych tekstów UI na stałe w komponentach; klucze i18n dla PL/EN/TH.
- Modele Prisma nie wychodzą przez API — mapuj na typy z `@shellty/api-contracts`.
- Sekrety tylko przez `@shellty/config` (walidacja przy starcie); nie loguj
  tokenów, haseł ani treści rozmów. Nie commituj `.env`.
- Testy: engine'y i serwisy mają `*.spec.ts` obok kodu (vitest); e2e w
  `*.e2e.spec.ts`. Testy nie wywołują płatnych usług AI.
- Conventional commits; `main` zawsze wdrażalny.

## Zakazane skróty

- `prisma db push` na staging/production; ręczne zmiany w bazie bez migracji.
- Klucze AI/S3/admin w aplikacji mobilnej lub webowej.
- Zaufanie odpowiedzi AI bez walidacji schematu (`assertAiResult`) i moderacji.
- Wspólne sekrety/bazy dla środowisk; dane produkcyjne w testach.

Pełna lista reguł, model danych, bezpieczeństwo, GDPR, dostępność i Definition
of Done: [docs/engineering-guidelines.md](./docs/engineering-guidelines.md).
