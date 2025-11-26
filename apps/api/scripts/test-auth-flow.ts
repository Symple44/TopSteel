/**
 * Test script for auth flow debugging
 * Run with: npx tsx scripts/test-auth-flow.ts
 */

const API_URL = process.env.API_URL || 'http://localhost:3001'

async function testAuthFlow() {
  console.log('=== Testing Auth Flow ===')
  console.log(`API URL: ${API_URL}`)

  try {
    // Step 1: Get CSRF token
    console.log('\n1. Getting CSRF token...')
    const csrfResponse = await fetch(`${API_URL}/api/csrf/token`)
    const csrfData = await csrfResponse.json()

    console.log(`   Status: ${csrfResponse.status}`)
    console.log(`   Token: ${csrfData.token ? 'YES' : 'NO'}`)
    console.log(`   Header name: ${csrfData.headerName}`)

    if (!csrfResponse.ok) {
      console.error('   FAILED: Could not get CSRF token')
      return
    }

    const csrfToken = csrfData.token
    const headerName = csrfData.headerName || 'x-csrf-token'

    // Step 2: Login
    console.log('\n2. Logging in...')
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [headerName]: csrfToken,
      },
      body: JSON.stringify({
        email: 'admin@topsteel.fr',
        password: 'admin123',
      }),
    })

    const loginData = await loginResponse.json()
    console.log(`   Status: ${loginResponse.status}`)
    console.log(`   Response keys: ${Object.keys(loginData).join(', ')}`)

    if (!loginResponse.ok) {
      console.error('   FAILED:', loginData.message || loginData)
      return
    }

    // Extract data (may be wrapped in 'data' by TransformInterceptor)
    const responseData = loginData.data || loginData
    console.log(`   Data keys: ${Object.keys(responseData).join(', ')}`)

    const accessToken = responseData.accessToken
    const user = responseData.user

    console.log(`   Access token: ${accessToken ? `YES (${accessToken.substring(0, 30)}...)` : 'NO'}`)
    console.log(`   User: ${user ? JSON.stringify(user) : 'NO'}`)
    console.log(`   User.isActive: ${user?.isActive}`)

    if (!accessToken) {
      console.error('   FAILED: No access token received')
      return
    }

    // Step 3: Verify token
    console.log('\n3. Verifying token...')
    const verifyResponse = await fetch(`${API_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    const verifyData = await verifyResponse.json()
    console.log(`   Status: ${verifyResponse.status}`)
    console.log(`   Response: ${JSON.stringify(verifyData)}`)

    if (!verifyResponse.ok) {
      console.error('   FAILED: Token verification failed')
      console.error('   This is the bug! The token should be valid.')
      return
    }

    // Step 4: Access protected endpoint
    console.log('\n4. Accessing protected endpoint (/api/societes)...')
    const protectedResponse = await fetch(`${API_URL}/api/societes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    console.log(`   Status: ${protectedResponse.status}`)

    if (protectedResponse.status === 401) {
      console.error('   FAILED: Should not get 401 with valid token')
    } else {
      console.log('   SUCCESS: Protected endpoint accessible')
    }

    console.log('\n=== Auth Flow Test Complete ===')

  } catch (error) {
    console.error('Error:', error)
  }
}

testAuthFlow()
