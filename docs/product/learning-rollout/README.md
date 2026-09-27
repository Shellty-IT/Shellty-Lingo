# Realizacja audytu zadań — etapy 0–5

Stan techniczny: 27 września 2026. Zmiany są przygotowane lokalnie. Dokument odróżnia implementację od odbioru produktu: testy jednostkowe nie zastępują obserwacji uczniów, akceptacji językowej ani pomiaru po 30 dniach.

Ponowna weryfikacja przed wydaniem produkcyjnym obejmuje wszystkie oczekujące zmiany, również z wcześniejszych sesji. Poprawiono kontekst zdania w powtórce fragmentu, wymóg zatwierdzonych tłumaczeń SRS, izolację odpowiedzi asynchronicznej między wystąpieniami tej samej karty i powrót z błędu kończenia wznowionej lekcji. Ocena według klucza nie jest już pokazywana jako awaria AI. Pomiar transferu odrzuca konteksty poznane przed oknem pomiaru (także z pomocą), przyszłe daty oraz metadane bez statusu `graded`.

CI tworzy teraz osobną bazę `shellty_stage1_test`, stosuje do niej migracje i uruchamia regresje niezawodności; nie korzysta przy tym z danych produkcyjnych. Lokalne testy po pierwszych poprawkach: 399 zaliczonych. Zaktualizowano Next.js do 16.3.3 i poprawione wersje multer, sharp, js-yaml oraz xmldom, usuwając blokadę audytu zależności. Powiązane komunikaty dostawców: [Next.js](https://github.com/advisories/GHSA-p293-qw3h-jr36), [multer](https://github.com/advisories/GHSA-535w-7cp7-47q4), [xmldom](https://github.com/advisories/GHSA-c7q8-3ch8-vqpv). Pozostają wcześniejsze, jawne wyjątki audytu dla narzędzi budowania; nie rozszerzono listy wyjątków.

## Zakres i status

| Etap | Dostarczony zakres                                                                                                                                                                                           | Brama odbioru pozostająca poza implementacją                                                                                                    |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | `baseline.json`: 51 lokalnych lekcji, 380 zadań, macierz EN/TH × A1–C1 × format. Telemetria startu lekcji, odpowiedzi i audio.                                                                               | 6–8 obserwowanych sesji Android/iOS, pomiary sieci i rzeczywistych ekranów. Lokalny czas silnika nie jest opóźnieniem API.                      |
| 1    | Rewizja harmonogramu, niezmienne payloady, trwała kolejka prób, ochrona przed spóźnionymi wynikami. [Szczegóły](../reliable-attempts/README.md).                                                             | Test integracyjny migracji i nowych pól na izolowanym PostgreSQL oraz restart na urządzeniach.                                                  |
| 2    | Renderery siedmiu formatów, instrukcje PL/EN/TH, poprawna rozsypanka, fokus i audio z jawnym wariantem czytania. [Szczegóły](../readable-exercises/README.md).                                               | TalkBack/VoiceOver, tekst 200%, klawiatury PL/EN/TH i odsłuch na urządzeniach.                                                                  |
| 3    | Wspólna ocena lekcji, SRS i poprawy; wersjonowana normalizacja; neutralny wynik awarii AI; szybkie zaliczanie klucza; osobna, idempotentna próba poprawy.                                                    | Zbiór odpowiedzi ocenionych przez dydaktyków EN/TH; kalibracja błędnych zaliczeń i odrzuceń.                                                    |
| 4    | Paczki SRS 5/10; sześć szkiców A2 i identyfikatory umiejętności; jeden wariant interakcji poprawiania fragmentu; podgląd `/pilots`; import szkiców i tłumaczeń do workflow treści.                           | Weryfikacja sześciu lekcji i tłumaczeń przez ludzi oraz ich publikacja w panelu. Szkice nie są zatwierdzonym materiałem.                        |
| 5    | Stały przydział kohorty kursu, zamrożona ekspozycja w sesji, 12 szkiców nowych kontekstów D7/D30; raport retencji/transferu, opóźnień, komfortu i szacunku kosztów; rozmowa z brakującą informacją za flagą. | Obserwacja D7/D30, zaplanowanie liczebności i równoważności prób, analiza porzuceń, kosztów rzeczywiście rozliczonych i decyzja o rozszerzeniu. |

## Reguły oceny

`answer-v2` zachowuje apostrofy, wewnętrzną interpunkcję i tajskie znaki. Zdania dopuszczają końcową kropkę, wykrzyknik lub pytajnik; luka wymaga zatwierdzonej formy. Znana odpowiedź nie wywołuje AI. Luka i odtwarzane zamknięte zadania SRS nie przyjmują semantycznego obejścia klucza. Własne zdanie używa rubryki `communication-v1`, zadanie zamknięte `reference-v1`.

Ocena AI ma limit oczekiwania 8 s. Brak wyniku daje `needs_review`, bez nowej karty błędu lub automatycznej kary SRS. Uczeń może pominąć taką kartę; harmonogram pozostaje bez zmian. Zakończenie lekcji liczy wynik tylko wśród rozstrzygniętych odpowiedzi i pokazuje osobno liczbę nierozstrzygniętych. Stare próby nie są przeliczane. Wywołanie dostawcy może zakończyć się po upływie limitu odpowiedzi aplikacji; szacunek kosztu nie obejmuje pewnie wszystkich takich wywołań.

Poprawa zapisuje jeden rekord `ExerciseCorrection`, `attemptOrdinal: 2`, `assisted: true`. Nie zmienia pierwszej próby, SRS, ukończenia ani nagród. Retry zachowuje payload i klucz. GET odtwarza zapisaną poprawę po powrocie do ekranu. Niewysłany szkic poprawy nie jest trwałą kolejką offline. Samodzielność i dane D7/D30 wykluczają poprawy, pomoc i oceny nierozstrzygnięte.

## Uruchomienie na środowisku testowym

1. Wykonać kopię bazy testowej. Zastosować kolejno migracje `20260926120000_reliable_review_attempts` i `20260927160000_practice_corrections` przez `pnpm db:migrate:deploy`, z jawnie ustawioną bazą tego środowiska. Nie używać `db push`. Nowa migracja dodaje tabelę poprawek oraz pola umiejętności, interakcji i kohorty; nie modyfikuje wyników historycznych.
2. Uruchomić API i zaktualizowany klient mobilny. Stary klient może nie rozpoznawać neutralnej oceny; nie rozszerzać wydania API na takie klienty przed weryfikacją kompatybilności. Flagi `learning_pilot` i `information_gap` domyślnie pozostają wyłączone. Wspólna ocena i paczki SRS nie mają osobnej flagi — wymagają skoordynowanego wydania.
3. Sprawdzić `pnpm check` i izolowane testy bazy. Istniejący test niezawodnych prób przyjmuje `STAGE1_TEST_DATABASE_URL`; nie ustawiać `RUN_DATABASE_E2E` na bazę produkcyjną.
4. Podgląd szkiców: admin `/pilots`, API `GET /content/admin/pilots?locale=pl`. Podgląd admina używa wspólnego katalogu i kontraktów; nie jest pełnym edytorem ani symulatorem oceny AI.
5. Przygotować po trzy lekcje w opublikowanych kursach EN/TH A2. Importować szkic przez `POST /content/admin/lessons/:lessonId/pilots/:pilotId`, gdzie ID mają postać `en-change-meeting`, `en-order-food`, `en-ask-directions` i odpowiednio `th-*`. Sprawdzić rzeczywiste ID w katalogu API. Import tworzy nową rewizję draft; ponowienie importu tworzy kolejną rewizję.
6. Zweryfikować cele, polecenia, konteksty, klucze i tłumaczenia PL/EN/TH. Zatwierdzić tłumaczenia; publikacja wymaga zweryfikowanych tytułów, poleceń, instrukcji i celów. Wykonać istniejący proces `draft → review → published`. Import niczego automatycznie nie publikuje.
7. Włączyć `learning_pilot` dla grupy wewnętrznej istniejącym administracyjnym API flag. Serwer zapisuje kohortę raz w `UserCourse`; grupa kontrolna otrzymuje klasyczną lukę, pilotażowa poprawianie fragmentu. Pozostałe zadania są wspólne — eksperyment bada ten wariant, nie cały pakiet zmian. W sesji zapisuje się faktyczny wariant. Wyłączenie flagi blokuje kolejne wejścia do lekcji pilotażowej; nie cofa danych ani nie zmienia zamrożonych prób.
8. Dla każdej umiejętności importować nowe konteksty przez `POST /content/admin/lessons/:lessonId/pilots/:pilotId/probes/7` oraz `/probes/30`, do osobnych lekcji tego samego kursu. Przejść tę samą weryfikację i publikację. Dostarczenie uczniowi w oknach D7 [7,10) i D30 [30,37) jest zadaniem operacyjnym; aplikacja nie wysyła automatycznych przypomnień i nie gwarantuje terminu ekspozycji.
9. Dopiero po przeglądzie scenariusza uruchomić `information_gap` dla grupy wewnętrznej. Uczeń nie otrzymuje ukrytej informacji i klucza; partner ujawnia dostępność/długość spotkania w odpowiedzi na pytania. Dostępny jest deterministyczny fallback. Nie jest to walidowana ocena wymowy ani tonów.

## Pomiar i decyzja

`GET /release/learning-evidence?windowDays=90` wymaga administratora. Zestawienie rozdziela język, poziom, kohortę i okno D7/D30. Bierze pierwszą ocenioną, samodzielną odpowiedź tekstową dla umiejętności, potem pierwszą odpowiedź na inną tożsamość treści w oknie. Brak obserwacji jest brakującą daną. Raport pokazuje przedziały Wilsona i nie podejmuje automatycznej decyzji o rozszerzeniu. Limit 10 000 rekordów oznacza `truncated` i `needs_data`; raport nie zastępuje hurtowni analitycznej.

Zmiana fingerprintu jest filtrem nowości, a nie dowodem równoważności pedagogicznej. Redaktor musi sprawdzić zgodność prób z celem; analityk uwzględnić wielokrotne umiejętności jednego ucznia, brakujące odpowiedzi i selekcję. Próg 30 obserwacji w każdej komórce jest bramą opisową, nie obliczeniem mocy. Przed startem ustalić minimalny efekt, liczebność oraz margines braku pogorszenia. Faktyczna retencja 30-dniowa powstaje po upływie 30 dni.

Opóźnienia p50/p95 dotyczą zarejestrowanych startów i wyników. Komfort to dobrowolna odpowiedź 1–5. Koszt to szacunek z metadanych udanych ocen, nie faktura i nie pełen koszt łańcucha providerów. Do analizy porzuceń wykorzystać istniejący raport release baseline i zdarzenia `lesson_started`, `lesson_completed`, `exercise_presented`, `exercise_answered`; bez surowych odpowiedzi i rozmów. Niezakończona sesja nie jest automatycznie porzuceniem: wymaga uzgodnionego okna bezczynności i analizy kroków.

Przed rozszerzeniem sprawdzić duplikaty, utratę kolejki, fałszywe oceny, niepewność wyników, koszty i komfort. Przy regresji wyłączyć flagi pilotażu oraz cofnąć skoordynowane wydanie aplikacji/API; zachować migracje addytywne i historię. Zmiana SRS pozostaje poza tym wdrożeniem (`srs-v1`).

## Odbiór manualny

Weryfikacja automatyczna 27 września 2026 ([CI](https://github.com/Shellty-IT/Shellty-Lingo/actions/runs/36348957218)):

- Format, ESLint, typy, testy i buildy — OK. API: 283 testy; mobile: 101; pakiety: 16; razem 400.
- E2E z PostgreSQL — 15 zaliczonych, bez pominięć. Zastosowano migracje w osobnych bazach CI i sprawdzono retry, równoległe zapisy, korekty oraz stały przydział kohorty. Starsza sesja bez locale używa domyślnego języka angielskiego.
- Lokalny eksport Expo dla Androida, iOS i web — OK. Eksport pakietu nie zastępuje odbioru na urządzeniu.
- Audyt zależności i skanery sekretów — OK. Dwa publiczne identyfikatory umiejętności w testach mają punktowe adnotacje fałszywych trafień gitleaks; nie wyłączono skanowania plików ani reguł.
- Konfiguracja Vercel ustala Node.js 24, pnpm 11.13.0 i kolejność budowania pakietów współdzielonych. Obraz Docker panelu uwzględnia również pakiet i18n.
- Baseline można odtworzyć z katalogu głównego: `corepack pnpm@11.13.0 exec tsx apps/api/scripts/learning-baseline.ts`.

Zapisać dla każdej sesji: urządzenie/OS, locale, język kursu, poziom i format, tekst 100/200%, czytnik ekranu, sieć, zmierzone czasy, miejsce utraty fokusu, audio i powód przerwania. Pokryć mały ekran, tajskie znaki, klawiaturę zasłaniającą odpowiedź, timeout po zapisie, restart, dwa urządzenia, pomoc podczas wysyłania, zmianę konta i brak audio. Nie rejestrować tokenów ani surowych odpowiedzi w telemetrii.

Lokalny silnik Docker był niedostępny; bramę migracji i testów PostgreSQL zaliczono w izolowanym środowisku CI. Stan wdrożenia produkcji należy potwierdzać osobno przez wersję API, status Vercel i identyfikator aktualizacji EAS.
