# Shellty Lingo — plan budowy aplikacji

## 1. Cel dokumentu

Ten dokument przekłada założenia produktu na kolejność prac prowadzącą od pustego repozytorium do opublikowanego MVP aplikacji Shellty Lingo na Androida i iOS. Szczegóły techniczne, konwencje i informacje potrzebne podczas implementacji znajdują się w [`CLOUDE.md`](./CLOUDE.md).

## 2. Wizja produktu

Shellty Lingo to mobilna aplikacja dla osób dorosłych (18–65 lat), która łączy ustrukturyzowaną naukę słownictwa i gramatyki z praktycznymi rozmowami prowadzonymi przez AI.

Pierwsze wydanie obsługuje:

- naukę języka angielskiego i tajskiego, z postępem zapisywanym osobno dla każdego kursu;
- interfejs w języku polskim, angielskim i tajskim, niezależny od języka nauki;
- personalizację według poziomu, celu, czasu i historii błędów;
- tekstowe rozmowy z AI, analizę błędów i rekomendacje dalszej nauki;
- szczególne potrzeby języka tajskiego: alfabet, transliterację, oznaczenia tonów, formy grzecznościowe i kontekst kulturowy.

Główną hipotezą MVP jest: **krótkie, spersonalizowane sesje oraz bezpieczna rozmowa z AI pomagają użytkownikowi regularnie ćwiczyć praktyczny język i osiągać mierzalny postęp**.

## 3. Granice MVP

### 3.1. Funkcje wymagane

- aplikacja React Native/Expo na Androida i iOS;
- rejestracja e-mail, logowanie, wylogowanie, potwierdzenie adresu i reset hasła;
- usunięcie konta, eksport danych i podstawowe zarządzanie zgodami;
- onboarding z wyborem języka interfejsu, kursu, celu, poziomu i harmonogramu;
- podstawowy test poziomujący dla angielskiego i tajskiego;
- kursy, lekcje, słownictwo, podstawowa gramatyka i spaced repetition;
- alfabet tajski i podstawowe ćwiczenia rozpoznawania tonów;
- tekstowa rozmowa z AI z wyborem scenariusza i trybu korekty;
- podsumowanie rozmowy: błędy, poprawione zdania, naturalniejsze zwroty, nowe słowa;
- podstawowy, aktualizowany plan nauki;
- panel postępów osobny dla każdego języka;
- przypomnienia push kontrolowane przez użytkownika;
- podstawowy panel administracyjny do zarządzania treścią i zgłoszeniami;
- trzy środowiska: development, staging i production;
- podstawowa analityka produktu, monitoring błędów, limity AI i audyt bezpieczeństwa.

### 3.2. Poza MVP

- rozmowy głosowe w czasie rzeczywistym;
- zaawansowana ocena fonetyczna oraz wiarygodna punktacja tonów tajskich;
- pełny tryb offline i publiczna aplikacja webowa dla uczniów;
- społeczność, lekcje z lektorami, certyfikaty;
- rozbudowana grywalizacja;
- plany rodzinne i firmowe;
- automatyczne, niekontrolowane publikowanie treści wygenerowanych przez AI.

Projekt danych i integracji ma nie blokować tych funkcji, lecz nie wolno rozszerzać nimi zakresu pierwszego wydania.

## 4. Zasady realizacji

1. Najpierw budujemy pionowy przepływ użytkownika, potem poszerzamy katalog treści.
2. Treść kursu jest wersjonowana i może zostać opublikowana dopiero po przeglądzie językowym.
3. Aplikacja mobilna nigdy nie komunikuje się bezpośrednio z dostawcą AI ani magazynem przy użyciu uprzywilejowanych kluczy.
4. Każdy etap kończy się działającym przyrostem, testami i krótką demonstracją na stagingu.
5. Funkcja nie jest ukończona bez obsługi błędów, analityki, lokalizacji PL/EN/TH i podstaw dostępności.
6. Odpowiedzi AI są danymi niezaufanymi: muszą być walidowane, moderowane, limitowane i możliwe do zgłoszenia.
7. Koszt AI oraz jakość językowa są traktowane jako wymagania produktu, a nie prace optymalizacyjne „na później”.

## 5. Etapy budowy

Szacunki zakładają zespół opisany w sekcji 8. Część zadań produktowych, treściowych i technicznych może być prowadzona równolegle. Całość MVP to około 7–10 miesięcy, zależnie od liczby i jakości gotowych materiałów edukacyjnych.

