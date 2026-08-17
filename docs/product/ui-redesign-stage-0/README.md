# Redesign UI/UX — Etap 0: pomiar i diagnoza

**Status:** przygotowanie techniczne i badawcze ukończone; pomiar baseline oraz sesje z użytkownikami wymagają danych po wdrożeniu i rekrutacji.

## Cel

Etap 0 ustanawia źródła prawdy przed przebudową interfejsu. Nie przypisuje redesignowi efektów bez wcześniejszego pomiaru i nie wpisuje fikcyjnych wyników badań.

## Dostarczone rezultaty

| Rezultat                                    | Status                 | Źródło                                             |
| ------------------------------------------- | ---------------------- | -------------------------------------------------- |
| Jawny katalog zdarzeń UX                    | gotowy                 | [`analytics-baseline.md`](./analytics-baseline.md) |
| Prywatnościowy filtr właściwości telemetrii | gotowy                 | `ReleaseService.telemetry`                         |
| Raport administracyjny baseline             | gotowy                 | `GET /v1/release/baseline?windowDays=14`           |
| Inwentarz ekranów, komponentów i stanów     | gotowy                 | [`ux-inventory.md`](./ux-inventory.md)             |
| Protokół wywiadów i testów                  | gotowy                 | [`research-protocol.md`](./research-protocol.md)   |
| Wynik minimum 14 dni baseline               | oczekuje na dane       | po wdrożeniu wersji z nową telemetrią              |
| Wywiady i testy z uczestnikami              | oczekuje na rekrutację | nie wolno zastępować wyniku założeniem zespołu     |

## Decyzje Etapu 0

1. Główną metryką redesignu są wartościowe sesje nauki, nie czas spędzony w aplikacji ani liczba kliknięć.
2. Zdarzenia ukończenia lekcji, powtórki, rozmowy i Listening Lab zapisuje backend jako źródło prawdy. Klient nie dubluje tych zdarzeń.
3. Klient mierzy wyłącznie zachowanie, którego backend nie zna: zobaczenie i wybór planu, kroki onboardingu, otwarcie słownika oraz świadome wyjście z lekcji.
4. Treść odpowiedzi, rozmów, nagrań i wyszukiwanych słów nie trafia do telemetrii UX.
5. Raport baseline jest oddzielony od raportu gotowości wydania, ponieważ odpowiada na inne pytania produktowe.
6. Pierwsze porównanie redesignu może nastąpić dopiero po pełnym oknie baseline i wdrożeniu jednej zdefiniowanej zmiany.

## Brama przejścia do Etapu 1

Prace projektowe mogą rozpocząć się na podstawie inwentarza, ale decyzje ilościowe wymagają:

- minimum 14 kolejnych dni poprawnie zbieranej telemetrii;
- kontroli, czy zdarzenia domenowe nie są dublowane;
- co najmniej 12 zakończonych sesji badawczych z segmentów opisanych w protokole;
- osobnej recenzji tajskiego i dostępności;
- zatwierdzenia listy problemów P0/P1 przez Product Ownera i UX Lead.

## Ograniczenia

- Repozytorium nie zawiera eksportu opinii ze sklepów, ticketów supportu ani nagrań wcześniejszych badań.
- Bez uruchomionego środowiska z realnymi testerami raport baseline prawidłowo zwróci zera lub `null`; nie jest to wynik oceny produktu.
- Dane sprzed wdrożenia nowych zdarzeń nie mogą być porównywane jeden do jednego z pełnym lejkiem po wdrożeniu.
