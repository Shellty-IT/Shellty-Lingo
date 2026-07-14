# Backlog produktu — baseline MVP

## Konwencje

- `P0` — konieczne do bezpiecznego działania lub pełnej ścieżki MVP;
- `P1` — konieczne do wartości/operacji MVP, ale może wejść po pierwszym pionie;
- `P2` — później; nie może blokować MVP;
- właściciel jest rolą DRI odpowiedzialną za doprowadzenie funkcji do akceptacji, nie jedynym wykonawcą;
- każda funkcja widoczna dla użytkownika musi mieć PL/EN/TH, stany loading/empty/error/offline, analitykę, dostępność i testy adekwatne do ryzyka.

## Pozostałe działania zamykające Etap 0

| ID | Priorytet | Właściciel | Akceptacja |
|---|---|---|---|
| S0-01 | P0 | Product Manager | 12 wywiadów z trzech segmentów ma zgodę, zanonimizowane wnioski i zapisane zmiany decyzji |
| S0-02 | P0 | Product Owner | pakiet Etapu 0 ma datę i jawną akceptację lub listę odrzuconych decyzji |
| S0-03 | P0 | Privacy/Security Lead | dane administratora, DPA/TIA i podstawy prawne są zatwierdzone przed betą zewnętrzną |
| S0-04 | P0 | English Methodologist | zakres EN A1–A2, liczba lekcji i workflow recenzji są wykonalne |
| S0-05 | P0 | Thai Language Lead | zakres TH Pre-A1–A1, transliteracja, tony i workflow audio są wykonalne |

## Funkcje MVP

