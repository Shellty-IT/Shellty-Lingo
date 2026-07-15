# Etap 3 — tożsamość, konto i lokalizacja

**Status:** częściowo zrealizowany; podstawowy przepływ konta działa, ale brama etapu nie jest zamknięta.

Etap dodaje pierwszy chroniony pion użytkownika: rejestrację i logowanie e-mail, krótką sesję dostępową, rotowany token odświeżania, profil oraz onboarding kursu.

## Dostarczone elementy

- API `/v1/auth`: rejestracja, logowanie, odświeżanie i unieważnianie sesji, profil, onboarding, żądanie eksportu i asynchronicznego usunięcia konta;
- hasła są haszowane scryptem z losową solą; refresh tokeny są zapisywane wyłącznie jako hash i należą do rodziny unieważnianej przy wylogowaniu;
- migracja tworzy `User`, `UserProfile`, `UserCourse`, tokeny jednorazowe, zgody, eksporty/usunięcia i rejestr zdarzeń bezpieczeństwa;
- rate limit chroni endpointy logowania i odświeżania, a audyt nie przechowuje haseł ani tokenów;
- aplikacja Expo przechowuje sesję w `Expo SecureStore`, prowadzi przez projektowy onboarding PL/EN/TH i wyświetla pierwszy ekran główny dla wybranego kursu.

## Uruchomienie

Po uzupełnieniu `apps/api/.env` o dwa losowe sekrety uruchom migracje przez `pnpm db:migrate:deploy`, a następnie `pnpm dev:api` i `pnpm dev:mobile`.

## Otwarte elementy bramy

- wysyłka i obsługa potwierdzenia e-mail, resetu oraz zmiany hasła nie mają jeszcze endpointów ani adaptera dostawcy;
- eksport i usunięcie konta tworzą żądania, ale brakuje workerów wykonujących eksport/usunięcie;
- lokalizacje PL/EN/TH obejmują główne przepływy, lecz nie istnieje automatyczna kontrola kompletności wszystkich ekranów mobilnych;
- E2E z prawdziwą bazą pokrywa rejestrację, onboarding i rotację tokenu, ale nie pełną macierz wymaganą w planie (błędne dane, wygaśnięcie, zmiana języka i usunięcie konta).

Model tokenów jednorazowych jest przygotowany w bazie, ale sam model danych nie stanowi ukończonej funkcji.
