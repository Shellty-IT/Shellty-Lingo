# Shellty Lingo

[Polski](./README.md) | [English](./README.en.md)

Shellty Lingo to projekt mobilnej aplikacji do interaktywnej i spersonalizowanej nauki języków obcych z wykorzystaniem sztucznej inteligencji. Aplikacja połączy ustrukturyzowane lekcje, system inteligentnych powtórek i praktyczne rozmowy z agentem AI.

> **Stan projektu:** Etap 1 — dokumentacja UX, system projektowy i klikalny prototyp są gotowe do walidacji. Kod aplikacji produkcyjnej nie został jeszcze utworzony.

## Cel produktu

Pierwsze wydanie będzie przeznaczone dla dorosłych użytkowników na każdym poziomie zaawansowania i pozwoli:

- uczyć się języka angielskiego lub tajskiego;
- korzystać z interfejsu po polsku, angielsku lub tajsku;
- przejść test poziomujący i otrzymać indywidualny plan nauki;
- ćwiczyć słownictwo i gramatykę z wykorzystaniem spaced repetition;
- korzystać ze słownika kontekstowego, który tłumaczy słowa, zwroty i treść zadań, odczytuje oryginał oraz tłumaczenie na głos i zapisuje wybrane elementy do powtórek;
- poznawać alfabet, transliterację i podstawy tonów języka tajskiego;
- prowadzić tekstowe rozmowy z AI i otrzymywać analizę błędów;
- obserwować postęp oddzielnie dla każdego języka;
- otrzymywać kontrolowane przypomnienia o nauce i powtórkach.

## Zakres MVP

MVP obejmuje aplikację na Androida i iOS, backend REST API oraz panel administracyjny. Najważniejsze moduły to:

1. konto, uwierzytelnianie, profil i zgody;
2. onboarding i test poziomujący;
3. kursy, lekcje, słownictwo i podstawowa gramatyka;
4. słownik kontekstowy, tłumaczenie oraz synteza mowy (TTS);
5. spaced repetition i historia błędów;
6. podstawowy kurs alfabetu i tonów tajskich;
7. tekstowe rozmowy z AI i podsumowanie korekty;
8. plan nauki i panel postępów;
9. powiadomienia oraz podstawowe subskrypcje;
10. panel zarządzania i publikacji treści;
11. monitoring, analityka, bezpieczeństwo i obsługa GDPR.

Rozmowy głosowe w czasie rzeczywistym, zaawansowana analiza wymowy, pełny tryb offline, społeczność i certyfikaty są planowane po MVP.

## Planowany stos technologiczny

| Obszar | Technologie |
|---|---|
| Mobile | React Native, Expo, Expo Router, TypeScript |
| Dane klienta | TanStack Query, Zustand |
| Formularze i walidacja | React Hook Form, Zod |
| Lokalizacja | i18next, react-i18next, Expo Localization |
| Backend | Node.js, NestJS, TypeScript, REST API |
| Baza danych | PostgreSQL, Prisma ORM |
| Panel administracyjny | Next.js, React, TypeScript |
| Multimedia | magazyn zgodny z S3 |
| Mobile CI/CD | Expo EAS |
| Repozytorium i automatyzacja | GitHub, GitHub Actions |

Dostawcy hostingu, modeli AI, e-mail, analityki, monitoringu i płatności zostaną zatwierdzeni w rekordach decyzji architektonicznych (ADR).

## Architektura wysokiego poziomu

```text
Aplikacja Expo ─────┐
                    ├── HTTPS ──> NestJS REST API ──> PostgreSQL
Panel Next.js ──────┘                   │       ├────> magazyn S3
                                       │       ├────> e-mail / push / płatności
                                       │       └────> kolejki i cache (gdy potrzebne)
                                       └────────────> adaptery dostawców AI
```

Aplikacja mobilna nie może komunikować się bezpośrednio z dostawcą AI ani przechowywać sekretów serwerowych. API odpowiada za autoryzację, limity, moderację, walidację odpowiedzi, kontrolę kosztów i audyt.

## Dokumentacja

- [Plan budowy](./PLAN_BUDOWY.md) — etapy realizacji, bramy jakości, ryzyka, KPI i kryteria ukończenia MVP.
- [Kontekst techniczny](./CLOUDE.md) — architektura, model danych, kontrakty, konwencje, bezpieczeństwo, AI, testowanie i CI/CD.
- [Etap 1 — UX i klikalny prototyp](./docs/product/stage-1/README.md) — architektura informacji, przepływy, komponenty, stany, dostępność oraz prototyp PL/EN/TH dla iOS/Android.
- `docs/adr/` — decyzje architektoniczne; katalog powstanie podczas bootstrapu technicznego.
- `docs/runbooks/` — instrukcje operacyjne; katalog powstanie przed betą.

## Docelowa struktura repozytorium

```text
apps/
  mobile/             # Expo / React Native
  api/                # NestJS REST API
  admin/              # Next.js
packages/
  api-contracts/
  config/
  domain/
  i18n/
  ui/
prisma/
  migrations/
  seed/
docs/
  adr/
  runbooks/
```

Struktura zostanie utworzona w etapie fundamentów. Aktualnie repozytorium zawiera dokumentację planistyczną.

## Uruchamianie

Projekt nie ma jeszcze kodu wykonywalnego. Po zakończeniu bootstrapu główny `package.json` powinien udostępniać spójne polecenia uruchamiane z katalogu głównego:

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:migrate
pnpm db:seed
```

Wymagane wersje Node.js i pnpm zostaną przypięte w repozytorium. Nie należy instalować zależności przed utworzeniem workspace i lockfile.

## Zasady pracy

- gałąź `main` musi pozostać wdrażalna;
- zmiany trafiają przez krótkie gałęzie i pull requesty;
- każdy pull request powinien przechodzić formatowanie, lint, typecheck, testy i build;
- zmiany schematu bazy wymagają migracji i planu zgodności;
- tekst widoczny dla użytkownika musi uwzględniać PL, EN i TH;
- zmiany promptów lub modeli AI wymagają wersjonowania i ewaluacji;
- treści edukacyjne przed publikacją wymagają recenzji językowej;
- nie wolno zatwierdzać sekretów, plików `.env`, danych użytkowników ani nagrań.

Szczegółowa Definition of Done znajduje się w [CLOUDE.md](./CLOUDE.md#25-definition-of-done).

## Bezpieczeństwo i prywatność

Projekt stosuje privacy-by-default i zasadę minimalnych uprawnień. Dane użytkowników, rozmowy oraz przyszłe nagrania muszą mieć zdefiniowany cel, retencję i procedurę usuwania. Odpowiedzi AI są traktowane jako dane niezaufane i podlegają walidacji, moderacji, limitom oraz możliwości zgłoszenia.

Nie zgłaszaj podatności w publicznym issue. Do czasu utworzenia formalnej polityki bezpieczeństwa skontaktuj się prywatnie z właścicielem organizacji Shellty-IT.

## Licencja

Licencja projektu nie została jeszcze określona. Do czasu dodania pliku `LICENSE` wszystkie prawa są zastrzeżone.
