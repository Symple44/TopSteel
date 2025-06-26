-- =========================================================================
-- ERP TOPSTEEL - SCHÉMA PRINCIPAL (VERSION CORRIGÉE)
-- Fichier: sql/schemas/01-main-schema.sql
-- =========================================================================

-- Extensions PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- Types ENUM (syntaxe corrigée pour PostgreSQL)
-- =====================================================

-- Vérifier et créer les types ENUM avec gestion d'erreur
DO $$ 
BEGIN
    -- Rôles utilisateurs
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM(
            'ADMIN', 'MANAGER', 'COMMERCIAL', 'TECHNICIEN', 'COMPTABLE', 'VIEWER'
        );
    END IF;

    -- Types de clients
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_type') THEN
        CREATE TYPE client_type AS ENUM(
            'PARTICULIER', 'PROFESSIONNEL', 'COLLECTIVITE', 'ASSOCIATION'
        );
    END IF;

    -- Statuts des projets
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'projet_statut') THEN
        CREATE TYPE projet_statut AS ENUM(
            'BROUILLON', 'DEVIS', 'ACCEPTE', 'EN_COURS', 'TERMINE', 'FACTURE', 'CLOTURE', 'ANNULE'
        );
    END IF;

    -- Types de projets
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'projet_type') THEN
        CREATE TYPE projet_type AS ENUM(
            'PORTAIL', 'CLOTURE', 'ESCALIER', 'GARDE_CORPS', 'RAMPE', 'VERRIERE', 
            'STRUCTURE', 'BARDAGE', 'COUVERTURE', 'CHARPENTE', 'AUTRE'
        );
    END IF;

    -- Priorités
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priorite') THEN
        CREATE TYPE priorite AS ENUM(
            'BASSE', 'NORMALE', 'HAUTE', 'URGENTE'
        );
    END IF;

    -- Statuts des devis
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'devis_statut') THEN
        CREATE TYPE devis_statut AS ENUM(
            'BROUILLON', 'ENVOYE', 'RELANCE', 'ACCEPTE', 'REFUSE', 'EXPIRE'
        );
    END IF;

    -- Catégories de produits
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categorie_produit') THEN
        CREATE TYPE categorie_produit AS ENUM(
            'PROFILE', 'TOLE', 'TUBE', 'ACCESSOIRE', 'QUINCAILLERIE', 'CONSOMMABLE', 'OUTILLAGE', 'AUTRE'
        );
    END IF;

    -- Unités de mesure
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unite_mesure') THEN
        CREATE TYPE unite_mesure AS ENUM(
            'PIECE', 'ML', 'M2', 'M3', 'KG', 'TONNE', 'LITRE', 'HEURE'
        );
    END IF;

    -- Types de mouvements de stock
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_mouvement') THEN
        CREATE TYPE type_mouvement AS ENUM(
            'ENTREE', 'SORTIE', 'RESERVATION', 'LIBERATION', 'AJUSTEMENT', 'INVENTAIRE', 'RETOUR'
        );
    END IF;

    -- Statuts des commandes
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commande_statut') THEN
        CREATE TYPE commande_statut AS ENUM(
            'BROUILLON', 'CONFIRMEE', 'EN_COURS', 'LIVREE_PARTIELLEMENT', 'LIVREE', 'FACTUREE', 'ANNULEE'
        );
    END IF;

    -- Types de documents
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_document') THEN
        CREATE TYPE type_document AS ENUM(
            'PLAN', 'DEVIS', 'FACTURE', 'BON_COMMANDE', 'BON_LIVRAISON', 'PHOTO', 'RAPPORT', 'CERTIFICAT', 'AUTRE'
        );
    END IF;

    -- Modes de paiement
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mode_paiement') THEN
        CREATE TYPE mode_paiement AS ENUM(
            'ESPECES', 'CHEQUE', 'VIREMENT', 'CB', 'PRELEVEMENT', 'TRAITE', 'AUTRE'
        );
    END IF;

END $$;

-- =====================================================
-- TABLES PRINCIPALES
-- =====================================================

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email varchar(255) UNIQUE NOT NULL,
    password varchar(255) NOT NULL,
    nom varchar(100) NOT NULL,
    prenom varchar(100) NOT NULL,
    role user_role DEFAULT 'VIEWER',
    telephone varchar(20),
    is_active boolean DEFAULT true,
    refresh_token text,
    last_login timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table des clients