### Etap 0 — decyzje produktowe i definicja sukcesu (2–4 tygodnie)

**Cel:** zamknąć decyzje, które wpływają na architekturę, budżet i zakres treści.

Prace:

- przeprowadzić rozmowy z użytkownikami z głównych segmentów;
- wybrać pierwsze persony i 3–5 najważniejszych scenariuszy użycia;
- zdefiniować zakres treści startowej dla obu języków i poziomów;
- określić bezpłatne limity, ofertę premium i zasady naliczania limitów AI;
- ustalić KPI bazowe: aktywacja, ukończenie pierwszej lekcji, retencja D7/D30, regularność nauki, koszt AI na aktywnego użytkownika;
- przeprowadzić DPIA/ocenę ryzyka prywatności dla rozmów i przyszłych nagrań;
- wybrać dostawców: hosting, PostgreSQL, S3, e-mail, push, AI, analityka i monitoring;
- przygotować backlog produktu, kryteria akceptacji i rejestr decyzji architektonicznych (ADR).

**Rezultat:** zatwierdzony zakres MVP, budżet usług, mapa zdarzeń analitycznych, lista dostawców i backlog.

**Brama jakości:** każda funkcja ma właściciela, priorytet, kryteria akceptacji i przypisanie do MVP albo etapu późniejszego.

### Etap 1 — UX, system projektowy i prototyp (4–6 tygodni)

**Cel:** zweryfikować kluczowe przepływy przed implementacją.

Prace:

- przygotować mapę informacji i przepływy: onboarding, test, dzisiejszy plan, lekcja, powtórka, rozmowa AI, postęp i ustawienia;
- zaprojektować stany pusty, ładowania, offline, błędu, limitu i wygaśniętej sesji;
- przygotować responsywny system komponentów, tokeny kolorów/typografii i warianty dostępności;
- zbudować klikalny prototyp dla Androida i iOS;
- sprawdzić wszystkie ekrany z realnymi tekstami PL/EN/TH, dużą czcionką i długimi tłumaczeniami;
- przetestować prototyp z użytkownikami oraz zweryfikować czytelność pisma tajskiego z native speakerem;
- określić sposób komunikowania niepewności i błędów AI.

**Rezultat:** zatwierdzony prototyp, biblioteka komponentów i specyfikacja ekranów.

**Brama jakości:** użytkownik testowy samodzielnie przechodzi onboarding, kończy pierwszą lekcję i rozpoczyna rozmowę AI; nie ma krytycznych problemów dostępności lub tajskiego składu tekstu.

### Etap 2 — fundament repozytorium i środowisk (2–3 tygodnie)

**Cel:** stworzyć powtarzalny warsztat pracy i pierwszy wdrażalny pion systemu.

Prace:

- utworzyć monorepo TypeScript z aplikacjami `mobile`, `api` i `admin` oraz współdzielonymi pakietami;
- skonfigurować Expo Router, NestJS, Next.js, Prisma i PostgreSQL;
- dodać formatowanie, lint, typecheck, testy, walidację zmiennych środowiskowych i pre-commit hooks;
- dodać Docker Compose dla lokalnych zależności infrastrukturalnych;
- ustanowić strategię migracji i seed danych demonstracyjnych;
- utworzyć CI dla każdego pull requestu oraz kontrolowane wdrożenia development/staging;
- skonfigurować centralne logi, monitoring błędów, healthcheck i correlation ID;
- przygotować bezpieczne zarządzanie sekretami i `.env.example` bez wartości poufnych.

**Rezultat:** „hello world” wszystkich aplikacji, API połączone z bazą, automatyczne testy i staging.

**Brama jakości:** nowy programista uruchamia projekt wyłącznie na podstawie README i `CLOUDE.md`; pull request nie może zostać scalony przy błędzie lint/typecheck/test/build.

### Etap 3 — tożsamość, konto i lokalizacja (3–5 tygodni)

**Cel:** użytkownik może bezpiecznie utworzyć konto i skonfigurować kurs.

Prace:

