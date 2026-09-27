# Etap 2: czytelne i dostępne zadania

Implementacja z 27.09.2026 obejmuje A03, A07, A08, A10 i A11 z audytu. Kod jest gotowy do przeglądu; odbiór na fizycznych urządzeniach i przygotowanie nagrań pozostają warunkami publikacji.

## Zachowanie

- Siedem formatów ma osobne renderery odpowiedzi. Wybór pojedynczy i odsłuch używają ról radio, wybór wielokrotny — checkbox. API podaje liczbę wymaganych zaznaczeń bez ujawniania identyfikatorów rozwiązania. Luka i pełna odpowiedź mają różne instrukcje oraz etykiety pól.
- Rozsypanka pokazuje odpowiedź w wybranej kolejności. Po ocenie każda pozycja jest porównywana z rozwiązaniem; sama obecność kafelka w rozwiązaniu nie daje zielonego oznaczenia. Pary również mają ocenę konkretnych połączeń. Poprawność opisuje tekst, a nie wyłącznie kolor.
- Kafelki można przesuwać wcześniej/później i usuwać przyciskami z etykietami dostępności. Przeciąganie nie jest wymagane. Po wysłaniu odpowiedzi obowiązuje blokada i niezmienny payload z etapu 1.
- Wyświetlanie rozsypanek zachowuje autorską wielkość liter, interpunkcję, symbole i tajskie znaki. Opcjonalne `displayText` pozwala redaktorowi świadomie ustalić napis. Dotychczasowe grupowanie angielskich fragmentów pozostaje dostępne tylko dla kursu EN; nie stosuje się go do TH.
- Instrukcje korzystają z zatwierdzonych tłumaczeń PL/EN/TH. Sesja zachowuje język interfejsu ustalony przy rozpoczęciu. Dla historycznej treści bez zweryfikowanego tłumaczenia widoczna jest lokalna instrukcja formatu i oryginalne angielskie polecenie jako tekst dodatkowy. Oryginał nie znika po zmianie języka interfejsu.
- Wspólna ramka wskazuje język odpowiedzi. Nowe zadanie przewija ekran na początek i kieruje fokus czytnika na instrukcję. Fokus pola tekstowego przewija do jego zmierzonej pozycji; nie do końca całej strony. Obsługa klawiatury ponawia pomiar, a zmiana zadania odrzuca stary callback.
- Odsłuch preferuje przypisane nagranie. Błąd nagrania lub brak rozpoczęcia odtwarzania w ciągu 12 sekund uruchamia jawnie opisany głos syntetyczny. Awaria obu źródeł pokazuje komunikat i wariant tekstowy. Stop, wysłanie odpowiedzi, przejście w tło i opuszczenie zadania zatrzymują odtwarzanie; spóźniony URL nie uruchamia zatrzymanego nagrania.
- Wariant czytania ujawnia tekst i zapisuje `mode: "reading"` w odpowiedzi, także w trwałej kolejce. Serwer zapisuje `practiceMode`, `assisted` i `listeningVerified: false` w wyniku oraz zdarzeniu. Poprawna odpowiedź pozwala ukończyć lekcję według dotychczasowych zasad punktacji, ale nie jest dowodem opanowania słuchania. `listeningVerified` dla odsłuchu oznacza poprawną odpowiedź w tym trybie; nie potwierdza fizycznego odsłuchania ani umiejętności fonetycznej.

Nie zmieniono algorytmu SRS, normalizacji ocen ani rubryki odpowiedzi otwartych. Te zmiany należą do etapu 3. Rozszerzenie formatów powtórek i treści dydaktycznych należy do etapu 4.

## Nagrania i konfiguracja API

Endpoint `GET /learning/sessions/:sessionId/exercises/:exerciseId/audio` sprawdza właściciela sesji, jej typ oraz przynależność zadania do przypiętej rewizji treści. Wymaga zasobu `audio`, MIME `audio/*` i dodatniego rozmiaru. Zwraca podpisany URL ważny przez 300 sekund oraz `expiresAt`; odpowiedź ma `Cache-Control: private, no-store`.

Zmienne wyłącznie po stronie API:

| Zmienna                                                | Znaczenie                                                                                                |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `MEDIA_S3_BUCKET`                                      | Bucket z zatwierdzonymi plikami; brak konfiguracji uruchamia fallback po stronie klienta.                |
| `MEDIA_S3_REGION`                                      | Region, domyślnie `us-east-1`.                                                                           |
| `MEDIA_S3_ENDPOINT`                                    | Opcjonalny endpoint S3 compatible; w staging/production wymaga HTTPS.                                    |
| `MEDIA_S3_ACCESS_KEY_ID`, `MEDIA_S3_SECRET_ACCESS_KEY` | Opcjonalna para danych dostępowych. Bez niej SDK używa standardowego łańcucha poświadczeń, np. roli IAM. |

