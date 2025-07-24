require('dotenv').config({ path: '../../.env.local' });
const { Client } = require('pg');

async function checkStructure() {
  const authClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'erp_topsteel_auth',
  });

  try {
    await authClient.connect();
    
    console.log('📊 STRUCTURE DE LA TABLE SOCIETES:\n');
    
    const structure = await authClient.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'sites' 
      ORDER BY ordinal_position;
    `);
    
    structure.rows.forEach(col => {
      console.log(`   • ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'nullable' : 'not null'}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await authClient.end();
  }
}

checkStructure();