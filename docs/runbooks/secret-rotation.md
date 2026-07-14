# Runbook: rotacja sekretów

Rotuj osobno sekrety tokenów, billing webhook, bazę, AI, push, storage i monitoring. Utwórz nową wersję w magazynie sekretów, wdroż ją na staging, sprawdź healthcheck i kluczowy przepływ, a następnie promuj produkcyjnie. Jeśli dostawca pozwala, utrzymuj krótki okres dwóch aktywnych kluczy.

Po migracji unieważnij starą wersję, sprawdź błędy uwierzytelnienia i udokumentuj osobę, czas oraz zakres. Podejrzenie kompromitacji oznacza natychmiastową rotację, unieważnienie sesji zależnych i uruchomienie runbooka incydentu.
