import axios from 'axios'

async function testLoginComplete() {
  const apiUrl = 'http://localhost:3002'
  const csrfUrl = `${apiUrl}/api/csrf/token`
  const loginUrl = `${apiUrl}/api/auth/login`

  console.log('🔐 Test complet de connexion admin...\n')

  const credentials = {
    email: 'admin@topsteel.fr',
    password: 'admin123'
  }

  try {
    // Étape 1: Obtenir le token CSRF
    console.log('📍 Étape 1: Récupération du token CSRF...')
    console.log('   URL:', csrfUrl)

    const csrfResponse = await axios.get(csrfUrl, {
      timeout: 10000,
      withCredentials: true
    })

    const csrfToken = csrfResponse.data.token || csrfResponse.data.csrfToken
    const cookies = csrfResponse.headers['set-cookie']

    if (!csrfToken) {
      console.log('❌ Impossible de récupérer le token CSRF')
      console.log('   Réponse:', csrfResponse.data)
      return false
    }

    console.log('✅ Token CSRF obtenu:', csrfToken.substring(0, 20) + '...')

    // Étape 2: Se connecter avec le token CSRF
    console.log('\n📍 Étape 2: Connexion avec les identifiants...')
    console.log('   Email:', credentials.email)
    console.log('   Mot de passe:', '***' + credentials.password.slice(-4))
    console.log('   URL:', loginUrl)

    const loginResponse = await axios.post(loginUrl, credentials, {
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
        'Cookie': cookies?.join('; ') || ''
      },
      timeout: 10000,
      withCredentials: true
    })

    if (loginResponse.status === 200 || loginResponse.status === 201) {
      console.log('\n✅ CONNEXION RÉUSSIE!\n')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📊 Informations de connexion:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('   ✓ Token JWT:', loginResponse.data.accessToken ? 'Présent' : 'Absent')
      console.log('   ✓ Refresh token:', loginResponse.data.refreshToken ? 'Présent' : 'Absent')

      if (loginResponse.data.user) {
        console.log('\n👤 Informations utilisateur:')
        console.log('   - Email:', loginResponse.data.user.email)
        console.log('   - Nom:', loginResponse.data.user.nom, loginResponse.data.user.prenom)
        console.log('   - Rôle:', loginResponse.data.user.role)
        console.log('   - ID:', loginResponse.data.user.id)
      }

      console.log('\n🎉 Le compte admin fonctionne parfaitement!')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

      console.log('📝 Identifiants de connexion:')
      console.log('   Email:       admin@topsteel.fr')
      console.log('   Mot de passe: admin123')
      console.log('\n✨ Vous pouvez maintenant vous connecter à l\'application!\n')

      return true
    } else {
      console.log('⚠️  Statut inattendu:', loginResponse.status)
      return false
    }

  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ ERREUR: Le serveur API n\'est pas démarré!')
      console.log('   Démarrez le serveur avec: pnpm dev:api')
    } else if (error.response) {
      console.log('❌ ERREUR DE CONNEXION:')
      console.log('   Statut:', error.response.status)
      console.log('   Message:', error.response.data?.message || error.response.statusText)

      if (error.response.status === 401) {
        console.log('\n⚠️  Les identifiants sont incorrects!')
      } else if (error.response.status === 400) {
        console.log('\n⚠️  Requête invalide:', error.response.data)
      }
    } else {
      console.log('❌ ERREUR:', error.message)
    }
    return false
  }
}

testLoginComplete()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
