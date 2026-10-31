# Czytelna biblioteka teorii

Sekcja „Teoria i zasady” porządkuje 21 istniejących materiałów według poziomu
oraz pięciu kategorii merytorycznych:

- **Budowa zdań:** szyk, be, inwersja, strona bierna.
- **Czas i czynności:** teraźniejszość, przeszłość, przyszłość i aspekt.
- **Warunki i hipotezy:** sytuacje realne, hipotetyczne i żal za przeszłością.
- **Intencje i uprzejmość:** pytania, prośby, stopień pewności.
- **Łączenie myśli:** przyczyna, skutek, kontrast.

Kategorie przypisane są jawnie w katalogu treści, niezależnie od tłumaczenia tytułu.
Wspólne etykiety działają dla kursów angielskiego i tajskiego. Interfejs i metadane
są dostępne po polsku, angielsku i tajsku.

## Biblioteka

Początkowo wybrany jest poziom z profilu. Poziom, kategoria i wyszukiwanie działają
łącznie. Wyszukiwarka obejmuje tytuł lokalny i angielski, wprowadzenie, schemat
oraz nazwę kategorii; rozpoznaje polskie słowa bez znaków diakrytycznych.
Filtry pozostają ustawione po powrocie z czytania.

Lista jest pogrupowana tematycznie. Karty pokazują pełny tytuł i poziom,
bez powtarzania długiego wprowadzenia. Filtry kategorii mają liczniki wyników.
Puste kategorie są ukryte, z wyjątkiem aktualnie wybranej. Brak wyników ma
wyjaśnienie i przycisk przywracający wszystkie materiały.

## Czytanie

Każdy temat ma stałą kolejność:

1. Niebieska **zasada** — objaśnienie użycia.
2. Fioletowa **budowa** — osobny wiersz dla każdej formy.
3. Zielone **przykłady** — zdanie i podpisane tłumaczenie w oddzielnej ramce.
4. Bursztynowe **Uważaj** — typowe błędy.
5. Dostępne powiązane ćwiczenia.

Kolor jest uzupełnieniem etykiet, numerów i nagłówków. Nie zmieniono reguł oceniania,
postępów ani zawartości przykładów. Czytanie nadal nie nalicza punktów.

## Inspiracje i zakres

- [Busuu Grammar Review](https://help.busuu.com/hc/en-us/articles/12575126438674-What-is-Grammar-Review):
  wybór konkretnego zagadnienia oraz połączenie objaśnienia z praktyką.
- [Duolingo: nauka gramatyki](https://blog.duolingo.com/language-rules-learning-grammar-on-duolingo/):
  krótkie objaśnienia zasad powiązane z lekcjami.

Implementacja używa istniejącego React Native/Expo i nie dodaje zależności
produkcyjnych. Paleta tego widoku jest jasna, zgodnie z obecną sekcją nauki.
To zmiana aplikacji mobilnej; nie wymaga migracji ani zmiany API.

## Weryfikacja

Testy komponentowe obejmują łączenie filtrów, wyszukiwanie bez polskich znaków,
powrót do listy, pusty wynik i reset, wybór praktyki oraz kurs tajski w PL/EN/TH.
Test katalogu sprawdza kompletność kategorii i tłumaczeń.

Podgląd rzeczywistych komponentów React Native Web sprawdzono w przeglądarce
przy szerokościach 320, 360, 412 i 768 px. To weryfikacja responsywności i interakcji,
nie test na fizycznym Androidzie ani audyt TalkBack.
