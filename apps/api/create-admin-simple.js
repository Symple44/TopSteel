// Create admin user for TopSteel
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || '192.168.0.22',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'topsteel',
  password: process.env.DB_PASSWORD || 'topsteel',
  database: process.env.DB_AUTH_NAME || 'topsteel_auth',
});

async function createAdmin() {
  try {
    console.log('\n🔐 CRÉATION DE L\'UTILISATEUR ADMIN\n');

    // Définir les credentials admin
    const email = 'admin@topsteel.fr';
    const password = 'Admin2025!';
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    console.log('📧 Email: ' + email);
    console.log('🔑 Password: ' + password);
    console.log('🆔 User ID: ' + userId);
    console.log('');

    // Vérifier si l'utilisateur existe déjà
    const existing = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);

    if (existing.rows.length > 0) {
      console.log('⚠️  L\'utilisateur admin existe déjà');
      console.log('   ID: ' + existing.rows[0].id);
      console.log('   Email: ' + existing.rows[0].email);
      console.log('');
      console.log('✅ Mise à jour du mot de passe...');

      // Mettre à jour le mot de passe
      await pool.query(
        `UPDATE users
         SET password = $1,
             role = $2,
             actif = true,
             updated_at = NOW()
         WHERE email = $3`,
        [hashedPassword, 'SUPER_ADMIN', email]
      );

      console.log('✅ Mot de passe mis à jour!\n');
    } else {
      console.log('➕ Création du nouvel utilisateur...');

      // Créer l'utilisateur
      await pool.query(
        `INSERT INTO users (id, nom, prenom, email, password, role, actif, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [userId, 'Admin', 'System', email, hashedPassword, 'SUPER_ADMIN', true]
      );

      console.log('✅ Utilisateur créé!\n');
    }

    // Vérifier les tables créées
    console.log('📊 Vérification des tables créées:');
    const tables = await pool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log(`   Total: ${tables.rows.length} tables`);
    tables.rows.forEach(t => {
      console.log(`   ✅ ${t.tablename}`);
    });

    await pool.end();

    console.log('\n✅ SETUP TERMINÉ - PRÊT À UTILISER\n');
    console.log('📝 Pour tester la connexion:');
    console.log('   node test-login.js\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createAdmin();
