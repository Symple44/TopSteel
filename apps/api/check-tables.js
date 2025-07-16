const { Client } = require('pg');

// Configuration de la base de données
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_topsteel',
});

async function checkTables() {
  try {
    // Connexion à la base de données
    await client.connect();
    console.log('Connecté à PostgreSQL');

    // Check if notifications table exists and get its structure
    const notificationsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'notifications' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    console.log('\nStructure actuelle de la table notifications:');
    if (notificationsColumns.rows.length === 0) {
      console.log('La table notifications n\'existe pas');
    } else {
      notificationsColumns.rows.forEach(row => {
        console.log(`- ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default || ''}`);
      });
    }

    // Check all notification-related tables
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE 'notification%'
    `);
    
    console.log('\nTables de notification existantes:');
    tables.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

    // Check if there's data in notifications table
    try {
      const count = await client.query('SELECT COUNT(*) FROM notifications');
      console.log(`\nNombre de notifications: ${count.rows[0].count}`);
    } catch (error) {
      console.log('Impossible de compter les notifications:', error.message);
    }

    // Show sample data if any
    try {
      const sample = await client.query('SELECT * FROM notifications LIMIT 3');
      console.log('\nExemple de données dans notifications:');
      sample.rows.forEach(row => {
        console.log(row);
      });
    } catch (error) {
      console.log('Impossible de récupérer les données:', error.message);
    }

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await client.end();
  }
}

checkTables();