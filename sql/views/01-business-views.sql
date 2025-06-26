-- =========================================================================
-- ERP TOPSTEEL - VUES MÉTIER COMPLÈTES
-- Fichier: sql/views/01-business-views.sql
-- =========================================================================

-- =====================================================
-- VUES PRINCIPALES POUR PROJETS MÉTALLERIE
-- =====================================================

-- Vue complète des projets avec toutes les informations liées
CREATE OR REPLACE VIEW v_projets_complets AS
SELECT 
    p.id,
    p.numero,
    p.nom,
    p.description,
    p.type,
    p.statut,
    p.priorite,
    p.date_debut,
    p.date_fin_prevue,
    p.date_fin_reelle,
    p.budget_estime,
    p.cout_reel,
    p.avancement_pct,
    
    -- Informations client
    c.nom as client_nom,
    c.type as client_type,
    c.email as client_email,
    c.telephone as client_telephone,
    
    -- Informations responsable
    u.nom as responsable_nom,
    u.prenom as responsable_prenom,
    u.email as responsable_email,
    
    -- Adresse chantier formatée
    p.adresse_chantier->>'rue' as chantier_rue,
    p.adresse_chantier->>'ville' as chantier_ville,
    p.adresse_chantier->>'cp' as chantier_cp,
    
    -- Calculs automatiques
    CASE 
        WHEN p.date_fin_prevue < CURRENT_DATE AND p.statut NOT IN ('TERMINE', 'FACTURE', 'CLOTURE') 
        THEN 'EN_RETARD'
        ELSE 'OK'
    END as etat_planning,
    
    CASE 
        WHEN p.cout_reel > p.budget_estime * 1.1 THEN 'DEPASSEMENT'
        WHEN p.cout_reel > p.budget_estime * 0.9 THEN 'ATTENTION'
        ELSE 'OK'
    END as etat_budget,
    
    -- Statistiques
    (SELECT COUNT(*) FROM documents WHERE projet_id = p.id) as nb_documents,
    (SELECT COUNT(*) FROM devis WHERE projet_id = p.id) as nb_devis,
    
    p.created_at,
    p.updated_at
FROM projets p
LEFT JOIN clients c ON p.client_id = c.id
LEFT JOIN users u ON p.responsable_id = u.id;

-- Vue dashboard projets par statut
CREATE OR REPLACE VIEW v_dashboard_projets AS
SELECT 
    statut,
    COUNT(*) as nombre_projets,
    SUM(budget_estime) as budget_total,
    SUM(cout_reel) as cout_total,
    AVG(avancement_pct) as avancement_moyen,
    COUNT(CASE WHEN date_fin_prevue < CURRENT_DATE THEN 1 END) as projets_en_retard,
    COUNT(CASE WHEN cout_reel > budget_estime * 1.1 THEN 1 END) as projets_depassement_budget
FROM projets 
GROUP BY statut
ORDER BY 
    CASE statut
        WHEN 'EN_COURS' THEN 1
        WHEN 'ACCEPTE' THEN 2
        WHEN 'DEVIS' THEN 3
        WHEN 'BROUILLON' THEN 4
        WHEN 'TERMINE' THEN 5
        WHEN 'FACTURE' THEN 6
        WHEN 'CLOTURE' THEN 7
        WHEN 'ANNULE' THEN 8
    END;

-- =====================================================
-- VUES CLIENTS ET COMMERCIAL
-- =====================================================

