# Etap 5 — silnik nauki, test poziomujący i powtórki

## Dostarczony pion edukacyjny

- deterministyczne ocenianie siedmiu typów ćwiczeń: pojedynczy i wielokrotny wybór, dopasowanie, luka, wpisywanie, układanie oraz odsłuch;
- test poziomujący EN/TH z mapowaniem wyniku na A1, A2 lub B1 i trwałym zapisem w osobnym `UserCourse`;
- sesje lekcji możliwe do wznowienia, historia prób i postęp lekcji bez mieszania kursów;
- idempotentne rozpoczęcie testu/lekcji, zapis odpowiedzi i ocenienie powtórki;
- jawny algorytm spaced repetition z ocenami `again`, `hard`, `good`, `easy`, historią powtórek i kolejką według `dueAt`;
- automatyczne dodanie błędnych odpowiedzi do historii błędów oraz zapis słów ze słownika do własnej kolejki;
- słownik kontekstowy ograniczający wybór do treści bieżącego ćwiczenia, z tłumaczeniem PL/EN/TH, transliteracją i tonami, jeśli są dostępne;
- systemowy TTS dla oryginału i tłumaczenia, ponowne odtwarzanie, tempo `1×/0.7×` i nieblokujący fallback przy braku głosu;
- lokalna kolejka nieprzesłanych odpowiedzi w bezpiecznym magazynie mobilnym i automatyczne ponowienie po odzyskaniu połączenia;
- zdarzenia analityczne: rozpoczęcie/ukończenie testu, rozpoczęcie/ukończenie lekcji, odpowiedź, zapis słownikowy i powtórka.

## Endpointy ucznia

- `GET /v1/learning/dashboard?language=en|th` — poziom, lekcje, postęp i liczba zaległych powtórek;
- `POST /v1/learning/placement/start` i `POST /v1/learning/placement/:sessionId/submit` — test poziomujący;
- `POST /v1/learning/lessons/:courseSlug/:lessonSlug/start` — rozpoczęcie lub wznowienie lekcji bez ujawniania klucza odpowiedzi;
- `POST /v1/learning/sessions/:sessionId/attempts` i `/complete` — idempotentny zapis próby oraz ukończenie;
- `POST /v1/learning/dictionary` i `/dictionary/save` — znaczenie w kontekście oraz zapis do powtórek;
- `GET /v1/learning/reviews` i `POST /v1/learning/reviews/:itemId` — kolejka SRS i ocena powtórki.

Każdy endpoint wymaga access tokenu. Mutacje, których ponowienie mogłoby zdublować postęp, przyjmują stabilny `idempotencyKey` i zwracają wcześniej zapisany wynik.

## Weryfikacja

Testy jednostkowe obejmują wszystkie typy oceniania, progi testu poziomującego, cztery ścieżki algorytmu SRS, zachowanie dat na granicy zmiany czasu oraz ponowienie żądania bez utworzenia duplikatu. Pełną bramą jakości pozostaje główne polecenie `pnpm check`.

## Krótka demonstracja

1. Zarejestruj użytkownika i ukończ onboarding dla EN albo TH.
2. Na ekranie planu rozpocznij test poziomujący i zakończ go lub pomiń.
3. Otwórz pierwszą opublikowaną lekcję, dotknij słowa w poleceniu, odsłuchaj oryginał i tłumaczenie oraz zapisz wynik.
4. Odpowiedz na ćwiczenie, ukończ lekcję i przejdź do powtórek.
5. Oceń element kolejki; następny termin zostanie wyliczony przez jawny algorytm SRS.
