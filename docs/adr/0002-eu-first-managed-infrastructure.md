# ADR-0002: Zarządzana infrastruktura EU-first

- **Status:** zaakceptowana roboczo
- **Data:** 2026-07-14
- **Właściciel:** Tech Lead / DevOps

## Kontekst

Mały zespół potrzebuje trzech środowisk, PostgreSQL, rollbacku i niskiego narzutu operacyjnego. Produkt przetwarza profile edukacyjne i rozmowy użytkowników z UE.

## Decyzja

API, worker, admin i PostgreSQL uruchamiamy na Render we Frankfurcie. Obiekty i e-mail używają AWS S3/SES w `eu-central-1`. Każde środowisko ma osobne konto/projekt, bazę, bucket i sekrety. Production używa płatnej bazy z PITR; free tier nie przechowuje danych beta.

Nie dodajemy Redis/BullMQ przed zadaniem wymagającym trwałej kolejki. Kontenery, standardowy PostgreSQL i interfejs S3 pozostają przenośne. Backup logiczny jest okresowo testowany poza mechanizmem dostawcy.

## Konsekwencje

- mniejszy koszt DevOps i spójny region danych;
- zależność od panelu/automatyzacji Render, ograniczana przez kontenery i migracje;
- AWS wymaga osobnej polityki IAM i kontroli kosztu;
- zmiana regionu Render wymaga migracji, dlatego region jest wybierany przy tworzeniu zasobu.

## Alternatywy

- pełne AWS: większa kontrola, zbyt duży narzut dla MVP;
- serverless DB u osobnego dostawcy: elastyczna, ale zwiększa liczbę procesorów i ruch między usługami;
- self-hosting: odrzucony z powodu backupów, patchowania i dyżurów.

