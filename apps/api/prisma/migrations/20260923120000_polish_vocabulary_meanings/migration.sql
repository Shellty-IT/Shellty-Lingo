-- Repair Polish translations seeded with the English definition. Preserve
-- translations that an editor has already changed independently.
UPDATE "translations" AS t
SET "value" = meanings.polish
FROM "vocabulary_entries" AS v
JOIN (
  VALUES
    ('in hindsight', 'z perspektywy czasu'),
    ('otherwise', 'w przeciwnym razie'),
    ('by no means', 'w żadnym wypadku'),
    ('to some extent', 'do pewnego stopnia'),
    ('a fair point', 'słuszna uwaga'),
    ('to elaborate', 'rozwinąć myśl'),
    ('common ground', 'wspólna płaszczyzna porozumienia'),
    ('findings', 'ustalenia z analizy lub badań'),
    ('actionable', 'konkretny i możliwy do wdrożenia'),
    ('allegedly', 'rzekomo'),
    ('norm', 'powszechnie przyjęta norma'),
    ('root cause', 'pierwotna przyczyna problemu'),
    ('on track', 'zgodnie z planem'),
    ('restart', 'uruchomić ponownie'),
    ('credentials', 'dane logowania'),
    ('error message', 'komunikat o błędzie'),
    ('pull request', 'prośba o przegląd i scalenie zmian w kodzie'),
    ('branch', 'gałąź kodu'),
    ('regression', 'ponowne pojawienie się wcześniej usuniętego błędu'),
    ('severity', 'poziom powagi incydentu'),
    ('latency', 'opóźnienie odpowiedzi systemu'),
    ('failover', 'przełączenie na system zapasowy po awarii'),
    ('threat model', 'model zagrożeń')
) AS meanings(term, polish) ON meanings.term = v.term
WHERE t."entity_type" = 'vocabulary_entry'
  AND t."entity_id" = v."id"
  AND t."locale" = 'pl'
  AND t."field" = 'definition'
  AND v."language" = 'en'
  AND (
    t."value" = v."definition"
    OR (v."term" = 'root cause' AND t."value" = 'the underlying reason a problem happened')
  );
