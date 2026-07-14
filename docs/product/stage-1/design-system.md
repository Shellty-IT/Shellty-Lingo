# System projektowy Shellty Lingo

## 1. Fundamenty

System rozwija [`design-baseline.md`](../stage-0/design-baseline.md). Nazwy tokenów są semantyczne, aby komponent nie zależał od konkretnego odcienia i mógł obsłużyć wysoki kontrast lub przyszły tryb ciemny.

### Śledzenie źródła wizualnego

Każda rodzina widoków ma bezpośredni wzorzec w [`Shellty Lingo.dc.html`](../../../Shellty%20Lingo%20%E2%80%94%20interfejs%20aplikacji/Shellty%20Lingo.dc.html); Etap 1 nie wprowadza alternatywnego kierunku graficznego.

| Widoki Etapu 1 | Sekcja źródłowego designu |
|---|---|
| Start i onboarding | `PROTOTYP ONBOARDING` |
| Dziś i dolna nawigacja | `STEP 5 — EKRAN GŁÓWNY` |
| Lista, ćwiczenie, feedback i słownik | `NAUKA` oraz `STANY I KOMPONENTY` |
| Tajski i 200% tekstu | `TAJSKI` oraz reguły fontu z baseline |
| Scenariusze, rozmowa, korekta i podsumowanie | `TUTOR AI` |
| Postępy i ustawienia | `POSTĘPY / PROFIL` |
| Loading, offline, błąd, limit i sesja | `STANY I KOMPONENTY`, rozszerzone bez zmiany języka wizualnego |

Nowe ekrany są kompozycją tych samych tokenów, kart, nagłówków, CTA i nawigacji. Każda zmiana palety, typografii lub języka kształtu wymaga aktualizacji źródłowego designu i decyzji Product Ownera.

### Kolor

| Token | Jasny | Kontrastowy | Użycie |
|---|---:|---:|---|
| `color.bg.canvas` | `#EAF1F8` | `#FFFFFF` | tło poza aplikacją/prototypem |
| `color.bg.app` | `#F3F7FC` | `#FFFFFF` | powierzchnia ekranu |
| `color.bg.card` | `#FFFFFF` | `#FFFFFF` | karta i panel |
| `color.bg.inverse` | `#0B1A30` | `#000000` | powierzchnia odwrócona |
| `color.text.primary` | `#0E2038` | `#000000` | tekst podstawowy |
| `color.text.secondary` | `#52647C` | `#27364A` | tekst pomocniczy |
| `color.text.inverse` | `#FFFFFF` | `#FFFFFF` | tekst na granacie |
| `color.action.primary` | `#1F6FEB` | `#075CCF` | CTA, link, fokus |
| `color.action.support` | `#0D8F85` | `#06756C` | sukces i wspierająca akcja |
| `color.accent.coral` | `#E76F3E` | `#BD4519` | oszczędny akcent |
| `color.border.default` | `#DCE5F0` | `#718096` | obramowania |
| `color.state.error` | `#B93838` | `#8E1F1F` | błąd z ikoną/tekstem |
| `color.state.warning` | `#8B5B00` | `#684200` | ostrzeżenie |
| `color.state.success` | `#08796E` | `#005E56` | powodzenie |
| `color.focus` | `#FFB020` | `#8A4F00` | obrys fokusu |

Minimalny kontrast: 4.5:1 dla zwykłego tekstu, 3:1 dla dużego tekstu i elementów interfejsu. `ink.400` z baseline nie jest dozwolony dla ważnego tekstu na białym tle.

### Typografia

| Styl | Rodzina | Bazowy rozmiar / linia | Waga |
|---|---|---:|---:|
| Display | Space Grotesk | 30/36 | 800 |
| H1 | Space Grotesk | 24/30 | 800 |
| H2 | Space Grotesk | 20/26 | 700 |
| Title | Plus Jakarta Sans | 17/24 | 700 |
| Body | Plus Jakarta Sans | 16/24 | 500 |
| Body small | Plus Jakarta Sans | 14/20 | 500 |
| Label | Plus Jakarta Sans | 12/16 | 700 |
| Thai display | Noto Sans Thai / system | 36/52 | 600 |
| Thai body | Noto Sans Thai / system | 17/28 | 500 |

Skalowanie respektuje ustawienia systemowe co najmniej do 200%. Przy skali 200% liczba kolumn spada do jednej, tekst nie ma limitu linii, a dolne CTA uczestniczy w przewijaniu, jeśli stały panel zasłaniałby treść.

### Przestrzeń, promień i cień

- przestrzeń: `space.1–10` = 4, 8, 12, 16, 20, 24, 32, 40, 48, 64;
- promień: `sm=8`, `md=12`, `lg=16`, `xl=22`, `pill=999`;
- cień `raised`: `0 10 30 -16 rgba(14,32,56,.28)`; cień nie może być jedynym separatorem;
- obrys fokusu: 3 px `color.focus` + 2 px odstępu.

