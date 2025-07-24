require('dotenv').config({ path: '../../.env.local' });
const { Client } = require('pg');

async function checkTenantData() {
  const authClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'erp_topsteel_auth',
  });

  try {
    await authClient.connect();
    
    console.log('📊 VÉRIFICATION DES DONNÉES MULTI-TENANT\n');
    
    // Vérifier les sociétés
    const societes = await authClient.query('SELECT id, nom, code, status FROM societes');
    console.log('🏢 SOCIÉTÉS:');
    societes.rows.forEach(s => {
      console.log(`   • ${s.nom} (${s.code}) - ${s.status}`);
    });
    
    // Vérifier les utilisateurs
    const users = await authClient.query('SELECT id, nom, prenom, email FROM users');
    console.log('\n👥 UTILISATEURS:');
    users.rows.forEach(u => {
      console.log(`   • ${u.nom} ${u.prenom} (${u.email})`);
    });
    
    // Vérifier les sites
    const sites = await authClient.query('SELECT id, nom, societe_id FROM sites');
    console.log('\n🏪 SITES:');
    sites.rows.forEach(s => {
      console.log(`   • ${s.nom} (société: ${s.societe_id})`);
    });
    
    console.log('\n✅ Vérification terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await authClient.end();
  }
}

checkTenantData();