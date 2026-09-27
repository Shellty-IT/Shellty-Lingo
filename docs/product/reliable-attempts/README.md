# Etap 1: wiarygodny zapis odpowiedzi

Implementacja z 26.09.2026 obejmuje A01, A02 i A05 z audytu zadań. Jest gotowa do przeglądu kodu; odbiór na fizycznym Androidzie/iOS i wdrożenie pozostają osobnymi krokami.

## Zachowanie

- Każde wystąpienie powtórki ma rosnącą `scheduleRevision`, niezależną od `repetitions`. Ocena zwiększa ją atomowo. Ponowne dodanie istniejącej karty po błędzie lekcji również zwiększa rewizję.
- Mobile wysyła oczekiwaną rewizję i klucz `review:<id>:<revision>`. Serwer wiąże klucz z hashem oceny oraz rewizji. Identyczne retry zwraca zapisany wynik, zmiana payloadu jest konfliktem, a nie nową próbą.
- Transakcje PostgreSQL chronią przed podwójną aktualizacją harmonogramu, liczników lekcji i ukończenia. Dwie instancje klienta mogą zatwierdzić dane wystąpienie tylko raz.
- Wysłana odpowiedź i ocena są zamrożone do końca operacji. Ponowienie nie pobiera aktualnie edytowanego tekstu. Kolejne zadanie jest dostępne po otrzymaniu wyniku.
- Kolejka lekcji i ocen SRS jest przypisana do użytkownika. Zapis poprzedza żądanie HTTP. Dwa naprzemienne pliki, numer rewizji i kontrolny odczyt chronią ostatni kompletny zapis przy przerwaniu zapisu kolejnego pliku.
- Odtworzenie kolejki po starcie, powrót aplikacji na pierwszy plan, powrót sieci w przeglądarce i ponowienie co 5 sekund na aktywnym ekranie umożliwiają synchronizację. Żądania dotyczące tego samego klucza są współdzielone.
- Błąd dysku nie usuwa starej kolejki ani nie pokazuje komunikatu o zachowaniu nowej odpowiedzi. Można nadal wysłać zamrożoną odpowiedź przez sieć; jeżeli to też się nie uda, UI wymaga pozostania na ekranie i ponowienia.
- Spóźnione wyniki tutora, słownika i oceny powtórki są odrzucane po zmianie zadania. Serwer ustala pomoc na moment otrzymania odpowiedzi, przed oceną AI; później ukończona podpowiedź nie zmienia historycznego wyniku.
- Nowe komunikaty mają wersje PL, EN i TH. Algorytm `srs-v1` i zasady punktacji pozostają dotychczasowe.

## Wdrożenie

1. Zastosować addytywną migrację `20260926120000_reliable_review_attempts` standardowym `pnpm db:migrate:deploy` w docelowym środowisku. Nie używać `db push`.
2. Wdrożyć API z nowym kontraktem kolejki.
3. Opublikować mobile po odbiorze na urządzeniach. Nowy klient wymaga API zwracającego `scheduleRevision`; nie publikować go wcześniej niż API.

Historyczne `ReviewAttempt` zachowują nullable hash i rewizję. API nadal przyjmuje starsze żądania bez oczekiwanej rewizji; pełna ochrona przed starym wystąpieniem wymaga nowego klienta. Migracja nie zmienia istniejących terminów ani punktacji.

Stara kolejka `v1` nie zna właściciela. Importowane są tylko odpowiedzi z sesji, której właściciela potwierdziło API podczas wznowienia lekcji. Oryginalny plik pozostaje zachowany dla innych sesji/kont.

Trwałe pliki używają Expo FileSystem na Androidzie/iOS. Eksport web został zweryfikowany kompilacją; trwałość danych w przeglądarce wymaga osobnego adaptera. Przy niedostępnym zapisie obowiązuje komunikat o niezapisanej odpowiedzi, a nie zapewnienie o działaniu offline.

## Weryfikacja

Podstawowe kontrole całego repozytorium:

```powershell
corepack pnpm@11.13.0 check
```

Wynik lokalny z 26.09.2026: formatowanie, lint, typy i build przeszły; 280 testów jednostkowych zakończonych sukcesem (225 API, 41 mobile, 14 pakietów). Suite E2E: 12 testów przeszło, w tym 9 nowych testów zapisu na PostgreSQL; niezwiązany test autoryzacji bazy został pominięty, ponieważ `RUN_DATABASE_E2E` nie było włączone.

Testy PostgreSQL wymagają osobnej lokalnej bazy. Suite odmawia uruchomienia dla hosta spoza localhost/127.0.0.1 lub nazwy bazy innej niż `shellty_stage1_test` i usuwa wyłącznie utworzone przez siebie fixture'y.

```powershell
# Tylko izolowana baza testowa; przed testem zastosować wszystkie migracje.
$env:STAGE1_TEST_DATABASE_URL = 'postgresql://postgres:stage1_test_only@127.0.0.1:55432/shellty_stage1_test?schema=public'
corepack pnpm@11.13.0 test:e2e
```

Regresje obejmują `again → good`, `hard → hard`, identyczne i zmienione retry, dwa urządzenia, stare wystąpienie po następnym terminie, równoległy zapis lekcji i ukończenie, utratę odpowiedzi HTTP, restart kolejki, przerwanie zapisu pliku, błąd dysku, zmianę konta, równoczesne enqueue/flush oraz spóźnione callbacki. Testy komponentów używają atrap portów React Native; nie zastępują testów natywnego systemu plików.

Przed publikacją sprawdzić na Androidzie i iOS: utratę sieci przed/po zatwierdzeniu odpowiedzi, zabicie procesu i wznowienie lekcji, zmianę konta z oczekującymi odpowiedziami, powrót z tła, odzyskanie połączenia oraz spóźnioną podpowiedź. Testować EN i TH z interfejsami PL/EN/TH. Automatyczne testy symulują awarię dysku; jej obsługę w UI również należy obejrzeć na urządzeniu.

Nie uruchomiono migracji w zwykłej bazie projektu ani w produkcji. Lokalny test wykorzystuje osobny kontener PostgreSQL.
