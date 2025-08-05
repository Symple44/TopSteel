-- scripts/init-databases.sql
-- Initialisation des bases de données PostgreSQL pour TopSteel ERP

-- Base de données principale ERP
CREATE DATABASE erp_topsteel;

-- Base de données d'authentification (multi-tenant)
CREATE DATABASE erp_topsteel_auth;

-- Base de données partagée (multi-tenant)
CREATE DATABASE erp_topsteel_shared;

-- Base de données marketplace
CREATE DATABASE erp_topsteel_marketplace;

-- Créer les extensions nécessaires dans chaque base
\c erp_topsteel;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

\c erp_topsteel_auth;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c erp_topsteel_shared;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c erp_topsteel_marketplace;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Créer un utilisateur avec privilèges appropriés
CREATE USER topsteel_app WITH PASSWORD 'topsteel_app_password';

-- Accorder les privilèges nécessaires
GRANT ALL PRIVILEGES ON DATABASE erp_topsteel TO topsteel_app;
GRANT ALL PRIVILEGES ON DATABASE erp_topsteel_auth TO topsteel_app;
GRANT ALL PRIVILEGES ON DATABASE erp_topsteel_shared TO topsteel_app;
GRANT ALL PRIVILEGES ON DATABASE erp_topsteel_marketplace TO topsteel_app;

-- Configuration de performance PostgreSQL
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET random_page_cost = 1.1;

-- Recharger la configuration
SELECT pg_reload_conf();