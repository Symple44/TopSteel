// Script pour ajouter la colonne deleted_at à la table users
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5439,
  user: 'topsteel',
  password: 'topsteelpass',
  database: 'topsteel_auth'
});

async function addDeletedAtColumn() {
  try {
    await client.connect();
    console.log('✅ Connecté à la base de données topsteel_auth');

    // Vérifier si la colonne existe déjà
    const checkQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'deleted_at'
    `;

    const result = await client.query(checkQuery);

    if (result.rows.length > 0) {
      console.log('⏭️  Colonne deleted_at existe déjà dans la table users');
    } else {
      console.log('🔧 Ajout de la colonne deleted_at à la table users...');

      // Ajouter la colonne
      await client.query(`
        ALTER TABLE users
        ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL
      `);

      console.log('✅ Colonne deleted_at ajoutée avec succès');

      // Créer un index pour les performances
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_deleted_at
        ON users(deleted_at)
      `);

      console.log('✅ Index sur deleted_at créé');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('✅ Déconnecté de la base de données');
  }
}

addDeletedAtColumn();
