# Etap 13 — rozwój po MVP

Pierwszy eksperyment wdrożony po MVP to **Listening Lab**. W środowiskach development/staging jest domyślnie dostępny, a na produkcji pozostaje wyłączony do decyzji opartej na danych beta.

## Zakres eksperymentu

- krótkie ćwiczenia EN i TH z odsłuchem w tempie podstawowym i wolniejszym;
- odpowiedź wielokrotnego wyboru bez ujawniania klucza przed oceną;
- transkrypcja i wyjaśnienie dopiero po odpowiedzi;
- lokalna, maksymalnie 30-sekundowa próba głosowa z odsłuchem;
- nagranie trafia wyłącznie do cache urządzenia i jest usuwane przy zmianie nagrania lub wyjściu z widoku;
- osobne flagi `listening_lab` i `async_speaking`, stabilny rollout kohortowy oraz zdarzenia `listening_started`/`listening_completed`.

Lokalna próba głosowa celowo nie jest wysyłana ani transkrybowana. Włączenie uploadu/transkrypcji wymaga DPIA, zgody, polityki retencji, umowy z procesorem, limitu kosztu, testów tajskiego oraz osobnej decyzji rolloutowej.

## Kolejność dalszych kandydatów

Kandydaci z planu są reprezentowani przez wyłączone flagi: `realtime_voice`, `thai_tone_analysis`, `offline_mode` i `social_features`. Decyzja o kolejnym przyroście korzysta z danych beta: problemu użytkownika, ukończenia, retencji, jakości, kosztu i ryzyka prywatności. Sam fakt istnienia flagi nie oznacza zgody na implementację ani komunikowanie dokładności analizy wymowy.

## Kryteria promocji Listening Lab na produkcję

- minimum 30 aktywnych testerów eksperymentu;
- brak regresji crash-free i czasu uruchomienia;
- wzrost ukończenia sesji bez spadku ukończenia lekcji;
- pozytywna weryfikacja nagrań na iOS/Android oraz VoiceOver/TalkBack;
- ekspercka akceptacja tajskich tekstów i tempa TTS;
- zatwierdzony komunikat prywatności dla mikrofonu.
