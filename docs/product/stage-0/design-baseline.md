# Baseline stylistyki Shellty Lingo

## Źródło prawdy

Wizualnym źródłem prawdy jest dostarczony prototyp [`Shellty Lingo.dc.html`](../../../Shellty%20Lingo%20%E2%80%94%20interfejs%20aplikacji/Shellty%20Lingo.dc.html) oraz jego widoki w folderze `Shellty Lingo — interfejs aplikacji`.

Etap 0 nie tworzy jeszcze kodu Expo. Poniższe reguły są kontraktem dla systemu projektowego z Etapu 1 i implementacji z Etapu 2+. Zmiana kierunku wymaga decyzji Product Ownera, nie przypadkowej zamiany stylu podczas developmentu.

## Tokeny podstawowe

| Rola | Wartość | Użycie |
|---|---|---|
| `color.navy.900` | `#0B1A30` | splash, obudowa telefonu, ciemne nagłówki i powierzchnie premium |
| `color.blue.600` | `#1F6FEB` | główna akcja, aktywna nawigacja, link i fokus |
| `color.teal.500` | `#12B5A8` | sukces, postęp, wspierający akcent i gradient |
| `color.coral.500` | `#FF8A5B` | akcent marki i wyróżnienie; nie jako jedyny sygnał błędu |
| `color.ink.900` | `#0E2038` | główny tekst na jasnym tle |
| `color.ink.600` | `#5B6B82` | tekst drugorzędny |
| `color.ink.400` | `#94A3B6` | placeholder i stan nieaktywny po weryfikacji kontrastu |
| `color.surface.app` | `#F3F7FC` | tło ekranu aplikacji |
| `color.surface.card` | `#FFFFFF` | karty, pola i dolne panele |
| `color.border` | `#E4EBF3` | obramowania i separatory |
| `color.success.bg` | `#E8F7F4` | komunikat sukcesu |
| `color.error.fg` | `#D34B4B` | błąd z ikoną i tekstem |
| `color.error.bg` | `#FDF1F1` | tło błędu |
| `gradient.brand` | `#1F6FEB → #12B5A8` | logo, postęp i oszczędne wyróżnienia |

Kolory z prototypu są punktem startowym, a nie zwolnieniem z testu WCAG 2.2 AA. Dla dużego tekstu tajskiego należy sprawdzić rzeczywisty font i rendering na urządzeniu.

## Typografia

- nagłówki, liczby postępu i marka: **Space Grotesk**, wagi 700–800;
- tekst UI, formularze i etykiety: **Plus Jakarta Sans**, wagi 500–700;
- tajski: font systemowy lub zatwierdzony font z pełnym pokryciem znaków i diakrytyków; Plus Jakarta Sans nie może być wymuszany, jeśli pogarsza skład;
- typowa skala mobilna: 11, 12, 13, 14, 15, 17, 20, 22, 24 i 30 px przed uwzględnieniem Dynamic Type;
- tekst podstawowy nie mniejszy niż 14 px; etykieta 11–12 px tylko z odpowiednim kontrastem i możliwością skalowania.

## Język kształtu i układu

- miękkie karty na jasnoniebieskim tle, promień zwykle 14–18 px;
- główny przycisk pełnej szerokości, niebieski, promień około 10–12 px i czytelny stan wciśnięcia;
- duże powierzchnie marketingowe/splash używają granatu i dyskretnego turkusowego światła;
- odstępy bazują na siatce 4 px, z dominującymi wartościami 8/12/16/20/24/32;
- dolna nawigacja ma pięć pozycji: Dziś, Nauka, Tutor AI, Postępy, Profil;
- komunikaty zawsze łączą ikonę, tytuł/tekst i kolor; kolor nie jest jedynym nośnikiem informacji;
- aktywność, progres i sukces używają niebieskiego/turkusu; koral jest oszczędnym akcentem, nie podstawowym CTA.

## Wzorce ekranów wynikające z prototypu

1. Onboarding: jeden wybór na ekranie, widoczny postęp, akcja `Dalej` przy dolnej krawędzi.
2. Nauka: karty lekcji z czytelnym stanem `ukończono / kontynuuj / zablokowane`.
3. Ćwiczenie: postęp u góry, jedno polecenie, centralna treść, stała akcja na dole i informacja zwrotna bez przeskoku układu.
4. Tajski: znak ma pierwszeństwo wizualne, transliteracja jest drugorzędna i możliwa do ukrycia, audio posiada tekstową etykietę dostępności.
5. Tutor AI: wiadomość użytkownika, odpowiedź AI, poprawka, wyjaśnienie i naturalniejsza forma muszą być wizualnie rozróżnialne również bez koloru.
6. Postęp: najpierw seria i tygodniowa aktywność, potem liczby i odznaki; oddzielny kurs jest zawsze widoczny.
7. Profil: ustawienia języka nauki, dostępności, transliteracji, kontrastu i prywatności są grupowane semantycznie.

## Stany obowiązkowe

Każdy komponent asynchroniczny posiada `idle`, `loading`, `success`, `empty`, `error`, `offline` oraz `disabled` tam, gdzie ma sens. Prototyp pokazuje wzorce przycisku, formularza, toastu, offline, odtwarzacza i modalu; implementacja ma je odtworzyć oraz dodać etykiety czytnika ekranu, fokus i redukcję ruchu.

## Kryterium akceptacji odwzorowania

Widok implementacyjny jest zgodny, gdy:

- używa tokenów zamiast lokalnych kolorów i promieni;
- hierarchia, gęstość, kształty i stany odpowiadają prototypowi, nawet jeśli rozmiar urządzenia jest inny;
- działa przy 200% rozmiaru tekstu bez utraty głównej akcji;
- poprawnie składa PL/EN/TH, w tym tajskie diakrytyki;
- kontrast i cele dotykowe przechodzą automatyczny audyt oraz ręczny test VoiceOver/TalkBack;
- screenshot test obejmuje co najmniej mały Android, standardowy iPhone i duży rozmiar tekstu.

