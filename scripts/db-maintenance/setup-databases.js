// Setup databases for TopSteel
const { Pool } = require('pg');
require('dotenv').config();

// Pool pour se connecter à la base postgres (base système)
const systemPool = new Pool({
  host: process.env.DB_HOST || '192.168.0.22',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'topsteel',
  password: process.env.DB_PASSWORD || 'topsteel',
  database: 'postgres', // Base système pour créer les autres bases
});

async function setupDatabases() {
  try {
    console.log('\n🚀 CONFIGURATION DES BASES DE DONNÉES TOPSTEEL\n');
    console.log(`📍 Host: ${process.env.DB_HOST || '192.168.0.22'}`);
    console.log(`👤 User: ${process.env.DB_USERNAME || 'topsteel'}`);
    console.log(`🔑 Password: ${process.env.DB_PASSWORD || 'topsteel'}\n`);

    // Vérifier la connexion au serveur PostgreSQL
    console.log('1️⃣  Test de connexion au serveur PostgreSQL...');
    await systemPool.query('SELECT version()');
    console.log('   ✅ Connexion réussie\n');

    // Liste des bases de données à créer
    const databases = [
      'topsteel_auth',
      'topsteel',
    ];

    for (const dbName of databases) {
      console.log(`2️⃣  Vérification de la base "${dbName}"...`);

      // Vérifier si la base existe
      const checkDb = await systemPool.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [dbName]
      );

      if (checkDb.rows.length > 0) {
        console.log(`   ⚠️  La base "${dbName}" existe déjà`);

        // Demander si on veut la supprimer
        console.log(`   🗑️  Suppression de la base "${dbName}"...`);

        // Terminer les connexions actives
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

      // Créer la base
      console.log(`   🏗️  Création de la base "${dbName}"...`);
      await systemPool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`   ✅ Base "${dbName}" créée\n`);
    }

    // Vérifier les bases créées
    console.log('3️⃣  Vérification des bases créées...');
    const allDbs = await systemPool.query(`
      SELECT datname FROM pg_database
      WHERE datname LIKE 'topsteel%'
      ORDER BY datname
    `);

    console.log('   📊 Bases de données TopSteel:');
    allDbs.rows.forEach(row => {
      console.log(`      ✅ ${row.datname}`);
    });

    await systemPool.end();

    console.log('\n✅ CONFIGURATION DES BASES DE DONNÉES TERMINÉE\n');
    console.log('📝 Prochaine étape: Exécuter les migrations');
    console.log('   npm run migration:auth:run\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error('\n💡 Vérifiez que:');
    console.error('   - PostgreSQL est démarré');
    console.error('   - Le serveur est accessible sur 192.168.0.22:5432');
    console.error('   - L\'utilisateur "topsteel" existe et a les droits CREATEDB');
    console.error('\nDétails de l\'erreur:');
    console.error(error);
    process.exit(1);
  }
}

setupDatabases();
