# Rejestr kategorii podmiotów przetwarzających

Przed produkcją właściciel prywatności uzupełnia nazwę prawną, kraj/region, DPA, mechanizm transferu, cel, kategorie danych, retencję i datę przeglądu dla każdego wybranego dostawcy.

| Kategoria                | Minimalny zakres danych                      | Wymagania                                   |
| ------------------------ | -------------------------------------------- | ------------------------------------------- |
| Hosting API / PostgreSQL | identyfikatory, profil, postęp, treść rozmów | UE preferowana, szyfrowanie, backup, DPA    |
| Storage                  | audio kursowe, krótkotrwałe eksporty         | podpisane URL, lifecycle, osobne środowiska |
| AI                       | minimalny kontekst edukacyjny i rozmowa      | brak trenowania bez zgody, retencja, DPA    |
| Push / e-mail            | token urządzenia lub e-mail i typ komunikatu | zgoda, suppression, brak treści wrażliwej   |
| Analityka / monitoring   | pseudonimowe zdarzenia i diagnostyka         | bez treści rozmów, tokenów i pełnego PII    |
| App Store / Google Play  | identyfikator transakcji, produkt, status    | weryfikacja serwerowa, zasady sklepu        |
