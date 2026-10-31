# Teoria i wyjaśnienia odpowiedzi

## Zachowanie aplikacji

- **Lekcje → Teoria i zasady** otwiera osobną bibliotekę 21 lekcji do czytania:
  angielski A1–C1 oraz tajski A1–B2. Użytkownik może wybrać dowolny poziom,
  niezależnie od swojego poziomu ćwiczeń.
- Każdy temat zawiera zastosowanie, regułę, schemat, przykłady z tłumaczeniem
  i typowe błędy. Dostępne powiązane lekcje praktyczne można otworzyć z teorii.
  Samo czytanie nie zapisuje próby, nie nalicza punktów i nie wymaga AI.
- Po **każdej** ocenionej odpowiedzi wielokrotnego wyboru wyświetlana jest zasada
  i omówienie wszystkich opcji, również niezaznaczonych. Dotyczy to wyników
  poprawnych, częściowych i błędnych.
- Omówienie rozróżnia błąd gramatyczny od poprawnego zdania, które nie odpowiada
  na polecenie lub nie pasuje do sytuacji. Podaje regułę, wskazuje błąd i pokazuje
  poprawioną formę albo trafniejszą wypowiedź.
- Po układaniu zdania aplikacja pokazuje pełne poprawne zdanie oraz jego
  tłumaczenie w języku interfejsu, także przy odpowiedzi bezbłędnej.
  Tłumaczymy całość, nie osobne kafelki.
- Starsze połączone zadania A1 otrzymują w nowych rewizjach dwa jawne pytania
  i oznaczenia `[1]` / `[2]` przy opcjach, aby ta sama forma nie miała sprzecznej
  oceny bez widocznego kontekstu.

## Dane i zgodność

`choice-explanations.ts` zawiera omówienia w PL/EN/TH dla wszystkich istniejących
zestawów wielokrotnego wyboru. Dopasowanie wymaga całego zestawu opcji i zgodnego
klucza odpowiedzi; kolejność i identyfikatory mogą się zmieniać. API zachowuje pełne
wyjaśnienia redakcyjne, a ogólnikowe objaśnienia starszych rewizji uzupełnia z tego
katalogu podczas nowej próby. Nie modyfikuje historycznych wyników ani kluczy oceniania.

`ordering-translations.ts` dostarcza pełne tłumaczenia zdań ze wszystkich zadań
układania w obecnym katalogu. API preferuje tłumaczenie redakcyjne zapisane jako
`answerTranslation`, a następnie używa katalogu. Nowe opcjonalne pole odpowiedzi
`feedback.answerTranslation` nie zmienia formatu żądania ani wyniku oceny.
Starsze klienty mogą je zignorować. Brak tłumaczenia nie blokuje zapisu próby.

Katalogi nie wymagają migracji ani ponownego publikowania istniejących lekcji,
aby wyjaśnienia i tłumaczenia działały w nowych próbach. Seed demonstracyjny zapisuje
też tłumaczenia oraz uwzględnia rozwinięte zadania w skrócie nowej rewizji.

## Wymagania redakcyjne

Nowe zadanie wielokrotnego wyboru wymaga zweryfikowanego wyjaśnienia w PL/EN/TH,
cytującego każdą opcję. Bramka kompletności sprawdza obecność cytatów i tłumaczeń;
nie udaje automatycznej recenzji językowej. Recenzent musi sprawdzić zasadę,
czas gramatyczny, znaczenie, konkretne uzasadnienie oraz poprawkę każdego błędu.
Nie wolno nazywać gramatycznie poprawnego dystraktora niegramatycznym.

Nowe zadanie układania wymaga zweryfikowanego `answerTranslation` w każdym języku
interfejsu. Pole zawiera pełne poprawne zdanie, bez komentarza i numerów kafelków.

## Weryfikacja i wydanie

Testy obejmują pełny katalog, zmianę kolejności/ID opcji, niezgodny klucz odpowiedzi,
przypadki poprawne/częściowe/błędne, polskie znaczenie zdania warunkowego,
bramkę redakcyjną i przejście teoria → praktyka. Biblioteka nie zmienia
poziomu profilu ani dostępności płatnych funkcji.

Wydanie obejmuje API oraz aktualizację JS aplikacji Expo. Zachowany runtime `1.0.0`
i brak nowych modułów natywnych pozwalają dostarczyć je istniejącemu Androidowi
przez kanał `production`. Weryfikacja po publikacji: zdrowe API, nowe omówienie po
próbie wielokrotnego wyboru, tłumaczenie po układaniu oraz dostępna kategoria teorii.
Rollback: poprzedni deploy API i poprzednia grupa aktualizacji Expo.
