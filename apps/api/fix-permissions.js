// Fix database permissions
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || '192.168.0.22',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'toptime',
  password: process.env.DB_PASSWORD || 'toptime',
  database: process.env.DB_AUTH_NAME || 'topsteel_auth',
});

async function fixPermissions() {
  try {
    console.log('\n🔐 Correction des permissions...\n');

    // Grant all privileges on all tables
    await pool.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO toptime');
    console.log('✅ Permissions sur les tables accordées');

    // Grant all privileges on all sequences
    await pool.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO toptime');
    console.log('✅ Permissions sur les séquences accordées');

    // Set default privileges for future tables
    await pool.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO toptime');
    console.log('✅ Permissions par défaut configurées');

    console.log('\n✅ Toutes les permissions ont été corrigées\n');

    await pool.end();
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

fixPermissions();
