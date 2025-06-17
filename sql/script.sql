-- =====================================================
-- Script de création de la base de données ERP TOPSTEEL
-- PostgreSQL 15+
-- =====================================================

-- Créer la base de données
CREATE DATABASE erp_topsteel
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'fr_FR.UTF-8'
    LC_CTYPE = 'fr_FR.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Se connecter à la base
\c erp_topsteel;

-- =====================================================
-- Extensions
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Pour la recherche fuzzy

-- =====================================================
-- Types ENUM
-- =====================================================

-- Rôles utilisateurs
CREATE TYPE user_role AS ENUM (
    'ADMIN',
    'MANAGER',
    'COMMERCIAL',
    'TECHNICIEN',
    'COMPTABLE',
    'VIEWER'
);

-- Types de clients
CREATE TYPE client_type AS ENUM (
    'PARTICULIER',
    'PROFESSIONNEL',
    'COLLECTIVITE',
    'ASSOCIATION'
);

-- Statuts des projets
CREATE TYPE projet_statut AS ENUM (
    'BROUILLON',
    'DEVIS',
    'ACCEPTE',
    'EN_COURS',
    'TERMINE',
    'FACTURE',
    'CLOTURE',
    'ANNULE'
);

-- Types de projets
CREATE TYPE projet_type AS ENUM (
    'PORTAIL',
    'CLOTURE',
    'ESCALIER',
    'GARDE_CORPS',
    'RAMPE',
    'VERRIERE',
    'STRUCTURE',
    'BARDAGE',
    'COUVERTURE',
    'CHARPENTE',
    'AUTRE'
);

-- Priorités
CREATE TYPE priorite AS ENUM (
    'BASSE',
    'NORMALE',
    'HAUTE',
    'URGENTE'
);

-- Statuts des devis
CREATE TYPE devis_statut AS ENUM (
    'BROUILLON',
    'ENVOYE',
    'RELANCE',
    'ACCEPTE',
    'REFUSE',
    'EXPIRE'
);

-- Catégories de produits
CREATE TYPE categorie_produit AS ENUM (
    'PROFILE',
    'TOLE',
    'TUBE',
    'ACCESSOIRE',
    'QUINCAILLERIE',
    'CONSOMMABLE',
    'OUTILLAGE',
    'AUTRE'
);

-- Unités de mesure
CREATE TYPE unite_mesure AS ENUM (
    'PIECE',
    'ML',      -- Mètre linéaire
    'M2',      -- Mètre carré
    'M3',      -- Mètre cube
    'KG',      -- Kilogramme
    'TONNE',
    'LITRE',
    'HEURE'
);

-- Types de mouvements de stock
CREATE TYPE type_mouvement AS ENUM (
    'ENTREE',
    'SORTIE',
    'RESERVATION',
    'LIBERATION',
    'AJUSTEMENT',
    'INVENTAIRE',
    'RETOUR'
);

-- Statuts des commandes
CREATE TYPE commande_statut AS ENUM (
    'BROUILLON',
    'CONFIRMEE',
    'EN_COURS',
    'LIVREE_PARTIELLEMENT',
    'LIVREE',
    'FACTUREE',
    'ANNULEE'
);

-- Statuts de production
CREATE TYPE production_statut AS ENUM (
    'PLANIFIE',
    'EN_ATTENTE',
    'EN_COURS',
    'PAUSE',
    'TERMINE',
    'CONTROLE',
    'VALIDE',
    'ANNULE'
);

-- Statuts des opérations
CREATE TYPE operation_statut AS ENUM (
    'EN_ATTENTE',
    'EN_COURS',
    'TERMINEE',
    'BLOQUEE',
    'ANNULEE'
);

-- Statuts des factures
CREATE TYPE facture_statut AS ENUM (
    'BROUILLON',
    'EMISE',
    'ENVOYEE',
    'PAYEE_PARTIELLEMENT',
    'PAYEE',
    'EN_RETARD',
    'ANNULEE'
);

-- Modes de paiement
CREATE TYPE mode_paiement AS ENUM (
    'ESPECES',
    'CHEQUE',
    'VIREMENT',
    'CB',
    'PRELEVEMENT',
    'TRAITE',
    'AUTRE'
);

