# Wstępna ocena skutków dla ochrony danych (DPIA)

**Właściciel procesu:** Privacy/Security Lead  
**Data oceny:** 2026-07-14  
**Status:** wstępna ocena projektowa; wymaga danych administratora, konsultacji prawnej i podpisanych DPA przed betą zewnętrzną

## 1. Dlaczego wykonujemy pełną ocenę

Shellty Lingo używa nowej technologii do analizy wypowiedzi, buduje profil edukacyjny i może przypadkowo otrzymać dane szczególnej kategorii w swobodnym tekście. UODO wskazuje, że innowacyjna technologia, ewaluacja/profilowanie i łączenie danych są kryteriami oceny wysokiego ryzyka. Przyjmujemy ostrożnie, że DPIA jest wymagana, choć wynik edukacyjny nie wywołuje skutków prawnych i aplikacja jest przeznaczona dla dorosłych.

DPIA jest procesem żywym: przegląd przed betą, po istotnej zmianie dostawcy/modelu/retencji oraz obowiązkowo przed funkcją nagrywania głosu.

## 2. Zakres i przepływy danych

| Proces | Dane | Cel | Robocza podstawa | Retencja |
|---|---|---|---|---|
| Konto i sesja | e-mail, hash hasła, identyfikatory sesji, IP w logu bezpieczeństwa | utworzenie i ochrona konta | wykonanie umowy; prawnie uzasadniony interes dla bezpieczeństwa | konto do usunięcia; log bezpieczeństwa 90 dni |
| Profil edukacyjny | języki, poziom, cel, strefa czasu, postęp, błędy, plan | personalizacja i świadczenie kursu | wykonanie umowy | do usunięcia konta lub wcześniejszego usunięcia kursu |
| Treść rozmowy AI | tekst wpisany przez użytkownika, odpowiedź, scenariusz | prowadzenie i korekta rozmowy | wykonanie umowy; wyraźne ostrzeżenie przed danymi wrażliwymi | 30 dni; możliwość natychmiastowego usunięcia |
| Wnioski z rozmowy | wskazane błędy, zapisane słowa, ocena umiejętności | dalszy plan i powtórki | wykonanie umowy | do usunięcia przez użytkownika/konta |
| Słownik/TTS | wybrany fragment, języki, audio wygenerowane | tłumaczenie i odsłuch | wykonanie umowy | cache treści niepersonalnej do 30 dni; zapytanie personalne bez cache |
| Analityka produktu | pseudonim, zdarzenia i metadane bez treści | ulepszanie produktu i mierzenie celu | zgoda tam, gdzie wymagana przez ePrivacy/SDK; inaczej uzasadniony interes po LIA | 12 miesięcy |
| Monitoring | stack trace, wersja, urządzenie, pseudonim techniczny | stabilność i bezpieczeństwo | prawnie uzasadniony interes | 30 dni |
| Powiadomienia | token urządzenia, preferencje, strefa czasu | zamówione przypomnienia | zgoda/ustawienie użytkownika i pozwolenie systemowe | do wycofania lub 30 dni po błędzie `DeviceNotRegistered` |
| Eksport/usunięcie | zakres żądania, status, podpisany URL | wykonanie praw osoby | obowiązek prawny | plik eksportu 24 h; metadane zadania 90 dni |
| Płatności | identyfikator transakcji, produkt, status uprawnienia | zakup i rozliczenie | umowa i obowiązek prawny | dane księgowe wg prawa; w aplikacji minimalny stan uprawnienia |
| Support/zgłoszenie AI | treść dobrowolnego zgłoszenia, potrzebny kontekst | obsługa i bezpieczeństwo | umowa/uzasadniony interes | 24 miesiące, krócej na żądanie jeśli brak obowiązku |

Podstawy prawne są propozycją techniczną. Ostateczne podstawy, okres danych księgowych i treść zgód zatwierdza prawnik/administrator.

## 3. Osoby, odbiorcy i transfery

- osoby: dorośli użytkownicy 18+, testerzy, redaktorzy i administratorzy;
- aplikacja nie jest kierowana do dzieci; przy rejestracji wymagane jest potwierdzenie 18+, bez zbierania pełnej daty urodzenia;
- odbiorcy: operator hostingu/bazy, S3/e-mail, Expo/APNs/FCM, dostawca AI, analityka, monitoring i płatności;
- każdy procesor wymaga DPA, listy podprocesorów, instrukcji usunięcia oraz oceny transferu;
- główne dane i analityka pozostają we Frankfurcie; dostawca amerykański może przetwarzać wyłącznie minimalny zakres na podstawie odpowiedniego mechanizmu transferowego;
- do AI nie wysyłamy e-maila, imienia, identyfikatora płatności ani stabilnego ID użytkownika.

## 4. Niezbędność i proporcjonalność

- historia rozmowy jest ograniczona do okna potrzebnego bieżącej sesji; pełna historia nie jest automatycznie przesyłana;
- treść rozmowy nie trafia do analityki, logów, monitoringu, powiadomień ani narzędzia supportowego bez jawnego zgłoszenia;
- poziom i ostatnie kategorie błędów są wystarczające do personalizacji; AI nie potrzebuje tożsamości;
- wynik AI nie podejmuje decyzji prawnej, finansowej, rekrutacyjnej ani zdrowotnej;
- użytkownik może korzystać z lekcji i SRS po awarii/wyłączeniu AI;
- rekomendacja planu ma deterministyczny fallback i może zostać zmieniona przez użytkownika;
- domyślna retencja treści rozmowy 30 dni jest ograniczona, widoczna i możliwa do skrócenia przez usunięcie.

