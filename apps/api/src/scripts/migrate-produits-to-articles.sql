-- Script de migration : produits vers articles
-- TopSteel ERP - Migration de l'ancien modèle vers le nouveau
-- 
-- Ce script migre les données de la table 'produits' (ancien modèle)
-- vers la table 'articles' (nouveau modèle plus complet)

-- ============================================
-- IMPORTANT: Exécuter ce script UNIQUEMENT si:
-- 1. La table produits contient des données
-- 2. La table articles est créée et vide
-- 3. Vous voulez migrer vers le nouveau modèle
-- ============================================

BEGIN;

-- Vérifier que la table produits existe et contient des données
DO $$
DECLARE
    produit_count INTEGER;
    article_count INTEGER;
BEGIN
    -- Compter les produits existants
    SELECT COUNT(*) INTO produit_count FROM produits WHERE deleted_at IS NULL;
    
    -- Compter les articles existants
    SELECT COUNT(*) INTO article_count FROM articles;
    
    IF produit_count = 0 THEN
        RAISE NOTICE 'Aucun produit à migrer. Migration annulée.';
        RAISE EXCEPTION 'Migration inutile - table produits vide';
    END IF;
    
    IF article_count > 0 THEN
        RAISE NOTICE 'La table articles contient déjà % enregistrements.', article_count;
        RAISE EXCEPTION 'Migration annulée - table articles non vide. Videz la table articles avant migration.';
    END IF;
    
    RAISE NOTICE 'Migration de % produits vers la table articles...', produit_count;
END $$;

-- Migration des données produits vers articles
INSERT INTO articles (
    -- Colonnes de base
    id,
    created_at,
    updated_at,
    deleted_at,
    version,
    created_by_id,
    updated_by_id,
    
    -- Colonnes tenant
    societe_id,
    site_id,
    
    -- Colonnes métier
    reference,
    designation,
    description,
    type,
    status,
    
    -- Classification (dérivée du type produit)
    famille,
    sous_famille,
    
    -- Prix et valorisation
    prix_vente_ht,
    prix_achat_standard,
    taux_marge,
    
    -- Caractéristiques techniques depuis specifications
    caracteristiques_techniques,
    
    -- Métadonnées
    metadonnees,
    
    -- Dates
    date_creation_fiche,
    date_derniere_modification
)
SELECT 
    -- Génération d'un nouvel UUID pour chaque article
    gen_random_uuid() as id,
    p.created_at,
    p.updated_at,
    p.deleted_at,
    p.version,
    p.created_by_id,
    p.updated_by_id,
    
    -- Tenant
    p.societe_id,
    p.site_id,
    
    -- Transformation des données métier
    COALESCE(p.reference, 'PROD-' || LPAD(p.id::text, 6, '0')) as reference,
    p.nom as designation,
    p.description,
    
    -- Mapping du type produit vers type article
    CASE 
        WHEN p.type IN ('ACIER', 'INOX', 'ALUMINIUM', 'METAL') THEN 'MATIERE_PREMIERE'
        WHEN p.type IN ('PROFILE', 'POUTRE', 'TUBE') THEN 'PRODUIT_SEMI_FINI'
        WHEN p.type IN ('STRUCTURE', 'ASSEMBLAGE') THEN 'PRODUIT_FINI'
        WHEN p.type IN ('VISSERIE', 'QUINCAILLERIE') THEN 'FOURNITURE'
        WHEN p.type IN ('ELECTRODE', 'CONSOMMABLE') THEN 'CONSOMMABLE'
        ELSE 'MATIERE_PREMIERE'
    END::article_type as type,
    
    -- Status basé sur actif
    CASE 
        WHEN p.actif = true THEN 'ACTIF'
        ELSE 'INACTIF'
    END::article_status as status,
    
    -- Classification dérivée
    CASE 
        WHEN p.type IN ('ACIER', 'INOX', 'ALUMINIUM') THEN 'METAUX'
        WHEN p.type IN ('PROFILE', 'POUTRE') THEN 'PROFILES'
        WHEN p.type IN ('TUBE') THEN 'TUBES'
        WHEN p.type IN ('TOLE') THEN 'TOLES'
        ELSE 'DIVERS'
    END as famille,
    
    p.type as sous_famille,
    
    -- Prix et marges
    p.prix_vente as prix_vente_ht,
    p.cout_production as prix_achat_standard,
    
    -- Calcul du taux de marge
    CASE 
        WHEN p.cout_production IS NOT NULL AND p.cout_production > 0 THEN
            ROUND(((p.prix_vente - p.cout_production) / p.cout_production) * 100, 2)
        ELSE NULL
    END as taux_marge,
    
    -- Récupération des specifications
    CASE 
        WHEN p.specifications IS NOT NULL AND p.specifications != '{}'::jsonb THEN
            jsonb_build_object(
                'specifications_origine', p.specifications,
                'temps_fabrication_minutes', p.temps_fabrication,
                'migre_depuis', 'table_produits',
                'date_migration', CURRENT_TIMESTAMP
            )
        ELSE 
            jsonb_build_object(
                'temps_fabrication_minutes', p.temps_fabrication,
                'migre_depuis', 'table_produits',
                'date_migration', CURRENT_TIMESTAMP
            )
    END as caracteristiques_techniques,
    
    -- Métadonnées enrichies
    CASE 
        WHEN p.metadata IS NOT NULL THEN
            p.metadata || jsonb_build_object(
                'origine_migration', 'produits',
                'id_origine', p.id,
                'reference_origine', p.reference
            )
        ELSE
            jsonb_build_object(
                'origine_migration', 'produits',
                'id_origine', p.id,
                'reference_origine', p.reference
            )
    END as metadonnees,
    
    -- Dates
    p.created_at::date as date_creation_fiche,
    p.updated_at::date as date_derniere_modification
    
