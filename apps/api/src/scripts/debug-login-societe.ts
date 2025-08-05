import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const API_URL = 'http://localhost:3003'

async function debugLoginSociete() {
  console.log('🔍 Debug du problème login-societe\n')

  try {
    // 1. Test de connexion
    console.log('📝 Étape 1: Connexion avec admin@topsteel.tech')
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
    console.log('   ✅ Connexion réussie')
    const accessToken = loginData.data.accessToken

    // 2. Test de récupération des sociétés
    console.log('\n📝 Étape 2: Récupération des sociétés')
    const societesResponse = await fetch(`${API_URL}/api/auth/societes`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!societesResponse.ok) {
      const error = await societesResponse.text()
      throw new Error(`Get societes failed: ${societesResponse.status} - ${error}`)
    }

    const societesData: any = await societesResponse.json()
    console.log(`   ✅ ${societesData.data.length} société(s) trouvée(s)`)

    if (societesData.data.length > 0) {
      const firstSociete = societesData.data[0]
      console.log(`   - Société: ${firstSociete.nom} (ID: ${firstSociete.id})`)

      // 3. Tester l'endpoint qui échoue avec plus de debugging
      console.log('\n📝 Étape 3: Test détaillé de login-societe')

      // Essayer de comprendre le token JWT
      const tokenParts = accessToken.split('.')
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
          console.log(`   - Token user ID: ${payload.sub}`)
          console.log(`   - Token email: ${payload.email}`)
          console.log(`   - Token expires: ${new Date(payload.exp * 1000).toISOString()}`)
        } catch (e) {
          console.log('   - Impossible de décoder le token JWT')
        }
      }

      // Faire l'appel qui échoue
      console.log(`\n   🔄 Tentative de sélection de société...`)
      const selectResponse = await fetch(`${API_URL}/api/auth/login-societe/${firstSociete.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      console.log(`   - Status code: ${selectResponse.status}`)
      console.log(`   - Status text: ${selectResponse.statusText}`)

      const responseText = await selectResponse.text()
      console.log(`   - Response body: ${responseText}`)

      if (!selectResponse.ok) {
        // Essayer d'obtenir plus d'informations
        console.log('\n🔍 Headers de la réponse:')
        selectResponse.headers.forEach((value, key) => {
          console.log(`   ${key}: ${value}`)
        })

        // Tester d'autres endpoints pour voir s'ils marchent
        console.log("\n🔍 Test d'autres endpoints pour voir si le serveur répond:")

        const healthResponse = await fetch(`${API_URL}/api/health`)
        console.log(`   - Health check: ${healthResponse.status}`)

        const verifyResponse = await fetch(`${API_URL}/api/auth/verify`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        console.log(`   - Verify token: ${verifyResponse.status}`)
      }
    }
  } catch (error: any) {
    console.error('\n❌ Erreur:', error.message)
    console.error('Stack trace:', error.stack)
    process.exit(1)
  }
}

// Vérifier que le serveur est démarré
console.log('⏳ Vérification du serveur...')
fetch(`${API_URL}/api/health`)
  .then((response) => {
    if (response.ok) {
      console.log('✅ Serveur accessible\n')
      debugLoginSociete()
    } else {
      throw new Error('Server returned ' + response.status)
    }
  })
  .catch((error) => {
    console.error("❌ Le serveur n'est pas accessible sur", API_URL)
    console.error('   Erreur:', error.message)
    process.exit(1)
  })
