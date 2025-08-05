import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const API_URL = 'http://localhost:3003'

async function testAuthFlow() {
  try {
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: 'admin@topsteel.tech',
        password: 'TopSteel44!',
      }),
    })

    if (!loginResponse.ok) {
      const error = await loginResponse.text()
      throw new Error(`Login failed: ${loginResponse.status} - ${error}`)
    }

    const loginData: any = await loginResponse.json()

    const accessToken = loginData.data.accessToken
    const societesResponse = await fetch(`${API_URL}/api/auth/societes`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!societesResponse.ok) {
      const error = await societesResponse.text()
      throw new Error(`Get societes failed: ${societesResponse.status} - ${error}`)
    }

    const societesData: any = await societesResponse.json()

    if (societesData.data.length > 0) {
      const firstSociete = societesData.data[0]
      const selectResponse = await fetch(`${API_URL}/api/auth/login-societe/${firstSociete.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      if (!selectResponse.ok) {
        const error = await selectResponse.text()
        throw new Error(`Select societe failed: ${selectResponse.status} - ${error}`)
      }

      const selectData: any = await selectResponse.json()
      const verifyResponse = await fetch(`${API_URL}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${selectData.data.tokens.accessToken}` },
      })

      if (!verifyResponse.ok) {
        const error = await verifyResponse.text()
        throw new Error(`Verify token failed: ${verifyResponse.status} - ${error}`)
      }

      const _verifyData: any = await verifyResponse.json()
    }
  } catch (_error: any) {
    process.exit(1)
  }
}
fetch(`${API_URL}/api/health`)
  .then((response) => {
    if (response.ok) {
      testAuthFlow()
    } else {
      throw new Error(`Server returned ${response.status}`)
    }
  })
  .catch((_error) => {
    process.exit(1)
  })
