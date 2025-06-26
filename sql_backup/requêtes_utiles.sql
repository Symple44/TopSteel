
-- =====================================================
-- Requêtes SQL utiles pour l'ERP TOPSTEEL
-- =====================================================

-- =====================================================
-- 1. TABLEAU DE BORD ET STATISTIQUES
-- =====================================================

-- Statistiques générales du tableau de bord
SELECT 
    (SELECT COUNT(*) FROM projets WHERE statut = 'EN_COURS') as projets_en_cours,
    (SELECT COUNT(*) FROM projets WHERE statut = 'ACCEPTE') as projets_en_attente,
    (SELECT COUNT(*) FROM devis WHERE statut = 'ENVOYE' AND date_validite >= CURRENT_DATE) as devis_actifs,
    (SELECT COUNT(*) FROM factures WHERE statut IN ('EMISE', 'ENVOYEE', 'EN_RETARD')) as factures_impayees,
    (SELECT COALESCE(SUM(montant_ttc - montant_paye), 0) FROM factures WHERE statut != 'PAYEE') as total_impayes,
    (SELECT COUNT(*) FROM stocks WHERE quantite_disponible <= quantite_minimale) as produits_stock_critique;

-- Chiffre d'affaires par mois (12 derniers mois)
WITH mois AS (
    SELECT generate_series(
        date_trunc('month', CURRENT_DATE - INTERVAL '11 months'),
        date_trunc('month', CURRENT_DATE),
        '1 month'::interval
    ) AS mois
)
SELECT 
    TO_CHAR(m.mois, 'YYYY-MM') as periode,
    TO_CHAR(m.mois, 'TMMonth YYYY') as mois_annee,
    COALESCE(SUM(f.montant_ht), 0) as ca_ht,
    COALESCE(SUM(f.montant_ttc), 0) as ca_ttc,
    COUNT(DISTINCT f.id) as nb_factures
FROM mois m
LEFT JOIN factures f ON date_trunc('month', f.date_emission) = m.mois
    AND f.statut != 'ANNULEE'
GROUP BY m.mois
ORDER BY m.mois;

-- Top 10 clients par CA (année en cours)
SELECT 
    c.id,
    c.nom,
    c.type,
    COUNT(DISTINCT p.id) as nb_projets,
    COALESCE(SUM(f.montant_ht), 0) as ca_ht,
    COALESCE(SUM(f.montant_ttc), 0) as ca_ttc
FROM clients c
LEFT JOIN projets p ON p.client_id = c.id
LEFT JOIN factures f ON f.projet_id = p.id 
    AND f.statut != 'ANNULEE'
    AND EXTRACT(YEAR FROM f.date_emission) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY c.id, c.nom, c.type
ORDER BY ca_ttc DESC
LIMIT 10;

-- =====================================================
-- 2. GESTION DES PROJETS
-- =====================================================

-- Projets en cours avec informations complètes
SELECT 
    p.reference,
    p.description,
    p.statut,
    p.avancement,
    c.nom as client,
    u.nom || ' ' || u.prenom as responsable,
    p.date_debut,
    p.date_fin_prevue,
    p.montant_ht,
    p.montant_ttc,
    DATE_PART('day', p.date_fin_prevue - CURRENT_DATE) as jours_restants,
    (SELECT COUNT(*) FROM ordres_fabrication WHERE projet_id = p.id) as nb_of,
    (SELECT COUNT(*) FROM documents WHERE projet_id = p.id) as nb_documents
FROM projets p
INNER JOIN clients c ON c.id = p.client_id
LEFT JOIN users u ON u.id = p.responsable_id
WHERE p.statut IN ('EN_COURS', 'ACCEPTE')
ORDER BY p.priorite DESC, p.date_fin_prevue;

-- Rentabilité des projets terminés
SELECT 
    p.reference,
    p.description,
    c.nom as client,
    p.montant_ht as ca_ht,
    COALESCE(SUM(lc.montant_ht), 0) as cout_matieres,
    p.montant_ht - COALESCE(SUM(lc.montant_ht), 0) as marge_brute,
    CASE 
        WHEN p.montant_ht > 0 
        THEN ROUND((p.montant_ht - COALESCE(SUM(lc.montant_ht), 0)) / p.montant_ht * 100, 2)
        ELSE 0 
    END as taux_marge
FROM projets p
INNER JOIN clients c ON c.id = p.client_id
LEFT JOIN commandes cmd ON cmd.projet_id = p.id
LEFT JOIN lignes_commande lc ON lc.commande_id = cmd.id
WHERE p.statut = 'TERMINE'
GROUP BY p.id, p.reference, p.description, c.nom, p.montant_ht
ORDER BY p.updated_at DESC;

