# Etap 7 — rozmowy tekstowe i analiza AI

**Status:** pion developerski; produkcyjna warstwa AI i brama jakości pozostają otwarte.

Backend udostępnia neutralny interfejs `AiProvider`, wersjonuje prompt i schemat odpowiedzi oraz stosuje podstawowy filtr wejścia i wyjścia. Każda rozmowa ma scenariusz, poziom, rolę, jeden z czterech trybów korekty, limit długości i wiadomości, szacunkowe metryki tokenów/kosztu oraz prosty circuit breaker.

Odpowiedzi są walidowane przed zapisem. Po rozmowie powstaje strukturalne podsumowanie z mocnymi stronami, poprawkami i rekomendacją. Użytkownik może zgłosić odpowiedź, a redaktor ma chroniony endpoint i kolejkę zgłoszeń w panelu administracyjnym.

Kod zawiera adaptery Gemini i Groq, konfigurowalną kolejność dostawców oraz deterministyczny fallback. Są testy z atrapami odpowiedzi dostawców, lecz w tym przeglądzie nie potwierdzono działania z rzeczywistymi kluczami ani jakości odpowiedzi w PL/EN/TH. Do zamknięcia etapu nadal brakuje potwierdzonego streamingu/cancel, dojrzałej moderacji, alertów kosztowych oraz automatycznych i eksperckich ewaluacji językowych. Deterministyczna odpowiedź nie jest dowodem jakości modelu AI.
