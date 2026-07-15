# Etap 7 — rozmowy tekstowe i analiza AI

**Status:** pion developerski; produkcyjna warstwa AI i brama jakości pozostają otwarte.

Backend udostępnia neutralny interfejs `AiProvider`, wersjonuje prompt i schemat odpowiedzi oraz stosuje podstawowy filtr wejścia i wyjścia. Każda rozmowa ma scenariusz, poziom, rolę, jeden z czterech trybów korekty, limit długości i wiadomości, szacunkowe metryki tokenów/kosztu oraz prosty circuit breaker.

Odpowiedzi są walidowane przed zapisem. Po rozmowie powstaje strukturalne podsumowanie z mocnymi stronami, poprawkami i rekomendacją. Użytkownik może zgłosić odpowiedź, a redaktor ma chroniony endpoint i kolejkę zgłoszeń w panelu administracyjnym.

Obecnie dostępny jest wyłącznie deterministyczny adapter edukacyjny do developmentu i testów. Produkcja odrzuca uruchomienie funkcji AI bez gotowej integracji. Do zamknięcia etapu brakuje produkcyjnego dostawcy, streamingu/cancel, dojrzałej moderacji, alertów kosztowych oraz automatycznych i eksperckich ewaluacji PL/EN/TH. Deterministyczna odpowiedź nie jest dowodem jakości modelu AI.
