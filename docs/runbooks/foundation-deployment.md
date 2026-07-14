# Runbook — wdrożenie Foundation Release

## Pierwsza konfiguracja staging

1. W Render utwórz zasoby z `render.yaml` w regionie Frankfurt.
2. Wygeneruj osobne deploy hooks API i admina.
3. Utwórz GitHub Environment `staging` z wymaganym zatwierdzeniem i sekretami `RENDER_API_DEPLOY_HOOK`, `RENDER_ADMIN_DEPLOY_HOOK`.
4. Dodaj tajne `DATABASE_URL`/`SENTRY_DSN` wyłącznie w Render; publiczny URL API i zredagowany publiczny DSN mogą trafić do zmiennych klienta.
5. W Sentry wyłącz replay, attachments i PII; nie włączaj body requestów. Zweryfikuj scrubbing testowym błędem bez danych użytkownika.
6. Utwórz projekt Expo/EAS, przypisz `projectId` dopiero przez `eas init`, a wartości profili przechowuj w EAS Environment Variables.

## Wdrożenie

1. Upewnij się, że CI dla commita jest zielone.
2. Uruchom workflow „Controlled deployment”, wybierając `development` lub `staging`.
3. Po wdrożeniu sprawdź `/v1/health/live`, a następnie `/v1/health/ready`.
4. Sprawdź, czy odpowiedź zawiera `x-correlation-id`, a log dla tego ID nie zawiera nagłówków, body ani PII.
5. Wykonaj smoke test panelu i aplikacji mobilnej dla PL/EN/TH.

## Rollback

1. W Render wybierz ostatni zdrowy deploy API i admina.
2. Nie cofaj automatycznie migracji. Przy migracji addytywnej starsza aplikacja ma działać na nowym schemacie.
3. Jeśli readiness nie wraca do `ok`, zatrzymaj rollout i porównaj correlation ID między odpowiedzią, logiem Render i Sentry.
4. Zapisz incydent, commit, czas rozpoczęcia/końca oraz wynik rollbacku.