CREATE TABLE IF NOT EXISTS clients (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    type client_type NOT NULL,
    nom varchar(255) NOT NULL,
    email varchar(255),
    telephone varchar(20),
    siret varchar(14) UNIQUE,
    tva_intra varchar(20),
    adresse jsonb DEFAULT '{}',
    contact_principal jsonb,
    notes text,
    credit_limite numeric(10,2),
    encours numeric(10,2) DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table des fournisseurs (compatible avec l'existant)
CREATE TABLE IF NOT EXISTS fournisseurs (
    id serial PRIMARY KEY,
    nom varchar(255) NOT NULL,
    email varchar(255) UNIQUE,
    telephone varchar(20),
    adresse text,
    siret varchar(14),
    actif boolean DEFAULT true,
    "createdAt" timestamptz DEFAULT now(),
    "updatedAt" timestamptz DEFAULT now()
);

-- Table des projets
CREATE TABLE IF NOT EXISTS projets (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero varchar(50) UNIQUE NOT NULL,
    nom varchar(255) NOT NULL,
    description text,
    type projet_type NOT NULL,
    statut projet_statut DEFAULT 'BROUILLON',
    priorite priorite DEFAULT 'NORMALE',
    client_id uuid REFERENCES clients(id),
    responsable_id uuid REFERENCES users(id),
    date_debut date,
    date_fin_prevue date,
    date_fin_reelle date,
    budget_estime numeric(12,2),
    cout_reel numeric(12,2) DEFAULT 0,
    avancement_pct integer DEFAULT 0 CHECK (avancement_pct >= 0 AND avancement_pct <= 100),
    adresse_chantier jsonb,
    coordonnees_gps point,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table des devis
CREATE TABLE IF NOT EXISTS devis (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero varchar(50) UNIQUE NOT NULL,
    projet_id uuid REFERENCES projets(id),
    client_id uuid REFERENCES clients(id),
    redacteur_id uuid REFERENCES users(id),
    statut devis_statut DEFAULT 'BROUILLON',
    date_emission date DEFAULT CURRENT_DATE,
    date_validite date,
    montant_ht numeric(12,2) DEFAULT 0,
    taux_tva numeric(5,2) DEFAULT 20.00,
    montant_ttc numeric(12,2) DEFAULT 0,
    remise_pct numeric(5,2) DEFAULT 0,
    conditions_paiement text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table des produits/matériaux
CREATE TABLE IF NOT EXISTS produits (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    code varchar(50) UNIQUE NOT NULL,
    nom varchar(255) NOT NULL,
    description text,
    categorie categorie_produit NOT NULL,
    unite unite_mesure NOT NULL,
    prix_achat numeric(10,4),
    prix_vente numeric(10,4),
    stock_actuel numeric(10,3) DEFAULT 0,
    stock_minimum numeric(10,3) DEFAULT 0,
    stock_maximum numeric(10,3),
    fournisseur_principal_id integer REFERENCES fournisseurs(id),
    actif boolean DEFAULT true,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table des documents
CREATE TABLE IF NOT EXISTS documents (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom varchar(255) NOT NULL,
    description text,
    type type_document DEFAULT 'AUTRE',
    chemin varchar(500),
    taille integer DEFAULT 0,
    mime_type varchar(100),
    projet_id uuid REFERENCES projets(id),
    uploaded_by uuid REFERENCES users(id),
    is_public boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table des mouvements de stock
CREATE TABLE IF NOT EXISTS mouvements_stock (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    produit_id uuid REFERENCES produits(id),
    type type_mouvement NOT NULL,
    quantite numeric(10,3) NOT NULL,
    prix_unitaire numeric(10,4),
    reference_document varchar(255),
    commentaire text,
    effectue_par uuid REFERENCES users(id),
    projet_id uuid REFERENCES projets(id),
    created_at timestamptz DEFAULT now()
);

-- Table des commandes fournisseurs
CREATE TABLE IF NOT EXISTS commandes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero varchar(50) UNIQUE NOT NULL,
    fournisseur_id integer REFERENCES fournisseurs(id),
    statut commande_statut DEFAULT 'BROUILLON',
    date_commande date DEFAULT CURRENT_DATE,
    date_livraison_prevue date,
    date_livraison_reelle date,
    montant_ht numeric(12,2) DEFAULT 0,
    montant_ttc numeric(12,2) DEFAULT 0,
    commandeur_id uuid REFERENCES users(id),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table notifications
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    titre varchar(255) NOT NULL,
    message text NOT NULL,
    type varchar(50) DEFAULT 'INFO',
    utilisateur_id uuid REFERENCES users(id),
    lu boolean DEFAULT false,
    url varchar(500),
    data jsonb,
    created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEX DE BASE
-- =====================================================

-- Index sur les emails pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- Index sur les numéros/codes pour les recherches
CREATE INDEX IF NOT EXISTS idx_projets_numero ON projets(numero);
CREATE INDEX IF NOT EXISTS idx_devis_numero ON devis(numero);
CREATE INDEX IF NOT EXISTS idx_produits_code ON produits(code);

-- Index sur les clés étrangères
CREATE INDEX IF NOT EXISTS idx_projets_client_id ON projets(client_id);
CREATE INDEX IF NOT EXISTS idx_projets_responsable_id ON projets(responsable_id);
CREATE INDEX IF NOT EXISTS idx_devis_projet_id ON devis(projet_id);
CREATE INDEX IF NOT EXISTS idx_documents_projet_id ON documents(projet_id);

-- Index sur les dates
CREATE INDEX IF NOT EXISTS idx_projets_date_debut ON projets(date_debut);
CREATE INDEX IF NOT EXISTS idx_devis_date_emission ON devis(date_emission);

-- =====================================================
-- TRIGGERS DE BASE (updated_at automatique)
-- =====================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_projets_updated_at BEFORE UPDATE ON projets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_devis_updated_at BEFORE UPDATE ON devis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_produits_updated_at BEFORE UPDATE ON produits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTAIRES SUR LES TABLES
-- =====================================================

COMMENT ON TABLE users IS 'Utilisateurs du système ERP';
COMMENT ON TABLE clients IS 'Clients de TopSteel';
COMMENT ON TABLE fournisseurs IS 'Fournisseurs de matériaux et services';
COMMENT ON TABLE projets IS 'Projets de métallerie';
COMMENT ON TABLE devis IS 'Devis pour les projets';
COMMENT ON TABLE produits IS 'Catalogue des produits et matériaux';
COMMENT ON TABLE documents IS 'Documents attachés aux projets';
COMMENT ON TABLE mouvements_stock IS 'Historique des mouvements de stock';
COMMENT ON TABLE commandes IS 'Commandes passées aux fournisseurs';
COMMENT ON TABLE notifications IS 'Notifications système';