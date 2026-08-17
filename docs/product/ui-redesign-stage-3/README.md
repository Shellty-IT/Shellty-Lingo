# Redesign UI/UX — Faza 3: doświadczenie lekcji i feedback

**Status:** implementacja techniczna ukończona; testy czytników ekranu, tekstu 200% i obserwacja użytkowników na urządzeniach pozostają otwarte.

## Cel

Faza 3 przebudowuje moment faktycznej nauki. Użytkownik ma od razu rozumieć polecenie, widzieć treść w odpowiedniej hierarchii, otrzymać jednoznaczny feedback oraz przejść do kolejnego zadania bez szukania głównej akcji.

## Dostarczone rezultaty

| Rezultat                                                               | Status | Dowód                                      |
| ---------------------------------------------------------------------- | ------ | ------------------------------------------ |
| Kompaktowy kontekst lekcji i jawny licznik ćwiczeń                     | gotowe | `LessonView` i `styles.lessonContext`      |
| Czytelna hierarchia: polecenie → materiał → odpowiedź → feedback → CTA | gotowe | `apps/mobile/src/learning/lesson-view.tsx` |
| Poprawne role radio/checkbox dla odpowiedzi                            | gotowe | warianty opcji w `LessonView`              |
| Oddzielny feedback poprawny, częściowy i błędny                        | gotowe | `feedbackTone` i semantyczne style         |
| Oczekiwana odpowiedź w języku użytkownika                              | gotowe | `expectedAnswerText`                       |
| Ukrycie tekstu źródłowego w ćwiczeniu słuchowym                        | gotowe | wariant `listening` promptu                |
| Powtórne i wolniejsze odtwarzanie nagrania                             | gotowe | kontrolki 1× / 0,7×                        |
| Słownik jako dostępny panel skupiony                                   | gotowe | `DictionarySheet`                          |
| Informacja o automatycznym tłumaczeniu                                 | gotowe | jawny komunikat w panelu słownika          |
| CTA zachowujące etykietę podczas ładowania                             | gotowe | `PrimaryButton.loading`                    |
| Rozbudowane podsumowanie wyniku                                        | gotowe | wynik, liczba ćwiczeń i gotowe powtórki    |
| Reguły prezentacji objęte testami jednostkowymi                        | gotowe | `lesson-presentation.test.ts`              |

## Hierarchia ćwiczenia

```text
Zamknięcie + postęp
└── Kontekst lekcji i numer ćwiczenia
    └── Polecenie
        └── Materiał źródłowy / odtwarzacz
            └── Obszar odpowiedzi
                └── Feedback i oczekiwane rozwiązanie
                    └── Sprawdź / Dalej / Zakończ lekcję
```

Główna akcja pozostaje po treści w naturalnej kolejności fokusu. Ekran jest przewijany, dlatego przy tekście 200% akcja nie zasłania odpowiedzi ani feedbacku.

## Zasady feedbacku

- `correct`: zielony stan, ikona i tekst „Poprawna odpowiedź”;
- `partial`: bursztynowy stan „Prawie dobrze”, oczekiwane rozwiązanie i wyjaśnienie;
- `incorrect`: czerwony stan, oczekiwane rozwiązanie i wyjaśnienie;
- kolor nigdy nie jest jedynym nośnikiem wyniku;
- poprawne opcje i błędnie zaznaczone opcje otrzymują osobne obramowanie oraz kolor tekstu;
- identyfikatory odpowiedzi z API są zamieniane na tekst widoczny dla użytkownika;
- feedback jest ogłaszany jako dostępny komunikat, ale nie przejmuje ręcznie fokusu.

## Ćwiczenia słuchowe

Tekst przekazywany do syntezy mowy nie jest wyświetlany przed odpowiedzią. Interfejs pokazuje wyłącznie polecenie, neutralny opis odtwarzacza oraz kontrolki odsłuchu. Zapobiega to sytuacji, w której poprawną odpowiedź można odczytać bez słuchania.

## Słownik kontekstowy

Panel słownika:

1. otwiera się ponad lekcją i izoluje kontekst dostępności;
2. ma własny stan ładowania oraz zawsze dostępne zamknięcie;
3. pokazuje znaczenie, tłumaczenie w kontekście i przykład;
4. obsługuje TTS źródła i tłumaczenia oraz wolniejsze tempo;
5. pozwala zapisać element do powtórek;
6. oznacza tłumaczenie automatyczne i informuje, że może wymagać weryfikacji;
7. nie wysyła treści wyszukiwanego słowa do telemetrii produktu.

Każde słowo-klucz ma cel dotykowy o wysokości minimum 44 pt. Panel jest przewijany, więc działa także przy dużym tekście i na małych ekranach.

## Podsumowanie lekcji

Podsumowanie pokazuje:

- nazwę ukończonej lekcji;
- wynik procentowy;
- liczbę ukończonych ćwiczeń;
- liczbę powtórek gotowych po lekcji;
- jedno CTA prowadzące z powrotem do katalogu i odświeżonego planu.

## Skalowalność

- Logika określająca gotowość odpowiedzi, ton feedbacku i tekst oczekiwanego rozwiązania znajduje się poza komponentem widoku i ma testy jednostkowe.
- Słownik jest osobnym komponentem, dzięki czemu może zostać wykorzystany w powtórkach lub rozmowie bez kopiowania całej lekcji.
- `PrimaryButton` obsługuje stan ładowania jako wspólny kontrakt, zachowując etykietę i szerokość.
- Style pozostają oparte na semantycznych tokenach, bez wprowadzania nowej lokalnej palety.

## Brama jakości

- typecheck aplikacji mobilnej, API, tłumaczeń i kontraktów przechodzi;
- testy prezentacji odpowiedzi oraz pełny zestaw testów API przechodzą;
- lint, formatowanie i kontrola różnic nie zgłaszają problemów;
- każdy typ ćwiczenia działa dla PL, EN i TH;
- VoiceOver i TalkBack poprawnie ogłaszają role wyboru, postęp i feedback;
- przy tekście 200% odpowiedzi, słownik i CTA pozostają osiągalne;
- ćwiczenie słuchowe nie ujawnia transkrypcji przed odpowiedzią;
- zamknięcie słownika zwraca użytkownika do tego samego miejsca lekcji.

Ostatnie cztery kryteria wymagają fizycznego urządzenia lub sesji badawczej.
