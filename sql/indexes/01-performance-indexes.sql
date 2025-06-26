-- =========================================================================
-- ERP TOPSTEEL - INDEX OPTIMISÉS
-- Fichier: sql/indexes/01-performance-indexes.sql
-- =========================================================================

-- Index sur les tables principales
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_siret ON clients(siret);
CREATE INDEX IF NOT EXISTS idx_clients_nom ON clients(nom);

CREATE INDEX IF NOT EXISTS idx_fournisseurs_actif ON fournisseurs(actif);
CREATE INDEX IF NOT EXISTS idx_fournisseurs_email ON fournisseurs(email);

CREATE INDEX IF NOT EXISTS idx_projets_numero ON projets(numero);
CREATE INDEX IF NOT EXISTS idx_projets_statut ON projets(statut);
CREATE INDEX IF NOT EXISTS idx_projets_type ON projets(type);
CREATE INDEX IF NOT EXISTS idx_projets_client ON projets(client_id);
CREATE INDEX IF NOT EXISTS idx_projets_responsable ON projets(responsable_id);
CREATE INDEX IF NOT EXISTS idx_projets_dates ON projets(date_debut, date_fin_prevue);

CREATE INDEX IF NOT EXISTS idx_documents_projet ON documents(projet_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_public ON documents(is_public);

-- Index de recherche textuelle
CREATE INDEX IF NOT EXISTS idx_clients_nom_trgm ON clients USING gin(nom gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_projets_nom_trgm ON projets USING gin(nom gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_nom_trgm ON documents USING gin(nom gin_trgm_ops);
