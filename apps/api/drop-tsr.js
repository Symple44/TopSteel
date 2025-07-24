require('dotenv').config({ path: '../../.env.local' });
const { Client } = require('pg');

async function dropTSR() {
  const adminClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    
    // Fermer les connexions existantes
    await adminClient.query(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = 'erp_topsteel_tsr' AND pid <> pg_backend_pid();
    `);
    
    // Supprimer la base
    await adminClient.query('DROP DATABASE IF EXISTS erp_topsteel_tsr');
    console.log('✅ Base supprimée : erp_topsteel_tsr');
    
    await adminClient.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

dropTSR();