-- Vue clients avec statistiques complètes
CREATE OR REPLACE VIEW v_clients_analytics AS
SELECT 
    c.id,
    c.type,
    c.nom,
    c.email,
    c.telephone,
    c.siret,
    c.tva_intra,
    c.adresse,
    c.contact_principal,
    c.notes,
    c.credit_limite,
    c.encours,
    c.created_at,
    c.updated_at,
    
    -- Statistiques projets
    COUNT(p.id) as nb_projets_total,
    COUNT(CASE WHEN p.statut IN ('EN_COURS', 'ACCEPTE') THEN 1 END) as nb_projets_actifs,
    COUNT(CASE WHEN p.statut = 'TERMINE' THEN 1 END) as nb_projets_termines,
    
    -- Statistiques financières
    SUM(p.budget_estime) as budget_total_estime,
    SUM(p.cout_reel) as cout_total_reel,
    AVG(p.budget_estime) as budget_moyen_projet,
    
    -- Statistiques devis
    COUNT(d.id) as nb_devis_total,
    COUNT(CASE WHEN d.statut = 'ACCEPTE' THEN 1 END) as nb_devis_acceptes,
    COUNT(CASE WHEN d.statut = 'ENVOYE' THEN 1 END) as nb_devis_en_attente,
    SUM(CASE WHEN d.statut = 'ACCEPTE' THEN d.montant_ttc ELSE 0 END) as ca_realise,
    
    -- Dates importantes
    MAX(p.created_at) as dernier_projet,
    MIN(p.created_at) as premier_projet,
    
    -- Classification client
    CASE 
        WHEN COUNT(p.id) = 0 THEN 'PROSPECT'
        WHEN COUNT(p.id) = 1 THEN 'NOUVEAU_CLIENT'
        WHEN COUNT(p.id) BETWEEN 2 AND 5 THEN 'CLIENT_REGULIER'
        WHEN COUNT(p.id) > 5 THEN 'CLIENT_FIDELE'
    END as classification,
    
    -- Risque (basé sur encours existant)
    CASE 
        WHEN c.encours > COALESCE(c.credit_limite, 50000) THEN 'RISQUE_ELEVE'
        WHEN c.encours > COALESCE(c.credit_limite, 50000) * 0.8 THEN 'RISQUE_MOYEN'
        ELSE 'RISQUE_FAIBLE'
    END as niveau_risque
    
FROM clients c
LEFT JOIN projets p ON c.id = p.client_id
LEFT JOIN devis d ON p.id = d.projet_id
GROUP BY c.id, c.type, c.nom, c.email, c.telephone, c.siret, c.tva_intra, 
         c.adresse, c.contact_principal, c.notes, c.credit_limite, c.encours, 
         c.created_at, c.updated_at;

-- Vue top clients par CA
CREATE OR REPLACE VIEW v_top_clients_ca AS
SELECT 
    c.nom,
    c.type,
    c.email,
    COUNT(DISTINCT p.id) as nb_projets,
    SUM(d.montant_ttc) as ca_total,
    AVG(d.montant_ttc) as panier_moyen,
    MAX(d.date_emission) as derniere_vente
FROM clients c
INNER JOIN projets p ON c.id = p.client_id
INNER JOIN devis d ON p.id = d.projet_id
WHERE d.statut = 'ACCEPTE'
GROUP BY c.id, c.nom, c.type, c.email
ORDER BY ca_total DESC
LIMIT 20;

-- =====================================================
-- VUES GESTION STOCK ET PRODUITS
-- =====================================================

-- Vue stock critique avec informations fournisseur
CREATE OR REPLACE VIEW v_stocks_critiques AS
SELECT 
    pr.id,
    pr.code,
    pr.nom,
    pr.categorie,
    pr.unite,
    pr.stock_actuel,
    pr.stock_minimum,
    pr.stock_maximum,
    pr.prix_achat,
    pr.prix_vente,
    
    -- Informations fournisseur
    f.nom as fournisseur_nom,
    f.email as fournisseur_email,
    f.telephone as fournisseur_telephone,
    
    -- Calculs
    (pr.stock_minimum - pr.stock_actuel) as quantite_a_commander,
    (pr.stock_minimum - pr.stock_actuel) * pr.prix_achat as montant_commande_estime,
    
    -- Statut critique
    CASE 
        WHEN pr.stock_actuel <= 0 THEN 'RUPTURE'
        WHEN pr.stock_actuel <= pr.stock_minimum * 0.5 THEN 'CRITIQUE'
        WHEN pr.stock_actuel <= pr.stock_minimum THEN 'FAIBLE'
        ELSE 'OK'
    END as niveau_alerte,
    
    -- Derniers mouvements
    (SELECT MAX(created_at) FROM mouvements_stock WHERE produit_id = pr.id) as dernier_mouvement,
    (SELECT type FROM mouvements_stock WHERE produit_id = pr.id ORDER BY created_at DESC LIMIT 1) as type_dernier_mouvement
    
FROM produits pr
LEFT JOIN fournisseurs f ON pr.fournisseur_principal_id = f.id
WHERE pr.actif = true 
AND pr.stock_actuel <= pr.stock_minimum
ORDER BY 
    CASE 
        WHEN pr.stock_actuel <= 0 THEN 1
        WHEN pr.stock_actuel <= pr.stock_minimum * 0.5 THEN 2
        ELSE 3
    END,
    pr.stock_actuel ASC;

-- Vue valorisation stock
CREATE OR REPLACE VIEW v_valorisation_stock AS
SELECT 
    pr.categorie,
    COUNT(*) as nb_references,
    SUM(pr.stock_actuel) as quantite_totale,
    SUM(pr.stock_actuel * pr.prix_achat) as valeur_achat,
    SUM(pr.stock_actuel * pr.prix_vente) as valeur_vente,
    SUM(pr.stock_actuel * (pr.prix_vente - pr.prix_achat)) as marge_potentielle,
    AVG(pr.prix_vente / NULLIF(pr.prix_achat, 0)) as taux_marge_moyen
