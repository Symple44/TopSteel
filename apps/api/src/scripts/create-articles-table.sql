-- Script de création de la table articles pour TopSteel ERP
-- Base tenant : erp_topsteel_topsteel

-- Extension UUID si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums requis
DO $$ BEGIN
    CREATE TYPE article_type AS ENUM (
        'MATIERE_PREMIERE',
        'PRODUIT_FINI',
        'PRODUIT_SEMI_FINI',
        'FOURNITURE',
        'CONSOMMABLE',
        'SERVICE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE article_status AS ENUM (
        'ACTIF',
        'INACTIF',
        'OBSOLETE',
        'EN_COURS_CREATION'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE unite_stock AS ENUM (
        'PCS', 'KG', 'G', 'M', 'CM', 'MM',
        'M2', 'M3', 'L', 'ML', 'T', 'H'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE methode_valorisation_stock AS ENUM (
        'FIFO', 'LIFO', 'CMUP', 'PRIX_STANDARD'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table articles
CREATE TABLE IF NOT EXISTS articles (
    -- Colonnes de base (héritées de BaseAuditEntity)
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1,
    created_by_id UUID,
    updated_by_id UUID,
    deleted_by_id UUID,
    
    -- Colonnes tenant
    societe_id UUID NOT NULL,
    site_id UUID,
    
    -- Colonnes métier
    reference VARCHAR(30) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    description TEXT,
    type article_type NOT NULL,
    status article_status NOT NULL DEFAULT 'ACTIF',
    
    -- Classification
    famille VARCHAR(50),
    sous_famille VARCHAR(50),
    marque VARCHAR(100),
    modele VARCHAR(50),
    
    -- Unités et gestion stock
    unite_stock unite_stock NOT NULL DEFAULT 'PCS',
    unite_achat unite_stock,
    unite_vente unite_stock,
    coefficient_achat DECIMAL(10,4) DEFAULT 1,
    coefficient_vente DECIMAL(10,4) DEFAULT 1,
    
    -- Gestion des stocks
    gere_en_stock BOOLEAN NOT NULL DEFAULT true,
    stock_physique DECIMAL(15,4) DEFAULT 0,
    stock_reserve DECIMAL(15,4) DEFAULT 0,
    stock_disponible DECIMAL(15,4) DEFAULT 0,
    stock_mini DECIMAL(15,4),
    stock_maxi DECIMAL(15,4),
    stock_securite DECIMAL(15,4),
    
    -- Valorisation
    methode_valorisation methode_valorisation_stock NOT NULL DEFAULT 'CMUP',
    prix_achat_standard DECIMAL(12,4),
    prix_achat_moyen DECIMAL(12,4),
    prix_vente_ht DECIMAL(12,4),
    taux_tva DECIMAL(5,2),
    taux_marge DECIMAL(5,2),
    
    -- Informations fournisseur principal
    fournisseur_principal_id UUID,
    reference_fournisseur VARCHAR(50),
    delai_approvisionnement VARCHAR(10),
    quantite_mini_commande DECIMAL(15,4),
    quantite_multiple_commande DECIMAL(15,4),
    
    -- Caractéristiques physiques
    poids DECIMAL(10,4), -- en kg
    volume DECIMAL(10,4), -- en m3
    longueur DECIMAL(8,4), -- en mm
    largeur DECIMAL(8,4), -- en mm
    hauteur DECIMAL(8,4), -- en mm
    couleur VARCHAR(50),
    
    -- Informations comptables et fiscales
    compte_comptable_achat VARCHAR(20),
    compte_comptable_vente VARCHAR(20),
    compte_comptable_stock VARCHAR(20),
    code_douanier VARCHAR(10),
    code_ean VARCHAR(30),
    
    -- Métadonnées et informations techniques
    caracteristiques_techniques JSONB DEFAULT '{}',
    informations_logistiques JSONB DEFAULT '{}',
    metadonnees JSONB DEFAULT '{}',
    
    -- Dates importantes
    date_creation_fiche DATE,
    date_derniere_modification DATE,
    date_dernier_inventaire DATE,
    date_dernier_mouvement DATE,
    
    -- Contraintes
    CONSTRAINT pk_articles PRIMARY KEY (id),
    CONSTRAINT uq_articles_reference UNIQUE (reference),
    CONSTRAINT chk_prix_positifs CHECK (
        (prix_achat_standard IS NULL OR prix_achat_standard >= 0) AND
        (prix_achat_moyen IS NULL OR prix_achat_moyen >= 0) AND
        (prix_vente_ht IS NULL OR prix_vente_ht >= 0)
    ),
    CONSTRAINT chk_stock_coherent CHECK (
        (stock_mini IS NULL OR stock_maxi IS NULL OR stock_mini <= stock_maxi)
    ),
    CONSTRAINT chk_taux_valides CHECK (
        (taux_tva IS NULL OR (taux_tva >= 0 AND taux_tva <= 100)) AND
        (taux_marge IS NULL OR taux_marge >= 0)
    )
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_articles_reference ON articles(reference);
CREATE INDEX IF NOT EXISTS idx_articles_designation ON articles(designation);
CREATE INDEX IF NOT EXISTS idx_articles_type ON articles(type);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_famille ON articles(famille);
CREATE INDEX IF NOT EXISTS idx_articles_sous_famille ON articles(sous_famille);
CREATE INDEX IF NOT EXISTS idx_articles_societe_id ON articles(societe_id);
CREATE INDEX IF NOT EXISTS idx_articles_gere_en_stock ON articles(gere_en_stock);
CREATE INDEX IF NOT EXISTS idx_articles_fournisseur_principal_id ON articles(fournisseur_principal_id);
CREATE INDEX IF NOT EXISTS idx_articles_code_ean ON articles(code_ean);

-- Table system_settings si elle n'existe pas
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    label VARCHAR(255),
    description TEXT,
    type VARCHAR(50) DEFAULT 'string',
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_system_settings PRIMARY KEY (id),
    CONSTRAINT uq_system_settings_key UNIQUE (category, key)
);

CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_active ON system_settings(is_active);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at 
    BEFORE UPDATE ON articles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Vérification finale
DO $$
BEGIN
    RAISE NOTICE 'Table articles créée avec succès';
    RAISE NOTICE 'Table system_settings créée avec succès';
    RAISE NOTICE 'Toutes les contraintes et index sont en place';
END $$;