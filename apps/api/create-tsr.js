require('dotenv').config({ path: '../../.env.local' });
const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

async function createTSRSociete() {
  const authClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'erp_topsteel_auth',
  });

  const adminClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  });

  try {
    await authClient.connect();
    await adminClient.connect();
    
    console.log('🚀 CRÉATION DE LA SOCIÉTÉ TOP STEEL RECETTE\n');
    
    // 1. Créer la société dans AUTH
    const societeId = uuidv4();
    const insertSociete = `
      INSERT INTO societes (id, nom, code, status, plan, max_users, max_sites, email, telephone, adresse, database_name, configuration) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, nom, code;
    `;
    
    const societeResult = await authClient.query(insertSociete, [
      societeId,
      'Top Steel Recette',
      'TSR',
      'ACTIVE',
      'PROFESSIONAL',
      10,
      3,
      'admin@topsteelrecette.com',
      '+33123456789',
      '123 Rue de Test, Paris 75001, France',
      'erp_topsteel_tsr',
      JSON.stringify({
        ville: 'Paris',
        codePostal: '75001',
        pays: 'France',
        locale: 'fr',
        timezone: 'Europe/Paris'
      })
    ]);
    
    console.log('✅ Société créée:', societeResult.rows[0]);
    
    // 2. Créer la base de données tenant
    const dbName = 'erp_topsteel_tsr';
    await adminClient.query(`CREATE DATABASE "${dbName}"`);
    console.log(`✅ Base de données créée: ${dbName}`);
    
    // 3. Créer le site principal
    const siteId = uuidv4();
    const insertSite = `
      INSERT INTO sites (id, nom, code, societe_id, type, is_principal, actif, configuration) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, nom;
    `;
    
    const siteResult = await authClient.query(insertSite, [
      siteId,
      'Site Principal TSR',
      'TSR-MAIN',
      societeId,
      'PRODUCTION',
      true,
      true,
      JSON.stringify({
        description: 'Site principal de Top Steel Recette',
        timezone: 'Europe/Paris'
      })
    ]);
    
    console.log('✅ Site créé:', siteResult.rows[0]);
    
    console.log('\n🎉 SOCIÉTÉ TOP STEEL RECETTE CRÉÉE AVEC SUCCÈS !');
    console.log(`   • ID: ${societeId}`);
    console.log(`   • Base de données: ${dbName}`);
    console.log(`   • Site ID: ${siteId}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await authClient.end();
    await adminClient.end();
  }
}

createTSRSociete();