| ID | Funkcja | Priorytet | Właściciel | Etap | Kryterium akceptacji |
|---|---|---|---|---:|---|
| MVP-001 | Aplikacja iOS/Android | P0 | Mobile Lead | 2 | minimalny shell Expo uruchamia się na wspieranym Androidzie/iOS, używa baseline designu i nie zawiera sekretów |
| MVP-002 | Rejestracja e-mail i weryfikacja | P0 | Backend Lead | 3 | użytkownik tworzy konto, otrzymuje jednorazowy link i nie może wejść w chroniony przepływ przed weryfikacją |
| MVP-003 | Logowanie, reset i bezpieczna sesja | P0 | Backend Lead | 3 | access/rotowany refresh, wykrycie reuse, reset bez enumeracji kont i wylogowanie wszystkich sesji przechodzą E2E |
| MVP-004 | Profil, zgody i preferencje | P0 | Product Manager | 3 | użytkownik osobno ustawia UI/wyjaśnienia/kurs, widzi wersje zgód i może je wycofać |
| MVP-005 | Eksport i usunięcie konta | P0 | Privacy/Security Lead | 3/9 | eksport ma krótki URL, usunięcie obejmuje procesorów i backup lifecycle, a status/retry są audytowane |
| MVP-006 | Lokalizacja PL/EN/TH | P0 | Mobile Lead | 3 | brak surowych kluczy, CI wykrywa brak tłumaczeń, a krytyczne ekrany działają z długim tekstem i tajskim |
| MVP-007 | Onboarding kurs/cel/czas | P0 | Product Manager | 3 | użytkownik wybiera język UI niezależnie od kursu i kończy/pomija test w maks. 5 minut w teście prototypu |
| MVP-008 | Oddzielny `UserCourse` EN/TH | P0 | Backend Lead | 3 | przełączenie kursu nie przenosi poziomu, planu, historii, SRS ani ustawień tajskiego |
| MVP-009 | Test poziomujący EN | P1 | English Methodologist | 5 | wersjonowany test mapuje na A1/A2, zapis jest idempotentny, a komunikat nie udaje certyfikatu |
| MVP-010 | Test poziomujący TH | P1 | Thai Language Lead | 5 | wersjonowany test mapuje na Pre-A1/A1 i nie opiera wyniku na automatycznej punktacji wymowy |
| MVP-011 | Model treści i workflow publikacji | P0 | Content Platform Lead | 4 | niekompletna/niezrecenzowana wersja nie może zostać opublikowana, a rollback odtwarza poprzednią wersję |
| MVP-012 | Panel administracyjny i RBAC | P0 | Web Lead | 4 | editor/reviewer/admin mają minimalne role, operacje uprzywilejowane są audytowane, a podgląd PL/EN/TH odpowiada mobile |
| MVP-013 | Import/eksport treści i mediów | P1 | Content Platform Lead | 4 | walidacja raportuje wiersze, nie publikuje częściowej paczki, a upload używa krótkiego signed URL i limitów |
| MVP-014 | Katalog startowy EN A1–A2 | P0 | English Methodologist | 4–6 | 30 lekcji, 360 haseł i 12 scenariuszy spełnia DoD i ma niezależną recenzję |
| MVP-015 | Katalog startowy TH Pre-A1–A1 | P0 | Thai Language Lead | 4–6 | 30 lekcji, 300 haseł i 10 scenariuszy spełnia DoD; 100% tajskiego zatwierdza native speaker |
| MVP-016 | Renderer lekcji | P0 | Mobile Lead | 5 | wznawia sesję, zapisuje wersję treści i obsługuje listę/ćwiczenie/feedback bez utraty stanu po backgroundzie |
| MVP-017 | Silnik ćwiczeń deterministycznych | P0 | Learning Engine Lead | 5 | choice/matching/gap/typed/ordering/listening mają wersjonowane ocenianie i testy Unicode EN/TH |
| MVP-018 | Słownik kontekstowy | P0 | Learning Engine Lead | 5 | zaznaczenie słowa/frazy/zdania/zadania otwiera panel bez resetu odpowiedzi, a wynik zachowuje kontekst |
| MVP-019 | Tłumaczenie i TTS | P0 | Backend Lead | 5 | odtwarza źródło/tłumaczenie, ma prędkości i fallback, respektuje limit oraz nie zdradza odpowiedzi bez jawnej podpowiedzi |
| MVP-020 | Zapis własnych słów | P1 | Learning Engine Lead | 5 | wpis zapisany z kontekstem pojawia się raz w SRS pomimo retry i można go usunąć |
| MVP-021 | Spaced repetition | P0 | Learning Engine Lead | 5 | deterministyczny, wersjonowany algorytm liczy `dueAt` w strefie użytkownika; DST/idempotencja mają testy |
| MVP-022 | Historia błędów i postęp | P1 | Learning Engine Lead | 5/8 | agregaty można odbudować ze zdarzeń, a użytkownik widzi spójne wyniki na drugim urządzeniu |
| MVP-023 | Alfabet, transliteracja i tony TH | P0 | Thai Language Lead | 6 | znaki/diakrytyki/audio renderują się na macierzy urządzeń, transliterację można wyłączyć, brak obietnicy scoringu |
| MVP-024 | Rozmowa tekstowa AI | P0 | AI Lead | 7 | streaming, timeout/cancel/retry, moderacja, limit tur, `store:false`, walidacja i kill switch przechodzą testy kontraktowe |
| MVP-025 | Tryby korekty i scenariusze AI | P1 | AI Lead | 7 | cztery tryby zachowują kontrakt, poziom i rejestr; testy PL/EN/TH osiągają zatwierdzony próg |
| MVP-026 | Podsumowanie rozmowy | P0 | AI Lead | 7 | wersjonowany JSON zawiera korekty/wyjaśnienia/słowa/rekomendacje, a błędna odpowiedź nie modyfikuje profilu |
| MVP-027 | Zgłoszenie odpowiedzi AI | P0 | Trust & Safety Lead | 7 | użytkownik zgłasza wiadomość/podsumowanie, panel pokazuje minimalny kontekst, a dostęp jest audytowany |
| MVP-028 | Limity i budżet AI | P0 | Backend Lead | 7/10 | API egzekwuje plan/dzień/tury/koszt, retry nie nalicza dwa razy, a alert/kill switch działa bez blokowania lekcji |
| MVP-029 | Plan „Dzisiaj” z fallbackiem | P0 | Product Manager | 8 | plan uwzględnia czas, cel i SRS; awaria AI nigdy nie daje pustego ekranu |
| MVP-030 | Dashboard postępów | P1 | Product Manager | 8 | czas/lekcje/słowa/skuteczność/seria/poziom są wyjaśnione i rozdzielone EN/TH |
| MVP-031 | Powiadomienia i quiet hours | P1 | Mobile Lead | 9 | just-in-time permission, granularne typy, strefa IANA, quiet hours i usuwanie martwego tokenu przechodzą E2E |
| MVP-032 | Subskrypcje i entitlementy | P1 | Backend Lead | 10 | zakup/restore/refund/expiry/grace i duplikat webhooka zmieniają serwerowe uprawnienie dokładnie raz |
| MVP-033 | Paywall i stan planu | P1 | Product Manager | 10 | oferta pokazuje lokalną cenę/okres/warunki, nie stosuje dark patterns i odtwarza zakup |
| MVP-034 | Analityka produktu | P0 | Product Manager | 2–12 | zdarzenia zgodne z mapą emitują się raz, bez treści/PII, z możliwością cofnięcia zgody i usunięcia profilu |
| MVP-035 | Monitoring, logi i correlation ID | P0 | DevOps/SRE | 2 | crash/error/latency/cost mają redakcję, dashboard i alert; trace nie zawiera tokenu ani treści rozmowy |
| MVP-036 | Backup, restore i runbooki | P0 | DevOps/SRE | 9 | odtworzenie staging z backupu spełnia RPO/RTO, wynik i właściciel są zapisani |
| MVP-037 | Bezpieczeństwo i moderacja | P0 | Privacy/Security Lead | 2–11 | threat model, rate limit, IDOR, XSS/content sanitization, secret scan i test prompt injection nie mają otwartego P0/P1 |
| MVP-038 | Dostępność WCAG 2.2 AA | P0 | UX/UI Lead | 1–11 | kluczowy pion działa przy 200% tekstu, VoiceOver/TalkBack, bez informacji tylko kolorem i z właściwym fokusem |
| MVP-039 | Stany sieciowe i idempotentny retry | P0 | Mobile Lead | 5–11 | offline/wolna sieć/wygaśnięta sesja/cancel/retry nie dublują postępu i pokazują działanie naprawcze |
| MVP-040 | Środowiska i CI/CD | P0 | DevOps/SRE | 2 | dev/stage/prod są rozdzielone, PR blokuje lint/typecheck/test/build, a deployment ma rollback |
| MVP-041 | Zamknięta beta i rollout | P0 | Product Owner | 12 | reprezentatywna beta, zgody, monitoring, support i go/no-go spełniają progi KPI bez P0/P1 |

