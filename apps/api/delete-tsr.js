require('dotenv').config({ path: '../../.env.local' });
const { Client } = require('pg');

async function deleteTSR() {
  console.log('🗑️ SUPPRESSION DE LA SOCIÉTÉ TSR\n');

  const adminClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  });

  const authClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'erp_topsteel_auth',
  });

  try {
    await adminClient.connect();
    await authClient.connect();

    console.log('📊 ÉTAPE 1: Suppression des sites TSR');
    await authClient.query("DELETE FROM sites WHERE societe_id IN (SELECT id FROM societes WHERE code = 'TSR')");
    console.log('✅ Sites TSR supprimés');

    console.log('\n🏢 ÉTAPE 2: Suppression de la société TSR');
    const result = await authClient.query("DELETE FROM societes WHERE code = 'TSR' RETURNING nom");
    if (result.rows.length > 0) {
      console.log(`✅ Société supprimée: ${result.rows[0].nom}`);
    } else {
      console.log('⚠️ Aucune société TSR trouvée');
    }

    console.log('\n💾 ÉTAPE 3: Suppression de la base de données');
    // Fermer les connexions à la base TSR
    await adminClient.query(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = 'erp_topsteel_tsr' AND pid <> pg_backend_pid();
    `);
    
    await adminClient.query('DROP DATABASE IF EXISTS erp_topsteel_tsr');
    console.log('✅ Base de données erp_topsteel_tsr supprimée');

    console.log('\n🎉 SUPPRESSION TSR TERMINÉE !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await adminClient.end();
    await authClient.end();
  }
}

deleteTSR();