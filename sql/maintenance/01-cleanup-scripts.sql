-- =========================================================================
-- ERP TOPSTEEL - SCRIPTS DE MAINTENANCE ET NETTOYAGE
-- Fichier: sql/maintenance/01-cleanup-scripts.sql
-- =========================================================================

-- =====================================================
-- NETTOYAGE AUTOMATIQUE DES DONNÉES
-- =====================================================

-- Nettoyage des notifications anciennes
DELETE FROM notifications 
WHERE lu = true 
AND created_at < CURRENT_DATE - INTERVAL '30 days';

-- Nettoyage des logs d'audit anciens (garder 1 an)
-- DELETE FROM audit_logs 
-- WHERE created_at < CURRENT_DATE - INTERVAL '1 year';

-- =====================================================
-- DÉTECTION DES ANOMALIES
-- =====================================================

-- Projets avec dates incohérentes
SELECT 
    numero,
    nom,
    date_debut,
    date_fin_prevue,
    date_fin_reelle,
    'Date fin réelle avant date début' as anomalie
FROM projets 
WHERE date_fin_reelle < date_debut
UNION ALL
SELECT 
    numero,
    nom,
    date_debut,
    date_fin_prevue,
    date_fin_reelle,
    'Date fin prévue avant date début' as anomalie
FROM projets 
WHERE date_fin_prevue < date_debut;

-- Clients avec encours négatif
SELECT 
    nom,
    encours,
    'Encours négatif' as anomalie
FROM clients 
WHERE encours < 0;

-- Produits avec stock négatif
SELECT 
    code,
    nom,
    stock_actuel,
    'Stock négatif' as anomalie
FROM produits 
WHERE stock_actuel < 0;

-- Devis avec montants incohérents
SELECT 
    numero,
    montant_ht,
    taux_tva,
    montant_ttc,
    'Calcul TTC incorrect' as anomalie
FROM devis 
WHERE ABS(montant_ttc - (montant_ht * (1 + taux_tva / 100))) > 0.01;

-- =====================================================
-- RECALCULS ET CORRECTIONS
-- =====================================================

-- Recalculer l'encours de tous les clients
UPDATE clients 
SET encours = (
    SELECT COALESCE(SUM(d.montant_ttc), 0)
    FROM devis d
    INNER JOIN projets p ON d.projet_id = p.id
    WHERE p.client_id = clients.id
    AND d.statut = 'ACCEPTE'
    AND p.statut NOT IN ('FACTURE', 'CLOTURE', 'ANNULE')
),
updated_at = CURRENT_TIMESTAMP;

-- Corriger les stocks produits basés sur les mouvements
UPDATE produits 
SET stock_actuel = (
    SELECT 
        COALESCE(SUM(
            CASE ms.type
                WHEN 'ENTREE' THEN ms.quantite
                WHEN 'SORTIE' THEN -ms.quantite
                WHEN 'AJUSTEMENT' THEN 0 -- Géré séparément
                WHEN 'INVENTAIRE' THEN 0 -- Géré séparément
                ELSE 0
            END
        ), 0) +
        COALESCE((
            SELECT ms2.quantite 
            FROM mouvements_stock ms2 
            WHERE ms2.produit_id = produits.id 
            AND ms2.type IN ('AJUSTEMENT', 'INVENTAIRE')
            ORDER BY ms2.created_at DESC 
            LIMIT 1
        ), produits.stock_actuel)
    FROM mouvements_stock ms
    WHERE ms.produit_id = produits.id
),
updated_at = CURRENT_TIMESTAMP
WHERE id IN (
    SELECT DISTINCT produit_id 
    FROM mouvements_stock
);

-- =====================================================
-- OPTIMISATION DES PERFORMANCES
-- =====================================================

-- Réindexation des tables principales
REINDEX TABLE users;
REINDEX TABLE clients;
REINDEX TABLE projets;
REINDEX TABLE produits;
REINDEX TABLE devis;

-- Mise à jour des statistiques pour l'optimiseur
ANALYZE users;
ANALYZE clients;
ANALYZE projets;
ANALYZE produits;
ANALYZE devis;
ANALYZE mouvements_stock;
ANALYZE notifications;

-- =====================================================
-- VÉRIFICATIONS DE COHÉRENCE
-- =====================================================

-- Vérifier l'intégrité référentielle manuelle
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    -- Projets sans client
    SELECT COUNT(*) INTO orphan_count
    FROM projets p
    LEFT JOIN clients c ON p.client_id = c.id
    WHERE p.client_id IS NOT NULL AND c.id IS NULL;
    
    IF orphan_count > 0 THEN
        RAISE WARNING 'Trouvé % projets avec des clients inexistants', orphan_count;
    END IF;
    
    -- Devis sans projet
    SELECT COUNT(*) INTO orphan_count
    FROM devis d
    LEFT JOIN projets p ON d.projet_id = p.id
    WHERE d.projet_id IS NOT NULL AND p.id IS NULL;
    
    IF orphan_count > 0 THEN
        RAISE WARNING 'Trouvé % devis avec des projets inexistants', orphan_count;
    END IF;
    
    -- Mouvements de stock sans produit
    SELECT COUNT(*) INTO orphan_count
    FROM mouvements_stock ms
    LEFT JOIN produits p ON ms.produit_id = p.id
    WHERE ms.produit_id IS NOT NULL AND p.id IS NULL;
    
    IF orphan_count > 0 THEN
        RAISE WARNING 'Trouvé % mouvements de stock avec des produits inexistants', orphan_count;
    END IF;
