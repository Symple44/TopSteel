const { Client } = require('pg');
const fs = require('fs');

// Configuration de la base de données
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_topsteel',
});

async function executeSQLScript() {
  try {
    // Connexion à la base de données
    await client.connect();
    console.log('Connecté à PostgreSQL');

    // Lire le fichier SQL
    const sqlScript = fs.readFileSync('create-notification-tables.sql', 'utf8');
    
    // Exécuter le script
    const result = await client.query(sqlScript);
    console.log('Script SQL exécuté avec succès');
    
    // Vérifier les tables créées
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE 'notification%'
    `);
    
    console.log('Tables de notification créées:');
    tables.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Compter les notifications
    const notificationCount = await client.query('SELECT COUNT(*) FROM notifications');
    console.log(`Nombre de notifications: ${notificationCount.rows[0].count}`);
    
    const templateCount = await client.query('SELECT COUNT(*) FROM notification_templates');
    console.log(`Nombre de templates: ${templateCount.rows[0].count}`);
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await client.end();
  }
}

executeSQLScript();