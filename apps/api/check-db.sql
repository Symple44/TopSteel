-- Vérifier les sociétés
\echo '=== SOCIETES ==='
SELECT id, nom, code, actif FROM societes LIMIT 5;

\echo ''
\echo '=== COLONNE deleted_at dans users ==='
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'deleted_at';
