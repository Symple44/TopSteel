// Script to verify database connection matches TypeORM configuration
const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env.local' });

const pool = new Pool({
  host: process.env.DB_HOST || process.env.DATABASE_HOST,
  port: parseInt(process.env.DB_PORT || process.env.DATABASE_PORT),
  user: process.env.DB_USERNAME || process.env.DATABASE_USERNAME,
  password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD,
  database: process.env.DB_AUTH_NAME || process.env.DATABASE_AUTH_NAME,
});

async function checkConnection() {
  try {
    console.log('\n🔍 Configuration utilisée:');
    console.log(`   Host: ${process.env.DB_HOST || process.env.DATABASE_HOST}`);
    console.log(`   Port: ${process.env.DB_PORT || process.env.DATABASE_PORT}`);
    console.log(`   User: ${process.env.DB_USERNAME || process.env.DATABASE_USERNAME}`);
    console.log(`   Database: ${process.env.DB_AUTH_NAME || process.env.DATABASE_AUTH_NAME}`);

    // Check PostgreSQL version
    const versionResult = await pool.query('SELECT version()');
    console.log('\n✅ Connexion réussie!');
    console.log(`   PostgreSQL: ${versionResult.rows[0].version.split(',')[0]}`);

    // Check current database
    const dbResult = await pool.query('SELECT current_database(), current_schema()');
    console.log(`   Database actuelle: ${dbResult.rows[0].current_database}`);
    console.log(`   Schema actuel: ${dbResult.rows[0].current_schema}`);

    // List all tables
    const tablesResult = await pool.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name
    `);

    console.log('\n📋 Tables dans la base de données:');
    if (tablesResult.rows.length === 0) {
      console.log('   ❌ Aucune table trouvée!');
    } else {
      tablesResult.rows.forEach(t => {
        console.log(`   - ${t.table_schema}.${t.table_name}`);
      });
    }

    // Specifically check for migrations table
    const migrationsCheck = await pool.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_name = 'migrations'
    `);

    console.log('\n🔍 Recherche table "migrations":');
    if (migrationsCheck.rows.length === 0) {
      console.log('   ❌ Table "migrations" introuvable dans aucun schema');
    } else {
      migrationsCheck.rows.forEach(t => {
        console.log(`   ✅ Trouvée dans: ${t.table_schema}.${t.table_name}`);
      });
    }

    await pool.end();
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkConnection();