-- Projets en retard
SELECT 
    p.reference,
    p.description,
    c.nom as client,
    p.statut,
    p.avancement || '%' as avancement,
    p.date_fin_prevue,
    CURRENT_DATE - p.date_fin_prevue as jours_retard,
    u.nom || ' ' || u.prenom as responsable
FROM projets p
INNER JOIN clients c ON c.id = p.client_id
LEFT JOIN users u ON u.id = p.responsable_id
WHERE p.statut NOT IN ('TERMINE', 'FACTURE', 'CLOTURE', 'ANNULE')
    AND p.date_fin_prevue < CURRENT_DATE
ORDER BY jours_retard DESC;

-- =====================================================
-- 3. GESTION DES STOCKS
-- =====================================================

-- Produits en stock critique avec informations fournisseur
SELECT 
    p.reference,
    p.designation,
    p.categorie,
    s.quantite_disponible,
    s.quantite_reservee,
    s.quantite_disponible - s.quantite_reservee as quantite_libre,
    s.quantite_minimale,
    s.quantite_maximale,
    f.nom as fournisseur_principal,
    f.delai_livraison || ' jours' as delai_livraison,
    p.prix_achat,
    s.quantite_minimale * p.prix_achat as valeur_stock_min
FROM stocks s
INNER JOIN produits p ON p.id = s.produit_id
LEFT JOIN fournisseurs f ON f.id = p.fournisseur_principal_id
WHERE s.quantite_disponible <= s.quantite_minimale * 1.2
ORDER BY s.quantite_disponible / NULLIF(s.quantite_minimale, 0);

-- Valorisation du stock
SELECT 
    p.categorie,
    COUNT(DISTINCT p.id) as nb_references,
    SUM(s.quantite_disponible) as quantite_totale,
    SUM(s.quantite_disponible * p.prix_achat) as valeur_achat,
    SUM(s.quantite_disponible * p.prix_vente) as valeur_vente_potentielle
FROM stocks s
INNER JOIN produits p ON p.id = s.produit_id
WHERE p.actif = true
GROUP BY p.categorie
ORDER BY valeur_achat DESC;

-- Historique des mouvements de stock (7 derniers jours)
SELECT 
    ms.created_at,
    p.reference,
    p.designation,
    ms.type_mouvement,
    ms.quantite,
    ms.quantite_avant || ' → ' || ms.quantite_apres as evolution,
    ms.motif,
    ms.reference_document,
    u.nom || ' ' || u.prenom as utilisateur
FROM mouvements_stock ms
INNER JOIN stocks s ON s.id = ms.stock_id
INNER JOIN produits p ON p.id = s.produit_id
INNER JOIN users u ON u.id = ms.utilisateur_id
WHERE ms.created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY ms.created_at DESC;

-- Produits les plus consommés (30 derniers jours)
SELECT 
    p.reference,
    p.designation,
    p.categorie,
    COUNT(ms.id) as nb_sorties,
    SUM(CASE WHEN ms.type_mouvement = 'SORTIE' THEN ms.quantite ELSE 0 END) as quantite_consommee,
    AVG(CASE WHEN ms.type_mouvement = 'SORTIE' THEN ms.quantite ELSE 0 END) as quantite_moyenne_sortie
FROM mouvements_stock ms
INNER JOIN stocks s ON s.id = ms.stock_id
INNER JOIN produits p ON p.id = s.produit_id
WHERE ms.type_mouvement = 'SORTIE'
    AND ms.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.id, p.reference, p.designation, p.categorie
ORDER BY quantite_consommee DESC
LIMIT 20;

-- =====================================================
-- 4. GESTION COMMERCIALE
-- =====================================================

-- Devis en cours avec taux de transformation
WITH devis_stats AS (
    SELECT 
        EXTRACT(MONTH FROM date_emission) as mois,
        COUNT(*) FILTER (WHERE statut = 'ACCEPTE') as nb_acceptes,
        COUNT(*) as nb_total,
        SUM(montant_ttc) FILTER (WHERE statut = 'ACCEPTE') as ca_accepte,
        SUM(montant_ttc) as ca_total
    FROM devis
    WHERE date_emission >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY EXTRACT(MONTH FROM date_emission)
)
SELECT 
    TO_CHAR(TO_DATE(mois::text, 'MM'), 'TMMonth') as mois,
    nb_total as devis_emis,
    nb_acceptes as devis_acceptes,
    ROUND(nb_acceptes::numeric / NULLIF(nb_total, 0) * 100, 1) as taux_transformation,
    ca_total as ca_potentiel,
    ca_accepte as ca_realise
