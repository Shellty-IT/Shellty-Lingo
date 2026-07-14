# Etap 7 — rozmowy tekstowe i analiza AI

Backend udostępnia neutralny interfejs `AiProvider`, wersjonuje prompt i schemat odpowiedzi, moderuje wejście oraz wyjście i nie przekazuje danych osobowych. Każda rozmowa ma scenariusz, poziom, rolę, jeden z czterech trybów korekty, limit długości i wiadomości, metryki tokenów/kosztu oraz circuit breaker.

Odpowiedzi są walidowane przed zapisem. Po rozmowie powstaje strukturalne podsumowanie z mocnymi stronami, poprawkami i rekomendacją. Użytkownik może zgłosić odpowiedź, a redaktor ma chroniony endpoint i kolejkę zgłoszeń w panelu administracyjnym.

W środowisku bez skonfigurowanego zewnętrznego dostawcy działa deterministyczny adapter edukacyjny, dzięki czemu pion można testować bez klucza uprzywilejowanego w aplikacji mobilnej.
