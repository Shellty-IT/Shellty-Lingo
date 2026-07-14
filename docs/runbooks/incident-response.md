# Runbook: incydent produkcyjny

1. Potwierdź alert i wyznacz incident commandera; nie kopiuj PII do komunikatora.
2. Zapisz czas, środowisko, wersję i correlation ID. Oceń wpływ: dostępność, dane, koszt AI, billing lub push.
3. Ogranicz skutki: wyłącz funkcję flagą, zatrzymaj scheduler albo wróć do poprzedniego artefaktu. Nie zmieniaj ręcznie danych.
4. Dla podejrzenia wycieku odetnij klucz, zachowaj log audytowy, skontaktuj osobę odpowiedzialną za prywatność i oceń obowiązek zgłoszenia.
5. Zweryfikuj metryki przez 30 minut po naprawie. Opublikuj zwięzłą komunikację bez danych użytkowników.
6. W 48 godzin przygotuj postmortem: przyczyna, oś czasu, wpływ, działania i właściciele.

Alarmy P0: brak API/bazy, błędne naliczenie uprawnienia, możliwy dostęp między kontami lub utrata danych. P1: rosnący błąd AI/push, kolejka starsza niż 15 min, p95 ponad próg albo koszt ponad budżet.