-- Types de documents
CREATE TYPE type_document AS ENUM (
    'PLAN',
    'DEVIS',
    'FACTURE',
    'BON_COMMANDE',
    'BON_LIVRAISON',
    'PHOTO',
    'RAPPORT',
    'CERTIFICAT',
    'AUTRE'
);

-- Types de notifications
CREATE TYPE type_notification AS ENUM (
    'INFO',
    'SUCCESS',
    'WARNING',
    'ERROR',
    'PROJET_UPDATE',
    'STOCK_ALERT',
    'TASK_ASSIGNED',
    'PAIEMENT_RECU',
    'COMMANDE_LIVREE'
);

-- Types de valeurs pour les paramètres
CREATE TYPE type_valeur AS ENUM (
    'STRING',
    'NUMBER',
    'BOOLEAN',
    'JSON',
    'DATE'
);

-- =====================================================
-- Tables
-- =====================================================

-- Table: users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'VIEWER',
    telephone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    refresh_token TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: clients
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type client_type NOT NULL,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telephone VARCHAR(20),
    siret VARCHAR(14) UNIQUE,
    tva_intra VARCHAR(20),
    adresse JSONB NOT NULL DEFAULT '{}',
    contact_principal JSONB,
    notes TEXT,
    credit_limite DECIMAL(10,2),
    encours DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: projets
CREATE TABLE projets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    statut projet_statut NOT NULL DEFAULT 'BROUILLON',
    type projet_type NOT NULL,
    priorite priorite NOT NULL DEFAULT 'NORMALE',
    client_id UUID NOT NULL REFERENCES clients(id),
    responsable_id UUID REFERENCES users(id),
    date_debut DATE,
    date_fin DATE,
    date_fin_prevue DATE,
    montant_ht DECIMAL(10,2) DEFAULT 0,
    montant_ttc DECIMAL(10,2) DEFAULT 0,
    taux_tva DECIMAL(5,2) DEFAULT 20,
    marge DECIMAL(5,2) DEFAULT 0,
    avancement DECIMAL(5,2) DEFAULT 0 CHECK (avancement >= 0 AND avancement <= 100),
    adresse_chantier JSONB,
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: devis
CREATE TABLE devis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero VARCHAR(50) UNIQUE NOT NULL,
    projet_id UUID NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    version INTEGER DEFAULT 1,
    date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
    date_validite DATE NOT NULL,
    statut devis_statut NOT NULL DEFAULT 'BROUILLON',
    montant_ht DECIMAL(10,2) NOT NULL DEFAULT 0,
    montant_tva DECIMAL(10,2) NOT NULL DEFAULT 0,
    montant_ttc DECIMAL(10,2) NOT NULL DEFAULT 0,
    remise_globale DECIMAL(5,2) DEFAULT 0,
    conditions TEXT,
    notes_internes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: lignes_devis
CREATE TABLE lignes_devis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    devis_id UUID NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantite DECIMAL(10,3) NOT NULL,
    unite VARCHAR(20) NOT NULL,
    prix_unitaire DECIMAL(10,2) NOT NULL,
    remise DECIMAL(5,2) DEFAULT 0,
    montant_ht DECIMAL(10,2) NOT NULL,
    taux_tva DECIMAL(5,2) NOT NULL DEFAULT 20,
    montant_ttc DECIMAL(10,2) NOT NULL,
    ordre INTEGER NOT NULL,
    is_optionnel BOOLEAN DEFAULT false,
    UNIQUE(devis_id, ordre)
);

-- Table: fournisseurs
CREATE TABLE fournisseurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    siret VARCHAR(14) UNIQUE,
    tva_intra VARCHAR(20),
    email VARCHAR(255),
    telephone VARCHAR(20),
    adresse JSONB NOT NULL DEFAULT '{}',
    site_web VARCHAR(255),
    contacts JSONB DEFAULT '[]',
    delai_paiement INTEGER DEFAULT 30,
    conditions_paiement TEXT,
    delai_livraison INTEGER DEFAULT 7,
    franco DECIMAL(10,2) DEFAULT 0,
    categories TEXT[],
    rib JSONB,
    actif BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: produits
