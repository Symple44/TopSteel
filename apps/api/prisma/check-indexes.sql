-- ============================================
-- Script de Vérification des Index Multi-Tenant
-- ============================================
-- Ce script vérifie que tous les index nécessaires
-- pour les performances multi-tenant sont présents
--
-- Usage: psql -U postgres -d topsteel -f check-indexes.sql
-- ============================================

\echo '=========================================='
\echo 'VÉRIFICATION DES INDEX MULTI-TENANT'
\echo '=========================================='
\echo ''

-- ============================================
-- 1. LISTER TOUTES LES TABLES AVEC SOCIETE_ID
-- ============================================

\echo '1. Tables avec colonne societe_id:'
\echo '----------------------------------------'

SELECT
    table_name,
    column_name,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'societe_id'
ORDER BY table_name;

\echo ''
\echo '=========================================='

-- ============================================
-- 2. VÉRIFIER LES INDEX SIMPLES SUR SOCIETE_ID
-- ============================================

\echo '2. Index simples sur societe_id:'
\echo '----------------------------------------'

SELECT
    t.tablename AS table_name,
    i.indexname AS index_name,
    array_agg(a.attname ORDER BY a.attnum) AS indexed_columns
FROM pg_indexes i
JOIN pg_class c ON c.relname = i.indexname
JOIN pg_attribute a ON a.attrelid = c.oid
JOIN pg_tables t ON t.tablename = i.tablename
WHERE t.schemaname = 'public'
  AND a.attname = 'societe_id'
GROUP BY t.tablename, i.indexname
ORDER BY t.tablename, i.indexname;

\echo ''
\echo '=========================================='

-- ============================================
-- 3. VÉRIFIER LES INDEX COMPOSITES RECOMMANDÉS
-- ============================================

\echo '3. Index composites recommandés:'
\echo '----------------------------------------'

-- Liste des index composites recommandés pour performance
WITH recommended_indexes AS (
    SELECT 'notifications' AS table_name, 'societe_id, user_id' AS columns UNION ALL
    SELECT 'notifications', 'societe_id, type' UNION ALL
    SELECT 'notifications', 'societe_id, created_at' UNION ALL
    SELECT 'notification_events', 'societe_id, type' UNION ALL
    SELECT 'notification_templates', 'societe_id, code' UNION ALL
    SELECT 'notification_rules', 'societe_id, type' UNION ALL
    SELECT 'query_builders', 'societe_id, created_by' UNION ALL
    SELECT 'query_builders', 'societe_id, created_at' UNION ALL
    SELECT 'parameter_system', 'societe_id, category' UNION ALL
    SELECT 'parameter_application', 'societe_id, category' UNION ALL
    SELECT 'parameter_client', 'societe_id, category' UNION ALL
    SELECT 'system_settings', 'societe_id, category' UNION ALL
    SELECT 'menu_configurations', 'societe_id, is_active' UNION ALL
    SELECT 'audit_logs', 'societe_id, created_at'
)
SELECT
    r.table_name,
    r.columns AS recommended_index,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM pg_indexes i
            WHERE i.tablename = r.table_name
              AND i.schemaname = 'public'
              AND i.indexdef LIKE '%' || replace(r.columns, ', ', '%') || '%'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status
FROM recommended_indexes r
ORDER BY r.table_name, r.columns;

\echo ''
\echo '=========================================='

-- ============================================
-- 4. TABLES SANS INDEX SUR SOCIETE_ID
-- ============================================

\echo '4. Tables avec societe_id SANS index:'
\echo '----------------------------------------'

SELECT DISTINCT
    c.table_name,
    'societe_id' AS column_name,
    '❌ MISSING INDEX' AS status
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.column_name = 'societe_id'
  AND NOT EXISTS (
      SELECT 1
      FROM pg_indexes i
      WHERE i.schemaname = 'public'
        AND i.tablename = c.table_name
        AND i.indexdef LIKE '%societe_id%'
  )
ORDER BY c.table_name;

\echo ''
\echo '=========================================='

-- ============================================
-- 5. STATISTIQUES D'UTILISATION DES INDEX
-- ============================================

\echo '5. Statistiques d''utilisation des index:'
\echo '----------------------------------------'

SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    CASE
        WHEN idx_scan = 0 THEN '⚠️  UNUSED'
        WHEN idx_scan < 100 THEN '🔸 LOW USAGE'
        WHEN idx_scan < 1000 THEN '✅ MODERATE'
        ELSE '🚀 HIGH USAGE'
    END AS usage_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexrelname LIKE '%societe%'
ORDER BY idx_scan DESC, tablename;

\echo ''
\echo '=========================================='

-- ============================================
-- 6. TAILLE DES INDEX
-- ============================================

\echo '6. Taille des index multi-tenant:'
\echo '----------------------------------------'

SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    pg_size_pretty(pg_relation_size(tablename::regclass)) AS table_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexrelname LIKE '%societe%'
ORDER BY pg_relation_size(indexrelid) DESC;

\echo ''
\echo '=========================================='

-- ============================================
-- 7. INDEX REDONDANTS OU INUTILES
-- ============================================

\echo '7. Index potentiellement redondants:'
\echo '----------------------------------------'

-- Vérifier les index qui couvrent les mêmes colonnes
SELECT
    i1.tablename,
    i1.indexname AS index_1,
    i2.indexname AS index_2,
    '⚠️  POTENTIALLY REDUNDANT' AS status
FROM pg_indexes i1
JOIN pg_indexes i2
    ON i1.tablename = i2.tablename
    AND i1.indexname < i2.indexname
    AND i1.schemaname = 'public'
    AND i2.schemaname = 'public'
WHERE (
    -- Index avec societe_id
    i1.indexdef LIKE '%societe_id%'
    OR i2.indexdef LIKE '%societe_id%'
)
AND (
    -- Même définition (possible redondance)
    similarity(i1.indexdef, i2.indexdef) > 0.7
)
ORDER BY i1.tablename, i1.indexname;

\echo ''
\echo '=========================================='

-- ============================================
-- 8. RECOMMANDATIONS SQL POUR CRÉER LES INDEX MANQUANTS
-- ============================================

\echo '8. Commandes SQL pour créer les index manquants:'
\echo '----------------------------------------'

-- Cette section génère les commandes CREATE INDEX pour les index manquants

WITH missing_composite_indexes AS (
    SELECT 'notifications' AS table_name, 'idx_notifications_societe_user' AS index_name,
           'societe_id, user_id' AS columns WHERE NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'notifications'
        AND indexdef LIKE '%societe_id%user_id%'
    )
    UNION ALL
    SELECT 'notifications', 'idx_notifications_societe_type',
           'societe_id, type' WHERE NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'notifications'
        AND indexdef LIKE '%societe_id%type%'
    )
    UNION ALL
    SELECT 'query_builders', 'idx_query_builders_societe_created_by',
           'societe_id, created_by' WHERE NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'query_builders'
        AND indexdef LIKE '%societe_id%created_by%'
    )
)
SELECT
    'CREATE INDEX ' || index_name || ' ON ' || table_name ||
    ' (' || columns || ');' AS create_index_sql
FROM missing_composite_indexes
WHERE table_name IS NOT NULL;

\echo ''
\echo '=========================================='
\echo 'VÉRIFICATION TERMINÉE'
\echo '=========================================='
\echo ''
\echo 'Recommandations:'
\echo '  1. Créer les index manquants (section 8)'
\echo '  2. Surveiller les index inutilisés (section 5)'
\echo '  3. Supprimer les index redondants (section 7)'
\echo '  4. Mesurer l''impact sur les performances'
\echo ''
