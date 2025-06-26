-- =========================================================================
-- ERP TOPSTEEL - SCRIPTS DE MAINTENANCE
-- Fichier: sql/maintenance/01-cleanup-scripts.sql
-- =========================================================================

-- Nettoyage des tokens expirés
DELETE FROM users WHERE refresh_token IS NOT NULL 
AND last_login < NOW() - INTERVAL '30 days';

-- Archivage des projets clos anciens
UPDATE projets SET statut = 'CLOTURE' 
WHERE statut = 'TERMINE' 
AND date_fin_reelle < NOW() - INTERVAL '1 year';

-- Nettoyage des documents orphelins
DELETE FROM documents 
WHERE projet_id IS NULL 
AND created_at < NOW() - INTERVAL '90 days';

-- Statistiques de base
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 
    'clients' as table_name, COUNT(*) as count FROM clients
UNION ALL
SELECT 
    'projets' as table_name, COUNT(*) as count FROM projets
UNION ALL
SELECT 
    'documents' as table_name, COUNT(*) as count FROM documents;
