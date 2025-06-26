-- =========================================================================
-- ERP TOPSTEEL - SCHÉMA PRINCIPAL
-- Fichier: sql/schemas/01-main-schema.sql
-- =========================================================================

-- Extensions PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Types ENUM
CREATE TYPE IF NOT EXISTS user_role AS ENUM(
    'ADMIN', 'MANAGER', 'COMMERCIAL', 'TECHNICIEN', 'COMPTABLE', 'VIEWER'
);

CREATE TYPE IF NOT EXISTS client_type AS ENUM(
    'PARTICULIER', 'PROFESSIONNEL', 'COLLECTIVITE', 'ASSOCIATION'
);

CREATE TYPE IF NOT EXISTS projet_statut AS ENUM(
    'BROUILLON', 'DEVIS', 'ACCEPTE', 'EN_COURS', 'TERMINE', 'FACTURE', 'CLOTURE', 'ANNULE'
);

CREATE TYPE IF NOT EXISTS projet_type AS ENUM(
    'PORTAIL', 'CLOTURE', 'ESCALIER', 'GARDE_CORPS', 'RAMPE', 'VERRIERE', 
    'STRUCTURE', 'BARDAGE', 'COUVERTURE', 'CHARPENTE', 'AUTRE'
);

CREATE TYPE IF NOT EXISTS priorite AS ENUM(
    'BASSE', 'NORMALE', 'HAUTE', 'URGENTE'
);

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

-- Table des documents
CREATE TABLE IF NOT EXISTS documents (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom varchar(255) NOT NULL,
    description text,
    type varchar(50),
    chemin varchar(500),
    taille integer DEFAULT 0,
    mime_type varchar(100),
    projet_id uuid REFERENCES projets(id),
    uploaded_by uuid REFERENCES users(id),
    is_public boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
