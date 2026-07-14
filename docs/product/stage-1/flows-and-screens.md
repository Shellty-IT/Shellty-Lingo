# Przepływy i specyfikacja ekranów

## F-01 — onboarding i test

**Cel:** użytkownik trafia do właściwej pierwszej lekcji w maksymalnie 5 minut.

```text
Start → język UI → kurs → cel → czas → propozycja testu
                                           ├── Rozpocznij → pytania → wynik
                                           └── Pomiń ────────────→ poziom startowy
                                                          ↓
                                                       Dzisiaj
```

Reguły:

- wybór języka UI natychmiast zmienia wszystkie kolejne teksty;
- kurs EN/TH nie może być tym samym polem co język UI;
- test można pominąć bez zawstydzania;
- wynik to rekomendacja poziomu, nie certyfikat;
- powrót zachowuje wybory, a zamknięcie pozwala wznowić konfigurację;
- przy 200% tekstu CTA pozostaje osiągalne przez przewijanie i nie zasłania treści.

## F-02 — plan dnia i pierwsza lekcja

```text
Dzisiaj → Rozpocznij plan → instrukcja → odpowiedź → sprawdzenie
                                                  ├── poprawna → następne
                                                  └── błędna → wyjaśnienie → następne
                                                                   ↓
                                                            podsumowanie lekcji
```

Słownik kontekstowy otwiera się jako panel modalny nad ćwiczeniem. Zamknięcie przywraca dokładnie tę samą odpowiedź, timer i pozycję. Źródło i tłumaczenie mają oddzielne kontrolki TTS oraz etykietę szybkości.

## F-03 — rozmowa z Tutorem AI

```text
Tutor AI → scenariusz → tryb korekty → zasady i limit → rozmowa
                                                    ├── odpowiedź → korekta
                                                    ├── timeout → ponów/anuluj
                                                    ├── limit → wyjaśnienie planu
                                                    └── zakończ → podsumowanie
                                                                      ↓
                                                        zapisz słowa / zgłoś
```

Na wejściu pokazujemy: kurs, poziom, scenariusz, tryb korekty, liczbę dostępnych rozmów i informację, że AI może się mylić. W rozmowie poprawka odróżnia: oryginał, wersję poprawioną, krótkie wyjaśnienie, naturalniejszy wariant i poziom pewności.

## F-04 — postęp i przełączenie kursu

```text
Postępy EN → przełącz kurs → Postępy TH
     ↓                           ↓
metryki EN                  metryki TH / pusty start
```

Kurs jest widoczny w nagłówku. Każda metryka ma opis sposobu liczenia. Pusty kurs pokazuje pierwsze możliwe działanie. Nie agregujemy EN i TH w jedną wartość poziomu ani skuteczności.

## F-05 — ustawienia i prywatność

```text
Profil → sekcja → zmiana → zapis → potwierdzenie
                   ├── błąd → zachowaj formularz + napraw
                   └── offline → zapisz później / anuluj
```

Eksport i usunięcie konta są osobnymi, jasno nazwanymi procesami. Wycofanie zgody nie jest ukryte pod „preferencjami marketingowymi”. Destrukcyjna akcja wymaga potwierdzenia opisującego skutki.

## Inwentarz ekranów MVP

| ID | Ekran | Najważniejsza treść | Główne stany |
|---|---|---|---|
| O-01 | Start | obietnica, rejestracja/logowanie | content, offline |
| O-02 | Język UI | PL/EN/TH z nazwą własną | content |
| O-03 | Kurs | EN/TH, granice poziomów | content |
| O-04 | Cel | praca, podróż, rozmowa, egzamin | content |
| O-05 | Harmonogram | 5/10/15/20 min i dni | content, error |
| O-06 | Test | postęp, pytanie, pominięcie | loading, content, error, session |
| O-07 | Wynik | rekomendacja i ograniczenia | content |
| T-01 | Dziś | kurs, plan, SRS, cel tygodnia | loading, empty, content, error, offline, session |
| L-01 | Nauka | moduły i status lekcji | loading, empty, content, error, offline |
| L-02 | Ćwiczenie | polecenie, treść, odpowiedź, CTA | content, submitting, feedback, offline |
| L-03 | Słownik | kontekst, tłumaczenie, TTS, zapisz | loading, content, no-voice, error, offline, limit |
| L-04 | Wynik lekcji | wynik, błędy, kolejny krok | content, sync-pending, error |
| A-01 | Scenariusze AI | kategorie, koszt limitu | loading, empty, content, limit, offline |
| A-02 | Ustawienia rozmowy | scenariusz, tryb korekty, rejestr | content |
| A-03 | Rozmowa | wiadomości, poprawki, anulowanie | streaming, timeout, moderated, error, limit, offline |
| A-04 | Podsumowanie AI | błędy, zwroty, rekomendacja | generating, content, partial, error |
| P-01 | Postępy | kurs, tydzień, metryki, błędy | loading, empty, content, error |
| S-01 | Profil | konto, języki, kursy, a11y, privacy | loading, content, error |

## Copy krytyczne

| Sytuacja | Zalecany komunikat PL |
|---|---|
| Wynik testu | „Na podstawie tego krótkiego testu proponujemy A1. To wskazówka do wyboru materiału, nie certyfikat.” |
| Awaria planu AI | „Plan automatyczny jest chwilowo niedostępny. Przygotowaliśmy bezpieczny zestaw z Twoich lekcji i powtórek.” |
| Niepewna korekta | „Ta sugestia może zależeć od kontekstu. Pewność: średnia.” |
| Limit AI | „Dzisiejszy limit rozmów został wykorzystany. Lekcje i powtórki nadal działają.” |
| Brak sieci w lekcji | „Nie udało się zapisać odpowiedzi. Zachowaliśmy ją na tym urządzeniu i ponowimy zapis po połączeniu.” |
| Wygasła sesja | „Dla bezpieczeństwa zaloguj się ponownie. Twój postęp na tym ekranie został zachowany.” |

Pełne tłumaczenia copy prototypowego znajdują się w `prototype/app.js`; przed produkcją muszą przejść korektę PL/EN/TH.
