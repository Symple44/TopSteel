const axios = require('axios');

const API_URL = 'http://localhost:3002/api';

async function testArticlesMenuSearch() {
  try {
    console.log('🔐 Authentification...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      login: 'admin@topsteel.tech',
      password: 'TopSteel44!',
    });

    const { accessToken } = loginResponse.data.data;
    console.log('✅ Authentification réussie\n');

    const authConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    // Test 1: Recherche du menu "Articles"
    console.log('🔍 Test 1: Recherche "articles" dans les menus');
    console.log('========================================');
    
    try {
      const searchResponse = await axios.get(
        `${API_URL}/search/menus?q=articles`,
        authConfig
      );
      
      const { data } = searchResponse.data;
      console.log(`Résultats trouvés: ${data.results.length}`);
      console.log(`Total: ${data.total}`);
      console.log(`Moteur: ${data.searchEngine}`);
      
      if (data.results.length > 0) {
        console.log('\n📋 Menus trouvés:');
        data.results.forEach((result, index) => {
          console.log(`${index + 1}. ${result.title}`);
          console.log(`   Type: ${result.type}`);
          console.log(`   URL: ${result.url}`);
          console.log(`   Score: ${result.score || 'N/A'}`);
        });
      } else {
        console.log('❌ Aucun menu trouvé pour "articles"');
      }
    } catch (error) {
      console.error('❌ Erreur de recherche:', error.response?.data || error.message);
    }

    // Test 2: Recherche globale pour "articles"
    console.log('\n\n🔍 Test 2: Recherche globale "articles"');
    console.log('========================================');
    
    try {
      const globalSearchResponse = await axios.get(
        `${API_URL}/search/global?q=articles&types=menu`,
        authConfig
      );
      
      const { data } = globalSearchResponse.data;
      console.log(`Résultats trouvés: ${data.results.length}`);
      console.log(`Total: ${data.total}`);
      console.log(`Moteur: ${data.searchEngine}`);
      
      if (data.results.length > 0) {
        console.log('\n📋 Résultats trouvés:');
        data.results.forEach((result, index) => {
          console.log(`${index + 1}. [${result.type}] ${result.title}`);
          console.log(`   URL: ${result.url}`);
          console.log(`   Score: ${result.score || 'N/A'}`);
        });
      } else {
        console.log('❌ Aucun résultat trouvé pour "articles"');
      }
    } catch (error) {
      console.error('❌ Erreur de recherche globale:', error.response?.data || error.message);
    }

    // Test 3: Vérifier directement dans la base
    console.log('\n\n🔍 Test 3: Requête SQL directe pour menu_items');
    console.log('========================================');
    console.log('Vérification de l\'existence du menu Articles dans la base...');
    console.log('(Cette partie nécessite une connexion directe à la base)');
    
    // Test 4: Recherche avec différentes variantes
    console.log('\n\n🔍 Test 4: Test avec différentes variantes');
    console.log('========================================');
    
    const variants = ['article', 'Article', 'Articles', 'ARTICLES', 'articl'];
    
    for (const variant of variants) {
      try {
        const response = await axios.get(
          `${API_URL}/search/menus?q=${variant}`,
          authConfig
        );
        
        const { data } = response.data;
        console.log(`"${variant}": ${data.results.length} résultat(s)`);
        
        if (data.results.length > 0) {
          console.log(`  -> Trouvé: ${data.results.map(r => r.title).join(', ')}`);
        }
      } catch (error) {
        console.log(`"${variant}": Erreur`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    if (error.response) {
      console.error('   Détails:', error.response.data);
    }
  }
}

// Lancer le test
testArticlesMenuSearch();