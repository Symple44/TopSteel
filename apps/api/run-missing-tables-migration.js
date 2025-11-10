const { Client } = require('pg');

async function createMissingTables() {
  const client = new Client({
    host: '192.168.0.22',
    port: 5432,
    user: 'topsteel',
    password: 'topsteel',
    database: 'topsteel_auth'
  });

  try {
    await client.connect();
    console.log('✅ Connecté à topsteel_auth\n');

    // Créer parameters_system
    console.log('🔧 Création de la table parameters_system...');
    await client.query(`
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
      )
    `);
    console.log('✅ Table parameters_system créée');

    // Créer les index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_parameters_system_group_key
      ON parameters_system("group", key)
    `);
    console.log('✅ Index créé\n');

    // Vérifier
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_name = 'parameters_system'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Vérification: Table parameters_system existe bien');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

createMissingTables();
