# Runbook: płatności

Przy wzroście odrzuconych webhooków sprawdź podpis, zegar, identyfikator sklepu i kolejkę bez logowania receiptów. Duplikat jest normalny i musi zwrócić sukces bez ponownego skutku.

Przy rozbieżności uprawnienia:

1. znajdź subskrypcję po hashowanym identyfikatorze operacyjnym, nie po receipt;
2. porównaj ostatnie zdarzenie sklepu, status i `currentPeriodEnd`;
3. ponów bezpiecznie event przez ten sam endpoint; idempotency zapobiegnie duplikacji;
4. nie przyznawaj ręcznie trwałego premium — awaryjne uprawnienie musi mieć termin, powód i audit log;
5. przy refundzie/expiry potwierdź wyłączenie entitlementu i zachowanie danych użytkownika.
