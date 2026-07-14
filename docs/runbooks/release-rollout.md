# Runbook: beta, rollout i rollback

## Przed betą

1. Wykonaj pełne `pnpm check`, migracje na czystej bazie i macierz Etapu 11.
2. Zweryfikuj staging, Sentry, alarmy, kolejkę supportu, backup/restore i poświadczenia sklepowe.
3. Ustaw flagi kosztowne na minimalny uzgodniony procent. Zachowaj `ai_conversations` jako natychmiastowy kill switch.
4. Uruchom `eas build --profile beta --platform all`, a po zakończeniu `eas submit --profile beta --platform android|ios`; Android trafia jako draft do internal track, a iOS do TestFlight po konfiguracji submit credentials.
5. Zaproś wyłącznie testerów ze zgodą beta i instrukcją zgłaszania P0/P1.

## Codzienny przegląd

- odczytaj `/v1/release/readiness?windowDays=30` kontem administratora;
- porównaj aktywację, ukończenie lekcji/rozmowy, D1/D7, zgłoszenia AI, crash-free i koszt AI;
- przejrzyj nowe P0/P1, kolejkę supportu i zgłoszenia jakości tajskiego;
- zapisz decyzję, właściciela, godzinę oraz zmianę procentu każdej flagi.

## Rollout publiczny

1. Wymagaj zielonego CI, `recommendation=go`, zamkniętych P0/P1 i podpisu Product/QA/Operations.
2. Wdróż API/admin na production, wykonaj live/ready smoke test i dopiero potem kolejkuj build mobilny.
3. Rozpocznij phased release: 5% → 20% → 50% → 100%, nie częściej niż raz na 24 godziny.
4. Na każdym progu potwierdź crash-free, p95 API, błędy AI, support i budżet.

## Stop i rollback

Natychmiast zatrzymaj rollout przy P0, utracie danych, błędzie autoryzacji, crash-free poniżej progu, niekontrolowanym koszcie AI albo szkodliwej odpowiedzi bez działającej moderacji.

1. Wyłącz dotkniętą funkcję przez `PATCH /v1/release/flags/:key` (`enabled=false`, `rolloutPercent=0`) — jest to pierwsza i najszybsza reakcja.
2. Zatrzymaj phased release w konsoli sklepu.
3. Jeśli problem dotyczy API/admina, przywróć poprzedni zdrowy deploy. Nie cofaj automatycznie migracji.
4. Jeśli problem jest w kliencie i nie da się go odciąć flagą, przygotuj poprawiony build; wycofanie wersji sklepowej zależy od możliwości platformy.
5. Uruchom runbook incydentu, komunikację użytkowników i raport przyczynowy.
