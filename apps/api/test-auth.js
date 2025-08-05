const API_URL = 'http://localhost:3002'

async function testAuthFlow() {
  console.log("🧪 Test complet du flux d'authentification\n")

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

    const loginData = await loginResponse.json()
    console.log('   ✅ Connexion réussie')
    console.log(`   - User: ${loginData.data.user.email}`)
    console.log(`   - Role: ${loginData.data.user.role}`)
    console.log(`   - Token: ${loginData.data.accessToken.substring(0, 50)}...`)

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

    const societesData = await societesResponse.json()
    console.log(`   ✅ ${societesData.data.length} société(s) trouvée(s)`)

    if (societesData.data.length > 0) {
      const firstSociete = societesData.data[0]
      console.log(`   - Première société: ${firstSociete.nom} (${firstSociete.code})`)

      // 3. Test de sélection de société
      console.log('\n📝 Étape 3: Sélection de la première société')
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

      const selectData = await selectResponse.json()
      console.log('   ✅ Société sélectionnée')
      console.log(`   - Nouveau token multi-tenant généré`)
      console.log(`   - Société active: ${selectData.data.user.societe.nom}`)

      // 4. Test de vérification du token
      console.log('\n📝 Étape 4: Vérification du token multi-tenant')
      const verifyResponse = await fetch(`${API_URL}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${selectData.data.tokens.accessToken}` },
      })

      if (!verifyResponse.ok) {
        const error = await verifyResponse.text()
        throw new Error(`Verify token failed: ${verifyResponse.status} - ${error}`)
      }

      const verifyData = await verifyResponse.json()
      console.log('   ✅ Token valide')
      console.log(`   - Email: ${verifyData.data.email}`)
      console.log(`   - Role: ${verifyData.data.role}`)
    }

    console.log('\n🎉 TOUS LES TESTS RÉUSSIS - LE SYSTÈME EST OPÉRATIONNEL!')
  } catch (error) {
    console.error('\n❌ Erreur:', error.message)
    process.exit(1)
  }
}

// Vérifier que le serveur est démarré
console.log('⏳ Vérification du serveur...')
fetch(`${API_URL}/api/health`)
  .then((response) => {
    if (response.ok) {
      console.log('✅ Serveur accessible\n')
      testAuthFlow()
    } else {
      throw new Error('Server returned ' + response.status)
    }
  })
  .catch((error) => {
    console.error("❌ Le serveur n'est pas accessible sur", API_URL)
    console.error('   Assurez-vous que le serveur API est démarré avec: npm run start:dev')
    process.exit(1)
  })
