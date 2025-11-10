const https = require('http');

async function testAuth() {
  try {
    // 1. Get CSRF token
    console.log('🔐 Getting CSRF token...');
    const csrfResponse = await fetch('http://localhost:3002/api/csrf/token');
    const csrfData = await csrfResponse.json();
    console.log('✅ CSRF Token:', csrfData.token.substring(0, 20) + '...');
    
    // 2. Login
    console.log('\n👤 Testing login...');
    const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfData.token
      },
      body: JSON.stringify({
        email: 'admin@topsteel.fr',
        password: 'Admin2025!'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Status:', loginResponse.status);
    console.log('Response:', JSON.stringify(loginData, null, 2));
    
    if (loginResponse.ok && loginData.data?.accessToken) {
      console.log('\n✅ LOGIN SUCCESSFUL!');
      console.log('Access Token:', loginData.data.accessToken.substring(0, 50) + '...');
      console.log('User:', loginData.data.user.email);
      console.log('Role:', loginData.data.user.role);
      return true;
    } else {
      console.log('\n❌ LOGIN FAILED');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

testAuth();