CREATE TABLE produits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference VARCHAR(100) UNIQUE NOT NULL,
    designation VARCHAR(255) NOT NULL,
    description TEXT,
    categorie categorie_produit NOT NULL,
    unite unite_mesure NOT NULL DEFAULT 'PIECE',
    prix_achat DECIMAL(10,2),
    prix_vente DECIMAL(10,2),
    coefficient DECIMAL(5,2) DEFAULT 1.5,
    fournisseur_principal_id UUID REFERENCES fournisseurs(id),
    specifications JSONB,
    poids_unitaire DECIMAL(10,3),
    dimensions JSONB,
    code_douanier VARCHAR(20),
    origine_pays VARCHAR(2),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: stocks
CREATE TABLE stocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produit_id UUID UNIQUE NOT NULL REFERENCES produits(id),
    quantite_disponible DECIMAL(10,3) DEFAULT 0,
    quantite_reservee DECIMAL(10,3) DEFAULT 0,
    quantite_commandee DECIMAL(10,3) DEFAULT 0,
    quantite_minimale DECIMAL(10,3) DEFAULT 0,
    quantite_maximale DECIMAL(10,3),
    emplacement VARCHAR(100),
    derniere_entree TIMESTAMP WITH TIME ZONE,
    derniere_sortie TIMESTAMP WITH TIME ZONE,
    dernier_inventaire TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: mouvements_stock
CREATE TABLE mouvements_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID NOT NULL REFERENCES stocks(id),
    type_mouvement type_mouvement NOT NULL,
    quantite DECIMAL(10,3) NOT NULL,
    quantite_avant DECIMAL(10,3) NOT NULL,
    quantite_apres DECIMAL(10,3) NOT NULL,
    reference_document VARCHAR(100),
    motif TEXT NOT NULL,
    cout_unitaire DECIMAL(10,2),
    utilisateur_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: commandes
CREATE TABLE commandes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero VARCHAR(50) UNIQUE NOT NULL,
    projet_id UUID REFERENCES projets(id),
    fournisseur_id UUID NOT NULL REFERENCES fournisseurs(id),
    date_commande DATE NOT NULL DEFAULT CURRENT_DATE,
    date_livraison_prevue DATE,
    date_livraison_reelle DATE,
    statut commande_statut NOT NULL DEFAULT 'BROUILLON',
    montant_ht DECIMAL(10,2) NOT NULL DEFAULT 0,
    montant_tva DECIMAL(10,2) NOT NULL DEFAULT 0,
    montant_ttc DECIMAL(10,2) NOT NULL DEFAULT 0,
    frais_port DECIMAL(10,2) DEFAULT 0,
    reference_fournisseur VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: lignes_commande
CREATE TABLE lignes_commande (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commande_id UUID NOT NULL REFERENCES commandes(id) ON DELETE CASCADE,
    produit_id UUID NOT NULL REFERENCES produits(id),
    quantite DECIMAL(10,3) NOT NULL,
    prix_unitaire DECIMAL(10,2) NOT NULL,
    remise DECIMAL(5,2) DEFAULT 0,
    montant_ht DECIMAL(10,2) NOT NULL,
    quantite_recue DECIMAL(10,3) DEFAULT 0,
    date_reception DATE,
    ordre INTEGER NOT NULL,
    UNIQUE(commande_id, ordre)
);

