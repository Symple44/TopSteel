// Create tenant database for TopSteel
const { Pool } = require('pg');
require('dotenv').config();

const systemPool = new Pool({
  host: process.env.DB_HOST || '192.168.0.22',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'topsteel',
  password: process.env.DB_PASSWORD || 'topsteel',
  database: 'postgres',
});

async function createTenantDB() {
  try {
    console.log('\n🏢 CRÉATION DE LA BASE DE DONNÉES TENANT\n');

    const dbName = 'erp_topsteel_topsteel';  // Nom que l'API attend

    // Vérifier si la base existe
    const check = await systemPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (check.rows.length > 0) {
      console.log(`⚠️  La base "${dbName}" existe déjà\n`);
    } else {
      console.log(`🏗️  Création de la base "${dbName}"...`);
      await systemPool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Base "${dbName}" créée\n`);
    }

    // Vérifier toutes les bases TopSteel
    const allDbs = await systemPool.query(`
      SELECT datname FROM pg_database
      WHERE datname LIKE '%topsteel%' OR datname LIKE '%erp%'
      ORDER BY datname
    `);

    console.log('📊 Bases de données:');
    allDbs.rows.forEach(row => {
      console.log(`   ✅ ${row.datname}`);
    });

    await systemPool.end();
    console.log('\n✅ TERMINÉ\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createTenantDB();
