// Script pour réparer le schéma critique de la base de données
// Utilise la configuration de TypeORM du projet

const { exec } = require('child_process');
const path = require('path');

console.log('🔧 Réparation du schéma de base de données...\n');

// Liste des commandes SQL à exécuter
const sqlCommands = [
  // Colonne deleted_at dans users
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;`,
  `CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);`,

  // Table parameters_system
  `CREATE TABLE IF NOT EXISTS parameters_system (
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
  );`,
  `CREATE INDEX IF NOT EXISTS idx_parameters_system_group_key ON parameters_system("group", key);`,

  // Table user_settings
  `CREATE TABLE IF NOT EXISTS user_settings (
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
  );`,
  `CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);`,

  // Table webhook_subscriptions
  `CREATE TABLE IF NOT EXISTS webhook_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    secret VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_event_type ON webhook_subscriptions(event_type);`,
];

// Créer un fichier SQL temporaire
const fs = require('fs');
const sqlFile = path.join(__dirname, 'temp-fix.sql');

const sqlContent = `
-- Connexion à la base topsteel_auth
\\c topsteel_auth

-- Exécuter les commandes
${sqlCommands.join('\n\n')}

-- Vérifier le nombre de sociétés
SELECT COUNT(*) as total_societes FROM societes;
`;

fs.writeFileSync(sqlFile, sqlContent);

console.log('✅ Fichier SQL créé: temp-fix.sql');
console.log('\n📋 Commandes SQL à exécuter:');
console.log('   - Ajout colonne users.deleted_at');
console.log('   - Création table parameters_system');
console.log('   - Création table user_settings');
console.log('   - Création table webhook_subscriptions');

console.log('\n⚠️  INSTRUCTIONS MANUELLES:');
console.log('============================================================');
console.log('1. Ouvrez pgAdmin ou votre client PostgreSQL');
console.log('2. Connectez-vous à la base: topsteel_auth');
console.log('   - Host: localhost');
console.log('   - Port: 5439');
console.log('   - User: topsteel');
console.log('   - Password: topsteelpass');
console.log('');
console.log('3. Exécutez les commandes SQL suivantes:');
console.log('============================================================\n');

sqlCommands.forEach((cmd, index) => {
  console.log(`-- Commande ${index + 1}:`);
  console.log(cmd);
  console.log('');
});

console.log('============================================================');
console.log('');
console.log('📄 Ou copiez le contenu du fichier: apps/api/temp-fix.sql');
console.log('');
console.log('⚡ Après exécution, redémarrez l\'API pour que les changements prennent effet.');
console.log('');