- rejestracja i logowanie e-mail, potwierdzenie adresu, reset i zmiana hasła;
- krótkotrwały access token, rotowany refresh token, unieważnianie sesji i bezpieczny magazyn mobilny;
- profil, zgody, ustawienia powiadomień, eksport danych i asynchroniczne usunięcie konta;
- onboarding i model `UserCourse` dla niezależnych ustawień EN/TH;
- pełna infrastruktura i18n dla PL/EN/TH z kontrolą brakujących kluczy w CI;
- role i minimalny RBAC dla użytkownika, redaktora i administratora;
- rate limiting, rejestr zdarzeń bezpieczeństwa i ochrona wrażliwych endpointów.

**Rezultat:** kompletny przepływ konto → onboarding → ekran główny w trzech językach.

**Brama jakości:** testy E2E obejmują udaną ścieżkę, błędne dane, wygaśnięcie tokenu, wylogowanie, zmianę języka oraz usunięcie konta.

### Etap 4 — model treści i panel administracyjny (4–6 tygodni)

**Cel:** eksperci językowi mogą bezpiecznie przygotowywać, sprawdzać i publikować kursy.

Prace:

- zaimplementować kursy, poziomy, moduły, lekcje, ćwiczenia, słownictwo i tematy gramatyczne;
- ustalić wspólny kontrakt ćwiczenia oraz typy odpowiedzi i oceniania;
- dodać draft/review/published/archived, wersjonowanie i historię zmian;
- dodać import/eksport treści, walidację kompletności tłumaczeń i podgląd mobilny;
- obsłużyć audio i ilustracje przez podpisane adresy S3 oraz metadane w bazie;
- wdrożyć panel Next.js z RBAC i audytem zmian;
- przygotować pierwszy mały, recenzowany zestaw lekcji EN i TH.

**Rezultat:** opublikowana lekcja może zostać pobrana i wyświetlona w aplikacji.

**Brama jakości:** nie da się opublikować niekompletnej lub niezweryfikowanej treści; rollback wersji jest przetestowany.

### Etap 5 — silnik nauki, test poziomujący i powtórki (6–8 tygodni)

**Cel:** zbudować podstawową pętlę edukacyjną bez zależności od AI.

Prace:

- odtwarzanie lekcji i ćwiczeń: wybór, dopasowanie, luka, wpisywanie, układanie, odsłuch;
- deterministyczne ocenianie odpowiedzi i zapis prób;
- podstawowy test poziomujący dla obu języków oraz mapowanie wyniku na poziom startowy;
- mechanizm spaced repetition z jawnym, testowalnym algorytmem i kolejką powtórek;
- historia błędów oraz progres słów, umiejętności, lekcji i kursu;
- obsługa przerwanego połączenia, idempotentnego zapisu i wznowienia sesji;
- pierwsze zdarzenia analityczne lejka aktywacji.

**Rezultat:** użytkownik przechodzi test, otrzymuje poziom, kończy lekcję i ma zaplanowaną powtórkę.

**Brama jakości:** ponowienie żądania nie dubluje postępu; obliczenia harmonogramu są pokryte testami jednostkowymi i testami stref czasowych.

### Etap 6 — język tajski (4–7 tygodni, częściowo równolegle)

**Cel:** zapewnić dydaktycznie poprawne podstawy tajskiego, a nie tylko tłumaczenie kursu angielskiego.

Prace:

- model spółgłosek, samogłosek, sylab, cyfr, klas i reguł czytania;
- prezentacja zapisu tajskiego, transliteracji, tonu, znaczenia i nagrania;
- ćwiczenia alfabetu i rozpoznawania tonów ze słuchu;
- ustawienia widoczności transliteracji i jej stopniowego wygaszania;
- formy grzecznościowe, partykuły końcowe, płeć osoby mówiącej i kontekst formalny/potoczny;
- przegląd treści, fontów, łamania tekstu i audio przez eksperta języka tajskiego;
- ostrożne etykiety: MVP ćwiczy tony, ale nie obiecuje wiarygodnej automatycznej oceny wymowy.

**Rezultat:** pierwsza kompletna ścieżka „podstawy alfabetu i tonów”.

**Brama jakości:** ekspert zatwierdza całą opublikowaną ścieżkę; testy urządzeń potwierdzają poprawne renderowanie znaków i znaków tonalnych.

### Etap 7 — rozmowy tekstowe i analiza AI (5–8 tygodni)

**Cel:** dostarczyć wyróżniającą wartość produktu w kontrolowanym kosztowo i jakościowo przepływie.

Prace:

