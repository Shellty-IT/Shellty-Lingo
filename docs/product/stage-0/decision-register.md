# Rejestr decyzji Etapu 0

Statusy: `zaakceptowana roboczo`, `warunkowa`, `otwarta`, `odrzucona`.

| ID | Decyzja | Status | Właściciel | Data przeglądu / wyzwalacz | Ślad |
|---|---|---|---|---|---|
| D-001 | Główne segmenty to PL→EN zawodowy, PL/EN→TH początkujący i TH→EN zawodowy | warunkowa | Product Manager | po 12 wywiadach | [persony](./product-decisions.md#2-proto-persony) |
| D-002 | Pięć głównych scenariuszy stanowi kolejność walidacji | zaakceptowana roboczo | Product Owner | po testach prototypu | [scenariusze](./product-decisions.md#3-najważniejsze-scenariusze-użycia) |
| D-003 | Katalog startowy: EN A1–A2, TH Pre-A1–A1 | warunkowa | Content Lead | akceptacja ekspertów/budżetu | [treści](./product-decisions.md#4-zakres-treści-startowej) |
| D-004 | Beta jest bezpłatna; płatności w publicznym MVP | zaakceptowana roboczo | Product Owner | przed rekrutacją bety | [ADR-0005](../../adr/0005-freemium-entitlements.md) |
| D-005 | Free: 4 rozmowy/okres; Premium: 40; cena 39,99/299,99 PLN | warunkowa | Product Manager | wywiady WTP i dane kosztowe | [limity](./product-decisions.md#5-oferta-i-limity) |
| D-006 | Progi aktywacji/retencji/kosztu stanowią go/no-go | zaakceptowana roboczo | Product Owner | po 100 aktywacjach | [KPI](./success-metrics.md) |
| D-007 | Treść rozmowy 30 dni; wnioski do usunięcia użytkownika/konta | warunkowa | Privacy/Security Lead | przegląd prawny i DPA | [DPIA](./privacy-dpia.md) |
| D-008 | Infrastruktura managed, EU-first: Render + AWS | zaakceptowana roboczo | Tech Lead | koszt >520 USD/1k MAU lub niespełnione SLO | [ADR-0002](../../adr/0002-eu-first-managed-infrastructure.md) |
| D-009 | OpenAI przez adapter backendu, `store:false`; EU+ZDR/MAM jako brama publicznego MVP | warunkowa | AI Lead | wynik DPA/TIA/ewaluacji | [ADR-0003](../../adr/0003-ai-boundary-and-retention.md) |
| D-010 | PostHog EU dla produktu, Sentry dla awarii; zero treści/PII | zaakceptowana roboczo | Tech Lead | audyt przed betą | [ADR-0004](../../adr/0004-telemetry-boundaries.md) |
| D-011 | Prototyp jest źródłem stylu; tokeny są kontraktem implementacji | zaakceptowana roboczo | UX/UI Lead | zaakceptowany nowy design | [baseline](./design-baseline.md) |
| D-012 | Rozmowa głosowa, nagrania i scoring wymowy są poza MVP | zaakceptowana roboczo | Product Owner | osobny discovery + DPIA | [backlog POST](./product-backlog.md#funkcje-po-mvp) |
| D-013 | `pnpm` workspaces bez Turborepo na starcie | zaakceptowana roboczo | Tech Lead | czas CI/orkiestracji uzasadnia zmianę | [ADR-0001](../../adr/0001-monorepo-and-toolchain.md) |
| D-014 | Użytkownik końcowy ma 18+; nie zbieramy pełnej daty urodzenia | warunkowa | Privacy/Security Lead | przegląd rynków i prawa konsumenckiego | [DPIA](./privacy-dpia.md) |
| D-015 | Brak realnych wywiadów jest jawnym ograniczeniem, nie syntetycznym dowodem | otwarta | Product Manager | po ukończeniu S0-01 | [badania](./user-research.md) |
| D-016 | Publiczne MVP: API 99,9%, PostgreSQL RPO ≤1 h, podstawowy RTO ≤4 h | zaakceptowana roboczo | DevOps/SRE | ćwiczenie restore i dane z bety | [KPI/SLO](./success-metrics.md#jakość-niezawodność-i-koszt) |

## Decyzje odrzucone

| Pomysł | Powód |
|---|---|
| Bezpośrednie wywołanie AI z aplikacji | ujawnia sekret, omija limity, moderację, koszt i audyt |
| Jeden wspólny postęp dla EN/TH | łamie model `UserCourse` i miesza plan/SRS |
| Automatyczna publikacja treści AI | brak recenzji językowej i ryzyko jakości |
| Nagrywanie głosu „na zapas” w MVP | nieproporcjonalne ryzyko, koszt i brak zwalidowanej wartości |
| Obietnica kursu dla wszystkich poziomów | katalog startowy nie pokrywa B1+ |
| Session replay dla zalogowanej aplikacji w MVP | ryzyko przechwycenia treści i niewykazana konieczność |