FROM devis_stats
ORDER BY mois;

-- Devis à relancer (proche expiration)
SELECT 
    d.numero,
    d.date_emission,
    d.date_validite,
    d.date_validite - CURRENT_DATE as jours_restants,
    d.montant_ttc,
    p.reference as projet,
    c.nom as client,
    c.email,
    c.telephone
FROM devis d
INNER JOIN projets p ON p.id = d.projet_id
INNER JOIN clients c ON c.id = p.client_id
WHERE d.statut = 'ENVOYE'
    AND d.date_validite BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY d.date_validite;

-- =====================================================
-- 5. GESTION DE PRODUCTION
-- =====================================================

-- Planning de production de la semaine
SELECT 
    of.numero as of_numero,
    p.reference as projet,
    of.statut,
    of.priorite,
    of.date_debut,
    of.date_fin_prevue,
    of.progression || '%' as avancement,
    COUNT(op.id) as nb_operations,
    COUNT(op.id) FILTER (WHERE op.statut = 'TERMINEE') as operations_terminees,
    STRING_AGG(DISTINCT u.nom || ' ' || u.prenom, ', ') as techniciens
FROM ordres_fabrication of
INNER JOIN projets p ON p.id = of.projet_id
LEFT JOIN operations op ON op.ordre_fabrication_id = of.id
LEFT JOIN users u ON u.id = op.technicien_id
WHERE of.statut IN ('EN_COURS', 'PLANIFIE')
    AND of.date_debut <= CURRENT_DATE + INTERVAL '7 days'
GROUP BY of.id, p.reference
ORDER BY of.priorite DESC, of.date_debut;

-- Charge de travail par technicien
SELECT 
    u.id,
    u.nom || ' ' || u.prenom as technicien,
    COUNT(DISTINCT op.id) as nb_operations,
    SUM(op.duree_estimee) / 60.0 as heures_prevues,
    SUM(op.duree_reelle) / 60.0 as heures_realisees,
    COUNT(DISTINCT op.id) FILTER (WHERE op.statut = 'EN_COURS') as operations_en_cours,
    COUNT(DISTINCT op.id) FILTER (WHERE op.statut = 'EN_ATTENTE') as operations_en_attente
FROM users u
INNER JOIN operations op ON op.technicien_id = u.id
INNER JOIN ordres_fabrication of ON of.id = op.ordre_fabrication_id
WHERE u.role = 'TECHNICIEN'
    AND of.statut IN ('EN_COURS', 'PLANIFIE')
GROUP BY u.id, u.nom, u.prenom
ORDER BY heures_prevues DESC;

-- Performance de production (temps réel vs estimé)
SELECT 
    of.numero,
    p.reference as projet,
    COUNT(op.id) as nb_operations,
    SUM(op.duree_estimee) as temps_estime_total,
    SUM(op.duree_reelle) as temps_reel_total,
    CASE 
        WHEN SUM(op.duree_estimee) > 0 
        THEN ROUND((SUM(op.duree_reelle)::numeric / SUM(op.duree_estimee)) * 100, 1)
        ELSE 0 
    END as ratio_temps_pourcent,
    CASE 
        WHEN SUM(op.duree_reelle) > SUM(op.duree_estimee) THEN 'Retard'
        WHEN SUM(op.duree_reelle) < SUM(op.duree_estimee) * 0.9 THEN 'Avance'
        ELSE 'Dans les temps'
    END as statut_delai
FROM ordres_fabrication of
INNER JOIN projets p ON p.id = of.projet_id
INNER JOIN operations op ON op.ordre_fabrication_id = of.id
WHERE of.statut = 'TERMINE'
    AND op.duree_reelle IS NOT NULL
GROUP BY of.id, of.numero, p.reference
ORDER BY of.updated_at DESC
LIMIT 20;

-- =====================================================
-- 6. GESTION FINANCIÈRE
-- =====================================================

-- Factures impayées avec ancienneté
SELECT 
    f.numero,
    f.date_emission,
    f.date_echeance,
    CURRENT_DATE - f.date_echeance as jours_retard,
    f.montant_ttc,
    f.montant_paye,
    f.montant_ttc - f.montant_paye as reste_a_payer,
    c.nom as client,
    c.telephone,
    c.email,
    p.reference as projet,
    f.relances as nb_relances,
    f.derniere_relance
