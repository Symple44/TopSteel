require('dotenv').config({ path: '../../.env.local' });
const { Client } = require('pg');

async function checkFinalData() {
  console.log('🎯 VÉRIFICATION FINALE DU SYSTÈME MULTI-TENANT\n');
  
  // Vérifier les bases de données
  const adminClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    
    console.log('📊 BASES DE DONNÉES CRÉÉES:');
    const databases = await adminClient.query(`
      SELECT datname FROM pg_database 
      WHERE datname LIKE 'erp_topsteel%' 
      ORDER BY datname;
    `);
    
    databases.rows.forEach(db => {
      console.log(`   ✅ ${db.datname}`);
    });
    
    await adminClient.end();
    
  } catch (error) {
    console.error('❌ Erreur bases:', error.message);
  }
  
  // Vérifier les données AUTH
  const authClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'erp_topsteel_auth',
  });

  try {
    await authClient.connect();
    
    console.log('\n🏢 SOCIÉTÉS DANS AUTH:');
    const societes = await authClient.query('SELECT nom, code, status, database_name FROM societes ORDER BY nom');
    societes.rows.forEach(s => {
      console.log(`   • ${s.nom} (${s.code}) - ${s.status} → ${s.database_name}`);
    });
    
    console.log('\n👥 UTILISATEURS DANS AUTH:');
    const users = await authClient.query('SELECT nom, prenom, email FROM users ORDER BY nom');
    users.rows.forEach(u => {
      console.log(`   • ${u.nom} ${u.prenom} (${u.email})`);
    });
    
    console.log('\n🏪 SITES:');
    const sites = await authClient.query(`
      SELECT s.nom, s.code, soc.nom as societe_nom, s.is_principal 
      FROM sites s 
      JOIN societes soc ON s.societe_id = soc.id 
      ORDER BY soc.nom, s.nom
    `);
    sites.rows.forEach(site => {
      const principal = site.is_principal ? ' (PRINCIPAL)' : '';
      console.log(`   • ${site.nom} (${site.code}) - ${site.societe_nom}${principal}`);
    });
    
    await authClient.end();
    
  } catch (error) {
    console.error('❌ Erreur AUTH:', error.message);
  }
  
  // Vérifier les tables TENANT (TSR)
  const tsrClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'erp_topsteel_tsr',
  });

  try {
    await tsrClient.connect();
    
    console.log('\n📦 TABLES DANS LA BASE TSR:');
    const tables = await tsrClient.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    tables.rows.forEach(table => {
      console.log(`   • ${table.table_name}`);
    });
    
    // Compter les enregistrements par défaut
    console.log('\n📊 DONNÉES PAR DÉFAUT:');
    for (const table of ['clients', 'fournisseurs', 'materiaux', 'stocks']) {
      try {
        const count = await tsrClient.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   • ${table}: ${count.rows[0].count} enregistrements`);
      } catch (e) {
        console.log(`   • ${table}: table non accessible`);
      }
    }
    
    await tsrClient.end();
    
  } catch (error) {
    console.error('❌ Erreur TSR:', error.message);
  }
  
  console.log('\n🎉 VÉRIFICATION FINALE TERMINÉE !');
}

checkFinalData();