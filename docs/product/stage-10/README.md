# Etap 10 — płatności i limity planów

**Status:** sandbox domenowy; integracje sklepowe i ich brama akceptacyjna nie są zrealizowane.

Backend udostępnia katalog miesięczny/roczny, weryfikację transakcji, restore oraz podpisane i idempotentne webhooki. Uprawnienie premium jest liczone wyłącznie po stronie API. Plan bezpłatny ma 5 wiadomości AI dziennie, premium 100; lekcja oznaczona `premium=true` zwraca `402 PREMIUM_REQUIRED` bez aktywnego uprawnienia.

Tryb sandbox jest jawnie kontrolowany przez `BILLING_SANDBOX_ENABLED` i służy CI/buildom developerskim. Konfiguracja staging/production odrzuca sandbox. Adapterów App Store Server API i Google Play Developer API jeszcze nie ma, dlatego kod nie może poprawnie przyznać produkcyjnego uprawnienia. Mobilny port `verifyNativePurchase` przekazuje potwierdzenie do backendu i nigdy nie przyznaje dostępu lokalnie, ale nie zastępuje natywnego zakupu ani restore.

Webhook wymaga `x-shellty-signature`, nie przechowuje surowego payloadu i deduplikuje po `(store, externalId)`. Grace period zachowuje dostęp; expiry, refund i cancellation go odbierają.

Testy obejmują wyłącznie wewnętrzny kontrakt sandbox. Nadal wymagane są scenariusze sandbox obu prawdziwych sklepów, podpisy Apple/Google, opóźnione/zdublowane webhooki dostawców, utrata sieci i zgodność tekstów sklepowych.
