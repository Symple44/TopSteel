// Reset ALL databases for TopSteel - Complete reinitialization
const { Pool } = require('pg');
require('dotenv').config();

const systemPool = new Pool({
  host: process.env.DB_HOST || '192.168.0.22',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'topsteel',
  password: process.env.DB_PASSWORD || 'topsteel',
  database: 'postgres',
});

async function resetAllDatabases() {
  try {
    console.log('\n🔥 RÉINITIALISATION COMPLÈTE DE TOUTES LES BASES DE DONNÉES\n');
    console.log(`📍 Host: ${process.env.DB_HOST || '192.168.0.22'}`);
    console.log(`👤 User: ${process.env.DB_USERNAME || 'topsteel'}\n`);

    // Liste toutes les bases TopSteel/ERP
    console.log('1️⃣  Recherche des bases de données TopSteel...');
    const allDbs = await systemPool.query(`
      SELECT datname FROM pg_database
      WHERE datname LIKE '%topsteel%' OR datname LIKE '%erp%'
      ORDER BY datname
    `);

    if (allDbs.rows.length === 0) {
      console.log('   ℹ️  Aucune base de données TopSteel trouvée\n');
    } else {
      console.log(`   📊 ${allDbs.rows.length} base(s) trouvée(s):`);
      allDbs.rows.forEach(row => {
        console.log(`      - ${row.datname}`);
      });
      console.log('');

      // Supprimer chaque base
      for (const row of allDbs.rows) {
        const dbName = row.datname;
        console.log(`2️⃣  Suppression de "${dbName}"...`);

        // Terminer toutes les connexions actives
        await systemPool.query(`
          SELECT pg_terminate_backend(pg_stat_activity.pid)
          FROM pg_stat_activity
          WHERE pg_stat_activity.datname = $1
            AND pid <> pg_backend_pid()
        `, [dbName]);

        // Supprimer la base
        await systemPool.query(`DROP DATABASE IF EXISTS "${dbName}"`);
        console.log(`   ✅ Base "${dbName}" supprimée`);
      }
    }

    console.log('\n3️⃣  Création des nouvelles bases de données...');

    const databasesToCreate = [
      'topsteel_auth',
      'topsteel',
      'erp_topsteel_topsteel'
    ];

    for (const dbName of databasesToCreate) {
      console.log(`   🏗️  Création de "${dbName}"...`);
      await systemPool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`   ✅ Base "${dbName}" créée`);
    }

    // Vérification finale
    console.log('\n4️⃣  Vérification finale...');
    const finalCheck = await systemPool.query(`
      SELECT datname FROM pg_database
      WHERE datname LIKE '%topsteel%' OR datname LIKE '%erp%'
      ORDER BY datname
    `);

    console.log('   📊 Bases de données TopSteel:');
    finalCheck.rows.forEach(row => {
      console.log(`      ✅ ${row.datname}`);
    });

    await systemPool.end();

    console.log('\n✅ RÉINITIALISATION COMPLÈTE TERMINÉE\n');
    console.log('📝 Prochaine étape: Exécuter les migrations');
    console.log('   npm run migration:auth:run\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

resetAllDatabases();
