# ADR-0004: Granice analityki i obserwowalności

- **Status:** zaakceptowana roboczo
- **Data:** 2026-07-14
- **Właściciel:** Product Manager / Tech Lead

## Kontekst

Produkt potrzebuje lejków, kosztu AI, crash-free i diagnozy błędów. Te systemy nie potrzebują treści edukacyjnej ani tożsamości użytkownika.

## Decyzja

PostHog Cloud EU (Frankfurt) obsługuje zdarzenia produktu i feature flags. Sentry obsługuje błędy, tracing i release health. Oba systemy przyjmują wyłącznie allowlistę pól. IP jest odrzucane w PostHog; session replay aplikacji zalogowanej jest wyłączony. W Sentry wyłączamy PII, attachments i replay, redagujemy nagłówki, tokeny, body i parametry zawierające tekst.

Mapa zdarzeń jest kontraktem wersjonowanym. E-mail, imię, prompt, odpowiedź, zaznaczony tekst i surowa odpowiedź ćwiczenia są zakazane. Zdarzenia krytyczne kosztu/bezpieczeństwa pochodzą z backendu.

## Konsekwencje

- KPI są mierzalne bez kopiowania treści;
- diagnoza niektórych błędów wymaga correlation ID i bezpiecznej reprodukcji zamiast payloadu;
- Sentry wymaga DPA/TIA i może zostać zastąpiony przy twardym wymaganiu pełnej rezydencji UE;
- zgodę analityczną można wycofać, nie wyłączając niezbędnego monitoringu bezpieczeństwa.

