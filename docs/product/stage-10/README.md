# Etap 10 — płatności i limity planów

Backend udostępnia katalog miesięczny/roczny, weryfikację transakcji, restore oraz podpisane i idempotentne webhooki. Uprawnienie premium jest liczone wyłącznie po stronie API. Plan bezpłatny ma 5 wiadomości AI dziennie, premium 100; lekcja oznaczona `premium=true` zwraca `402 PREMIUM_REQUIRED` bez aktywnego uprawnienia.

Tryb sandbox jest jawnie kontrolowany przez `BILLING_SANDBOX_ENABLED` i służy CI/buildom developerskim. Produkcja ma odrzucać sandbox oraz używać adapterów App Store Server API i Google Play Developer API z poświadczeniami w magazynie sekretów. Mobilny port `verifyNativePurchase` przekazuje potwierdzenie sklepu do backendu; nigdy nie przyznaje dostępu lokalnie.

Webhook wymaga `x-shellty-signature`, nie przechowuje surowego payloadu i deduplikuje po `(store, externalId)`. Grace period zachowuje dostęp; expiry, refund i cancellation go odbierają.