FROM produits pr
WHERE pr.actif = true 
AND pr.stock_actuel > 0
GROUP BY pr.categorie
ORDER BY valeur_achat DESC;

-- =====================================================
-- VUES FINANCIÈRES ET DEVIS
-- =====================================================

-- Vue pipeline commercial (devis en cours)
CREATE OR REPLACE VIEW v_pipeline_commercial AS
SELECT 
    d.id,
    d.numero,
    d.statut,
    d.date_emission,
    d.date_validite,
    d.montant_ttc,
    
    -- Informations projet/client
    p.nom as projet_nom,
    p.type as projet_type,
    c.nom as client_nom,
    c.type as client_type,
    
    -- Informations commercial
    u.nom as redacteur_nom,
    u.prenom as redacteur_prenom,
    
    -- Indicateurs
    CASE 
        WHEN d.date_validite < CURRENT_DATE THEN 'EXPIRE'
        WHEN d.date_validite < CURRENT_DATE + INTERVAL '7 days' THEN 'EXPIRE_BIENTOT'
        ELSE 'VALIDE'
    END as etat_validite,
    
    CURRENT_DATE - d.date_emission as anciennete_jours,
    d.date_validite - CURRENT_DATE as jours_restants,
    
    -- Probabilité de closing (basée sur l'ancienneté et le statut)
    CASE 
        WHEN d.statut = 'ACCEPTE' THEN 100
        WHEN d.statut = 'REFUSE' OR d.date_validite < CURRENT_DATE THEN 0
        WHEN d.statut = 'ENVOYE' AND CURRENT_DATE - d.date_emission <= 7 THEN 70
        WHEN d.statut = 'ENVOYE' AND CURRENT_DATE - d.date_emission <= 14 THEN 50
        WHEN d.statut = 'ENVOYE' AND CURRENT_DATE - d.date_emission <= 30 THEN 30
        WHEN d.statut = 'RELANCE' THEN 60
        ELSE 20
    END as probabilite_closing
    
FROM devis d
INNER JOIN projets p ON d.projet_id = p.id
INNER JOIN clients c ON d.client_id = c.id
LEFT JOIN users u ON d.redacteur_id = u.id
WHERE d.statut NOT IN ('REFUSE', 'EXPIRE')
ORDER BY d.montant_ttc DESC, d.date_emission DESC;

-- Vue CA mensuel
CREATE OR REPLACE VIEW v_ca_mensuel AS
SELECT 
    to_char(d.date_emission, 'YYYY-MM') as mois,
    extract(year from d.date_emission) as annee,
    extract(month from d.date_emission) as mois_num,
    COUNT(*) as nb_devis_acceptes,
    SUM(d.montant_ht) as ca_ht,
    SUM(d.montant_ttc) as ca_ttc,
    AVG(d.montant_ttc) as panier_moyen,
    COUNT(DISTINCT d.client_id) as nb_clients_distincts
FROM devis d
WHERE d.statut = 'ACCEPTE'
GROUP BY 
    to_char(d.date_emission, 'YYYY-MM'),
    extract(year from d.date_emission),
    extract(month from d.date_emission)
ORDER BY annee DESC, mois_num DESC;

-- =====================================================
-- VUES PLANNING ET PRODUCTION
-- =====================================================

-- Vue planning projets (Gantt simplifié)
CREATE OR REPLACE VIEW v_planning_projets AS
SELECT 
    p.id,
    p.numero,
    p.nom,
    p.type,
    p.statut,
    p.priorite,
    p.date_debut,
    p.date_fin_prevue,
    p.date_fin_reelle,
    p.avancement_pct,
    
    -- Informations responsable
    u.nom || ' ' || u.prenom as responsable,
    
    -- Calculs de planning
    CASE 
        WHEN p.date_debut IS NULL THEN NULL
        ELSE p.date_fin_prevue - p.date_debut
    END as duree_prevue_jours,
    
    CASE 
        WHEN p.date_debut IS NULL OR p.date_fin_reelle IS NULL THEN NULL
        ELSE p.date_fin_reelle - p.date_debut
    END as duree_reelle_jours,
    
    CASE 
        WHEN p.date_fin_prevue < CURRENT_DATE AND p.statut NOT IN ('TERMINE', 'FACTURE', 'CLOTURE') 
        THEN CURRENT_DATE - p.date_fin_prevue
        ELSE 0
    END as retard_jours,
    
    -- Charge de travail (simplifié)
    CASE p.type
        WHEN 'PORTAIL' THEN 5
        WHEN 'CLOTURE' THEN 3
        WHEN 'ESCALIER' THEN 7
        WHEN 'GARDE_CORPS' THEN 4
        WHEN 'VERRIERE' THEN 6
        ELSE 4
    END as charge_estimee_jours,
    
    -- Client
    c.nom as client_nom
    
FROM projets p
LEFT JOIN users u ON p.responsable_id = u.id
LEFT JOIN clients c ON p.client_id = c.id
WHERE p.statut NOT IN ('ANNULE', 'CLOTURE')
ORDER BY 
    CASE p.priorite
        WHEN 'URGENTE' THEN 1
        WHEN 'HAUTE' THEN 2
        WHEN 'NORMALE' THEN 3
        WHEN 'BASSE' THEN 4
    END,
    p.date_fin_prevue ASC;

-- =====================================================
-- VUES TABLEAU DE BORD GLOBAL
-- =====================================================

-- Vue KPI globaux TopSteel
CREATE OR REPLACE VIEW v_kpi_dashboard AS
SELECT 
    -- Projets
    (SELECT COUNT(*) FROM projets WHERE statut = 'EN_COURS') as projets_en_cours,
    (SELECT COUNT(*) FROM projets WHERE statut = 'ACCEPTE') as projets_acceptes,
    (SELECT COUNT(*) FROM projets WHERE date_fin_prevue < CURRENT_DATE AND statut NOT IN ('TERMINE', 'FACTURE', 'CLOTURE')) as projets_en_retard,
    
    -- Commercial
    (SELECT COUNT(*) FROM devis WHERE statut = 'ENVOYE' AND date_validite >= CURRENT_DATE) as devis_en_attente,
    (SELECT SUM(montant_ttc) FROM devis WHERE statut = 'ENVOYE' AND date_validite >= CURRENT_DATE) as pipeline_montant,
    (SELECT COUNT(*) FROM devis WHERE statut = 'ACCEPTE' AND date_emission >= CURRENT_DATE - INTERVAL '30 days') as devis_acceptes_mois,
    (SELECT SUM(montant_ttc) FROM devis WHERE statut = 'ACCEPTE' AND date_emission >= CURRENT_DATE - INTERVAL '30 days') as ca_mois,
    
    -- Stock
    (SELECT COUNT(*) FROM produits WHERE stock_actuel <= stock_minimum AND actif = true) as alertes_stock,
    (SELECT COUNT(*) FROM produits WHERE stock_actuel <= 0 AND actif = true) as ruptures_stock,
    (SELECT SUM(stock_actuel * prix_achat) FROM produits WHERE actif = true) as valeur_stock_total,
    
    -- Clients
    (SELECT COUNT(*) FROM clients) as nb_clients_total,
    (SELECT COUNT(*) FROM clients WHERE id IN (SELECT DISTINCT client_id FROM projets WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')) as clients_actifs_mois,
    (SELECT SUM(encours) FROM clients WHERE encours > 0) as encours_total;

-- Vue fournisseurs actifs (compatibilité existant)
CREATE OR REPLACE VIEW v_fournisseurs_actifs AS
SELECT 
    f.*,
    COUNT(p.id) as nb_produits_references,
    COUNT(c.id) as nb_commandes_total,
    MAX(c.date_commande) as derniere_commande,
    SUM(CASE WHEN c.statut IN ('CONFIRMEE', 'EN_COURS') THEN c.montant_ttc ELSE 0 END) as encours_commandes
FROM fournisseurs f
LEFT JOIN produits p ON f.id = p.fournisseur_principal_id
LEFT JOIN commandes c ON f.id = c.fournisseur_id
WHERE f.actif = true
GROUP BY f.id, f.nom, f.email, f.telephone, f.adresse, f.siret, f.actif, f."createdAt", f."updatedAt"
ORDER BY nb_produits_references DESC;

-- =====================================================
-- COMMENTAIRES POUR DOCUMENTATION
-- =====================================================

COMMENT ON VIEW v_projets_complets IS 'Vue complète des projets avec informations client et responsable';
COMMENT ON VIEW v_stocks_critiques IS 'Stock en situation critique nécessitant une commande';
COMMENT ON VIEW v_planning_projets IS 'Planning des projets avec calculs de retard et charge';
COMMENT ON VIEW v_kpi_dashboard IS 'KPIs globaux pour le tableau de bord principal';