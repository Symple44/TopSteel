-- =========================================================================
-- ERP TOPSTEEL - INDEX OPTIMISÉS POUR MÉTALLERIE
-- Fichier: sql/indexes/01-performance-indexes.sql
-- =========================================================================

-- =====================================================
-- INDEX PRINCIPAUX POUR RECHERCHES FRÉQUENTES
-- =====================================================

-- Index sur les utilisateurs
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- Index sur les clients
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_siret ON clients(siret);
CREATE INDEX IF NOT EXISTS idx_clients_nom ON clients(nom);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_encours ON clients(encours) WHERE encours > 0;

-- Index sur les fournisseurs (compatible existant)
CREATE INDEX IF NOT EXISTS idx_fournisseurs_actif ON fournisseurs(actif);
CREATE INDEX IF NOT EXISTS idx_fournisseurs_email ON fournisseurs(email);
CREATE INDEX IF NOT EXISTS idx_fournisseurs_nom ON fournisseurs(nom);

-- =====================================================
-- INDEX MÉTIER SPÉCIFIQUES À LA MÉTALLERIE
-- =====================================================

-- Index sur les projets (cœur de l'activité métallerie)
CREATE INDEX IF NOT EXISTS idx_projets_numero ON projets(numero);
CREATE INDEX IF NOT EXISTS idx_projets_statut ON projets(statut);
CREATE INDEX IF NOT EXISTS idx_projets_type ON projets(type);
CREATE INDEX IF NOT EXISTS idx_projets_priorite ON projets(priorite);
CREATE INDEX IF NOT EXISTS idx_projets_client_id ON projets(client_id);
CREATE INDEX IF NOT EXISTS idx_projets_responsable_id ON projets(responsable_id);
CREATE INDEX IF NOT EXISTS idx_projets_dates ON projets(date_debut, date_fin_prevue);
CREATE INDEX IF NOT EXISTS idx_projets_budget ON projets(budget_estime) WHERE budget_estime > 0;
CREATE INDEX IF NOT EXISTS idx_projets_avancement ON projets(avancement_pct);
CREATE INDEX IF NOT EXISTS idx_projets_actifs ON projets(statut) WHERE statut IN ('EN_COURS', 'ACCEPTE');

-- Index sur les devis (activité commerciale)
CREATE INDEX IF NOT EXISTS idx_devis_numero ON devis(numero);
CREATE INDEX IF NOT EXISTS idx_devis_statut ON devis(statut);
CREATE INDEX IF NOT EXISTS idx_devis_projet_id ON devis(projet_id);
CREATE INDEX IF NOT EXISTS idx_devis_client_id ON devis(client_id);
CREATE INDEX IF NOT EXISTS idx_devis_dates ON devis(date_emission, date_validite);
CREATE INDEX IF NOT EXISTS idx_devis_montant ON devis(montant_ttc) WHERE montant_ttc > 0;
CREATE INDEX IF NOT EXISTS idx_devis_en_attente ON devis(statut, date_validite) WHERE statut = 'ENVOYE';

-- Index sur les produits/matériaux métallurgie
CREATE INDEX IF NOT EXISTS idx_produits_code ON produits(code);
CREATE INDEX IF NOT EXISTS idx_produits_categorie ON produits(categorie);
CREATE INDEX IF NOT EXISTS idx_produits_unite ON produits(unite);
CREATE INDEX IF NOT EXISTS idx_produits_actif ON produits(actif);
CREATE INDEX IF NOT EXISTS idx_produits_fournisseur ON produits(fournisseur_principal_id);
CREATE INDEX IF NOT EXISTS idx_produits_prix ON produits(prix_vente) WHERE prix_vente > 0;
CREATE INDEX IF NOT EXISTS idx_produits_stock_critique ON produits(stock_actuel, stock_minimum) WHERE stock_actuel <= stock_minimum;

-- Index sur les mouvements de stock
CREATE INDEX IF NOT EXISTS idx_mouvements_stock_produit_id ON mouvements_stock(produit_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_stock_type ON mouvements_stock(type);
CREATE INDEX IF NOT EXISTS idx_mouvements_stock_date ON mouvements_stock(created_at);
CREATE INDEX IF NOT EXISTS idx_mouvements_stock_projet_id ON mouvements_stock(projet_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_stock_utilisateur ON mouvements_stock(effectue_par);

-- Index sur les commandes fournisseurs
CREATE INDEX IF NOT EXISTS idx_commandes_numero ON commandes(numero);
CREATE INDEX IF NOT EXISTS idx_commandes_statut ON commandes(statut);
CREATE INDEX IF NOT EXISTS idx_commandes_fournisseur_id ON commandes(fournisseur_id);
CREATE INDEX IF NOT EXISTS idx_commandes_dates ON commandes(date_commande, date_livraison_prevue);
CREATE INDEX IF NOT EXISTS idx_commandes_commandeur ON commandes(commandeur_id);
CREATE INDEX IF NOT EXISTS idx_commandes_en_cours ON commandes(statut) WHERE statut IN ('CONFIRMEE', 'EN_COURS');

-- Index sur les documents
CREATE INDEX IF NOT EXISTS idx_documents_projet_id ON documents(projet_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_public ON documents(is_public);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_nom ON documents(nom);

-- Index sur les notifications
CREATE INDEX IF NOT EXISTS idx_notifications_utilisateur_id ON notifications(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_notifications_lu ON notifications(lu);
CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_non_lues ON notifications(utilisateur_id, lu) WHERE lu = false;

-- =====================================================
-- INDEX DE RECHERCHE TEXTUELLE (FRANÇAIS)
-- =====================================================

-- Recherche full-text en français pour clients
CREATE INDEX IF NOT EXISTS idx_clients_search ON clients USING gin(
    to_tsvector('french', nom || ' ' || COALESCE(email, '') || ' ' || COALESCE(siret, ''))
);

-- Recherche full-text pour projets métallerie
CREATE INDEX IF NOT EXISTS idx_projets_search ON projets USING gin(
    to_tsvector('french', numero || ' ' || nom || ' ' || COALESCE(description, '') || ' ' || COALESCE(notes, ''))
);

-- Recherche full-text pour produits métallurgie
CREATE INDEX IF NOT EXISTS idx_produits_search ON produits USING gin(
    to_tsvector('french', code || ' ' || nom || ' ' || COALESCE(description, ''))
);

-- Recherche trigram pour noms approximatifs
CREATE INDEX IF NOT EXISTS idx_clients_nom_trgm ON clients USING gin(nom gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_projets_nom_trgm ON projets USING gin(nom gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_produits_nom_trgm ON produits USING gin(nom gin_trgm_ops);

-- =====================================================
-- INDEX POUR DONNÉES JSONB (ADRESSES, MÉTADONNÉES)
-- =====================================================

-- Index pour adresses clients
CREATE INDEX IF NOT EXISTS idx_clients_adresse_ville ON clients USING gin((adresse->'ville'));
CREATE INDEX IF NOT EXISTS idx_clients_adresse_cp ON clients USING gin((adresse->'cp'));

-- Index pour adresses chantier
CREATE INDEX IF NOT EXISTS idx_projets_chantier_ville ON projets USING gin((adresse_chantier->'ville'));
CREATE INDEX IF NOT EXISTS idx_projets_coordonnees ON projets USING gist(coordonnees_gps);

-- =====================================================
-- INDEX COMPOSITES POUR REQUÊTES COMPLEXES
-- =====================================================

-- Projets par client et statut (tableau de bord commercial)
CREATE INDEX IF NOT EXISTS idx_projets_client_statut ON projets(client_id, statut);

-- Projets par responsable et dates (planning)
CREATE INDEX IF NOT EXISTS idx_projets_responsable_dates ON projets(responsable_id, date_debut, date_fin_prevue);

-- Stock par produit et quantités (gestion stock)
CREATE INDEX IF NOT EXISTS idx_produits_stock_gestion ON produits(categorie, stock_actuel, stock_minimum);

-- Devis par période et statut (reporting commercial)
CREATE INDEX IF NOT EXISTS idx_devis_periode_statut ON devis(date_emission, statut);

-- Mouvements stock par projet et date (traçabilité chantier)
CREATE INDEX IF NOT EXISTS idx_mouvements_projet_date ON mouvements_stock(projet_id, created_at);

-- =====================================================
-- INDEX POUR ANALYTICS ET REPORTING
-- =====================================================

-- Index pour rapports financiers
CREATE INDEX IF NOT EXISTS idx_devis_montant_periode ON devis(date_emission, montant_ttc) WHERE statut = 'ACCEPTE';
CREATE INDEX IF NOT EXISTS idx_projets_cout_periode ON projets(created_at, cout_reel) WHERE statut IN ('TERMINE', 'FACTURE');

-- Index pour suivi performance
CREATE INDEX IF NOT EXISTS idx_projets_delais ON projets(date_fin_prevue, date_fin_reelle) WHERE date_fin_reelle IS NOT NULL;

-- =====================================================
-- INDEX PARTIELS POUR OPTIMISATION MÉMOIRE
-- =====================================================

-- Seulement les utilisateurs actifs
CREATE INDEX IF NOT EXISTS idx_users_actifs_role ON users(role) WHERE is_active = true;

-- Seulement les projets non terminés
CREATE INDEX IF NOT EXISTS idx_projets_en_cours_type ON projets(type, priorite) 
    WHERE statut NOT IN ('TERMINE', 'FACTURE', 'CLOTURE', 'ANNULE');

-- Seulement les produits en stock faible
CREATE INDEX IF NOT EXISTS idx_produits_stock_faible ON produits(categorie, stock_actuel) 
    WHERE stock_actuel <= stock_minimum AND actif = true;

-- =====================================================
-- COMMENTAIRES POUR DOCUMENTATION
-- =====================================================

COMMENT ON INDEX idx_projets_search IS 'Index de recherche full-text pour projets métallerie';
COMMENT ON INDEX idx_clients_search IS 'Index de recherche full-text pour clients';
COMMENT ON INDEX idx_produits_stock_critique IS 'Index pour alertes stock critique';
COMMENT ON INDEX idx_projets_actifs IS 'Index optimisé pour projets en cours d''activité';
COMMENT ON INDEX idx_devis_en_attente IS 'Index pour suivi des devis en attente de réponse';