FROM factures f
INNER JOIN projets p ON p.id = f.projet_id
INNER JOIN clients c ON c.id = p.client_id
WHERE f.statut IN ('EMISE', 'ENVOYEE', 'EN_RETARD', 'PAYEE_PARTIELLEMENT')
    AND f.montant_ttc > f.montant_paye
ORDER BY f.date_echeance;

-- Balance âgée des créances
SELECT 
    CASE 
        WHEN CURRENT_DATE - f.date_echeance <= 0 THEN 'Non échu'
        WHEN CURRENT_DATE - f.date_echeance BETWEEN 1 AND 30 THEN '0-30 jours'
        WHEN CURRENT_DATE - f.date_echeance BETWEEN 31 AND 60 THEN '31-60 jours'
        WHEN CURRENT_DATE - f.date_echeance BETWEEN 61 AND 90 THEN '61-90 jours'
        ELSE 'Plus de 90 jours'
    END as tranche,
    COUNT(*) as nb_factures,
    SUM(f.montant_ttc - f.montant_paye) as montant_du
FROM factures f
WHERE f.statut IN ('EMISE', 'ENVOYEE', 'EN_RETARD', 'PAYEE_PARTIELLEMENT')
    AND f.montant_ttc > f.montant_paye
GROUP BY 
    CASE 
        WHEN CURRENT_DATE - f.date_echeance <= 0 THEN 'Non échu'
        WHEN CURRENT_DATE - f.date_echeance BETWEEN 1 AND 30 THEN '0-30 jours'
        WHEN CURRENT_DATE - f.date_echeance BETWEEN 31 AND 60 THEN '31-60 jours'
        WHEN CURRENT_DATE - f.date_echeance BETWEEN 61 AND 90 THEN '61-90 jours'
        ELSE 'Plus de 90 jours'
    END
ORDER BY 
    CASE tranche
        WHEN 'Non échu' THEN 1
        WHEN '0-30 jours' THEN 2
        WHEN '31-60 jours' THEN 3
        WHEN '61-90 jours' THEN 4
        ELSE 5
    END;

-- Encours client avec limite de crédit
SELECT 
    c.id,
    c.nom,
    c.type,
    c.credit_limite,
    COALESCE(SUM(f.montant_ttc - f.montant_paye), 0) as encours_actuel,
    c.credit_limite - COALESCE(SUM(f.montant_ttc - f.montant_paye), 0) as credit_disponible,
    CASE 
        WHEN c.credit_limite > 0 
        THEN ROUND((COALESCE(SUM(f.montant_ttc - f.montant_paye), 0) / c.credit_limite) * 100, 1)
        ELSE 0 
    END as taux_utilisation,
    COUNT(f.id) as nb_factures_impayees
FROM clients c
LEFT JOIN projets p ON p.client_id = c.id
LEFT JOIN factures f ON f.projet_id = p.id 
    AND f.statut IN ('EMISE', 'ENVOYEE', 'EN_RETARD', 'PAYEE_PARTIELLEMENT')
WHERE c.credit_limite > 0
GROUP BY c.id, c.nom, c.type, c.credit_limite
HAVING COALESCE(SUM(f.montant_ttc - f.montant_paye), 0) > c.credit_limite * 0.8
ORDER BY taux_utilisation DESC;

-- =====================================================
-- 7. ANALYSES ET RAPPORTS
-- =====================================================

-- Analyse ABC des produits (Pareto)
WITH produit_stats AS (
    SELECT 
        p.id,
        p.reference,
        p.designation,
        p.categorie,
        SUM(ms.quantite) FILTER (WHERE ms.type_mouvement = 'SORTIE') as quantite_sortie,
        SUM(ms.quantite * ms.cout_unitaire) FILTER (WHERE ms.type_mouvement = 'SORTIE') as valeur_sortie
    FROM produits p
    INNER JOIN stocks s ON s.produit_id = p.id
    INNER JOIN mouvements_stock ms ON ms.stock_id = s.id
    WHERE ms.created_at >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY p.id, p.reference, p.designation, p.categorie
),
cumul AS (
    SELECT 
        *,
        SUM(valeur_sortie) OVER (ORDER BY valeur_sortie DESC) as valeur_cumulee,
        SUM(valeur_sortie) OVER () as valeur_totale
    FROM produit_stats
    WHERE valeur_sortie > 0
)
SELECT 
    reference,
    designation,
    categorie,
    quantite_sortie,
    valeur_sortie,
    ROUND((valeur_sortie / valeur_totale) * 100, 2) as pct_valeur,
    ROUND((valeur_cumulee / valeur_totale) * 100, 2) as pct_cumule,
    CASE 
        WHEN valeur_cumulee / valeur_totale <= 0.8 THEN 'A'
        WHEN valeur_cumulee / valeur_totale <= 0.95 THEN 'B'
        ELSE 'C'
    END as classe_abc