- stworzyć niezależny od dostawcy interfejs AI po stronie backendu;
- wersjonować prompty, schematy odpowiedzi i zestawy ewaluacyjne;
- dodać scenariusze, poziom, rolę, długość i cztery tryby korekty;
- przesyłać minimalny kontekst edukacyjny bez zbędnych danych osobowych;
- strumieniować tekst przez API, obsługiwać przerwanie, retry i timeout;
- walidować odpowiedzi strukturalne, moderować wejście/wyjście i filtrować instrukcje systemowe;
- po sesji generować podsumowanie, błędy, poprawki, nowe słowa i rekomendacje;
- dodać limity planu, limity długości, budżety, metryki tokenów/kosztu i circuit breaker;
- umożliwić zgłoszenie błędnej odpowiedzi oraz kolejkę przeglądu w panelu;
- przygotować automatyczne i eksperckie ewaluacje dla PL/EN/TH, ze szczególną wagą jakości tajskiego.

**Rezultat:** stabilna rozmowa tekstowa i zapisane, ustrukturyzowane podsumowanie wpływające na dalszą naukę.

**Brama jakości:** kontrakt odpowiedzi przechodzi walidację; zdefiniowany zestaw ewaluacyjny spełnia uzgodniony próg jakości, a limity kosztowe są egzekwowane serwerowo.

### Etap 8 — personalizowany plan i panel postępów (3–5 tygodni)

**Cel:** zamknąć pętlę: diagnoza → ćwiczenie → informacja zwrotna → następne zadanie.

Prace:

- deterministyczny szkielet planu oparty na poziomie, celu, czasie i zaległych powtórkach;
- wykorzystanie AI wyłącznie do rekomendacji w dozwolonych granicach, z fallbackiem bez AI;
- aktualizacja planu po sesji i obsługa zmiany celu lub kursu;
- dashboard: czas, lekcje, słowa, skuteczność, seria, błędy i tygodniowy cel;
- oddzielny progres EN/TH oraz jasne wyjaśnienie sposobu liczenia metryk;
- proste cele i odznaki bez rozbudowywania grywalizacji.

**Rezultat:** ekran „Dzisiaj” z krótką, wykonalną sesją i czytelnym postępem.

**Brama jakości:** plan nigdy nie jest pusty z powodu awarii AI; użytkownik widzi spójny progres po ponownym logowaniu i na drugim urządzeniu.

### Etap 9 — powiadomienia, prywatność i gotowość operacyjna (3–4 tygodnie)

**Cel:** wspierać regularność i przygotować produkt do bezpiecznego użycia przez testerów zewnętrznych.

Prace:

- przypomnienia o nauce i powtórkach z uwzględnieniem strefy czasowej i quiet hours;
- granularne zgody i możliwość wyłączenia każdego typu komunikacji;
- retencja rozmów, logów i eksportów oraz automatyczne procesy usuwania;
- kopie zapasowe, test przywracania, runbook incydentu i rotacja sekretów;
- alerty dla błędów, opóźnień, kosztu AI, kolejek i nietypowego ruchu;
- polityka prywatności, regulamin i rejestr podmiotów przetwarzających;
- obsługa zgłoszeń użytkownika i administracyjny audit log.

**Rezultat:** środowisko staging gotowe do zamkniętej bety.

**Brama jakości:** odtworzenie bazy jest przećwiczone; eksport i usunięcie danych przechodzą test akceptacyjny; powiadomienia nie są wysyłane bez zgody.

### Etap 10 — płatności i limity planów (3–5 tygodni)

**Cel:** uruchomić minimalny model freemium zgodny z zasadami sklepów mobilnych.

Prace:

- ustalić produkty miesięczne i roczne oraz uprawnienia po stronie serwera;
- zintegrować zakupy aplikacyjne i weryfikować transakcje po stronie backendu;
- obsłużyć przywrócenie zakupów, wygaśnięcie, grace period i webhooki;
- egzekwować limity AI i treści po stronie API, nie tylko w interfejsie;
- dodać ekran oferty, stan subskrypcji i analitykę konwersji;
- zweryfikować teksty i przepływy z wymaganiami App Store/Google Play.

**Rezultat:** bezpłatny i płatny wariant produktu z poprawnym odtwarzaniem uprawnień.

