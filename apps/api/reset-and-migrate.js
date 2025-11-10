// Reset database and run migrations properly
const { Pool } = require('pg');
const { execSync } = require('child_process');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || '192.168.0.22',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: 'topsteel',
  password: 'topsteel',
  database: process.env.DB_AUTH_NAME || 'topsteel_auth',
});

async function resetAndMigrate() {
  try {
    console.log('\n🔄 RÉINITIALISATION COMPLÈTE DE LA BASE DE DONNÉES\n');

    // Step 1: Drop schema
    console.log('1️⃣  Suppression du schéma public...');
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
    console.log('   ✅ Schéma supprimé');

    // Step 2: Recreate schema
    console.log('\n2️⃣  Recréation du schéma public...');
    await pool.query('CREATE SCHEMA public');
    await pool.query('GRANT ALL ON SCHEMA public TO toptime');
    await pool.query('GRANT ALL ON SCHEMA public TO public');
    console.log('   ✅ Schéma recréé');

    await pool.end();

    // Step 3: Run migrations via TypeORM
    console.log('\n3️⃣  Exécution des migrations TypeORM...');
    console.log('   📦 Migration de la base auth...\n');

    try {
      const output = execSync('npm run migration:auth:run', {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe'
      });
      console.log(output);
      console.log('   ✅ Migrations exécutées avec succès');
    } catch (error) {
      console.error('   ❌ Erreur lors des migrations:', error.message);
      if (error.stdout) console.log('STDOUT:', error.stdout);
      if (error.stderr) console.log('STDERR:', error.stderr);
      process.exit(1);
    }

    // Step 4: Verify tables
    console.log('\n4️⃣  Vérification des tables...');
    const verifyPool = new Pool({
      host: process.env.DB_HOST || '192.168.0.22',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USERNAME || 'toptime',
      password: process.env.DB_PASSWORD || 'toptime',
      database: process.env.DB_AUTH_NAME || 'topsteel_auth',
    });

    const tables = await verifyPool.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log(`   ✅ ${tables.rows.length} tables créées:`);
    tables.rows.forEach(t => console.log(`      - ${t.tablename}`));

    // Step 5: Verify user_mfa columns
    console.log('\n5️⃣  Vérification de la table user_mfa...');
    const columns = await verifyPool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'user_mfa'
      ORDER BY ordinal_position
    `);

    if (columns.rows.length === 0) {
      console.log('   ⚠️  Table user_mfa n\'a pas de colonnes!');
    } else {
      console.log(`   ✅ ${columns.rows.length} colonnes:`);
      columns.rows.forEach(c => console.log(`      - ${c.column_name}: ${c.data_type}`));
    }

    // Step 6: Create admin user
    console.log('\n6️⃣  Création de l\'utilisateur admin...');
    const bcrypt = require('bcrypt');
    const { v4: uuidv4 } = require('uuid');

    const email = 'admin@topsteel.fr';
    const password = 'Admin2025!';
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    await verifyPool.query(
      `INSERT INTO users (id, nom, prenom, email, password, role, actif)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING`,
      [userId, 'Admin', 'System', email, hashedPassword, 'SUPER_ADMIN', true]
    );

    console.log('   ✅ Utilisateur admin créé');
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Password: ${password}`);

    await verifyPool.end();

    console.log('\n✅ RÉINITIALISATION TERMINÉE - PRÊT À UTILISER\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  }
}

resetAndMigrate();
