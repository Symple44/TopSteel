-- =========================================================================
-- ERP TOPSTEEL - VUES MÉTIER
-- Fichier: sql/views/01-business-views.sql
-- =========================================================================

-- Vue des projets avec informations client
CREATE OR REPLACE VIEW v_projets_complets AS
SELECT 
    p.id,
    p.numero,
    p.nom,
    p.type,
    p.statut,
    p.priorite,
    p.date_debut,
    p.date_fin_prevue,
    p.budget_estime,
    p.cout_reel,
    p.avancement_pct,
    c.nom as client_nom,
    c.type as client_type,
    u.nom as responsable_nom,
    u.prenom as responsable_prenom,
    p.created_at
FROM projets p
LEFT JOIN clients c ON p.client_id = c.id
LEFT JOIN users u ON p.responsable_id = u.id;

-- Vue tableau de bord projets
CREATE OR REPLACE VIEW v_dashboard_projets AS
SELECT 
    statut,
    COUNT(*) as nombre,
    SUM(budget_estime) as budget_total,
    SUM(cout_reel) as cout_total,
    AVG(avancement_pct) as avancement_moyen
FROM projets 
GROUP BY statut;

-- Vue clients actifs
CREATE OR REPLACE VIEW v_clients_actifs AS
SELECT 
    c.*,
    COUNT(p.id) as nb_projets,
    SUM(p.budget_estime) as budget_total,
    MAX(p.created_at) as dernier_projet
FROM clients c
LEFT JOIN projets p ON c.id = p.client_id
GROUP BY c.id;

-- Vue fournisseurs actifs (compatible existant)
CREATE OR REPLACE VIEW v_fournisseurs_actifs AS
SELECT *
FROM fournisseurs
WHERE actif = true;
