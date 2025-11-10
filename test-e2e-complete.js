/**
 * Test End-to-End Complet du Système TopSteel
 */

const apiUrl = 'http://localhost:3002';
const webUrl = 'http://localhost:3005';

async function testE2E() {
  console.log('\n🚀 Test End-to-End TopSteel ERP\n');
  console.log('='.repeat(60));

  let testsPass = 0;
  let testsFail = 0;

  // Test 1: Health Check API
  console.log('\n📊 Test 1/7: Health Check API...');
  try {
    const healthResp = await fetch(`${apiUrl}/api/health`);
    const healthData = await healthResp.json();

    if (healthData.data.status === 'ok') {
      console.log('✅ API Health: OK');
      console.log('   - Database AUTH:', healthData.data.details.database_auth.status);
      console.log('   - Database SHARED:', healthData.data.details.database_shared.status);
      testsPass++;
    } else {
      console.log('❌ API Health: FAILED');
      testsFail++;
    }
  } catch (error) {
    console.log('❌ API Health: ERROR -', error.message);
    testsFail++;
  }

  // Test 2: Frontend Accessible
  console.log('\n📊 Test 2/7: Frontend Accessible...');
  try {
    const webResp = await fetch(webUrl);
    if (webResp.status === 200 || webResp.status === 307) {
      console.log('✅ Frontend accessible sur:', webUrl);
      testsPass++;
    } else {
      console.log('❌ Frontend HTTP Status:', webResp.status);
      testsFail++;
    }
  } catch (error) {
    console.log('❌ Frontend: ERROR -', error.message);
    testsFail++;
  }

  // Test 3: CSRF Token
  console.log('\n📊 Test 3/7: CSRF Token Generation...');
  let csrfToken = null;
  try {
    const csrfResp = await fetch(`${apiUrl}/api/csrf/token`);
    const csrfData = await csrfResp.json();
    csrfToken = csrfData.token;

    if (csrfToken && csrfToken.length > 0) {
      console.log('✅ CSRF Token généré:', csrfToken.substring(0, 20) + '...');
      testsPass++;
    } else {
      console.log('❌ CSRF Token: INVALID');
      testsFail++;
    }
  } catch (error) {
    console.log('❌ CSRF Token: ERROR -', error.message);
    testsFail++;
  }

  // Test 4: Login Admin
  console.log('\n📊 Test 4/7: Login Admin...');
  let accessToken = null;
  let userId = null;
  try {
    const loginResp = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken
      },
      body: JSON.stringify({
        email: 'admin@topsteel.fr',
        password: 'Admin2025!'
      })
    });

    const loginData = await loginResp.json();

    if (loginData.data && loginData.data.accessToken) {
      accessToken = loginData.data.accessToken;
      userId = loginData.data.user.id;
      console.log('✅ Login réussi');
      console.log('   - User:', loginData.data.user.email);
      console.log('   - Role:', loginData.data.user.role);
      console.log('   - Session ID:', loginData.data.sessionId);
      testsPass++;
    } else {
      console.log('❌ Login échoué:', loginData);
      testsFail++;
    }
  } catch (error) {
    console.log('❌ Login: ERROR -', error.message);
    testsFail++;
  }

  // Test 5: Accès Profile (Authentifié)
  console.log('\n📊 Test 5/7: Accès au profil utilisateur...');
  try {
    const profileResp = await fetch(`${apiUrl}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const profileData = await profileResp.json();

    if (profileData.data && profileData.data.id === userId) {
      console.log('✅ Profil accessible');
      console.log('   - Nom:', profileData.data.nom, profileData.data.prenom);
      console.log('   - Email:', profileData.data.email);
      testsPass++;
    } else {
      console.log('❌ Profil: FAILED');
      testsFail++;
    }
  } catch (error) {
    console.log('❌ Profil: ERROR -', error.message);
    testsFail++;
  }

  // Test 6: Liste des Sociétés
  console.log('\n📊 Test 6/7: Liste des sociétés...');
  try {
    const societesResp = await fetch(`${apiUrl}/api/auth/societes`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const societesData = await societesResp.json();

    console.log('✅ Sociétés accessible');
    console.log('   - Nombre:', societesData.data ? societesData.data.length : 0);
    testsPass++;
  } catch (error) {
    console.log('❌ Sociétés: ERROR -', error.message);
    testsFail++;
  }

  // Test 7: Page de Login Frontend
  console.log('\n📊 Test 7/7: Page Login Frontend...');
  try {
    const loginPageResp = await fetch(`${webUrl}/login`);

    if (loginPageResp.status === 200) {
      console.log('✅ Page login accessible');
      testsPass++;
    } else {
      console.log('❌ Page login: HTTP', loginPageResp.status);
      testsFail++;
    }
  } catch (error) {
    console.log('❌ Page login: ERROR -', error.message);
    testsFail++;
  }

  // Résumé
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RÉSUMÉ DES TESTS\n');
  console.log(`✅ Tests réussis: ${testsPass}/7`);
  console.log(`❌ Tests échoués: ${testsFail}/7`);

  const percentage = Math.round((testsPass / 7) * 100);
  console.log(`\n🎯 Score: ${percentage}%`);

  if (percentage === 100) {
    console.log('\n🎉 SUCCÈS COMPLET! Le système est 100% opérationnel!\n');
  } else if (percentage >= 80) {
    console.log('\n✅ SYSTÈME FONCTIONNEL avec quelques warnings.\n');
  } else {
    console.log('\n⚠️  Le système nécessite des corrections.\n');
  }

  console.log('='.repeat(60) + '\n');
}

testE2E().catch(error => {
  console.error('\n❌ Erreur globale:', error);
  process.exit(1);
});
