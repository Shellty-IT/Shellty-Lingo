# Plan walidacji prototypu

## Status i odpowiedzialność

Dokument jest gotowym protokołem badania, nie raportem z wykonanych badań. Wynik podpisują: UX/UI Lead, Product Owner oraz Thai Language Lead dla tajskiego. Rekrutacja wymaga świadomej zgody; notatki są anonimizowane.

## Próba

Minimum 12 osób:

- 5 osób zbliżonych do Marty (PL, EN A1–A2);
- 4 osoby zbliżone do Piotra (PL, TH od zera);
- 3 osoby zbliżone do Nichy (TH, EN A1–A2), w tym co najmniej jeden native speaker wykonujący osobny przegląd składu;
- co najmniej 3 osoby używające powiększonego tekstu lub technologii asystującej.

Badanie prowadzimy na minimum jednym fizycznym iPhonie i dwóch Androidach, w tym urządzeniu o szerokości około 320–360 dp.

## Zadania moderowane

### V-01 — pierwsze uruchomienie

Polecenie: „Chcesz przygotować angielski do sytuacji w pracy i masz około 10 minut dziennie. Skonfiguruj aplikację i sprawdź proponowany poziom.”

Sukces: ukończenie bez podpowiedzi, poprawne rozróżnienie języka UI i kursu, czas ≤5 min, brak cofnięcia wynikającego z niezrozumiałej etykiety.

### V-02 — pierwsza lekcja

Polecenie: „Wykonaj pierwsze zadanie z planu na dziś. Jeśli nie rozumiesz słowa, sprawdź je, a potem dokończ lekcję.”

Sukces: odnalezienie CTA, poprawne użycie odpowiedzi, słownik nie niszczy stanu, użytkownik rozumie informację zwrotną i dociera do podsumowania.

### V-03 — rozmowa AI

Polecenie: „Rozpocznij bezpieczną rozmowę o zamawianiu w kawiarni. Wybierz poprawianie po każdej wiadomości.”

Sukces: użytkownik rozumie, że rozmawia z AI, widzi limit i tryb, rozpoczyna rozmowę oraz potrafi odróżnić błąd od naturalniejszej sugestii.

### V-04 — kurs i postęp

Polecenie: „Sprawdź postęp tajskiego, a potem wróć do angielskiego.”

Sukces: uczestnik nie oczekuje wspólnego poziomu, rozpoznaje aktywny kurs i potrafi opisać kolejny krok dla pustego kursu.

### V-05 — awaria i odzyskanie

Moderator przełącza prototyp na offline, błąd i wygasłą sesję.

Sukces: uczestnik opisuje co zostało zachowane i wskazuje właściwą akcję naprawczą; nie interpretuje limitu jako awarii.

## Metryki i progi

| Miernik | Próg bramy |
|---|---:|
| ukończenie V-01 bez pomocy | ≥90% |
| ukończenie V-02 bez pomocy | ≥90% |
| rozpoczęcie AI w V-03 bez pomocy | ≥90% |
| mediana onboarding → Dziś | ≤5 min |
| rozróżnienie UI/kurs | 100% po onboardingu |
| rozpoznanie sugestii AI jako niepewnej | ≥80% |
| błędy krytyczne a11y lub składu TH | 0 otwartych |

Problem krytyczny oznacza brak możliwości ukończenia zadania, utratę danych/odpowiedzi, błędne oczekiwanie o prywatności lub AI, niedostępną główną akcję albo nieczytelny tajski.

## Audyt dostępności

- [ ] iOS VoiceOver: kolejność, nazwy, role, selected/disabled, modal i powrót fokusu;
- [ ] Android TalkBack: analogiczna ścieżka;
- [ ] tekst systemowy 200% na 320–360 dp bez utraty CTA;
- [ ] klawiatura sprzętowa: widoczny fokus i logiczna kolejność;
- [ ] kontrast WCAG 2.2 AA dla tekstu, ikon i fokusu;
- [ ] cele dotykowe minimum platformy;
- [ ] reduced motion: brak wymaganej animacji;
- [ ] informacje o wyniku nie tylko kolorem;
- [ ] komunikaty dynamiczne ogłaszane, ale nie przerywające;
- [ ] orientacja pozioma i klawiatura ekranowa nie blokują zadania.

## Recenzja tajskiego

Native speaker sprawdza na urządzeniu:

- [ ] naturalność i uprzejmość tekstów interfejsu;
- [ ] brak obciętych znaków i diakrytyków przy 100% i 200%;
- [ ] poprawne łamanie bez rozdzielania klastrów znaków;
- [ ] brak sztucznego `letter-spacing`;
- [ ] czytelność różnicy zapis / transliteracja / tłumaczenie;
- [ ] poprawne użycie ครับ/ค่ะ zależnie od ustawionego kontekstu;
- [ ] komunikat, że aplikacja ćwiczy tony, ale nie ocenia wiarygodnie wymowy;
- [ ] sensowną wymowę nazw przez VoiceOver/TalkBack.

## Macierz ekranów

Każde zadanie przechodzimy w PL/EN/TH, na iOS/Android oraz przynajmniej raz przy 200% tekstu. Stany `loading`, `empty`, `offline`, `error`, `limit` i `session-expired` testujemy z selektora prototypu.

## Szablon raportu

| ID | Zadanie/ekran | Urządzenie/język | Obserwacja | Waga P0–P3 | Decyzja | Właściciel |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — |

Po dwóch rundach raport końcowy zawiera: liczebność, wyniki metryk, listę zmian między rundami, otwarte ograniczenia i podpisy właścicieli. Nie wpisujemy fikcyjnych wyników dla niewykonanych sesji.
