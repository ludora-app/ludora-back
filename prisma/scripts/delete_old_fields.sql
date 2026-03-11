BEGIN;

-- 1. Supprimer les sessions qui référencent les fields à supprimer
DELETE FROM sessions."Sessions"
WHERE field_uid IN (
    SELECT uid FROM infrastructure."Fields"
    WHERE created_at > TIMESTAMP '2026-02-05 17:58:12.074'
);

-- 2. Supprimer les fields
DELETE FROM infrastructure."Fields"
WHERE created_at > TIMESTAMP '2026-02-05 17:58:12.074';

COMMIT;