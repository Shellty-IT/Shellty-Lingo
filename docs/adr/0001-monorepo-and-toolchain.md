# ADR-0001: Monorepo i narzędzia bazowe

- **Status:** zaakceptowana roboczo
- **Data:** 2026-07-14
- **Właściciel:** Tech Lead

## Kontekst

MVP obejmuje Expo, NestJS, Next.js, kontrakty, i18n i konfigurację. Potrzebny jest jeden lockfile i spójne komendy bez przedwczesnego dodawania warstwy orkiestracji.

## Decyzja

Używamy `pnpm` workspaces, strict TypeScript i jednego lockfile. Aplikacje trafiają do `apps/mobile`, `apps/api`, `apps/admin`; tylko realnie współdzielony kod do `packages/*`. Skrypty root wywołują polecenia workspace. Turborepo nie wchodzi na starcie; można je dodać po pomiarze czasu CI i powtarzających się zależności zadań.

GitHub Actions uruchamia ten sam lint/typecheck/test/build co lokalnie. Wersje Node i pnpm będą przypięte w Etapie 2.

## Konsekwencje

- prostszy bootstrap i mniej konfiguracji;
- atomowe zmiany kontraktu klient/API;
- cały workspace instaluje się z jednego lockfile;
- brak cache tasków do czasu, aż koszt CI uzasadni dodatkowe narzędzie.

## Ponowny przegląd

Gdy medianowy CI przekroczy 10 minut albo lokalne polecenia wymagają ręcznej orkiestracji co najmniej trzech grafów zależności.

