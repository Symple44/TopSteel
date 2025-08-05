const API_URL = 'http://localhost:3002'

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function testCompleteFlow() {
  console.log("🧪 Test complet du flux d'authentification TopSteel\n")
  console.log('================================\n')

  try {
    // 1. LOGIN
    console.log('📝 ÉTAPE 1: LOGIN')
    console.log('   Email: admin@topsteel.tech')
    console.log('   Password: TopSteel44!')

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
      console.error(`\n❌ LOGIN ÉCHOUÉ: ${loginResponse.status}`)
      console.error('Réponse:', error)
      return
    }

    const loginData = await loginResponse.json()
    console.log('\n✅ LOGIN RÉUSSI!')
    console.log(`   - User ID: ${loginData.data.user.id}`)
    console.log(`   - Email: ${loginData.data.user.email}`)
    console.log(`   - Role: ${loginData.data.user.role}`)
    console.log(`   - Token: ${loginData.data.accessToken.substring(0, 50)}...`)

    const accessToken = loginData.data.accessToken
    await sleep(1000)

    // 2. RÉCUPÉRATION DES SOCIÉTÉS
    console.log('\n================================')
    console.log('\n📝 ÉTAPE 2: RÉCUPÉRATION DES SOCIÉTÉS')

    const societesResponse = await fetch(`${API_URL}/api/auth/societes`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!societesResponse.ok) {
      const error = await societesResponse.text()
      console.error(`\n❌ RÉCUPÉRATION SOCIÉTÉS ÉCHOUÉE: ${societesResponse.status}`)
      console.error('Réponse:', error)
      return
    }

    const societesData = await societesResponse.json()
    console.log(`\n✅ ${societesData.data.length} SOCIÉTÉ(S) TROUVÉE(S):`)

    societesData.data.forEach((societe, index) => {
      console.log(`   ${index + 1}. ${societe.nom} (${societe.code})`)
      console.log(`      - ID: ${societe.id}`)
      console.log(`      - Role: ${societe.role}`)
      console.log(`      - Default: ${societe.isDefault}`)
    })

    if (societesData.data.length === 0) {
      console.error('\n❌ Aucune société trouvée pour cet utilisateur')
      return
    }

    const firstSociete = societesData.data[0]
    await sleep(1000)

    // 3. SÉLECTION DE SOCIÉTÉ
    console.log('\n================================')
    console.log('\n📝 ÉTAPE 3: SÉLECTION DE SOCIÉTÉ')
    console.log(`   Sélection de: ${firstSociete.nom}`)

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
      console.error(`\n❌ SÉLECTION SOCIÉTÉ ÉCHOUÉE: ${selectResponse.status}`)
      console.error('Réponse:', error)
      return
    }

    const selectData = await selectResponse.json()
    console.log('\n✅ SOCIÉTÉ SÉLECTIONNÉE!')
    console.log(`   - Société: ${selectData.data.user.societe.nom}`)
    console.log(`   - Nouveau token généré`)

    const multiTenantToken = selectData.data.tokens.accessToken
    await sleep(1000)

    // 4. VÉRIFICATION DU TOKEN
    console.log('\n================================')
    console.log('\n📝 ÉTAPE 4: VÉRIFICATION DU TOKEN MULTI-TENANT')

    const verifyResponse = await fetch(`${API_URL}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${multiTenantToken}` },
    })

    if (!verifyResponse.ok) {
      const error = await verifyResponse.text()
      console.error(`\n❌ VÉRIFICATION TOKEN ÉCHOUÉE: ${verifyResponse.status}`)
      console.error('Réponse:', error)
      return
    }

    const verifyData = await verifyResponse.json()
    console.log('\n✅ TOKEN VALIDE!')
    console.log(`   - Email: ${verifyData.data.email}`)
    console.log(`   - Role: ${verifyData.data.role}`)
    console.log(`   - ID: ${verifyData.data.id}`)

    // RÉSUMÉ FINAL
    console.log('\n================================')
    console.log('\n🎉 TOUS LES TESTS RÉUSSIS!')
    console.log('\n📊 RÉSUMÉ:')
    console.log('   ✅ Login avec admin@topsteel.tech')
    console.log('   ✅ Récupération des sociétés')
    console.log('   ✅ Sélection de société')
    console.log('   ✅ Token multi-tenant fonctionnel')
    console.log("\n🚀 LE SYSTÈME D'AUTHENTIFICATION EST OPÉRATIONNEL!")
  } catch (error) {
    console.error('\n❌ ERREUR INATTENDUE:', error.message)
    console.error(error.stack)
  }
}

// Démarrer le test
console.log('⏳ Connexion au serveur API...\n')
fetch(`${API_URL}/api/health`)
  .then((response) => {
    if (response.ok) {
      console.log('✅ Serveur API accessible\n')
      testCompleteFlow()
    } else {
      throw new Error('Serveur retourne ' + response.status)
    }
  })
  .catch((error) => {
    console.error("❌ ERREUR: Le serveur n'est pas accessible sur", API_URL)
    console.error('   Assurez-vous que le serveur est démarré avec: pnpm dev')
  })
