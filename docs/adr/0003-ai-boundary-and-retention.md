# ADR-0003: Granica AI, dostawca i retencja

- **Status:** warunkowa
- **Data:** 2026-07-14
- **Właściciel:** AI Lead / Privacy Lead

## Kontekst

Rozmowa AI jest wyróżnikiem MVP, ale generuje koszt i przetwarza swobodny tekst. Model i ceny zmieniają się szybciej niż domena produktu.

## Decyzja

Wywołania przechodzą wyłącznie przez backendowe porty `ConversationAi`, `ErrorAnalysisAi` i `RecommendationAi`. Pierwszym adapterem jest OpenAI API. Model jest konfiguracją routingu z przypiętym snapshotem w ewaluacji, nie nazwą w logice domenowej.

Backend wysyła minimalny kontekst bez tożsamości, używa `store:false`, nie używa trwałych obiektów rozmowy dostawcy, wersjonuje prompt/schemat i zapisuje wyłącznie metryki kosztowe bez treści. Treść po stronie Shellty ma 30 dni retencji; użytkownik może usunąć ją wcześniej.

Publiczne MVP wymaga zaakceptowanego DPA/TIA oraz europejskiego projektu z ZDR/MAM albo nowej decyzji dostawcy. Każda odpowiedź podlega moderacji, walidacji schematu, limitom, timeoutowi i kill switchowi.

## Konsekwencje

- brak sekretu i bezpośredniej zależności SDK w aplikacji;
- możliwość porównania dostawcy/modelu na tym samym zestawie ewaluacyjnym;
- dodatkowa warstwa backendu i koszt utrzymania schematów;
- dostawca pozostaje bramą prawną, nie tylko techniczną.

## Odrzucone

Bezpośredni SDK w mobile, nieograniczona historia, logowanie pełnych promptów oraz automatyczne użycie wniosków AI bez walidacji.