Roli nadać odczyt potrzebnych obiektów. Klucze dostępu i `storageKey` nie są przekazywane aplikacji. Podpisany URL daje czasowy dostęp do pliku — nie logować go ani nie wysyłać do analityki. Dla odtwarzania web skonfigurować CORS bucketa dla właściwych originów i odczytu GET. Test natywny musi sprawdzić rzeczywisty format pliku i odtwarzanie na obu platformach.

Plik musi istnieć pod `MediaAsset.storageKey`; implementacja nie tworzy bucketa ani nie przesyła nagrań. Brama publikacji sprawdza metadane przypisanego audio, nie odczytuje obiektu z magazynu i nie ocenia jakości wymowy. Nagrania EN/TH wymagają odbioru redakcyjnego. Nie wykonywano płatnych wywołań ani konfiguracji produkcyjnej.

## Treści i wdrożenie

1. Zachować migrację i kontrakty etapu 1. Etap 2 nie wymaga nowej migracji bazy.
2. Redaktorzy dodają tłumaczenia pola `instructions` do każdego niepustego polecenia w PL/EN/TH i przeprowadzają istniejący proces weryfikacji. Nowa publikacja jest blokowana przy brakujących lub niezweryfikowanych tłumaczeniach. Dotychczasowe opublikowane treści nie zostały automatycznie zmienione.
3. Dodać i zatwierdzić zasoby nagrań oraz skonfigurować magazyn na środowisku testowym. Zadania bez przypisanego nagrania korzystają z oznaczonego TTS; brak audio nie blokuje wariantu czytania.
4. Wdrożyć API przed nowym klientem, ponieważ klient przesyła tryb czytania i korzysta z nowego endpointu. Starsze odpowiedzi odsłuchu w postaci ID pozostają akceptowane. Następnie opublikować mobile po odbiorze urządzeń.

Nie uruchomiono seeda, nie zmieniono istniejących treści w bazie i nie wdrożono zmian w produkcji.

## Weryfikacja

```powershell
corepack pnpm@11.13.0 check
```

Wynik z 27.09.2026: formatowanie, lint, typy i build wszystkich aplikacji przeszły. Zaliczone 356 testów jednostkowych: 243 API, 97 mobile i 16 pakietów. Build mobile obejmuje eksport web, nie paczki natywne Android/iOS. Suite E2E zaliczyła 3 testy health; 9 testów zapisu PostgreSQL i 1 test autoryzacji bazy pominięto bez aktywnej konfiguracji izolowanej bazy.

Ponowienie regresji PostgreSQL z etapu 1 zostało zablokowane przez błąd startu Docker Desktop (`initializing Inference manager`, niedostępny lokalny socket). Kontener testowy nie został uruchomiony; nie zmieniano konfiguracji Docker ani zwykłej bazy projektu. Poprzednie wyniki PostgreSQL pozostają opisane w dokumentacji etapu 1 i nie są przedstawiane jako ponowna weryfikacja etapu 2.

Automatyczne regresje obejmują macierz 7 formatów × 3 języki interfejsu × 2 języki kursu, ocenę pozycji i par, obsługę kafelków bez gestów, lokalizację zatwierdzonych instrukcji i fallback historyczny, zapis trybu czytania, autoryzację i podpisywanie audio, awarie odtwarzania, spóźnione wyniki, anulowanie TTS oraz pomiar i reset przewijania. Testy komponentów używają atrap React Native i Expo; nie potwierdzają działania natywnego czytnika ani prawdziwego odtwarzacza.

Przed publikacją przejść wszystkie formaty na Androidzie i iOS: mały ekran, tekst 200%, klawiatury PL/EN/TH, TalkBack i VoiceOver. Sprawdzić tajskie znaki, widoczność pola i przycisku po otwarciu klawiatury, fokus następnego zadania i odczyt krótkiego feedbacku. Dla audio sprawdzić rzeczywiste nagrania EN/TH, brak głosu TH, wygasły/błędny URL, słabą sieć, tryb samolotowy, Stop, tło i wznowienie. Dla czytania sprawdzić retry i wznowienie zapisanej odpowiedzi. Te testy manualne nie zostały jeszcze wykonane.
