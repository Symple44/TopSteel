const { Pool } = require('pg');

async function testEntityConnection() {
  const authDbName = process.env.DB_AUTH_NAME || 'erp_topsteel_auth';
  
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: authDbName
  });

  try {
    console.log(`🔍 Test de l'entité UserMenuPreference dans ${authDbName}:`);
    
    // Test basic connection
    await pool.query('SELECT 1');
    console.log('✅ Connexion à la base de données réussie');
    
    // Check if table exists and has correct structure
    const tableInfo = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_menu_preference_items'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log(`📋 Structure de la table user_menu_preference_items:`);
    tableInfo.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Test insert with the structure expected by UserMenuPreference entity
    const testUserId = '0d2f2574-0ddf-4e50-ac45-58f7391367c8'; // Same as in the logs
    const testMenuId = '__custom_menu__';
    const testData = JSON.stringify({
      type: 'custom_menu_data',
      menuItems: [
        {
          id: 'test-1',
          title: 'Test Item',
          type: 'P',
          programId: '/test',
          orderIndex: 0,
          isVisible: true,
          children: []
        }
      ],
      savedAt: new Date().toISOString()
    });
    
    console.log(`🧪 Test d'insertion avec les données du service...`);
    
    // Delete any existing test data first
    await pool.query(`
      DELETE FROM user_menu_preference_items 
      WHERE user_id = $1 AND menu_id = $2
    `, [testUserId, testMenuId]);
    
    // Insert test data as the service would
    const insertResult = await pool.query(`
      INSERT INTO user_menu_preference_items (user_id, menu_id, is_visible, "order", custom_label)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [testUserId, testMenuId, true, 0, testData]);
    
    console.log(`✅ Insertion réussie:`, insertResult.rows[0]);
    
    // Test findOne query as the service would
    const findResult = await pool.query(`
      SELECT * FROM user_menu_preference_items
      WHERE user_id = $1 AND menu_id = $2
    `, [testUserId, testMenuId]);
    
    if (findResult.rows.length > 0) {
      console.log(`✅ Lecture réussie:`, findResult.rows[0]);
      
      // Test JSON parsing
      try {
        const parsedData = JSON.parse(findResult.rows[0].custom_label);
        console.log(`✅ Parsing JSON réussi:`, parsedData.menuItems.length, 'items');
      } catch (parseError) {
        console.log(`❌ Erreur de parsing JSON:`, parseError.message);
      }
    } else {
      console.log(`❌ Échec de la lecture`);
    }
    
    // Clean up
    await pool.query(`
      DELETE FROM user_menu_preference_items 
      WHERE user_id = $1 AND menu_id = $2
    `, [testUserId, testMenuId]);
    console.log(`🧹 Nettoyage effectué`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

testEntityConnection();