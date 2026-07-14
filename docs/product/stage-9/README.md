# Etap 9 — operacje, prywatność i powiadomienia

Zaimplementowany przyrost obejmuje granularne preferencje `learning_reminder`, `review_due` i `product_updates`, strefę IANA, lokalną godzinę oraz quiet hours. Domyślnie wszystkie kanały są wyłączone. Każda zmiana zapisuje wersjonowaną zgodę i zdarzenie audytowe.

Zadanie `POST /v1/operations/maintenance` jest dostępne wyłącznie dla administratora i uruchamia planowanie powiadomień lub retencję. Harmonogram powinien wywoływać `notifications` raz na minutę, a `retention` raz dziennie. Klucz dostawy jest unikalny dla użytkownika, typu i lokalnego dnia.

Retencja usuwa treść ukończonych rozmów po 30 dniach, gotowe eksporty po 7 dniach, historię dostaw po 90 dniach i log audytowy po 365 dniach. Wartości są także publikowane w kontrakcie ustawień prywatności.

Przed stagingiem należy podłączyć dostawcę push do kolejki `notification_deliveries`; sam scheduler nigdy nie omija zgody ani quiet hours.
