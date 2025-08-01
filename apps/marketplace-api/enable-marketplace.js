const { Client } = require('pg');

async function enableMarketplace() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'erp_topsteel_auth'
  });

  try {
    await client.connect();
    console.log('Connected to auth database');
    
    // Update TOPSTEEL société to enable marketplace
    const result = await client.query(`
      UPDATE societes 
      SET configuration = jsonb_set(
        COALESCE(configuration, '{}'),
        '{marketplace}',
        '{"enabled": true, "storeName": "TopSteel Marketplace", "description": "Boutique en ligne TopSteel"}'
      )
      WHERE code = 'TOPSTEEL'
      RETURNING id, code, nom, configuration;
    `);
    
    console.log('✅ Marketplace enabled for TOPSTEEL:', JSON.stringify(result.rows[0], null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

enableMarketplace();