**Brama jakości:** scenariusze sandbox obu sklepów oraz opóźnione/zdublowane webhooki są pokryte testami; utrata połączenia nie powoduje błędnego naliczenia dostępu.

### Etap 11 — testy całościowe, bezpieczeństwo i optymalizacja (4–8 tygodni)

**Cel:** usunąć problemy blokujące betę i publikację.

Prace:

- testy jednostkowe, integracyjne, kontraktowe API i mobilne E2E;
- macierz urządzeń Android/iOS, małe ekrany, starsze urządzenia i słaba sieć;
- testy wszystkich języków, formatów lokalnych i dynamicznego rozmiaru tekstu;
- testy obciążenia API, bazy i limitów AI;
- przegląd OWASP, zależności, konfiguracji chmury i uprawnień;
- testy jakości AI, prompt injection, niepożądanych treści i regresji promptów;
- profilowanie startu, list, obrazów, audio i zużycia pamięci;
- usunięcie błędów P0/P1 i ustalenie akceptowanych znanych ograniczeń.

**Rezultat:** kandydat do wydania i raport gotowości.

**Brama jakości:** brak otwartych błędów krytycznych; cele stabilności, wydajności, dostępności, kosztu AI i jakości odpowiedzi osiągają progi ustalone w Etapie 0.

### Etap 12 — zamknięta beta i publikacja (3–5 tygodni)

**Cel:** potwierdzić wartość produktu z realnymi użytkownikami i bezpiecznie opublikować MVP.

Prace:

- beta przez TestFlight i zamknięty kanał Google Play;
- rekrutacja reprezentatywnych użytkowników EN/TH i zebranie zgód;
- analiza aktywacji, retencji, ukończenia lekcji, zgłoszeń AI i kosztów;
- poprawki krytyczne i ponowne testy regresji;
- opisy, grafiki, polityki i materiały sklepowe w PL/EN/TH;
- przygotowanie procedury rollout/rollback, dyżuru i komunikacji awarii;
- etapowe wydanie produkcyjne i codzienny przegląd metryk po premierze.

**Rezultat:** opublikowane MVP na Androida i iOS.

**Brama jakości:** akceptacja sklepów, działający monitoring i support, zatwierdzony go/no-go oraz możliwość wyłączenia kosztownych funkcji przez feature flagę.

### Etap 13 — rozwój po MVP

Kolejność ustala się na podstawie danych z bety, nie wyłącznie pierwotnych założeń. Kandydaci:

1. odsłuch i nagrywanie asynchroniczne oraz transkrypcja;
2. rozmowy głosowe w czasie rzeczywistym;
3. zaawansowana wymowa angielska;
4. eksperymentalna, ostrożnie komunikowana analiza tonów tajskich;
5. listening, tryb offline i dalsze kursy;
6. plany rodzinne/firmowe, certyfikaty i funkcje społecznościowe.

Każda funkcja głosowa wymaga ponownej oceny prywatności, retencji, kosztu, opóźnień i jakości dla tajskiego.

## 6. Zależności i możliwa równoległość

- Etapy 0–2 są fundamentem i powinny zakończyć się przed pełnym developmentem funkcji.
- Projekt treści i panel administracyjny mogą rozwijać się równolegle z kontami i lokalizacją.
- Moduł tajski musi mieć osobny strumień pracy eksperta, ale używa wspólnego silnika lekcji.
- Integrację AI można prototypować wcześniej na danych testowych, lecz zapis do profilu ucznia wymaga gotowego modelu postępu.
- Płatności można przesunąć po becie, jeśli beta jest bezpłatna; przed publicznym freemium muszą być kompletne.
- Przygotowanie prawne, ewaluacje AI i treści edukacyjne trwają przez cały projekt.

## 7. Kryteria ukończenia MVP

MVP jest ukończone dopiero, gdy łącznie:

- działa na wspieranych wersjach Androida i iOS;
- oferuje kompletne i sprawdzone językowo interfejsy PL/EN/TH;
- pozwala uczyć się EN lub TH i przełączać kurs bez mieszania postępów;
- realizuje pełną ścieżkę konto → test → plan → lekcja → powtórka → rozmowa AI → postęp;
- egzekwuje prywatność, zgody, eksport i usunięcie danych;
- odpowiedzi AI są moderowane, walidowane, limitowane i możliwe do zgłoszenia;
- treści tajskie są zatwierdzone przez eksperta;
- istnieją monitoring, backup/restore, alerty, runbook oraz procedura rollbacku;
- automatyczne testy i macierz urządzeń nie wykazują błędów P0/P1;
- produkt przeszedł zamkniętą betę z rzeczywistymi użytkownikami;
- właściciel produktu zatwierdził wskaźniki jakości, kosztu i gotowości operacyjnej.

