const { Client } = require('pg');

async function checkMenus() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'erp_topsteel_auth',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    console.log('✅ Connecté à la base de données\n');

    // 1. Vérifier tous les menus
    console.log('📋 Tous les menus dans la base:');
    console.log('================================');
    
    const allMenusQuery = `
      SELECT 
        id,
        title,
        "programId",
        type,
        "isVisible",
        "configId"
      FROM menu_items
      ORDER BY title
      LIMIT 20
    `;
    
    const allMenusResult = await client.query(allMenusQuery);
    
    if (allMenusResult.rows.length > 0) {
      allMenusResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.title}`);
        console.log(`   ID: ${row.id}`);
        console.log(`   Program: ${row.programId || 'N/A'}`);
        console.log(`   Type: ${row.type}`);
        console.log(`   Visible: ${row.isVisible}`);
        console.log('');
      });
    } else {
      console.log('❌ Aucun menu trouvé dans la base');
    }

    // 2. Rechercher spécifiquement "Articles"
    console.log('\n🔍 Recherche spécifique "Articles":');
    console.log('====================================');
    
    const searchQuery = `
      SELECT 
        id,
        title,
        "programId",
        type,
        "isVisible"
      FROM menu_items
      WHERE 
        LOWER(title) LIKE '%article%'
        OR LOWER("programId") LIKE '%article%'
    `;
    
    const searchResult = await client.query(searchQuery);
    
    if (searchResult.rows.length > 0) {
      console.log(`✅ ${searchResult.rows.length} menu(s) trouvé(s) contenant "article":`);
      searchResult.rows.forEach((row) => {
        console.log(`\n- ${row.title}`);
        console.log(`  ID: ${row.id}`);
        console.log(`  Program: ${row.programId || 'N/A'}`);
        console.log(`  Visible: ${row.isVisible}`);
      });
    } else {
      console.log('❌ Aucun menu contenant "article" trouvé');
    }

    // 3. Rechercher dans programId
    console.log('\n🔍 Menus avec programId contenant "inventory":');
    console.log('==============================================');
    
    const inventoryQuery = `
      SELECT 
        id,
        title,
        "programId",
        "isVisible"
      FROM menu_items
      WHERE 
        "programId" LIKE '%inventory%'
    `;
    
    const inventoryResult = await client.query(inventoryQuery);
    
    if (inventoryResult.rows.length > 0) {
      console.log(`✅ ${inventoryResult.rows.length} menu(s) trouvé(s):`);
      inventoryResult.rows.forEach((row) => {
        console.log(`\n- ${row.title}`);
        console.log(`  Program: ${row.programId}`);
        console.log(`  Visible: ${row.isVisible}`);
      });
    } else {
      console.log('❌ Aucun menu avec programId "inventory" trouvé');
    }

    // 4. Compter le total
    console.log('\n📊 Statistiques:');
    console.log('================');
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN "isVisible" = true THEN 1 END) as visible,
        COUNT(CASE WHEN "isVisible" = false THEN 1 END) as hidden
      FROM menu_items
    `;
    
    const statsResult = await client.query(statsQuery);
    const stats = statsResult.rows[0];
    
    console.log(`Total menus: ${stats.total}`);
    console.log(`Menus visibles: ${stats.visible}`);
    console.log(`Menus cachés: ${stats.hidden}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ Connexion fermée');
  }
}

checkMenus();