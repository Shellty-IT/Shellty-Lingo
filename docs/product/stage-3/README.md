# Etap 3 — tożsamość, konto i lokalizacja

Etap dodaje pierwszy chroniony pion użytkownika: rejestrację i logowanie e-mail, krótką sesję dostępową, rotowany token odświeżania, profil oraz onboarding kursu.

## Dostarczone elementy

- API `/v1/auth`: rejestracja, logowanie, odświeżanie i unieważnianie sesji, profil, onboarding, żądanie eksportu i asynchronicznego usunięcia konta;
- hasła są haszowane scryptem z losową solą; refresh tokeny są zapisywane wyłącznie jako hash i należą do rodziny unieważnianej przy wylogowaniu;
- migracja tworzy `User`, `UserProfile`, `UserCourse`, tokeny jednorazowe, zgody, eksporty/usunięcia i rejestr zdarzeń bezpieczeństwa;
- rate limit chroni endpointy logowania i odświeżania, a audyt nie przechowuje haseł ani tokenów;
- aplikacja Expo przechowuje sesję w `Expo SecureStore`, prowadzi przez projektowy onboarding PL/EN/TH i wyświetla pierwszy ekran główny dla wybranego kursu.

## Uruchomienie

Po uzupełnieniu `apps/api/.env` o dwa losowe sekrety uruchom migracje przez `pnpm db:migrate:deploy`, a następnie `pnpm dev:api` i `pnpm dev:mobile`.

Wysyłka e-maili weryfikacyjnych i resetu hasła pozostaje adapterem do skonfigurowania po wyborze dostawcy; model jednorazowych tokenów jest już przygotowany w bazie.
