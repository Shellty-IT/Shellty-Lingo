# Decyzje produktowe MVP

## 1. Problem i obietnica produktu

Dorośli uczący się języka często oddzielają kurs od praktycznej rozmowy, nie wiedzą co ćwiczyć danego dnia i tracą regularność. Shellty Lingo ma prowadzić użytkownika przez krótką pętlę:

`plan na dziś → lekcja lub powtórka → bezpieczna praktyka z AI → konkretna informacja zwrotna → następne zadanie`

Obietnica MVP: **w 10–15 minut użytkownik wykonuje sensowną sesję dopasowaną do kursu, a po rozmowie rozumie najważniejsze błędy i wie, co powtórzyć.**

## 2. Proto-persony

Są to hipotezy do walidacji, a nie wynik przeprowadzonych wywiadów.

| Persona | Sytuacja | Główne zadanie | Bariery | Sygnał wartości |
|---|---|---|---|---|
| Marta, 34, PL, angielski A2 | pracuje biurowo, ma nieregularny grafik | swobodniej pisać i mówić w pracy | wstyd przed rozmową, brak planu, mało czasu | wraca 3 razy w tygodniu i rozpoczyna scenariusz zawodowy |
| Piotr, 42, PL, tajski od zera | przygotowuje podróż i kontakty z Tajlandią | rozpoznać pismo i poradzić sobie w prostych sytuacjach | tony, alfabet, nadmiar transliteracji, mało polskich materiałów | kończy ścieżkę alfabetu i używa pierwszego scenariusza sytuacyjnego |
| Nicha, 28, TH, angielski A2 | używa tajskiego interfejsu, uczy się do pracy | ćwiczyć naturalne, grzeczne wypowiedzi po angielsku | obawa przed błędami, niejasne wyjaśnienia gramatyczne | rozumie poprawkę po tajsku i zapisuje zwrot do powtórki |

Nie projektujemy osobnej persony „gracza”. Seria i odznaki wspierają nawyk, ale nie są główną wartością produktu.

## 3. Najważniejsze scenariusze użycia

| Priorytet | Scenariusz | Oczekiwany rezultat | Główny KPI |
|---|---|---|---|
| 1 | Pierwsze uruchomienie, kurs, cel i test | użytkownik trafia do pierwszej właściwej lekcji w maks. 5 minut | aktywacja |
| 2 | Codzienna sesja 10–15 minut | użytkownik kończy plan złożony z lekcji i należnych powtórek | regularność 3+ dni/tydzień |
| 3 | Słownik kontekstowy w zadaniu | użytkownik rozumie fragment bez utraty odpowiedzi i zapisuje potrzebne słowo | użycie słownika → ukończenie ćwiczenia |
| 4 | Rozmowa tekstowa z Tutorem AI | użytkownik ćwiczy bezpiecznie i dostaje zwięzłą, zrozumiałą korektę | ukończenie pierwszej rozmowy |
| 5 | Analiza postępu i wznowienie | użytkownik widzi osobny postęp EN/TH i wie, co zrobić dalej | powrót D7/D30 |

## 4. Zakres treści startowej

### Angielski

- poziomy: A1 i A2; test może rozpoznać wyższy poziom, ale kieruje do najwyższej dostępnej ścieżki z jasnym komunikatem;
- 30 lekcji: 15 A1 i 15 A2, po 5–8 minut;
- 6 modułów: podstawy kontaktu, codzienność, podróż, restauracja/usługi, praca, swobodna rozmowa;
- 360 recenzowanych haseł oraz 24 podstawowe tematy gramatyczne;
- 12 scenariuszy rozmowy AI, po 2 na moduł;
- każde ćwiczenie posiada tekst PL/EN/TH, odpowiedź deterministyczną, wyjaśnienie i metadane poziomu.

### Tajski

- poziomy: Pre-A1 i A1; nie deklarujemy automatycznej oceny poprawności wymowy;
- 30 lekcji: 15 alfabet/tony i 15 sytuacyjnych;
- ścieżka pisma: 44 spółgłoski pogrupowane dydaktycznie, najczęstsze samogłoski, cyfry, klasy spółgłosek i pięć tonów;
- ścieżka sytuacyjna: powitania, grzeczność, przedstawianie się, liczby/ceny, jedzenie, droga i transport;
- 300 recenzowanych haseł z zapisem tajskim, transliteracją, tonem, znaczeniem, przykładem i zweryfikowanym audio tam, gdzie jest dostępne;
- 10 scenariuszy rozmowy AI z parametrem płci osoby mówiącej i rejestrem formalnym/potocznym;
- każdy materiał tajski wymaga recenzji native speakera przed publikacją.

### Definition of Done lekcji

Lekcja nie może przejść do `published`, jeśli nie ma celu, poziomu, 6–10 ćwiczeń, kompletu PL/EN/TH, poprawnych odpowiedzi, wyjaśnień, wymaganych wpisów słownika, opisu dostępności mediów oraz akceptacji autora i niezależnego recenzenta.

## 5. Oferta i limity

### Zamknięta beta

Beta jest bezpłatna, bez ekranu płatności. Obowiązują jednak techniczne limity AI identyczne z planem Premium, aby mierzyć koszt i zapobiegać nadużyciom.

### Publiczne MVP

| Funkcja | Free | Premium |
|---|---|---|
| Onboarding i test poziomujący | pełny | pełny |
| Nowe lekcje | 1 dziennie | bez limitu katalogowego |
| Należne powtórki SRS | do 20 dziennie | bez limitu katalogowego |
| Słownik, tłumaczenie i TTS | 10 dynamicznych zapytań dziennie; wpisy kursowe bez limitu | 100 dynamicznych zapytań dziennie |
| Rozmowy AI | 4 na okres rozliczeniowy, maks. 12 tur | 40 na okres rozliczeniowy, maks. 20 tur |
| Postęp i plan | podstawowy, 30 dni historii | pełna historia i analiza błędów |
| Cena robocza | 0 PLN | 39,99 PLN/mies. lub 299,99 PLN/rok |

Cena jest hipotezą do testu willingness-to-pay; nie należy publikować produktu płatnego przed jej walidacją i sprawdzeniem lokalnych cen sklepów.

### Zasady naliczania AI

1. Jednostką limitu jest rozpoczęta rozmowa, w której dostarczono pierwszą poprawną odpowiedź asystenta.
2. Timeout, błąd moderacji po stronie systemu i retry z tym samym kluczem idempotencji nie zużywają kolejnej jednostki.
3. Ponowne otwarcie tej samej rozmowy w ciągu 30 minut nie tworzy nowej jednostki, dopóki nie została zakończona.
4. Jedna tura to wiadomość użytkownika i odpowiadająca jej wiadomość AI. Limit znaków wejścia wynosi 900 na wiadomość.
5. Limit jest egzekwowany przez API według okresu uprawnienia; dodatkowo obowiązuje 2 rozmowy/dzień Free i 8/dzień Premium.
6. Podsumowanie rozmowy wlicza się w koszt tej rozmowy, ale nie w liczbę tur.
7. Twardy kill switch wyłącza nową rozmowę po przekroczeniu globalnego budżetu; lekcje i powtórki nadal działają.

## 6. Granice MVP

Poza MVP pozostają: rozmowa głosowa realtime, przesyłanie nagrań, punktacja wymowy/tonów, pełny offline, publiczna aplikacja webowa ucznia, społeczność, lektorzy, certyfikaty, ligi, plany rodzinne i firmowe oraz kolejne języki.

Nie używamy sformułowań „dla każdego poziomu”, „ocenia wymowę” ani „bezbłędny tutor AI” w komunikacji MVP.

