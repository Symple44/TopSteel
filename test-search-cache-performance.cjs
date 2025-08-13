const axios = require('axios');

const API_URL = 'http://localhost:3002/api';

async function testSearchCachePerformance() {
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

    // Test 1: Statistiques du cache
    console.log('📊 Statistiques du cache:');
    console.log('========================');
    
    try {
      const statsResponse = await axios.get(
        `${API_URL}/search/cache/statistics`,
        authConfig
      );
      
      const stats = statsResponse.data.data;
      console.log(`Hits: ${stats.hits}`);
      console.log(`Misses: ${stats.misses}`);
      console.log(`Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%`);
      console.log(`Total Keys: ${stats.totalKeys}`);
      console.log(`Memory Usage: ${stats.memoryUsage} bytes`);
    } catch (error) {
      console.log('❌ Impossible de récupérer les statistiques');
    }

    // Test 2: Performance avec cache
    console.log('\n\n⚡ Test de performance avec cache:');
    console.log('====================================');
    
    const searchQuery = 'articles';
    const iterations = 5;
    const timings = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      try {
        await axios.get(
          `${API_URL}/search/global?q=${searchQuery}`,
          authConfig
        );
        
        const elapsed = Date.now() - startTime;
        timings.push(elapsed);
        
        if (i === 0) {
          console.log(`Première requête (cache miss): ${elapsed}ms`);
        } else {
          console.log(`Requête ${i + 1} (cache hit): ${elapsed}ms`);
        }
      } catch (error) {
        console.log(`Requête ${i + 1}: Erreur`);
      }
    }
    
    // Calculer les statistiques
    const firstRequest = timings[0];
    const cachedRequests = timings.slice(1);
    const avgCached = cachedRequests.reduce((a, b) => a + b, 0) / cachedRequests.length;
    const speedup = firstRequest / avgCached;
    
    console.log('\n📈 Résultats:');
    console.log(`Temps première requête: ${firstRequest}ms`);
    console.log(`Temps moyen avec cache: ${avgCached.toFixed(2)}ms`);
    console.log(`Amélioration: ${speedup.toFixed(2)}x plus rapide`);
    console.log(`Réduction: ${(firstRequest - avgCached).toFixed(2)}ms économisés`);

    // Test 3: Test d'invalidation
    console.log('\n\n🔄 Test d\'invalidation du cache:');
    console.log('==================================');
    
    try {
      // Clear cache
      await axios.delete(
        `${API_URL}/search/cache/clear`,
        authConfig
      );
      console.log('✅ Cache vidé');
      
      // Première requête après invalidation
      const start1 = Date.now();
      await axios.get(`${API_URL}/search/global?q=${searchQuery}`, authConfig);
      const time1 = Date.now() - start1;
      console.log(`Première requête après invalidation: ${time1}ms`);
      
      // Deuxième requête (devrait être en cache)
      const start2 = Date.now();
      await axios.get(`${API_URL}/search/global?q=${searchQuery}`, authConfig);
      const time2 = Date.now() - start2;
      console.log(`Deuxième requête (cache): ${time2}ms`);
      
      if (time2 < time1) {
        console.log(`✅ Cache fonctionne: ${((time1 - time2) / time1 * 100).toFixed(0)}% plus rapide`);
      }
    } catch (error) {
      console.log('❌ Erreur lors du test d\'invalidation');
    }

    // Test 4: Requêtes populaires
    console.log('\n\n🔥 Requêtes populaires:');
    console.log('=======================');
    
    try {
      const popularResponse = await axios.get(
        `${API_URL}/search/cache/popular-queries`,
        authConfig
      );
      
      const popular = popularResponse.data.data;
      if (popular && popular.length > 0) {
        popular.slice(0, 5).forEach((query, index) => {
          console.log(`${index + 1}. "${query.query}" - ${query.count} fois`);
        });
      } else {
        console.log('Aucune requête populaire enregistrée');
      }
    } catch (error) {
      console.log('❌ Impossible de récupérer les requêtes populaires');
    }

    // Test 5: Configuration du cache
    console.log('\n\n⚙️ Configuration du cache:');
    console.log('==========================');
    
    try {
      const configResponse = await axios.get(
        `${API_URL}/search/cache/config`,
        authConfig
      );
      
      const config = configResponse.data.data;
      console.log(`Cache activé: ${config.enabled ? 'Oui' : 'Non'}`);
      console.log(`TTL par défaut: ${config.defaultTTL}s`);
      console.log(`Préfixe des clés: ${config.keyPrefix}`);
      console.log(`Limite requêtes populaires: ${config.popularSearchesLimit}`);
    } catch (error) {
      console.log('❌ Impossible de récupérer la configuration');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    if (error.response) {
      console.error('   Détails:', error.response.data);
    }
  }
}

// Lancer le test
testSearchCachePerformance();