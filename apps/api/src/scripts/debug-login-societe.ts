import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const API_URL = 'http://localhost:3003'

async function debugLoginSociete() {
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

      // Essayer de comprendre le token JWT
      const tokenParts = accessToken.split('.')
      if (tokenParts.length === 3) {
        try {
          const _payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
        } catch (_e) {}
      }
      const selectResponse = await fetch(`${API_URL}/api/auth/login-societe/${firstSociete.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const _responseText = await selectResponse.text()

      if (!selectResponse.ok) {
        selectResponse.headers.forEach((_value, _key) => {})

        const _healthResponse = await fetch(`${API_URL}/api/health`)

        const _verifyResponse = await fetch(`${API_URL}/api/auth/verify`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      }
    }
  } catch (_error: any) {
    process.exit(1)
  }
}
fetch(`${API_URL}/api/health`)
  .then((response) => {
    if (response.ok) {
      debugLoginSociete()
    } else {
      throw new Error(`Server returned ${response.status}`)
    }
  })
  .catch((_error) => {
    process.exit(1)
  })
