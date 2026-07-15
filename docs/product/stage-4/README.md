# Etap 4 — treść i panel administracyjny

**Status:** częściowo zrealizowany; workflow publikacji i rzeczywisty panel operacyjny działają, pełne studio treści i media pozostają otwarte.

## Dostarczone elementy

- model kursów, modułów, lekcji, wersji, ćwiczeń, słownictwa, wariantów wymowy, tematów gramatycznych, tłumaczeń i prywatnych zasobów multimedialnych;
- wspólny kontrakt ćwiczeń dla wyboru pojedynczego/wielokrotnego, dopasowań, luk, wpisywania, układania i słuchania;
- workflow `draft → review → published → archived`, historia wersji, audyt zmian oraz bezpieczny rollback do wcześniejszej wersji;
- publiczne endpointy tylko dla opublikowanego kursu i lekcji oraz chronione endpointy warsztatu dla `editor` i `admin`;
- walidacja publikacji wymaga ćwiczenia, poprawnej odpowiedzi, czasu lekcji i zweryfikowanych tłumaczeń tytułu PL/EN/TH;
- responsywny panel Content Studio utrzymany w palecie i typografii referencyjnego interfejsu Shellty Lingo;
- deterministyczny seed z małą, opublikowaną lekcją EN i TH.

## Najważniejsze endpointy

- `GET /v1/content/courses` — katalog opublikowanych kursów;
- `GET /v1/content/courses/:courseSlug/lessons/:lessonSlug` — wersja lekcji dla mobile;
- `GET /v1/content/admin/workspace` — workspace redaktora;
- `POST /v1/content/admin/revisions/:revisionId/submit` — sprawdzenie kompletności i przekazanie do review;
- `POST /v1/content/admin/revisions/:revisionId/review` — decyzja redaktora;
- `POST /v1/content/admin/revisions/:revisionId/publish` — publikacja tylko przez admina;
- `POST /v1/content/admin/lessons/:lessonId/rollback/:version` — kontrolowany rollback tylko przez admina.

Panel ma logowanie dla ról `editor`/`admin`, sesję odświeżaną w pamięci, rzeczywisty workspace API oraz akcje submit/review/publish. Nie jest jeszcze kompletnym edytorem: brakuje formularzy CRUD kursów i ćwiczeń, importu/eksportu pakietów, uploadu S3, podglądu mobilnego oraz obsługi zgłoszeń AI do zamknięcia sprawy. Seed jest materiałem demonstracyjnym oznaczonym jako sprawdzony przez technicznego aktora systemowego; nie zastępuje recenzji eksperta językowego.