## 2. Układ responsywny

Projektujemy od szerokości 320 dp. Zawartość ekranu ma poziomy padding 16 dp na małych i 20–24 dp na standardowych urządzeniach. Modal na telefonie jest dolnym panelem, a na tablecie wyśrodkowanym dialogiem o maksymalnej szerokości 560 dp.

Safe area obejmuje status bar, wycięcie i wskaźnik gestu. Klawiatura nie może zasłaniać aktywnego pola ani akcji wysłania. Orientacja pozioma jest obsługiwana przez reflow i przewijanie, choć MVP jest optymalizowane dla pionu.

## 3. Komponenty

### `Button`

Warianty: `primary`, `secondary`, `quiet`, `danger`, `icon`. Rozmiary: `md` minimum 48 dp, `lg` 54 dp. Stany: default, pressed, focus, disabled, loading. Loading zachowuje szerokość i etykietę, np. „Zapisywanie…”. Ikona bez tekstu wymaga dostępnej nazwy.

### `ChoiceCard`

Cała powierzchnia jest pojedynczą kontrolką typu radio/checkbox. Stan wyboru łączy obramowanie, ikonę i tekst. Minimalna wysokość 64 dp. Opis nie może być wymagany do zrozumienia samej etykiety.

### `TextField`

Stała etykieta nad polem; placeholder nie zastępuje etykiety. Błąd bezpośrednio pod polem zawiera problem i sposób poprawy. Obsługuje hasło, licznik znaków i komunikat pomocniczy.

### `ProgressBar`

Ma tekstowy odpowiednik „Krok 3 z 6” lub „60%”. Nie opiera się wyłącznie na kolorze. Animację wyłączamy przy reduced motion.

### `LessonCard`

Pokazuje tytuł, cel, czas, typ i stan `new/in-progress/completed/locked`. Zablokowanie ma tekstowy powód. Karta nie zawiera więcej niż jednej głównej akcji.

### `ExerciseShell`

Stały kontrakt: zamknięcie, postęp, polecenie, treść, odpowiedź, obszar feedbacku i główna akcja. Feedback pojawia się w zarezerwowanym obszarze lub poniżej odpowiedzi, aby ograniczyć skok układu.

### `DictionarySheet`

Nagłówek zawiera wybrany fragment i zamknięcie. Sekcje: znaczenie w kontekście, tłumaczenie, przykład, TTS oryginału, TTS tłumaczenia, szybkość i „Zapisz do powtórek”. Brak głosu nie blokuje tłumaczenia.

### `AudioControl`

Etykieta mówi co będzie odtworzone, np. „Odtwórz wymowę po tajsku”. Stany: idle, playing, paused, loading, unavailable. Dwa odtwarzacze nie grają jednocześnie.

### `AIMessage` i `CorrectionCard`

Wiadomość ma widoczną rolę tekstową „Tutor AI” albo „Ty”. Korekta pokazuje oryginał, poprawkę, wyjaśnienie, naturalniejszy wariant i pewność `wysoka/średnia/niska`. Każda wiadomość AI ma menu zgłoszenia.

### `StatePanel`

Wspólny wzorzec dla empty/error/offline/limit/session. Zawiera ikonę dekoracyjną, jednoznaczny tytuł, krótkie wyjaśnienie, jedną główną akcję i opcjonalny link drugorzędny.

### `BottomNavigation`

Pięć pozycji z ikoną i etykietą. Aktualna karta ma `accessibilityState.selected`. Przy 200% tekstu etykiety mogą zawijać się do dwóch linii, ale nie znikają.

## 4. Dostępność

- kolejność fokusu odpowiada kolejności wizualnej i zadaniu;
- po zmianie ekranu fokus trafia na H1, po błędzie formularza na podsumowanie lub pierwsze błędne pole;
- toast nie przejmuje fokusu, lecz jest ogłaszany jako live region;
- modal zatrzymuje fokus i po zamknięciu zwraca go do wywołującej kontrolki;
- gesty mają równoważne przyciski; nie wymagamy przesuwania ani długiego przytrzymania;
- haptyka i animacja są dodatkiem, nie jedynym feedbackiem;
- tajskie znaki nie są rozstrzeliwane `letter-spacing`; diakrytyki nie mogą być przycinane przez stałą wysokość linii;
- flagi są dekoracyjne, a nazwa języka pozostaje tekstem.

## 5. Kontrakt implementacyjny

W Etapie 2 tokeny powinny trafić do współdzielonego pakietu `packages/ui` jako dane TypeScript. Komponenty nie przyjmują dowolnego koloru czy promienia bez udokumentowanego wyjątku. Storybook nie jest wymagany dla Foundation Release, ale katalog przykładów musi pokrywać wszystkie warianty i stany przed Etapem 3.
