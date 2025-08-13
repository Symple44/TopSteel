import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env' });

const authDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE_AUTH || 'erp_topsteel_auth',
});

async function testMenuSearch() {
  try {
    await authDataSource.initialize();
    console.log('✅ Connexion établie\n');

    // La requête SQL exacte générée par notre système
    const searchQuery = `
      SELECT 
        id::text as id, 
        "title", 
        "programId", 
        "type"
      FROM menu_items
      WHERE ("title" ILIKE $1 OR "programId" ILIKE $2)
        AND "isVisible" = true 
      LIMIT 20
    `;
    
    const searchTerms = [
      'articles',
      'article', 
      'Article',
      'ARTICLES',
      'arti',
      'inventory'
    ];

    console.log('🔍 Test de recherche avec la requête SQL exacte du système:\n');
    console.log('Requête:', searchQuery.replace(/\n/g, ' ').trim());
    console.log('\n');

    for (const term of searchTerms) {
      const params = [`%${term}%`, `%${term}%`];
      console.log(`📋 Recherche "${term}":`);
      console.log(`   Paramètres: ['%${term}%', '%${term}%']`);
      
      try {
        const results = await authDataSource.query(searchQuery, params);
        
        if (results.length > 0) {
          console.log(`   ✅ ${results.length} résultat(s) trouvé(s):`);
          results.forEach((row: any) => {
            console.log(`      - ${row.title} (${row.programId})`);
          });
        } else {
          console.log(`   ❌ Aucun résultat`);
        }
      } catch (error: any) {
        console.log(`   ❌ Erreur: ${error.message}`);
      }
      console.log('');
    }

    // Test direct sans ILIKE pour vérifier
    console.log('🔍 Test de vérification directe (sans recherche):');
    const directQuery = `
      SELECT id::text as id, title, "programId", "isVisible"
      FROM menu_items
      WHERE title = 'Articles'
    `;
    
    const directResults = await authDataSource.query(directQuery);
    if (directResults.length > 0) {
      console.log('✅ Menu Articles trouvé directement:');
      directResults.forEach((row: any) => {
        console.log(`   - ${row.title}`);
        console.log(`     ID: ${row.id}`);
        console.log(`     Program: ${row.programId}`);
        console.log(`     Visible: ${row.isVisible}`);
      });
    } else {
      console.log('❌ Menu Articles non trouvé même avec requête directe');
    }

    // Test ILIKE spécifiquement
    console.log('\n🔍 Test ILIKE avec différentes casses:');
    const ilikeCases = [
      { search: 'Articles', expected: 'Articles' },
      { search: 'articles', expected: 'Articles' },
      { search: 'ARTICLES', expected: 'Articles' },
      { search: 'ArTiClEs', expected: 'Articles' },
    ];

    for (const testCase of ilikeCases) {
      const testQuery = `
        SELECT title 
        FROM menu_items 
        WHERE title ILIKE $1
      `;
      const results = await authDataSource.query(testQuery, [`%${testCase.search}%`]);
      const found = results.find((r: any) => r.title === testCase.expected);
      console.log(`   "${testCase.search}" → ${found ? '✅ Trouvé' : '❌ Non trouvé'}`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await authDataSource.destroy();
    console.log('\n✅ Test terminé');
  }
}

testMenuSearch();