END $$;

-- =====================================================
-- RAPPORT DE MAINTENANCE
-- =====================================================

-- Génération d'un rapport de santé de la base
SELECT 
    'Statistiques générales' as section,
    'Nombre total d''utilisateurs' as metrique,
    COUNT(*)::text as valeur
FROM users
UNION ALL
SELECT 
    'Statistiques générales',
    'Utilisateurs actifs',
    COUNT(*)::text
FROM users WHERE is_active = true
UNION ALL
SELECT 
    'Statistiques générales',
    'Nombre de clients',
    COUNT(*)::text
FROM clients
UNION ALL
SELECT 
    'Statistiques générales',
    'Projets en cours',
    COUNT(*)::text
FROM projets WHERE statut IN ('EN_COURS', 'ACCEPTE')
UNION ALL
SELECT 
    'Statistiques générales',
    'Produits actifs',
    COUNT(*)::text
FROM produits WHERE actif = true
UNION ALL
SELECT 
    'Stock',
    'Produits en stock critique',
    COUNT(*)::text
FROM produits WHERE stock_actuel <= stock_minimum AND actif = true
UNION ALL
SELECT 
    'Stock',
    'Produits en rupture',
    COUNT(*)::text
FROM produits WHERE stock_actuel <= 0 AND actif = true
UNION ALL
SELECT 
    'Commercial',
    'Devis en attente de réponse',
    COUNT(*)::text
FROM devis WHERE statut = 'ENVOYE' AND date_validite >= CURRENT_DATE
UNION ALL
SELECT 
    'Commercial',
    'Pipeline commercial (€)',
    ROUND(SUM(montant_ttc))::text
FROM devis WHERE statut = 'ENVOYE' AND date_validite >= CURRENT_DATE
UNION ALL
SELECT 
    'Notifications',
    'Notifications non lues',
    COUNT(*)::text
FROM notifications WHERE lu = false
UNION ALL
SELECT 
    'Performance',
    'Taille base de données (MB)',
    ROUND(pg_database_size(current_database()) / 1024.0 / 1024.0)::text
ORDER BY section, metrique;

-- =====================================================
-- VACUUM ET MAINTENANCE PHYSIQUE
-- =====================================================

-- Nettoyage physique des tables (optionnel, selon la charge)
-- VACUUM ANALYZE users;
-- VACUUM ANALYZE clients;
-- VACUUM ANALYZE projets;
-- VACUUM ANALYZE produits;
-- VACUUM ANALYZE devis;
-- VACUUM ANALYZE mouvements_stock;

-- =====================================================
-- ALERTES ET RECOMMANDATIONS
-- =====================================================

-- Créer des notifications pour les administrateurs sur les anomalies détectées
INSERT INTO notifications (titre, message, type, utilisateur_id, data)
SELECT 
    'Maintenance : Stock critique',
    'Maintenance automatique : ' || COUNT(*) || ' produits en stock critique détectés',
    'WARNING',
    u.id,
    json_build_object('nb_produits_critiques', COUNT(*), 'maintenance_date', CURRENT_DATE)
FROM produits p
CROSS JOIN users u
WHERE p.stock_actuel <= p.stock_minimum 
AND p.actif = true
AND u.role = 'ADMIN'
AND u.is_active = true
GROUP BY u.id
HAVING COUNT(*) > 0;

-- Alerte projets en retard
INSERT INTO notifications (titre, message, type, utilisateur_id, data)
SELECT 
    'Maintenance : Projets en retard',
    'Maintenance automatique : ' || COUNT(*) || ' projets en retard détectés',
    'ERROR',
    u.id,
    json_build_object('nb_projets_retard', COUNT(*), 'maintenance_date', CURRENT_DATE)
FROM projets p
CROSS JOIN users u
WHERE p.date_fin_prevue < CURRENT_DATE 
AND p.statut NOT IN ('TERMINE', 'FACTURE', 'CLOTURE', 'ANNULE')
AND u.role IN ('ADMIN', 'MANAGER')
AND u.is_active = true
GROUP BY u.id
HAVING COUNT(*) > 0;

-- =====================================================
-- COMMENTAIRES DE DOCUMENTATION
-- =====================================================

COMMENT ON SCHEMA public IS 'Maintenance effectuée le ' || CURRENT_DATE::text;

-- Message de fin
DO $$
BEGIN
    RAISE NOTICE 'Maintenance TopSteel ERP terminée le % à %', CURRENT_DATE, CURRENT_TIME;
    RAISE NOTICE 'Consultez les notifications pour les alertes détectées';
END $$;