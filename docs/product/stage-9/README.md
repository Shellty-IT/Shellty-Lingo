# Etap 9 — operacje, prywatność i powiadomienia

**Status:** częściowo zrealizowany; scheduler i polityki istnieją, rzeczywiste dostawy oraz procesy GDPR nie są kompletne.

Zaimplementowany przyrost obejmuje granularne preferencje `learning_reminder`, `review_due` i `product_updates`, strefę IANA, lokalną godzinę oraz quiet hours. Domyślnie wszystkie kanały są wyłączone. Każda zmiana zapisuje wersjonowaną zgodę i zdarzenie audytowe.

Zadanie `POST /v1/operations/maintenance` jest dostępne wyłącznie dla administratora i uruchamia planowanie powiadomień lub retencję. Harmonogram powinien wywoływać `notifications` raz na minutę, a `retention` raz dziennie. Klucz dostawy jest unikalny dla użytkownika, typu i lokalnego dnia.

Retencja usuwa treść ukończonych rozmów po 30 dniach, gotowe eksporty po 7 dniach, historię dostaw po 90 dniach i log audytowy po 365 dniach. Wartości są także publikowane w kontrakcie ustawień prywatności.

Przed stagingiem należy dodać rejestrację tokenów urządzeń i worker/dostawcę push obsługującego kolejkę `notification_deliveries`; sam scheduler nigdy nie omija zgody ani quiet hours. Trzeba też wdrożyć workery eksportu/usunięcia konta i przeprowadzić udokumentowany test restore bazy. Same runbooki nie potwierdzają wykonania ćwiczenia operacyjnego.