## 5. Ryzyko i zabezpieczenia

Skala: prawdopodobieństwo `P` 1–4, wpływ `W` 1–4, wynik `P×W`; 12–16 wysokie, 6–11 średnie, 1–5 niskie.

| Ryzyko | Początkowe | Zabezpieczenia wymagane | Resztkowe | Decyzja |
|---|---:|---|---:|---|
| Użytkownik wpisuje dane zdrowotne, poglądy lub dane osoby trzeciej do rozmowy | 3×4=12 | ostrzeżenie, redakcja PII przed AI, brak logowania treści, usuwanie rozmowy, krótka retencja | 2×3=6 | akceptacja warunkowa |
| Treść rozmowy przechodzi do regionu/dostawcy bez właściwej podstawy | 3×4=12 | DPA, SCC/TIA lub odpowiedni mechanizm, `store:false`, projekt EU+ZDR przed publicznym MVP, rejestr transferów | 1×4=4 | brama prawna |
| Prompt injection powoduje ujawnienie systemowego kontekstu lub danych innej osoby | 3×4=12 | izolacja konwersacji, brak danych innych osób w promptach, walidacja, limity narzędzi, testy red-team | 1×4=4 | akceptacja po testach |
| E-mail/token/treść wycieka do analityki lub monitoringu | 3×4=12 | allowlista pól, scrubber, test kontraktowy, attachments/replay off, alert na PII | 1×4=4 | akceptacja po testach |
| Przejęcie konta ujawnia historię i postęp | 3×4=12 | Argon2id, rotacja refresh tokenów, SecureStore, rate limit, alerty, unieważnianie sesji | 2×3=6 | akceptacja warunkowa |
| Usunięcie konta nie usuwa danych u procesorów/backupu | 3×4=12 | orkiestracja usunięcia, retry/DLQ, dowód wykonania, cykl backupu ≤35 dni, test kwartalny | 1×4=4 | akceptacja po teście |
| Błędna korekta AI szkodzi nauce lub przedstawia stereotyp | 4×3=12 | schemat, ewaluacje PL/EN/TH, zgłoszenia, ekspert tajskiego, etykieta AI, możliwość ignorowania | 2×3=6 | akceptacja warunkowa |
| Użytkownik uważa ocenę poziomu za obiektywny certyfikat | 3×2=6 | jasny język „poziom startowy”, brak certyfikatu, wyjaśnienie metody, możliwość zmiany | 1×2=2 | akceptacja |
| Powiadomienie ujawnia na ekranie blokady wrażliwy kontekst | 2×3=6 | neutralne treści, brak fragmentów rozmów i wyników, granularne zgody, quiet hours | 1×2=2 | akceptacja |
| Osoba niepełnoletnia korzysta mimo przeznaczenia 18+ | 2×3=6 | potwierdzenie 18+, komunikacja dla dorosłych, procedura usunięcia po zgłoszeniu | 1×3=3 | akceptacja |
| Przyszłe nagranie głosu tworzy dane o podwyższonym ryzyku | 4×4=16 | funkcja poza MVP, osobna zgoda i nowa DPIA przed implementacją | 1×4=4 | nie implementować |

## 6. Prawa osoby i kontrola

- ustawienia pozwalają pobrać dane, usunąć historię rozmów, usunąć kurs i konto oraz wycofać zgody;
- eksport jest maszynowo czytelny, zabezpieczony krótkim podpisanym URL i nie zawiera sekretów;
- cofnięcie analityki zatrzymuje nowe zdarzenia i inicjuje usunięcie profilu analitycznego;
- usunięcie konta ma widoczny status, możliwość anulowania tylko w jawnym okresie karencji i kończy się powiadomieniem;
- dostęp pracownika do zgłoszenia/rekordu użytkownika jest rolą, zdarzeniem audytu i ma uzasadnienie;
- polityka prywatności nazywa AI jako system automatyczny, wyjaśnia ograniczenia i zgodnie z AI Act informuje użytkownika, że rozmawia z AI.

## 7. Bramy przed betą zewnętrzną

- [ ] dane administratora, kontakt prywatności i rynki są znane;
- [ ] prawnik/IOD zatwierdził podstawy, treść informacji i model zgód;
- [ ] podpisano i zarchiwizowano DPA oraz zweryfikowano podprocesorów;
- [ ] wykonano TIA dla transferów poza EOG lub wyeliminowano transfer;
- [ ] dostawca AI ma zaakceptowaną retencję; przed publicznym MVP projekt EU z ZDR/MAM albo zatwierdzony wyjątek;
- [ ] test potwierdza brak treści/PII w PostHog, Sentry i logach;
- [ ] usunięcie i eksport przeszły test E2E wraz z procesorami;
- [ ] procedura incydentu i kontakt do UODO są gotowe;
- [ ] funkcje głosowe pozostają wyłączone feature flagą.

## 8. Źródła

- [Komisja Europejska — kiedy wymagana jest DPIA](https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/obligations/when-data-protection-impact-assessment-dpia-required_en)
- [UODO — kiedy trzeba przeprowadzić ocenę skutków](https://uodo.gov.pl/pl/598/3617)
- [EDPB — wytyczne WP248 dotyczące DPIA](https://www.edpb.europa.eu/endorsed-wp29-guidelines_en)
- [EUR-Lex — AI Act, art. 50](https://eur-lex.europa.eu/eli/reg/2024/1689)