## Funkcje po MVP

| ID | Funkcja | Priorytet | Właściciel | Najwcześniej | Kryterium wejścia do backlogu realizacyjnego |
|---|---|---|---|---:|---|
| POST-001 | Nagrywanie asynchroniczne i transkrypcja | P2 | Mobile Lead | 13 | nowa DPIA, zgoda, retencja, budżet i test jakości TH zaakceptowane |
| POST-002 | Rozmowy głosowe realtime | P2 | AI Lead | 13 | audio async potwierdza wartość, koszt/latencja mają SLO, kill switch działa |
| POST-003 | Zaawansowana wymowa EN | P2 | English Methodologist | 13 | metodyka i walidacja ekspercka definiują uczciwy próg |
| POST-004 | Eksperymentalna analiza tonów TH | P2 | Thai Language Lead | 13 | native speaker i badanie wykazują wiarygodność, a komunikacja ograniczeń jest zatwierdzona |
| POST-005 | Pełny offline | P2 | Mobile Lead | 13 | dane pokazują istotny drop-off z powodu sieci, a wersjonowanie/synchronizacja mają projekt |
| POST-006 | Kolejne poziomy B1–C1 | P2 | Content Lead | 13 | A1/A2 osiąga progi retencji, istnieje budżet i zespół recenzji |
| POST-007 | Kolejne języki | P2 | Product Owner | 13 | EN/TH osiąga PMF i osobny ekspert/analiza pisma są dostępne |
| POST-008 | Społeczność i lektorzy | P2 | Product Owner | 13 | moderacja, bezpieczeństwo, płatności i support mają osobny model |
| POST-009 | Certyfikaty | P2 | Product Owner | 13 | istnieje wiarygodny, zewnętrznie zwalidowany model oceny |
| POST-010 | Rozbudowane ligi/grywalizacja | P2 | Product Manager | 13 | eksperyment wykazuje wzrost retencji bez szkody dla motywacji |
| POST-011 | Plany rodzinne/firmowe | P2 | Product Owner | 13 | popyt i model prywatności/administracji są potwierdzone |
| POST-012 | Publiczna aplikacja webowa ucznia | P2 | Web Lead | 13 | dane rynkowe uzasadniają utrzymanie kolejnej platformy |

## Brama jakości backlogu

Nowy element nie może wejść do sprintu bez: celu, właściciela, priorytetu, kryteriów akceptacji, analityki, ryzyk prywatności, zależności treściowych oraz oznaczenia `MVP` albo `POST-MVP`. Zmiana zwiększająca zakres MVP wymaga decyzji w [rejestrze](./decision-register.md).

