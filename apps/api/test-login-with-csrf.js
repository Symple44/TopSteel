// Test login with CSRF token
const http = require('http');

async function getCsrfToken() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/csrf/token',
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(body);
            resolve(parsed.token);
          } catch (err) {
            reject(new Error('Failed to parse CSRF response'));
          }
        } else {
          reject(new Error(`CSRF endpoint returned ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function login(csrfToken) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: 'admin@topsteel.fr',
      password: 'Admin2025!'
    });

    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'x-csrf-token': csrfToken,
      }
    };

    console.log('\n🔐 Test de connexion avec CSRF token...');
    console.log(`   CSRF Token: ${csrfToken.substring(0, 20)}...`);
    console.log('   Email: admin@topsteel.fr');
    console.log('   Password: Admin2025!\n');

    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);

      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        console.log('\nResponse body:');
        try {
          const parsed = JSON.parse(body);
          console.log(JSON.stringify(parsed, null, 2));

          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('\n✅ LOGIN RÉUSSI!');
            if (parsed.accessToken) {
              console.log('   Access Token:', parsed.accessToken.substring(0, 50) + '...');
            }
            if (parsed.user) {
              console.log('   User ID:', parsed.user.id);
              console.log('   Email:', parsed.user.email);
              console.log('   Role:', parsed.user.role);
            }
          } else {
            console.log('\n❌ LOGIN ÉCHOUÉ!');
            console.log('   Message:', parsed.message || 'Erreur inconnue');
          }
          resolve(parsed);
        } catch (err) {
          console.log(body);
          console.log('\n❌ Erreur de parsing:', err.message);
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testLogin() {
  try {
    console.log('\n📋 Étape 1: Récupération du token CSRF...');
    const csrfToken = await getCsrfToken();
    console.log('   ✅ Token CSRF récupéré:', csrfToken.substring(0, 20) + '...');

    console.log('\n📋 Étape 2: Tentative de connexion...');
    await login(csrfToken);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

testLogin();
