#!/usr/bin/env node

/**
 * Script de test du système de recherche globale TopSteel
 * Teste ElasticSearch et l'API de recherche
 */

const http = require('http');
const https = require('https');

// Configuration
const API_URL = 'http://localhost:3002';
const ES_URL = 'http://localhost:9200';
const ES_AUTH = 'elastic:ogAceYjRKTIMmACWwhRA';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Fonction pour faire une requête HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// Tests
async function runTests() {
  console.log(colors.cyan + '════════════════════════════════════════════════════════');
  console.log('     🔍 TEST DU SYSTÈME DE RECHERCHE GLOBALE TOPSTEEL');
  console.log('════════════════════════════════════════════════════════' + colors.reset);
  console.log();

  let token = null;
  let allTestsPassed = true;

  // Test 1: ElasticSearch
  console.log(colors.blue + '📊 Test 1: Vérification d\'ElasticSearch' + colors.reset);
  try {
    const auth = Buffer.from(ES_AUTH).toString('base64');
    const response = await makeRequest(`${ES_URL}/_cluster/health`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    
    if (response.status === 200 && response.data.status) {
      console.log(colors.green + '   ✅ ElasticSearch opérationnel' + colors.reset);
      console.log(colors.gray + `      Status: ${response.data.status}` + colors.reset);
      console.log(colors.gray + `      Cluster: ${response.data.cluster_name}` + colors.reset);
      console.log(colors.gray + `      Nodes: ${response.data.number_of_nodes}` + colors.reset);
    } else {
      console.log(colors.red + '   ❌ ElasticSearch non disponible' + colors.reset);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(colors.red + '   ❌ Erreur de connexion à ElasticSearch' + colors.reset);
    console.log(colors.gray + `      ${error.message}` + colors.reset);
    allTestsPassed = false;
  }
  console.log();

  // Test 2: Index de recherche
  console.log(colors.blue + '📑 Test 2: Vérification de l\'index topsteel_global_search' + colors.reset);
  try {
    const auth = Buffer.from(ES_AUTH).toString('base64');
    const response = await makeRequest(`${ES_URL}/topsteel_global_search/_stats`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    
    if (response.status === 200) {
      const docCount = response.data._all?.primaries?.docs?.count || 0;
      console.log(colors.green + '   ✅ Index existe' + colors.reset);
      console.log(colors.gray + `      Documents: ${docCount}` + colors.reset);
      console.log(colors.gray + `      Taille: ${response.data._all?.primaries?.store?.size_in_bytes || 0} bytes` + colors.reset);
      
      if (docCount === 0) {
        console.log(colors.yellow + '   ⚠️  L\'index est vide (normal si première utilisation)' + colors.reset);
      }
    } else if (response.status === 404) {
      console.log(colors.yellow + '   ⚠️  Index non trouvé - création nécessaire' + colors.reset);
      
      // Tentative de création
      console.log(colors.gray + '      Tentative de création...' + colors.reset);
      const createResponse = await makeRequest(`${ES_URL}/topsteel_global_search`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settings: {
            analysis: {
              analyzer: {
                french_analyzer: {
                  type: 'standard',
                  stopwords: '_french_'
                }
              }
            }
          },
          mappings: {
            properties: {
              type: { type: 'keyword' },
              id: { type: 'keyword' },
              title: { type: 'text', analyzer: 'french_analyzer' }
            }
          }
        })
      });
      
      if (createResponse.status === 200) {
        console.log(colors.green + '      ✅ Index créé avec succès' + colors.reset);
      }
    }
  } catch (error) {
    console.log(colors.red + '   ❌ Erreur lors de la vérification de l\'index' + colors.reset);
    console.log(colors.gray + `      ${error.message}` + colors.reset);
    allTestsPassed = false;
  }
  console.log();

  // Test 3: API Backend
  console.log(colors.blue + '🔌 Test 3: Vérification de l\'API Backend' + colors.reset);
  try {
    const response = await makeRequest(`${API_URL}/api/health`);
    
    if (response.status === 200) {
      console.log(colors.green + '   ✅ API Backend accessible' + colors.reset);
    } else {
      console.log(colors.yellow + '   ⚠️  API Backend répond avec status ' + response.status + colors.reset);
    }
  } catch (error) {
    console.log(colors.red + '   ❌ API Backend non accessible' + colors.reset);
    console.log(colors.gray + `      Vérifiez que le serveur est démarré sur le port 3002` + colors.reset);
    allTestsPassed = false;
  }
  console.log();

  // Test 4: Authentification
  console.log(colors.blue + '🔐 Test 4: Authentification' + colors.reset);
  const credentials = [
    { email: 'admin@topsteel.com', password: 'Admin123!@#' },
    { email: 'admin@topsteel.com', password: 'TopSteel2024!' },
    { email: 'admin@topsteel.fr', password: 'Admin123!@#' },
    { email: 'test@test.com', password: 'Test123!' }
  ];

  for (const cred of credentials) {
    try {
      console.log(colors.gray + `   Tentative avec: ${cred.email}` + colors.reset);
      const response = await makeRequest(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cred)
      });
      
      if (response.status === 200 || response.status === 201) {
        console.log(colors.green + `   ✅ Authentification réussie avec ${cred.email}` + colors.reset);
        token = response.data.token || response.data.access_token || response.data.data?.token;
        if (token) {
          console.log(colors.gray + `      Token obtenu: ${token.substring(0, 20)}...` + colors.reset);
        }
        break;
      }
    } catch (error) {
      // Continuer avec les autres credentials
    }
  }

  if (!token) {
    console.log(colors.yellow + '   ⚠️  Impossible de s\'authentifier' + colors.reset);
    console.log(colors.gray + '      Les tests suivants peuvent échouer' + colors.reset);
  }
  console.log();

  // Test 5: Endpoint de recherche
  console.log(colors.blue + '🔍 Test 5: Endpoint de recherche globale' + colors.reset);
  try {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await makeRequest(`${API_URL}/api/search/global?q=test`, { headers });
    
    if (response.status === 200) {
      console.log(colors.green + '   ✅ Endpoint de recherche accessible' + colors.reset);
      
      if (response.data.data) {
        const data = response.data.data;
        console.log(colors.gray + `      Moteur: ${data.searchEngine || 'non spécifié'}` + colors.reset);
        console.log(colors.gray + `      Résultats: ${data.total || 0}` + colors.reset);
        console.log(colors.gray + `      Temps: ${data.took || 0}ms` + colors.reset);
        
        if (data.searchEngine === 'elasticsearch') {
          console.log(colors.green + '   🚀 ElasticSearch est utilisé!' + colors.reset);
        } else if (data.searchEngine === 'postgresql') {
          console.log(colors.yellow + '   ⚠️  PostgreSQL est utilisé (fallback)' + colors.reset);
        }
      }
    } else if (response.status === 404) {
      console.log(colors.red + '   ❌ Endpoint non trouvé' + colors.reset);
      console.log(colors.gray + '      Le module de recherche n\'est pas chargé' + colors.reset);
      console.log(colors.gray + '      Redémarrez le serveur API' + colors.reset);
      allTestsPassed = false;
    } else if (response.status === 401) {
      console.log(colors.yellow + '   ⚠️  Authentification requise' + colors.reset);
    } else {
      console.log(colors.red + '   ❌ Erreur ' + response.status + colors.reset);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(colors.red + '   ❌ Erreur lors du test de recherche' + colors.reset);
    console.log(colors.gray + `      ${error.message}` + colors.reset);
    allTestsPassed = false;
  }
  console.log();

  // Test 6: Status du moteur de recherche
  console.log(colors.blue + '⚙️  Test 6: Status du moteur de recherche' + colors.reset);
  try {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await makeRequest(`${API_URL}/api/search/status`, { headers });
    
    if (response.status === 200 && response.data.data) {
      const status = response.data.data;
      console.log(colors.green + '   ✅ Status endpoint accessible' + colors.reset);
      console.log(colors.gray + `      Moteur actif: ${status.engine}` + colors.reset);
      console.log(colors.gray + `      Disponible: ${status.available}` + colors.reset);
      if (status.info) {
        console.log(colors.gray + `      Info: ${status.info}` + colors.reset);
      }
    } else if (response.status === 404) {
      console.log(colors.red + '   ❌ Endpoint status non trouvé' + colors.reset);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(colors.red + '   ❌ Erreur lors de la vérification du status' + colors.reset);
    allTestsPassed = false;
  }
  console.log();

  // Test 7: Test de recherche avec données
  if (token) {
    console.log(colors.blue + '📝 Test 7: Recherche avec différents termes' + colors.reset);
    const searchTerms = ['menu', 'client', 'article', 'admin', 'test'];
    
    for (const term of searchTerms) {
      try {
        const response = await makeRequest(`${API_URL}/api/search/global?q=${term}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 200 && response.data.data) {
          const results = response.data.data.results || [];
          console.log(colors.gray + `   Recherche "${term}": ${results.length} résultat(s)` + colors.reset);
          
          if (results.length > 0) {
            console.log(colors.green + `      ✓ Types trouvés: ${[...new Set(results.map(r => r.type))].join(', ')}` + colors.reset);
          }
        }
      } catch (error) {
        console.log(colors.gray + `   Erreur pour "${term}"` + colors.reset);
      }
    }
    console.log();
  }

  // Résumé
  console.log(colors.cyan + '════════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.cyan + '                      📊 RÉSUMÉ' + colors.reset);
  console.log(colors.cyan + '════════════════════════════════════════════════════════' + colors.reset);
  console.log();

  if (allTestsPassed) {
    console.log(colors.green + '✅ Tous les tests critiques sont passés!' + colors.reset);
    console.log(colors.green + '   Le système de recherche est opérationnel.' + colors.reset);
  } else {
    console.log(colors.yellow + '⚠️  Certains tests ont échoué.' + colors.reset);
    console.log();
    console.log(colors.yellow + 'Actions recommandées:' + colors.reset);
    console.log(colors.gray + '1. Vérifiez que le serveur API est démarré (pnpm dev)' + colors.reset);
    console.log(colors.gray + '2. Redémarrez le serveur pour charger le module de recherche' + colors.reset);
    console.log(colors.gray + '3. Vérifiez les variables d\'environnement dans .env' + colors.reset);
    console.log(colors.gray + '4. Assurez-vous qu\'ElasticSearch est démarré' + colors.reset);
  }

  console.log();
  console.log(colors.cyan + '════════════════════════════════════════════════════════' + colors.reset);
}

// Lancer les tests
console.log();
runTests().catch(error => {
  console.error(colors.red + 'Erreur fatale:', error.message + colors.reset);
  process.exit(1);
});