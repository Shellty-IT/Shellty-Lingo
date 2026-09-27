# ADR: wspólna ocena odpowiedzi i niezmienna poprawa

Data: 2026-09-27. Status: zaimplementowane lokalnie; publikacja wymaga odbioru opisanego w [runbooku](../../product/learning-rollout/README.md).

## Problem

Lekcja i SRS używały różnej normalizacji oraz różnie traktowały awarię AI. Zaliczenie poprawy po pokazaniu wzorca mogłoby zawyżyć samodzielność i powtórnie naliczyć postęp.

## Decyzja

Wprowadzić `answer-v2`: NFC, apostrofy typograficzne do ASCII, małe litery i normalizacja odstępów. `sentence-v2` ignoruje wyłącznie końcowe `. ! ?`; `gap-v2` zachowuje interpunkcję. Nie usuwać apostrofów ani znaków tajskich. Lekcja, SRS i poprawa korzystają z jednej orkiestracji oceny. Klucz ma pierwszeństwo i nie wymaga AI. Zamknięta luka wymaga klucza; własne zdanie może przyjąć ocenę semantyczną `communication-v1`.

Niedostępna lub niebezpieczna ocena AI to `needs_review`. Nie tworzy nowej karty błędu; SRS nie jest automatycznie oceniany jako `again`. Wynik końca lekcji wyłącza takie próby z mianownika, ujawniając ich liczbę. Przy samych nierozstrzygniętych próbach UI pokazuje brak oceny. Wewnętrzne `correct: false`, `score: 0` są wartościami zgodności kontraktu; każda analiza musi sprawdzić status. Nie reinterpretować starych prób bez wersji.

Druga próba ma oddzielny rekord z unikalnym powiązaniem do pierwszej, zamrożony payload oraz `assisted: true`. Nie aktualizuje oryginału, punktów, nagród ani SRS. Zachować dotychczasowy algorytm `srs-v1`. Metadane oceny przechowują wersję rubryki, język odpowiedzi, źródło, a dla udanej oceny AI również provider/model, wersję promptu oraz szacunek tokenów/kosztu.

## Konsekwencje

Wymagane jest skoordynowane wydanie API i klienta obsługującego `needs_review`. Historyczne wyniki pozostają historyczne. Ścisła interpunkcja wewnętrzna może zwiększyć liczbę potrzebnych wariantów w kluczu; redakcja musi je jawnie zatwierdzić. Deadline aplikacji 8 s nie anuluje całego łańcucha dostawców i nie jest gwarancją limitu kosztu. Zmiana tych zasad wymaga nowej wersji polityki, kalibracji i decyzji produktowej.