## 8. Zespół i odpowiedzialności

Minimalny rekomendowany skład:

- Product Owner/Product Manager — zakres, KPI, kolejność i decyzje go/no-go;
- UX/UI — badania, przepływy, design system i dostępność;
- 2 programistów React Native — aplikacja mobilna i testy urządzeń;
- programista backend/NestJS — API, baza, auth, integracje i bezpieczeństwo;
- programista web (może być backend/full-stack) — panel administracyjny;
- specjalista AI — abstrakcja dostawcy, prompty, ewaluacje, moderacja i koszt;
- QA — strategia testów, automatyzacja i regresja;
- DevOps/SRE w niepełnym wymiarze — CI/CD, środowiska, obserwowalność i kopie;
- metodyk angielskiego, ekspert tajskiego i korektorzy PL/EN/TH — program kursu i przegląd treści.

Jedna osoba może pełnić kilka ról, ale przegląd tajskiego, bezpieczeństwa i treści generowanej przez AI nie powinny opierać się wyłącznie na autorze implementacji.

## 9. Główne ryzyka i zabezpieczenia

| Ryzyko | Sygnał ostrzegawczy | Ograniczenie |
|---|---|---|
| Rozrost MVP | rosnący backlog bez zamykania pionów | stała lista poza MVP, feature flags, decyzje PO |
| Brak treści na czas | aplikacja gotowa, kursy nie | mały katalog startowy, równoległy zespół treści, workflow publikacji |
| Wysoki koszt AI | koszt/użytkownika przekracza budżet | limity serwerowe, krótszy kontekst, dobór modelu, cache tylko bezpiecznych wyników |
| Błędne odpowiedzi AI | wzrost zgłoszeń i niezaliczone ewaluacje | schematy, testy regresji, moderacja, eksperci, fallback |
| Niska jakość tajskiego | uwagi native speakerów | obowiązkowy ekspert, osobne ewaluacje, kontrola transliteracji i form grzecznościowych |
| Niska retencja | słabe D7 i mało powrotów | krótkie sesje, SRS, widoczny postęp, badania jakościowe |
| Problemy z prywatnością | niejasna retencja rozmów/nagrań | minimalizacja danych, DPIA, automatyczne usuwanie, jawne zgody |
| Problemy sklepowe | odrzucenie buildu/subskrypcji | wczesny przegląd zasad, sandbox IAP, kompletne polityki |
| Zależność od dostawcy | logika produktu w SDK dostawcy | adaptery, neutralne DTO, test kontraktowy i plan migracji |

## 10. Wskaźniki produktu i techniczne

Minimalny zestaw mierzony od bety:

- aktywacja: rejestracja → onboarding → test → pierwsza lekcja;
- odsetek ukończenia pierwszej lekcji i pierwszej rozmowy;
- DAU/MAU oraz retencja D1, D7, D30 i docelowo D90;
- liczba sesji i minut nauki na aktywnego użytkownika;
- terminowość powtórek i poprawa skuteczności odpowiedzi;
- progres testów/umiejętności, osobno EN i TH;
- konwersja premium, odnowienia i rezygnacje;
- koszt AI na aktywnego użytkownika i na zakończoną rozmowę;
- odsetek błędów/timeoutów AI, walidacji odpowiedzi i zgłoszeń jakości;
- crash-free users/sessions, błędy API, p95 latencji i dostępność;
- skuteczność powiadomień bez nadmiernej liczby rezygnacji.

Docelowe progi liczbowe ustala się w Etapie 0 po badaniu rynku, budżetu i wielkości próby beta.

## 11. Najbliższy kamień milowy

Pierwszym kamieniem milowym jest **Foundation Release**: monorepo, automatyczne CI, lokalne środowisko, wdrożony healthcheck API, szkielet aplikacji mobilnej i panelu, baza z pierwszą migracją, trzy języki interfejsu oraz udokumentowany proces uruchomienia. Dopiero po jego akceptacji należy równolegle rozwijać konto, treści i silnik nauki.
