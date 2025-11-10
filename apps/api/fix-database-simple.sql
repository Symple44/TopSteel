-- Script SQL simple pour réparer rapidement les problèmes critiques
-- À exécuter manuellement dans pgAdmin ou votre client PostgreSQL

-- ============================================================
-- BASE: topsteel_auth
-- ============================================================
\c topsteel_auth

\echo '=== Ajout de la colonne deleted_at à users ==='
ALTER TABLE users
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
\echo '✅ Colonne deleted_at ajoutée'

\echo ''
\echo '=== Création de la table parameters_system ==='
CREATE TABLE IF NOT EXISTS parameters_system (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "group" VARCHAR(100) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    type VARCHAR(50) DEFAULT 'string',
    scope VARCHAR(50) DEFAULT 'global',
    description TEXT,
    metadata JSONB,
    "arrayValues" TEXT[],
    "objectValues" JSONB,
    "isActive" BOOLEAN DEFAULT true,
    "isReadonly" BOOLEAN DEFAULT false,
    "translationKey" VARCHAR(255),
    "customTranslations" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("group", key)
);

CREATE INDEX IF NOT EXISTS idx_parameters_system_group_key
ON parameters_system("group", key);

\echo '✅ Table parameters_system créée'

\echo ''
\echo '=== Création de la table user_settings ==='
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(50) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'fr',
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id
ON user_settings(user_id);

\echo '✅ Table user_settings créée'

\echo ''
\echo '=== Création de la table webhook_subscriptions ==='
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    secret VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_event_type
ON webhook_subscriptions(event_type);

\echo '✅ Table webhook_subscriptions créée'

\echo ''
\echo '=== Vérification: Compter les sociétés ==='
SELECT COUNT(*) as total_societes FROM societes;

\echo ''
\echo '=== TERMINÉ ==='
\echo 'Toutes les tables et colonnes critiques ont été créées'
\echo 'Redémarrez maintenant l API pour appliquer les changements'
