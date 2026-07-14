# Stany, błędy i komunikacja zaufania do AI

## Macierz stanów asynchronicznych

| Stan | Co widzi użytkownik | Główna akcja | Zachowanie danych |
|---|---|---|---|
| `loading` | szkielet o kształcie finalnej treści i etykietę | anuluj tylko gdy operacja jest długa | nie czyścimy poprzednich danych bez potrzeby |
| `empty` | przyczynę pustego widoku i pierwszy krok | rozpocznij / zmień filtr | stan jest prawidłowy, nie raportujemy błędu |
| `offline` | informację o braku sieci i zakresie nadal dostępnym | spróbuj ponownie | odpowiedź lokalna pozostaje, zapis ma idempotency key |
| `error` | ludzki opis, identyfikator pomocy opcjonalnie | ponów | nie dublujemy operacji ani postępu |
| `limit` | co zostało wykorzystane, kiedy limit wróci i co nadal działa | wróć do lekcji / zobacz plan | nie udajemy awarii technicznej |
| `session-expired` | powód bezpieczeństwa i informację o zachowaniu pracy | zaloguj ponownie | stan formularza/ćwiczenia lokalnie zachowany |
| `partial` | dostępne dane i czego brakuje | ponów brakujący fragment | poprawne dane pozostają widoczne |
| `sync-pending` | znacznik „Zapiszemy po połączeniu” | bez wymaganej akcji | kolejka lokalna i deduplikacja |

## Zasady komunikatów

Komunikat odpowiada kolejno na cztery pytania: co się stało, co zachowaliśmy, co użytkownik może zrobić i — jeśli ma znaczenie — kiedy sytuacja się zmieni. Nie używamy kodów HTTP, słów „nieprawidłowy użytkownik” ani obietnic bez pokrycia.

Przykład:

> Nie udało się połączyć. Twoja odpowiedź została zachowana na tym urządzeniu. Sprawdź internet i spróbuj ponownie.

## AI jako dane niezaufane

### Przed rozmową

Pokazujemy krótko:

- „Rozmawiasz z AI, nie z człowiekiem.”
- „Tutor może się mylić — zwłaszcza w niuansach kulturowych i języku tajskim.”
- „Nie wpisuj danych poufnych.”
- wybrany poziom, scenariusz, tryb korekty i pozostały limit.

### W trakcie

- odpowiedź jest jednoznacznie podpisana „Tutor AI”;
- streaming ma stan „Tutor odpowiada…” i przycisk anulowania;
- korekta nie oznacza całej wypowiedzi jako błędnej, jeśli zmiana jest tylko bardziej naturalnym wariantem;
- niska i średnia pewność są widoczne tekstowo;
- moderacja nie zawstydza: „Nie mogę pomóc z tą treścią. Spróbujmy innego sformułowania lub scenariusza.”;
- zgłoszenie jest dostępne z menu każdej odpowiedzi.

### Po rozmowie

Podsumowanie rozdziela:

1. błędy o wysokiej pewności;
2. sugestie naturalniejszego brzmienia;
3. nowe słowa i zwroty;
4. rekomendowane zadanie;
5. zastrzeżenie oraz akcję zgłoszenia.

Nie modyfikujemy poziomu ani trwałej historii błędów na podstawie odpowiedzi, która nie przeszła walidacji kontraktu.

## Wzorzec pewności

| Poziom | Copy | Użycie |
|---|---|---|
| wysoka | „Pewność: wysoka” | jednoznaczna gramatyka lub kontrakt deterministyczny |
| średnia | „Może zależeć od kontekstu” | styl, rejestr, naturalność |
| niska | „Sprawdź z dodatkowym źródłem” | niuans kulturowy, wieloznaczność, niewystarczający kontekst |

Pewność jest atrybutem konkretnej sugestii, nie autorytetem całej rozmowy. Nie pokazujemy fałszywej precyzji procentowej.

## Limit i kill switch

Gdy AI jest wyłączone lub limit osiągnięty:

- plan, lekcje, powtórki i zapisane słowa pozostają aktywne;
- ekran AI wyjaśnia, czy chodzi o limit użytkownika, chwilową przerwę czy globalne wyłączenie;
- nie nakłaniamy do płatności w sytuacji awarii systemu;
- retry z tym samym kluczem nie nalicza nowej rozmowy.

## Analityka bez treści

Do zdarzeń trafiają wyłącznie identyfikatory scenariusza/trybu, status, czas, liczba tur, poziom pewności, typ błędu i fakt zgłoszenia. Nie wysyłamy treści wiadomości, korekt, e-maila, tokenów ani pełnego PII.
