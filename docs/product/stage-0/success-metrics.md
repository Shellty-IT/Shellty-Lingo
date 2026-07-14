# Definicja sukcesu i KPI

## Zasady pomiaru

- baseline produktu wynosi obecnie `brak danych`; wartości poniżej są progami decyzji dla zamkniętej bety, nie historycznymi wynikami;
- strefą czasu raportów produktowych jest UTC, a dzień nauki i seria użytkownika używają jego strefy IANA;
- użytkownicy wewnętrzni, konta QA, automaty i seed są wykluczone przez właściwość `actor_type`;
- KPI kursowe liczymy oddzielnie dla `course_language=en` oraz `course_language=th`;
- treść odpowiedzi, rozmów i tłumaczeń nigdy nie jest właściwością zdarzenia analitycznego.

## Lejek aktywacji

| KPI | Definicja | Próg beta | Reakcja poniżej progu |
|---|---|---:|---|
| Ukończenie onboardingu | `onboarding_completed / onboarding_started` w 24 h | ≥ 70% | uprościć wybory i teksty |
| Aktywacja | zweryfikowane konto + onboarding + test lub świadome pominięcie + start pierwszej lekcji w 24 h | ≥ 50% rejestracji | zatrzymać rozszerzanie katalogu, naprawić pierwszy przepływ |
| Ukończenie pierwszej lekcji | pierwsze `lesson_completed / first_lesson_started` | ≥ 70% | sprawdzić długość, trudność i błędy |
| Pierwsza rozmowa AI | rozpoczęta i zakończona rozmowa w 7 dni od rejestracji | ≥ 25% aktywowanych | poprawić odkrywalność/scenariusze, nie zwiększać limitu |
| Użycie słownika z kontynuacją | ukończone ćwiczenie do 15 min po słowniku | ≥ 75% użyć słownika | naprawić utratę kontekstu lub zbyt długi panel |

## Retencja i regularność

Aktywny dzień oznacza co najmniej jedno z: ukończona lekcja, ukończona sesja powtórek lub co najmniej 3 tury rozmowy AI. Sam start aplikacji nie jest aktywnością nauki.

| KPI | Definicja | Próg beta |
|---|---|---:|
| D1 | aktywność w dniu 1 po dniu aktywacji / aktywowani | ≥ 35% |
| D7 | aktywność w dniu 7 ± 1 dzień / aktywowani | ≥ 25% |
| D30 | aktywność w dniu 30 ± 2 dni / aktywowani | ≥ 12% |
| Regularny tydzień | użytkownik aktywny w min. 3 różnych dniach tygodnia / WAU | ≥ 30% |
| Terminowe powtórki | elementy powtórzone do 24 h po `due_at` / wszystkie należne i wyświetlone | ≥ 60% |
| Powrót po błędzie | użytkownik poprawnie odpowiada na wcześniej błędny element w 14 dni | ≥ 45% |

Kohortę retencji przypisujemy do dnia aktywacji, nie instalacji. D7/D30 raportujemy dopiero dla dojrzałej kohorty.

## Jakość, niezawodność i koszt

| KPI | Próg wejścia do publicznego MVP | Alarm |
|---|---:|---:|
| Crash-free users | ≥ 99,5% / 7 dni | < 99,0% |
| Dostępność podstawowego API | ≥ 99,9% / miesiąc | < 99,5% w dojrzałym oknie |
| Udane sesje zapisu postępu | ≥ 99,9% bez duplikatu | < 99,5% |
| API p95 bez AI/mediów | ≤ 750 ms | > 1,5 s przez 15 min |
| Pierwszy token rozmowy AI p95 | ≤ 3,5 s | > 6 s przez 15 min |
| Odpowiedzi AI zgodne ze schematem po maks. 1 naprawie | ≥ 99,0% | < 97,0% |
| Odpowiedzi AI zgłoszone jako błędne/niebezpieczne | < 2,0% rozmów | > 4,0% |
| Koszt AI na ukończoną rozmowę p95 | ≤ 0,08 USD | > 0,12 USD |
| Koszt AI na MAU Free | ≤ 0,60 USD | > 1,00 USD |
| Koszt AI na MAU Premium | ≤ 3,50 USD | > 5,00 USD |

Cele odtwarzania: w zamkniętej becie `RPO ≤ 24 h` i `RTO ≤ 8 h`; przed publicznym MVP `RPO ≤ 1 h` dla PostgreSQL oraz `RTO ≤ 4 h` dla podstawowego przepływu konto → lekcja. AI, tłumaczenie i TTS nie należą do podstawowego SLO, ponieważ mają kontrolowany fallback, ale ich degradacja jest osobno mierzona.

## Zasada go/no-go

Publiczne MVP może przejść do stopniowego wydania, gdy przez dwa kolejne tygodnie:

- nie ma otwartego P0 ani P1 dotyczącego utraty danych, bezpieczeństwa, płatności lub treści tajskich;
- aktywacja, ukończenie pierwszej lekcji, D7 i crash-free osiągają próg;
- koszt AI nie przekracza alarmu i co najmniej 95% limitów jest poprawnie egzekwowanych;
- ekspert zatwierdził 100% opublikowanej treści tajskiej, a losowa próba 10% treści angielskiej nie wykazuje błędu krytycznego.

Jeżeli D7 jest poniżej 15% po minimum 100 aktywowanych użytkownikach, wstrzymujemy płatne pozyskanie i badamy pętlę dzienną zamiast dodawać nowe funkcje.
