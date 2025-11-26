-- ============================================
-- Index Multi-Tenant Manquants
-- ============================================
-- Ce script crée les index composites manquants
-- pour optimiser les performances multi-tenant
--
-- Usage: psql -U postgres -d topsteel -f create-missing-indexes.sql
-- ============================================

\echo 'Création des index multi-tenant manquants...'
\echo ''

-- ============================================
-- 1. USER_MENU_PREFERENCES - Index simple manquant
-- ============================================

\echo '1. user_menu_preferences - Index simple societe_id'
CREATE INDEX IF NOT EXISTS idx_user_menu_preferences_societe
    ON user_menu_preferences (societe_id);

\echo '   ✅ Index créé: idx_user_menu_preferences_societe'
\echo ''

-- ============================================
-- 2. NOTIFICATIONS - Index composite created_at
-- ============================================

\echo '2. notifications - Index composite (societe_id, created_at)'
CREATE INDEX IF NOT EXISTS idx_notifications_societe_created
    ON notifications (societe_id, created_at DESC);

\echo '   ✅ Index créé: idx_notifications_societe_created'
\echo '   💡 Utilité: Trier les notifications par date pour une société'
\echo ''

-- ============================================
-- 3. QUERY_BUILDERS - Index composite created_at
-- ============================================

\echo '3. query_builders - Index composite (societe_id, created_at)'
CREATE INDEX IF NOT EXISTS idx_query_builders_societe_created
    ON query_builders (societe_id, created_at DESC);

\echo '   ✅ Index créé: idx_query_builders_societe_created'
\echo '   💡 Utilité: Lister les query builders récents d''une société'
\echo ''

-- ============================================
-- 4. INDEX OPTIONNELS (Performance supplémentaire)
-- ============================================

\echo '4. Index optionnels pour améliorer les performances'
\echo ''

-- Notifications par statut (si colonne existe)
CREATE INDEX IF NOT EXISTS idx_notifications_societe_status
    ON notifications (societe_id, status)
    WHERE status IS NOT NULL;

\echo '   ✅ Index créé: idx_notifications_societe_status (conditionnel)'

-- Query builders par statut actif
CREATE INDEX IF NOT EXISTS idx_query_builders_societe_active
    ON query_builders (societe_id, is_active)
    WHERE is_active = true;

\echo '   ✅ Index créé: idx_query_builders_societe_active (conditionnel)'

-- Audit logs par action
CREATE INDEX IF NOT EXISTS idx_audit_logs_societe_action
    ON audit_logs (societe_id, action)
    WHERE societe_id IS NOT NULL;

\echo '   ✅ Index créé: idx_audit_logs_societe_action (conditionnel)'

\echo ''
\echo '============================================'
\echo 'VÉRIFICATION DES INDEX CRÉÉS'
\echo '============================================'
\echo ''

-- Lister tous les nouveaux index
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
      'idx_user_menu_preferences_societe',
      'idx_notifications_societe_created',
      'idx_query_builders_societe_created',
      'idx_notifications_societe_status',
      'idx_query_builders_societe_active',
      'idx_audit_logs_societe_action'
  )
ORDER BY tablename, indexname;

\echo ''
\echo '============================================'
\echo 'INDEX CRÉÉS AVEC SUCCÈS'
\echo '============================================'
\echo ''
\echo 'Prochaines étapes:'
\echo '  1. Analyser les performances avec EXPLAIN ANALYZE'
\echo '  2. Monitorer l''utilisation: pg_stat_user_indexes'
\echo '  3. Ajuster selon les patterns de requêtes réels'
\echo ''
