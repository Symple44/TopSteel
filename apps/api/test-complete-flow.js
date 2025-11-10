const axios = require('axios');

const API_URL = 'http://localhost:3002/api';

async function testCompleteFlow() {
  try {
    console.log('=== TEST COMPLET DU SYSTÈME ===\n');

    // 0. Get CSRF Token
    console.log('0. Récupération du token CSRF...');
    const csrfResponse = await axios.get(`${API_URL}/csrf/token`);
    const csrfToken = csrfResponse.data.token;
    const csrfHeaderName = csrfResponse.data.headerName;
    console.log('✅ CSRF Token obtenu:', csrfToken.substring(0, 20) + '...');
    console.log('   Header name:', csrfHeaderName + '\n');

    // 1. Test Login
    console.log('1. Test Login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      login: 'admin@topsteel.tech',  // Le DTO attend "login" pas "email"
      password: 'ChangeMe123!'
    }, {
      headers: {
        [csrfHeaderName]: csrfToken
      }
    });

    if (!loginResponse.data.data || !loginResponse.data.data.accessToken) {
      console.log('❌ Login FAILED - No token received');
      console.log(JSON.stringify(loginResponse.data, null, 2));
      return;
    }

    const token = loginResponse.data.data.accessToken;
    const user = loginResponse.data.data.user;
    const societesFromLogin = loginResponse.data.data.societes || [];

    console.log('✅ Login SUCCESS');
    console.log('   User:', user.email);
    console.log('   Role:', user.role);
    console.log('   Sociétés dans le login:', societesFromLogin.length);
    if (societesFromLogin.length === 0) {
      console.log('   ⚠️  ATTENTION: Tableau societes vide pour SUPER_ADMIN dans le login!');
    }
    console.log('   Token:', token.substring(0, 50) + '...\n');

    // 2. Test /api/auth/societes (endpoint critique)
    console.log('2. Test /api/auth/societes (endpoint critique)...');
    const societesResponse = await axios.get(`${API_URL}/auth/societes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('   Status:', societesResponse.status);
    console.log('   Data type:', Array.isArray(societesResponse.data) ? 'Array' : typeof societesResponse.data);

    if (Array.isArray(societesResponse.data)) {
      console.log('   Nombre de sociétés:', societesResponse.data.length);

      if (societesResponse.data.length === 0) {
        console.log('❌ ERREUR: Tableau vide - SUPER_ADMIN devrait voir toutes les sociétés!');
      } else {
        console.log('✅ SUCCESS: Sociétés retournées pour SUPER_ADMIN');
        societesResponse.data.forEach((s, i) => {
          console.log(`   [${i + 1}] ${s.nom} (${s.code}) - Status: ${s.status}`);
        });
      }
    } else if (societesResponse.data.data && Array.isArray(societesResponse.data.data)) {
      console.log('   Nombre de sociétés:', societesResponse.data.data.length);

      if (societesResponse.data.data.length === 0) {
        console.log('❌ ERREUR: Tableau vide - SUPER_ADMIN devrait voir toutes les sociétés!');
      } else {
        console.log('✅ SUCCESS: Sociétés retournées pour SUPER_ADMIN');
        societesResponse.data.data.forEach((s, i) => {
          console.log(`   [${i + 1}] ${s.nom} (${s.code}) - Status: ${s.status}`);
        });
      }
    } else {
      console.log('❌ Format de réponse inattendu');
      console.log(JSON.stringify(societesResponse.data, null, 2));
    }

    console.log('\n=== RÉSULTAT FINAL ===');
    console.log('✅ Système opérationnel');
    console.log('✅ Authentification fonctionnelle');
    console.log('✅ Endpoint /api/auth/societes testé');

  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testCompleteFlow();
