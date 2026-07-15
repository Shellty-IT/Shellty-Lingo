# Etap 6 — język tajski

**Status:** prototyp techniczny; brama ekspercka i urządzeniowa nie została zamknięta.

Dodano osobny model znaków tajskich (`ThaiScriptUnit`) obejmujący spółgłoski, samogłoski, sylaby, cyfry i reguły tonów. Mobilna ścieżka prezentuje zapis tajski, nazwę, transliterację, klasę/ton, znaczenie, przykład i systemowy odsłuch. Użytkownik może wyłączyć transliterację; ustawienie jest zapisywane osobno dla kursu TH.

API publikuje wyłącznie jednostki z flagą `expertReviewed`. Dane demonstracyjne mają tę flagę technicznie ustawioną przez seed, lecz repozytorium nie zawiera dowodu recenzji native speakera. Interfejs jasno informuje, że MVP ćwiczy rozpoznawanie tonów, ale nie obiecuje automatycznej oceny wymowy.

Do zamknięcia etapu potrzebne są: kompletna ścieżka treści, podpis eksperta, testy fontów/łamania znaków i TTS na fizycznych urządzeniach iOS/Android oraz testy VoiceOver/TalkBack.

Demonstracja: wybierz kurs tajski → Nauka → Alfabet i tony → przełącz transliterację → odsłuchaj znak.