FROM produits p
WHERE p.deleted_at IS NULL;

-- Statistiques de migration
DO $$
DECLARE
    articles_migres INTEGER;
    produits_source INTEGER;
BEGIN
    SELECT COUNT(*) INTO produits_source FROM produits WHERE deleted_at IS NULL;
    SELECT COUNT(*) INTO articles_migres FROM articles WHERE metadonnees->>'origine_migration' = 'produits';
    
    RAISE NOTICE '';
    RAISE NOTICE '=== RÉSULTAT DE LA MIGRATION ===';
    RAISE NOTICE 'Produits source: %', produits_source;
    RAISE NOTICE 'Articles migrés: %', articles_migres;
    RAISE NOTICE '';
    
    -- Afficher quelques exemples
    RAISE NOTICE 'Exemples d''articles migrés:';
    FOR r IN (
        SELECT reference, designation, type, famille 
        FROM articles 
        WHERE metadonnees->>'origine_migration' = 'produits'
        LIMIT 5
    )
    LOOP
        RAISE NOTICE '  - % : % (%/%)', r.reference, r.designation, r.type, r.famille;
    END LOOP;
END $$;

-- Optionnel: Marquer la table produits comme obsolète (décommenter si souhaité)
-- COMMENT ON TABLE produits IS 'OBSOLÈTE - Migré vers la table articles. Ne plus utiliser.';

-- Créer une vue pour la compatibilité ascendante (si nécessaire)
CREATE OR REPLACE VIEW v_produits_legacy AS
SELECT 
    a.id::integer as id, -- Attention: perte de précision UUID vers integer
    a.societe_id,
    a.site_id,
    a.designation as nom,
    a.reference,
    a.description,
    COALESCE(a.sous_famille, a.famille) as type,
    a.prix_vente_ht as prix_vente,
    a.prix_achat_standard as cout_production,
    (a.caracteristiques_techniques->>'temps_fabrication_minutes')::integer as temps_fabrication,
    COALESCE(
        a.caracteristiques_techniques->'specifications_origine',
        '{}'::jsonb
    ) as specifications,
    CASE 
        WHEN a.status = 'ACTIF' THEN true
        ELSE false
    END as actif,
    a.metadonnees as metadata,
    a.created_at,
    a.updated_at,
    a.deleted_at,
    a.version,
    a.created_by_id,
    a.updated_by_id
FROM articles a
WHERE a.metadonnees->>'origine_migration' = 'produits';

COMMENT ON VIEW v_produits_legacy IS 'Vue de compatibilité pour l''ancien modèle produits. Utiliser la table articles directement.';

COMMIT;

-- ============================================
-- VÉRIFICATIONS POST-MIGRATION
-- ============================================

-- Vérifier la cohérence des données
SELECT 
    'Produits originaux' as source,
    COUNT(*) as total,
    COUNT(DISTINCT societe_id) as societes,
    COUNT(CASE WHEN actif = true THEN 1 END) as actifs
FROM produits
WHERE deleted_at IS NULL

UNION ALL

SELECT 
    'Articles migrés' as source,
    COUNT(*) as total,
    COUNT(DISTINCT societe_id) as societes,
    COUNT(CASE WHEN status = 'ACTIF' THEN 1 END) as actifs
FROM articles
WHERE metadonnees->>'origine_migration' = 'produits';

-- Exemples de requêtes pour vérifier les données migrées
/*
-- 1. Vérifier les références
SELECT 
    p.reference as ref_origine,
    a.reference as ref_migree,
    p.nom as nom_origine,
    a.designation as designation_migree
FROM produits p
JOIN articles a ON a.metadonnees->>'id_origine' = p.id::text
LIMIT 10;

-- 2. Vérifier les prix et marges
SELECT 
    a.reference,
    a.designation,
    a.prix_achat_standard,
    a.prix_vente_ht,
    a.taux_marge
FROM articles a
WHERE a.metadonnees->>'origine_migration' = 'produits'
AND a.prix_vente_ht IS NOT NULL
ORDER BY a.taux_marge DESC NULLS LAST
LIMIT 10;

-- 3. Statistiques par type
SELECT 
    a.type,
    a.famille,
    COUNT(*) as nombre,
    ROUND(AVG(a.prix_vente_ht), 2) as prix_moyen
FROM articles a
WHERE a.metadonnees->>'origine_migration' = 'produits'
GROUP BY a.type, a.famille
ORDER BY nombre DESC;
*/