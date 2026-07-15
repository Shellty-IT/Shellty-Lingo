# ADR-0005: Freemium i serwerowe entitlementy

- **Status:** warunkowa
- **Data:** 2026-07-14
- **Właściciel:** Product Owner / Backend Lead

## Kontekst

AI ma koszt zmienny, a sklepy mobilne dostarczają asynchroniczne i zdublowane zdarzenia. Beta ma przede wszystkim zweryfikować wartość i koszt.

## Decyzja

Zamknięta beta jest bezpłatna. Publiczne MVP oferuje Free i Premium zgodnie z limitem w decyzjach produktowych. RevenueCat normalizuje zakupy sklepów, ale API Shellty jest źródłem prawdy entitlementu i egzekwuje limity. Webhooki, restore, refund, grace i expiry są idempotentne.

Cena robocza to 39,99 PLN/mies. i 299,99 PLN/rok. Ekran płatności wchodzi dopiero po badaniu willingness-to-pay i potwierdzeniu kosztu AI. Osiągnięcie limitu jest stanem planu, nie błędem technicznym.

## Konsekwencje

- beta nie miesza walidacji wartości z konwersją;
- limity nie mogą zostać ominięte zmodyfikowanym klientem;
- utrzymujemy własny model `Subscription`/`Entitlement` oraz surowe ID zdarzeń;
- cena i liczba rozmów mogą zmienić się bez przebudowy mechanizmu uprawnień.

