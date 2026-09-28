# Diagnoza niedostępności tutora ćwiczeń

Tutor wskazówek dla `typed_answer` i `gap_fill` generuje wskazówkę, a następnie
osobno sprawdza, czy nie zdradza ona rozwiązania. Jedna poprawna wskazówka wymaga
dwóch wywołań modelu. Gotowe wskazówki są zapisywane i przy ponownym otwarciu
ćwiczenia nie wymagają kolejnego wywołania AI.

## Usunięty błąd kontroli odpowiedzi

Kontrola lokalna traktowała każde wspólne słowo wskazówki i przykładowej odpowiedzi
jako ujawnienie rozwiązania. Dla pełnych zdań blokowała także poprawne podpowiedzi
zawierające zwykłe słowa, np. polskie „a” lub „to”. Teraz porównanie pojedynczych
słów dotyczy jednowyrazowych rozwiązań. Pełne rozwiązania nadal są blokowane, także
po usunięciu spacji i interpunkcji. Niezależna kontrola AI pozostaje wymagana,
również do wykrywania tłumaczeń i parafraz rozwiązania.

## Modele i przełączanie

Kolejność dostawców wyznacza `AI_PROVIDER_ORDER`. Dla każdego dostawcy tutor
próbuje modelu podstawowego, a potem jego modeli rezerwowych:

| Ustawienie                        | Wartość domyślna        |
| --------------------------------- | ----------------------- |
| `AI_PROVIDER_ORDER`               | `groq,gemini`           |
| `GROQ_MODEL`                      | `openai/gpt-oss-120b`   |
| `AI_TUTOR_GROQ_FALLBACK_MODELS`   | `openai/gpt-oss-20b`    |
| `GEMINI_MODEL`                    | `gemini-3.6-flash`      |
| `AI_TUTOR_GEMINI_FALLBACK_MODELS` | `gemini-3.5-flash-lite` |
| `AI_TUTOR_TIMEOUT_MS`             | `24000`                 |

Lista rezerwowa to identyfikatory rozdzielone przecinkami, maksymalnie trzy.
Pusta wartość wyłącza dodatkowe modele dostawcy. Wymagany jest istniejący klucz
API danego dostawcy; nie potrzeba osobnego klucza dla każdego modelu. Te listy
dotyczą wskazówek w ćwiczeniach, a nie rozmów, tłumaczeń czy transkrypcji.

HTTP 429 powoduje natychmiastowe przejście do kolejnego modelu, bez ponawiania
tego samego żądania. Przeciążony model jest pomijany przez czas wskazany w
`Retry-After` (co najmniej 30 sekund), a bez tego nagłówka przez 60 sekund.
Pozostałe powtarzające się błędy otwierają obwód po trzech nieudanych próbach
na 30 sekund. Stan jest osobny dla każdego modelu i przechowywany w procesie API.

Generowanie, kontrola bezpieczeństwa i wszystkie próby modeli mają wspólny limit
24 sekund; pojedyncze połączenie ma limit maksymalnie 8 sekund. Pozostawia to
margines względem 30-sekundowego timeoutu klienta. Tutor próbuje innego modelu,
zamiast ponownie generować i weryfikować tę samą wskazówkę. Ucięta odpowiedź
(`length` / `MAX_TOKENS`) nie jest akceptowana. Limit wyjścia to 768 tokenów dla
wskazówki i 384 dla kontroli; Gemini używa niskiego poziomu rozumowania zgodnego
z modelem.

Rotacja nie zwiększa limitu planu użytkownika ani budżetu aplikacji. Wspólne
limity konta dostawcy mogą uniemożliwić użycie kilku modeli jednocześnie.
Aktualne limity sprawdzaj w [Groq](https://console.groq.com/settings/limits) i
[Google AI Studio](https://aistudio.google.com/usage?timeRange=last-28-days&tab=rate-limit).

## Logi i test połączenia

W logach Render szukaj zdarzenia `exercise_tutor_model_failed`. Zawiera wyłącznie
`provider`, `model`, `reason`, ewentualnie `status` i `retryAfterMs`, wraz ze
standardowym `correlationId`. Nie zawiera kluczy, zadania, odpowiedzi ucznia ani
wskazówki. `reason` rozróżnia limit, błąd HTTP, timeout, odrzuconą wskazówkę
i niepoprawną odpowiedź modelu. Zdarzenie sukcesu `exercise_hint_requested`
zawiera także `servedModel`.

Z katalogu głównego można wykonać test na przykładowym zadaniu B2:

```powershell
corepack pnpm@11.13.0 --filter @shellty/api ai:diagnose-tutor
corepack pnpm@11.13.0 --filter @shellty/api ai:diagnose-tutor --gap-example
corepack pnpm@11.13.0 --filter @shellty/api ai:diagnose-tutor --provider=groq --model=openai/gpt-oss-20b
corepack pnpm@11.13.0 --filter @shellty/api ai:diagnose-tutor --provider=gemini --model=gemini-3.5-flash-lite
```

Polecenie czyta konfigurację procesu oraz `apps/api/.env`, wykonuje rzeczywiste
zapytania i zużywa limit API. Wypisuje tylko metadane odpowiedzi, liczbę tokenów,
pozostały limit (jeśli dostawca udostępnia nagłówki) oraz wynik kontroli lokalnej.
Nie wypisuje treści ani kluczy. Kod zakończenia jest niezerowy przy awarii.

## Wdrożenie

Nowe listy modeli i limit czasu mają wartości domyślne w pakiecie konfiguracji,
więc istniejące środowisko z kluczami nie wymaga dodatkowych zmiennych.
Należy wdrożyć nową wersję backendu. `render.yaml` zawiera konfigurację docelową,
ale produkcyjna usługa nie jest synchronizowana jako Blueprint.
Rozróżnienie komunikatów w interfejsie wymaga także aktualizacji aplikacji mobilnej.

Limity planu użytkownika (`PLAN_LIMIT_REACHED`) są zachowane. Gdy wszystkie
modele zawiodą albo odrzucą wskazówkę, API zwraca krótką, przygotowaną lokalnie
wskazówkę z `dynamic: false`. Aplikacja oznacza ją jako awaryjną. Wskazówka
jest zapisywana w sesji jako pomoc lokalna, więc odpowiedź liczy się jako
wspomagana i pozostaje dostępna po wznowieniu lekcji. Kolejna sesja może
ponownie użyć modeli. Jeśli nawet lokalna wskazówka
pokrywa się z odpowiedzią, API nadal zwraca błąd 503.
