// Fix permissions as postgres superuser
const { Pool } = require('pg');

// Connect as toptime (superuser)
const pool = new Pool({
  host: '192.168.0.22',
  port: 5432,
  user: 'toptime',
  password: 'toptime',
  database: 'topsteel_auth',
});

async function fixPermissions() {
  try {
    console.log('\n🔐 Correction des permissions (en tant que postgres)...\n');

    // Grant all privileges on schema
    await pool.query('GRANT ALL PRIVILEGES ON SCHEMA public TO toptime');
    console.log('✅ Permissions sur le schéma accordées');

    // Grant all privileges on all tables
    await pool.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO toptime');
    console.log('✅ Permissions sur les tables accordées');

    // Grant all privileges on all sequences
    await pool.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO toptime');
    console.log('✅ Permissions sur les séquences accordées');

    // Set default privileges
    await pool.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO toptime');
    await pool.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO toptime');
    console.log('✅ Permissions par défaut configurées');

    // Make toptime owner of the database
    await pool.query('ALTER DATABASE topsteel_auth OWNER TO toptime');
    console.log('✅ toptime est maintenant propriétaire de la base');

    console.log('\n✅ Toutes les permissions ont été corrigées\n');

    await pool.end();
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error('Si vous n\'avez pas accès avec postgres/postgres, vérifiez les credentials PostgreSQL');
    process.exit(1);
  }
}

fixPermissions();