FROM cumul
ORDER BY valeur_sortie DESC;

-- Évolution mensuelle des indicateurs clés
WITH mois AS (
    SELECT generate_series(
        date_trunc('month', CURRENT_DATE - INTERVAL '11 months'),
        date_trunc('month', CURRENT_DATE),
        '1 month'::interval
    ) AS mois
)
SELECT 
    TO_CHAR(m.mois, 'YYYY-MM') as periode,
    -- Chiffre d'affaires
    COALESCE(SUM(f.montant_ht), 0) as ca_ht,
    -- Nombre de projets
    COUNT(DISTINCT p.id) FILTER (WHERE p.created_at::date >= m.mois AND p.created_at::date < m.mois + INTERVAL '1 month') as nouveaux_projets,
    -- Nombre de devis
    COUNT(DISTINCT d.id) FILTER (WHERE d.date_emission >= m.mois AND d.date_emission < m.mois + INTERVAL '1 month') as devis_emis,
    -- Taux de transformation
    ROUND(
        COUNT(DISTINCT d.id) FILTER (WHERE d.statut = 'ACCEPTE' AND d.date_emission >= m.mois AND d.date_emission < m.mois + INTERVAL '1 month')::numeric /
        NULLIF(COUNT(DISTINCT d.id) FILTER (WHERE d.date_emission >= m.mois AND d.date_emission < m.mois + INTERVAL '1 month'), 0) * 100,
        1
    ) as taux_transformation,
    -- Valeur stock
    (SELECT SUM(s.quantite_disponible * pr.prix_achat) 
     FROM stocks s 
     INNER JOIN produits pr ON pr.id = s.produit_id 
     WHERE DATE_TRUNC('month', s.updated_at) = m.mois) as valeur_stock
FROM mois m
LEFT JOIN factures f ON date_trunc('month', f.date_emission) = m.mois AND f.statut != 'ANNULEE'
LEFT JOIN projets p ON date_trunc('month', p.created_at) = m.mois
LEFT JOIN devis d ON date_trunc('month', d.date_emission) = m.mois
GROUP BY m.mois
ORDER BY m.mois;

-- =====================================================
-- 8. REQUÊTES DE MAINTENANCE
-- =====================================================

-- Nettoyage des notifications lues de plus de 30 jours
DELETE FROM notifications 
WHERE lu = true 
    AND lu_at < CURRENT_DATE - INTERVAL '30 days';

-- Identification des doublons potentiels de clients
SELECT 
    c1.nom,
    c1.siret,
    c2.nom as nom_doublon,
    c2.siret as siret_doublon,
    similarity(c1.nom, c2.nom) as score_similarite
FROM clients c1
CROSS JOIN clients c2
WHERE c1.id < c2.id
    AND (
        (c1.siret IS NOT NULL AND c1.siret = c2.siret)
        OR similarity(c1.nom, c2.nom) > 0.8
    )
ORDER BY score_similarite DESC;

-- Vérification de l'intégrité des stocks
SELECT 
    p.reference,
    p.designation,
    s.quantite_disponible,
    s.quantite_reservee,
    CASE 
        WHEN s.quantite_reservee > s.quantite_disponible THEN 'Réservation supérieure au stock'
        WHEN s.quantite_disponible < 0 THEN 'Stock négatif'
        WHEN s.quantite_minimale = 0 THEN 'Stock minimum non défini'
        ELSE 'OK'
    END as anomalie
FROM stocks s
INNER JOIN produits p ON p.id = s.produit_id
WHERE s.quantite_reservee > s.quantite_disponible
    OR s.quantite_disponible < 0
    OR s.quantite_minimale = 0
ORDER BY p.reference;

-- Statistiques d'utilisation par utilisateur (30 derniers jours)
SELECT 
    u.nom || ' ' || u.prenom as utilisateur,
    u.role,
    u.last_login,
    COUNT(DISTINCT al.id) as nb_actions,
    COUNT(DISTINCT DATE(al.created_at)) as jours_actifs,
    COUNT(DISTINCT al.entite) as tables_modifiees,
    STRING_AGG(DISTINCT al.action, ', ') as types_actions
FROM users u
LEFT JOIN audit_logs al ON al.utilisateur_id = u.id 
    AND al.created_at >= CURRENT_DATE - INTERVAL '30 days'
WHERE u.is_active = true
GROUP BY u.id, u.nom, u.prenom, u.role, u.last_login
ORDER BY nb_actions DESC;