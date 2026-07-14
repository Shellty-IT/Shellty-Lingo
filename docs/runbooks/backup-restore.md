# Runbook: backup i restore PostgreSQL

Backup jest szyfrowany, przechowywany poza głównym regionem i dostępny wyłącznie roli backup. Produkcja: backup codzienny, PITR zgodnie z ofertą dostawcy, retencja 30 dni.

Test restore wykonuj co miesiąc na izolowanej bazie bez dostępu aplikacji:

1. wybierz najnowszy ukończony backup i zanotuj jego identyfikator/checksumę;
2. odtwórz do nowej instancji w prywatnej sieci;
3. uruchom `prisma migrate status`, kontrolę liczności tabel i losowe testy relacji;
4. uruchom healthcheck API z anonimowymi danymi testowymi;
5. usuń instancję testową zgodnie z retencją i zapisz RPO/RTO oraz wynik w rejestrze ćwiczeń.

Restore produkcyjny wymaga dwóch osób, okna zmian, zamrożenia zapisów, snapshotu stanu bieżącego i jawnej decyzji rollback.