-- Table: ordres_fabrication
CREATE TABLE ordres_fabrication (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero VARCHAR(50) UNIQUE NOT NULL,
    projet_id UUID NOT NULL REFERENCES projets(id),
    statut production_statut NOT NULL DEFAULT 'PLANIFIE',
    date_debut DATE NOT NULL,
    date_fin DATE,
    date_fin_prevue DATE NOT NULL,
    priorite priorite NOT NULL DEFAULT 'NORMALE',
    progression DECIMAL(5,2) DEFAULT 0 CHECK (progression >= 0 AND progression <= 100),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: operations
CREATE TABLE operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ordre_fabrication_id UUID NOT NULL REFERENCES ordres_fabrication(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    poste_travail VARCHAR(100),
    duree_estimee INTEGER NOT NULL, -- en minutes
    duree_reelle INTEGER,
    statut operation_statut NOT NULL DEFAULT 'EN_ATTENTE',
    technicien_id UUID REFERENCES users(id),
    date_debut TIMESTAMP WITH TIME ZONE,
    date_fin TIMESTAMP WITH TIME ZONE,
    ordre INTEGER NOT NULL,
    notes TEXT,
    UNIQUE(ordre_fabrication_id, ordre)
);

-- Table: factures
CREATE TABLE factures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero VARCHAR(50) UNIQUE NOT NULL,
    projet_id UUID NOT NULL REFERENCES projets(id),
    devis_id UUID REFERENCES devis(id),
    date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
    date_echeance DATE NOT NULL,
    statut facture_statut NOT NULL DEFAULT 'BROUILLON',
    montant_ht DECIMAL(10,2) NOT NULL,
    montant_tva DECIMAL(10,2) NOT NULL,
    montant_ttc DECIMAL(10,2) NOT NULL,
    montant_paye DECIMAL(10,2) DEFAULT 0,
    acompte DECIMAL(10,2) DEFAULT 0,
    conditions_paiement TEXT,
    notes TEXT,
    relances INTEGER DEFAULT 0,
    derniere_relance DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: paiements
CREATE TABLE paiements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facture_id UUID NOT NULL REFERENCES factures(id),
    date_paiement DATE NOT NULL,
    montant DECIMAL(10,2) NOT NULL,
    mode_paiement mode_paiement NOT NULL,
    reference VARCHAR(100),
    banque VARCHAR(100),
    notes TEXT,
    reconcilie BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    type type_document NOT NULL,
    chemin_fichier VARCHAR(500) NOT NULL,
    taille INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    hash_fichier VARCHAR(64), -- SHA256
    projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    metadata JSONB,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: planning_taches
CREATE TABLE planning_taches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
    ordre_fabrication_id UUID REFERENCES ordres_fabrication(id) ON DELETE CASCADE,
    assigne_a UUID REFERENCES users(id),
    date_debut TIMESTAMP WITH TIME ZONE NOT NULL,
    date_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    tout_le_jour BOOLEAN DEFAULT false,
    statut operation_statut NOT NULL DEFAULT 'EN_ATTENTE',
    priorite priorite NOT NULL DEFAULT 'NORMALE',
    rappel_minutes INTEGER,
    recurrence JSONB,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type type_notification NOT NULL,
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    lu BOOLEAN DEFAULT false,
    lu_at TIMESTAMP WITH TIME ZONE,
    action_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: parametres
CREATE TABLE parametres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cle VARCHAR(100) UNIQUE NOT NULL,
    valeur TEXT NOT NULL,
    type_valeur type_valeur NOT NULL,
    description TEXT,
    categorie VARCHAR(50),
    is_public BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: audit_logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id UUID REFERENCES users(id),
    entite VARCHAR(50) NOT NULL,
    entite_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    anciennes_valeurs JSONB,
    nouvelles_valeurs JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Index
-- =====================================================

-- Index sur les clés étrangères
CREATE INDEX idx_projets_client_id ON projets(client_id);
CREATE INDEX idx_projets_responsable_id ON projets(responsable_id);
CREATE INDEX idx_projets_statut ON projets(statut);
CREATE INDEX idx_projets_type ON projets(type);
CREATE INDEX idx_projets_dates ON projets(date_debut, date_fin);

CREATE INDEX idx_devis_projet_id ON devis(projet_id);
CREATE INDEX idx_devis_statut ON devis(statut);
CREATE INDEX idx_devis_date_emission ON devis(date_emission);

CREATE INDEX idx_lignes_devis_devis_id ON lignes_devis(devis_id);

CREATE INDEX idx_produits_fournisseur_id ON produits(fournisseur_principal_id);
CREATE INDEX idx_produits_categorie ON produits(categorie);
CREATE INDEX idx_produits_reference ON produits(reference);

CREATE INDEX idx_stocks_produit_id ON stocks(produit_id);
CREATE INDEX idx_stocks_quantite ON stocks(quantite_disponible);

CREATE INDEX idx_mouvements_stock_id ON mouvements_stock(stock_id);
CREATE INDEX idx_mouvements_stock_date ON mouvements_stock(created_at);
CREATE INDEX idx_mouvements_stock_type ON mouvements_stock(type_mouvement);

CREATE INDEX idx_commandes_projet_id ON commandes(projet_id);
CREATE INDEX idx_commandes_fournisseur_id ON commandes(fournisseur_id);
CREATE INDEX idx_commandes_statut ON commandes(statut);
CREATE INDEX idx_commandes_dates ON commandes(date_commande, date_livraison_prevue);

CREATE INDEX idx_lignes_commande_commande_id ON lignes_commande(commande_id);
CREATE INDEX idx_lignes_commande_produit_id ON lignes_commande(produit_id);

CREATE INDEX idx_ordres_fabrication_projet_id ON ordres_fabrication(projet_id);
CREATE INDEX idx_ordres_fabrication_statut ON ordres_fabrication(statut);
CREATE INDEX idx_ordres_fabrication_dates ON ordres_fabrication(date_debut, date_fin);

CREATE INDEX idx_operations_ordre_id ON operations(ordre_fabrication_id);
CREATE INDEX idx_operations_technicien_id ON operations(technicien_id);
CREATE INDEX idx_operations_statut ON operations(statut);

CREATE INDEX idx_factures_projet_id ON factures(projet_id);
CREATE INDEX idx_factures_devis_id ON factures(devis_id);
CREATE INDEX idx_factures_statut ON factures(statut);
CREATE INDEX idx_factures_dates ON factures(date_emission, date_echeance);

CREATE INDEX idx_paiements_facture_id ON paiements(facture_id);
CREATE INDEX idx_paiements_date ON paiements(date_paiement);

CREATE INDEX idx_documents_projet_id ON documents(projet_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);

CREATE INDEX idx_planning_taches_projet_id ON planning_taches(projet_id);
CREATE INDEX idx_planning_taches_assigne_a ON planning_taches(assigne_a);
CREATE INDEX idx_planning_taches_dates ON planning_taches(date_debut, date_fin);

CREATE INDEX idx_notifications_utilisateur_id ON notifications(utilisateur_id);
CREATE INDEX idx_notifications_lu ON notifications(lu);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_audit_logs_entite ON audit_logs(entite, entite_id);
CREATE INDEX idx_audit_logs_utilisateur_id ON audit_logs(utilisateur_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Index pour la recherche textuelle
CREATE INDEX idx_clients_search ON clients USING gin(
    to_tsvector('french', nom || ' ' || COALESCE(email, '') || ' ' || COALESCE(siret, ''))
);

CREATE INDEX idx_projets_search ON projets USING gin(
    to_tsvector('french', reference || ' ' || description || ' ' || COALESCE(notes, ''))
);

CREATE INDEX idx_produits_search ON produits USING gin(
    to_tsvector('french', reference || ' ' || designation || ' ' || COALESCE(description, ''))
);

-- Index GIN pour les champs JSONB
CREATE INDEX idx_clients_adresse ON clients USING gin(adresse);
CREATE INDEX idx_projets_adresse_chantier ON projets USING gin(adresse_chantier);
CREATE INDEX idx_produits_specifications ON produits USING gin(specifications);
CREATE INDEX idx_documents_metadata ON documents USING gin(metadata);

-- Index sur les arrays
CREATE INDEX idx_projets_tags ON projets USING gin(tags);
CREATE INDEX idx_fournisseurs_categories ON fournisseurs USING gin(categories);
CREATE INDEX idx_documents_tags ON documents USING gin(tags);

-- =====================================================
-- Fonctions et Triggers
-- =====================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projets_updated_at BEFORE UPDATE ON projets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devis_updated_at BEFORE UPDATE ON devis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fournisseurs_updated_at BEFORE UPDATE ON fournisseurs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produits_updated_at BEFORE UPDATE ON produits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stocks_updated_at BEFORE UPDATE ON stocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commandes_updated_at BEFORE UPDATE ON commandes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ordres_fabrication_updated_at BEFORE UPDATE ON ordres_fabrication
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_factures_updated_at BEFORE UPDATE ON factures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planning_taches_updated_at BEFORE UPDATE ON planning_taches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parametres_updated_at BEFORE UPDATE ON parametres
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour l'audit automatique
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs(utilisateur_id, entite, entite_id, action, nouvelles_valeurs)
        VALUES (current_setting('app.current_user_id', true)::uuid, TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs(utilisateur_id, entite, entite_id, action, anciennes_valeurs, nouvelles_valeurs)
        VALUES (current_setting('app.current_user_id', true)::uuid, TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs(utilisateur_id, entite, entite_id, action, anciennes_valeurs)
        VALUES (current_setting('app.current_user_id', true)::uuid, TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD));
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Activer l'audit sur les tables critiques
CREATE TRIGGER audit_projets AFTER INSERT OR UPDATE OR DELETE ON projets
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_devis AFTER INSERT OR UPDATE OR DELETE ON devis
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_factures AFTER INSERT OR UPDATE OR DELETE ON factures
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_paiements AFTER INSERT OR UPDATE OR DELETE ON paiements
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Fonction pour calculer l'encours client
CREATE OR REPLACE FUNCTION calcul_encours_client(p_client_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_encours DECIMAL;
BEGIN
    SELECT COALESCE(SUM(f.montant_ttc - f.montant_paye), 0)
    INTO v_encours
    FROM factures f
    INNER JOIN projets p ON p.id = f.projet_id
    WHERE p.client_id = p_client_id
    AND f.statut NOT IN ('ANNULEE', 'PAYEE');
    
    RETURN v_encours;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer les références
CREATE OR REPLACE FUNCTION generate_reference(p_prefix VARCHAR, p_table VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_year INTEGER;
    v_count INTEGER;
    v_reference VARCHAR;
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    EXECUTE format('SELECT COUNT(*) + 1 FROM %I WHERE reference LIKE $1', p_table)
    INTO v_count
    USING p_prefix || '-' || v_year || '-%';
    
    v_reference := p_prefix || '-' || v_year || '-' || LPAD(v_count::VARCHAR, 4, '0');
    
    RETURN v_reference;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Vues
-- =====================================================

-- Vue pour le tableau de bord
CREATE VIEW v_dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM projets WHERE statut = 'EN_COURS') as projets_en_cours,
    (SELECT COUNT(*) FROM devis WHERE statut = 'ENVOYE' AND date_validite >= CURRENT_DATE) as devis_en_attente,
    (SELECT COUNT(*) FROM factures WHERE statut IN ('EMISE', 'ENVOYEE', 'EN_RETARD')) as factures_impayees,
    (SELECT SUM(montant_ttc - montant_paye) FROM factures WHERE statut IN ('EMISE', 'ENVOYEE', 'EN_RETARD')) as montant_impayes,
    (SELECT COUNT(*) FROM stocks WHERE quantite_disponible <= quantite_minimale) as alertes_stock,
    (SELECT COUNT(*) FROM ordres_fabrication WHERE statut = 'EN_COURS') as of_en_cours;

-- Vue pour les stocks critiques
CREATE VIEW v_stocks_critiques AS
SELECT 
    s.*,
    p.reference,
    p.designation,
    p.categorie,
    (s.quantite_disponible - s.quantite_reservee) as quantite_libre,
    CASE 
        WHEN s.quantite_disponible <= 0 THEN 'RUPTURE'
        WHEN s.quantite_disponible <= s.quantite_minimale THEN 'CRITIQUE'
        WHEN s.quantite_disponible <= s.quantite_minimale * 1.5 THEN 'FAIBLE'
        ELSE 'OK'
    END as niveau_alerte
FROM stocks s
INNER JOIN produits p ON p.id = s.produit_id
WHERE s.quantite_disponible <= s.quantite_minimale * 1.5
ORDER BY s.quantite_disponible / NULLIF(s.quantite_minimale, 0);

-- =====================================================
-- Données initiales
-- =====================================================

-- Paramètres système
INSERT INTO parametres (cle, valeur, type_valeur, description, categorie) VALUES
('COMPANY_NAME', 'TOPSTEEL', 'STRING', 'Nom de l''entreprise', 'GENERAL'),
('COMPANY_SIRET', '12345678901234', 'STRING', 'SIRET de l''entreprise', 'GENERAL'),
('COMPANY_TVA', 'FR12345678901', 'STRING', 'Numéro de TVA intracommunautaire', 'GENERAL'),
('COMPANY_ADDRESS', '{"rue": "123 Rue de l''Industrie", "code_postal": "44800", "ville": "Saint-Herblain", "pays": "France"}', 'JSON', 'Adresse de l''entreprise', 'GENERAL'),
('DEFAULT_TVA_RATE', '20', 'NUMBER', 'Taux de TVA par défaut (%)', 'COMPTABILITE'),
('INVOICE_PREFIX', 'FAC', 'STRING', 'Préfixe des numéros de facture', 'COMPTABILITE'),
('QUOTE_PREFIX', 'DEV', 'STRING', 'Préfixe des numéros de devis', 'COMPTABILITE'),
('PROJECT_PREFIX', 'PRJ', 'STRING', 'Préfixe des références projet', 'PROJETS'),
('ORDER_PREFIX', 'CMD', 'STRING', 'Préfixe des numéros de commande', 'ACHATS'),
('PRODUCTION_PREFIX', 'OF', 'STRING', 'Préfixe des ordres de fabrication', 'PRODUCTION'),
('QUOTE_VALIDITY_DAYS', '30', 'NUMBER', 'Durée de validité des devis (jours)', 'COMMERCIAL'),
('PAYMENT_DELAY_DAYS', '30', 'NUMBER', 'Délai de paiement par défaut (jours)', 'COMPTABILITE'),
('STOCK_ALERT_THRESHOLD', '1.2', 'NUMBER', 'Coefficient d''alerte stock (x stock minimum)', 'STOCK'),
('EMAIL_FROM', 'erp@topsteel.fr', 'STRING', 'Email d''envoi des notifications', 'NOTIFICATIONS'),
('SMTP_HOST', 'smtp.gmail.com', 'STRING', 'Serveur SMTP', 'NOTIFICATIONS'),
('SMTP_PORT', '587', 'NUMBER', 'Port SMTP', 'NOTIFICATIONS');

-- Utilisateur admin par défaut (mot de passe: Admin123!)
INSERT INTO users (email, password, nom, prenom, role) VALUES
('admin@topsteel.fr', '$2b$10$5kPNr2kfLGR8zKn3aB6Ziu5HBkGZfC3xGKGGWZXZQKYjpZ8sXZ2Aq', 'Admin', 'System', 'ADMIN');

-- =====================================================
-- Permissions et sécurité
-- =====================================================

-- Créer des rôles pour l'application
CREATE ROLE erp_app_user;
CREATE ROLE erp_readonly;
CREATE ROLE erp_admin;

-- Permissions pour erp_app_user
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO erp_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO erp_app_user;

-- Permissions pour erp_readonly
GRANT SELECT ON ALL TABLES IN SCHEMA public TO erp_readonly;

-- Permissions pour erp_admin
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO erp_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO erp_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO erp_admin;

-- Row Level Security (RLS) pour certaines tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politique pour les documents (voir seulement ses propres uploads)
CREATE POLICY documents_policy ON documents
    FOR ALL
    TO erp_app_user
    USING (uploaded_by = current_setting('app.current_user_id', true)::uuid OR EXISTS (
        SELECT 1 FROM users WHERE id = current_setting('app.current_user_id', true)::uuid AND role IN ('ADMIN', 'MANAGER')
    ));

-- Politique pour les notifications (voir seulement ses propres notifications)
CREATE POLICY notifications_policy ON notifications
    FOR ALL
    TO erp_app_user
    USING (utilisateur_id = current_setting('app.current_user_id', true)::uuid);

-- =====================================================
-- Fin du script
-- =====================================================