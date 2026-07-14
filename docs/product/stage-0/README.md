# Etap 0 — pakiet decyzji produktowych

**Wersja:** 0.1  
**Data:** 2026-07-14  
**Status:** pakiet decyzji gotowy do akceptacji; formalne zamknięcie etapu wymaga realnych wywiadów, akceptacji Product Ownera i przeglądu prawnego

Ten katalog jest wynikiem Etapu 0 z [`PLAN_BUDOWY.md`](../../../PLAN_BUDOWY.md). Zamyka robocze decyzje potrzebne do projektowania produktu, oszacowania kosztów i przygotowania backlogu. Nie zastępuje badań z realnymi użytkownikami ani porady prawnej.

## Rezultaty etapu

| Rezultat | Dokument | Stan |
|---|---|---|
| Persony, scenariusze, zakres MVP i treści | [Decyzje produktowe](./product-decisions.md) | gotowe jako hipotezy robocze |
| Plan i materiał do rozmów z użytkownikami | [Badania użytkowników](./user-research.md) | rekrutacja i wywiady wymagają działania człowieka |
| KPI, definicje i progi decyzji | [Definicja sukcesu](./success-metrics.md) | gotowe; baseline powstanie w becie |
| Mapa zdarzeń | [Analityka](./analytics-map.md) | gotowa |
| Wstępna DPIA i retencja | [Prywatność i DPIA](./privacy-dpia.md) | gotowa technicznie; wymaga danych administratora i przeglądu prawnego |
| Dostawcy i budżet | [Dostawcy i budżet](./vendors-and-budget.md) | rekomendacja gotowa do zatwierdzenia |
| Backlog z odpowiedzialnością i akceptacją | [Backlog produktu](./product-backlog.md) | gotowy |
| Wiążący kierunek wizualny | [Baseline designu](./design-baseline.md) | odtworzony z dostarczonego prototypu |
| Rejestr decyzji | [Rejestr decyzji](./decision-register.md) i [`docs/adr`](../../adr/) | gotowy |

## Decyzje obowiązujące domyślnie

Do czasu jawnej zmiany przez Product Ownera przyjmujemy:

1. Pierwszym rynkiem jest Polska, a dodatkowym segmentem weryfikacyjnym są użytkownicy tajskojęzyczni uczący się angielskiego.
2. Katalog startowy obejmuje angielski A1–A2 oraz tajski Pre-A1–A1. Wynik testu ponad katalog nie jest obietnicą kursu B1+.
3. Zamknięta beta jest bezpłatna. Publiczne MVP używa freemium z limitem AI egzekwowanym przez API.
4. Tekstowa rozmowa z AI jest częścią MVP; wejście audio, rozmowa głosowa i punktacja wymowy pozostają poza MVP.
5. Treść rozmowy przechowujemy domyślnie przez 30 dni, a wyprowadzone przez użytkownika poprawki i zapisane słowa do usunięcia konta.
6. Infrastruktura i główne magazyny danych działają w regionie Frankfurt; dane nie trafiają do analityki ani monitoringu jako treść rozmowy.
7. Prototyp z folderu `Shellty Lingo — interfejs aplikacji` jest wizualnym źródłem prawdy dla Etapu 1 i implementacji mobilnej.

## Warunki pełnego zamknięcia

Poniższych czynności nie można rzetelnie wykonać wyłącznie w repozytorium:

- przeprowadzenie co najmniej 12 rozmów z rzeczywistymi przedstawicielami trzech segmentów i zapisanie zanonimizowanych wniosków;
- akceptacja zakresu treści przez metodyka angielskiego i eksperta języka tajskiego;
- podanie danych administratora danych, zatwierdzenie podstaw prawnych, umów powierzenia i transferów przez prawnika lub IOD;
- zatwierdzenie miesięcznego budżetu oraz ceny przez właściciela produktu.

Do czasu ich wykonania decyzje oznaczone `warunkowa` mogą prowadzić do prototypowania i fundamentów technicznych, ale nie do pozyskiwania płatnych użytkowników.

## Definition of Ready dla Etapu 1

- [x] pięć głównych scenariuszy ma priorytet i miernik sukcesu;
- [x] każdy element MVP ma właściciela rolowego, priorytet, etap i kryterium akceptacji;
- [x] katalog startowy ma jawne granice oraz właścicieli recenzji;
- [x] istnieją progi KPI i kosztu AI;
- [x] istnieje mapa zdarzeń bez treści i PII;
- [x] istnieje wstępna DPIA, retencja i lista ryzyk;
- [x] istnieje lista dostawców, wariant kosztowy i plan wyjścia;
- [x] stylistyka prototypu została przepisana na tokeny i reguły komponentów;
- [ ] Product Owner zaakceptował pakiet;
- [ ] rozmowy z użytkownikami potwierdziły lub zmieniły hipotezy.
