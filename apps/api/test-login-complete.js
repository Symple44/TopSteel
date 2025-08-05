const API_URL = 'http://localhost:3002'

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function testCompleteFlow() {
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
      const _error = await loginResponse.text()
      return
    }

    const loginData = await loginResponse.json()

    const accessToken = loginData.data.accessToken
    await sleep(1000)

    const societesResponse = await fetch(`${API_URL}/api/auth/societes`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!societesResponse.ok) {
      const _error = await societesResponse.text()
      return
    }

    const societesData = await societesResponse.json()

    societesData.data.forEach((_societe, _index) => {})

    if (societesData.data.length === 0) {
      return
    }

    const firstSociete = societesData.data[0]
    await sleep(1000)

    const selectResponse = await fetch(`${API_URL}/api/auth/login-societe/${firstSociete.id}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    if (!selectResponse.ok) {
      const _error = await selectResponse.text()
      return
    }

    const selectData = await selectResponse.json()

    const multiTenantToken = selectData.data.tokens.accessToken
    await sleep(1000)

    const verifyResponse = await fetch(`${API_URL}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${multiTenantToken}` },
    })

    if (!verifyResponse.ok) {
      const _error = await verifyResponse.text()
      return
    }

    const _verifyData = await verifyResponse.json()
  } catch (_error) {}
}
fetch(`${API_URL}/api/health`)
  .then((response) => {
    if (response.ok) {
      testCompleteFlow()
    } else {
      throw new Error(`Serveur retourne ${response.status}`)
    }
  })
  .catch((_error) => {})
