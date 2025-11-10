const { Pool } = require('pg');

const pool = new Pool({
  host: '192.168.0.22',
  port: 5432,
  user: 'toptime',
  password: 'toptime',
  database: 'erp_topsteel_auth',
});

async function checkUsers() {
  try {
    // First, check what tables exist
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n=== TABLES DANS LA BASE DE DONNÉES ===\n');
    console.log(tablesResult.rows.map(r => r.table_name).join(', '));

    // Check migrations table
    try {
      const migrationsResult = await pool.query('SELECT * FROM migrations ORDER BY timestamp');
      console.log('\n=== MIGRATIONS EXÉCUTÉES ===\n');
      if (migrationsResult.rows.length === 0) {
        console.log('Aucune migration exécutée (table migrations vide)');
      } else {
        migrationsResult.rows.forEach(m => {
          console.log(`- ${m.name} (${new Date(m.timestamp).toISOString()})`);
        });
      }
    } catch (err) {
      console.log('\n❌ Erreur lecture table migrations:', err.message);
    }

    // Try to query users table
    try {
      const result = await pool.query(`
        SELECT
          id,
          email,
          first_name,
          last_name,
          role,
          created_at,
          is_active
        FROM users
        ORDER BY created_at DESC
        LIMIT 10
      `);

      console.log('\n=== UTILISATEURS DANS LA BASE DE DONNÉES ===\n');

      if (result.rows.length === 0) {
        console.log('❌ Aucun utilisateur trouvé dans la base de données');
        console.log('\n💡 Vous pouvez créer un utilisateur admin avec:');
        console.log('   Email: admin@topsteel.fr');
        console.log('   Password: Admin2025!');
      } else {
        console.log(`✅ ${result.rows.length} utilisateur(s) trouvé(s):\n`);

        result.rows.forEach((user, index) => {
          console.log(`${index + 1}. Email: ${user.email}`);
          console.log(`   Nom: ${user.first_name || 'N/A'} ${user.last_name || 'N/A'}`);
          console.log(`   Rôle: ${user.role}`);
          console.log(`   Actif: ${user.is_active ? 'Oui' : 'Non'}`);
          console.log(`   Créé le: ${user.created_at}`);
          console.log('');
        });
      }
    } catch (err) {
      console.log('\n❌ La table "users" n\'existe pas encore.');
      console.log('💡 Les migrations doivent être exécutées pour créer les tables.');
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    process.exit(1);
  }
}

checkUsers();
