// Test login via API
const http = require('http');

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
    'Content-Length': data.length
  }
};

console.log('\n🔐 Test de connexion à l\'API...');
console.log('   URL: http://localhost:3002/api/auth/login');
console.log('   Email: admin@topsteel.fr');
console.log('   Password: Admin2025!\n');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}\n`);

  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('Response body:');
    try {
      const parsed = JSON.parse(body);
      console.log(JSON.stringify(parsed, null, 2));

      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('\n✅ LOGIN RÉUSSI!');
        if (parsed.accessToken) {
          console.log('   Access Token reçu:', parsed.accessToken.substring(0, 50) + '...');
        }
      } else {
        console.log('\n❌ LOGIN ÉCHOUÉ!');
        console.log('   Message:', parsed.message || 'Erreur inconnue');
      }
    } catch (err) {
      console.log(body);
      console.log('\n❌ Erreur de parsing:', err.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erreur de connexion:', error.message);
  console.log('\n💡 Vérifiez que l\'API tourne sur http://localhost:3002');
});

req.write(data);
req.end();
