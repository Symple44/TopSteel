async function testEndpoints() {
  const baseUrl = 'http://localhost:3002';

  // Get CSRF and login first
  const csrfResp = await fetch(baseUrl + '/api/csrf/token');
  const csrfData = await csrfResp.json();
  const csrfToken = csrfData.token;

  const loginResp = await fetch(baseUrl + '/api/auth/login', {
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
  const accessToken = loginData.data.accessToken;

  const endpoints = [
    { name: 'Health', url: '/api/health', method: 'GET' },
    { name: 'Profile', url: '/api/auth/profile', method: 'GET', auth: true },
    { name: 'Societes', url: '/api/auth/societes', method: 'GET', auth: true },
    { name: 'Version', url: '/api/version', method: 'GET' },
  ];

  console.log('\n📡 Testing Critical Endpoints:\n');

  for (const endpoint of endpoints) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (endpoint.auth) {
        headers['Authorization'] = 'Bearer ' + accessToken;
      }

      const response = await fetch(baseUrl + endpoint.url, {
        method: endpoint.method,
        headers
      });

      const status = response.status;
      const statusIcon = status === 200 ? '✅' : '❌';
      console.log(statusIcon + ' ' + endpoint.name + ' (' + endpoint.method + ') ' + endpoint.url + ' -> ' + status);
    } catch (error) {
      console.log('❌ ' + endpoint.name + ' -> ERROR: ' + error.message);
    }
  }

  console.log('\n✅ All critical endpoints tested!\n');
}

testEndpoints();
