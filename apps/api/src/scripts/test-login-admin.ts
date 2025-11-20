import axios from 'axios'

async function testLogin() {
  const apiUrl = process.env.FRONTEND_URL?.replace('3005', '3002') || 'http://localhost:3002'
  const loginUrl = `${apiUrl}/api/v1/auth/login`

  console.log('🔐 Test de connexion admin...')
  console.log('📍 URL:', loginUrl)

  const credentials = {
    email: 'admin@topsteel.fr',
    password: 'admin123'
  }

  try {
    console.log('📧 Email:', credentials.email)
    console.log('🔑 Mot de passe:', '***' + credentials.password.slice(-4))
    console.log('\n⏳ Tentative de connexion...\n')

    const response = await axios.post(loginUrl, credentials, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })

    if (response.status === 200 || response.status === 201) {
      console.log('✅ CONNEXION RÉUSSIE!\n')
      console.log('📊 Données reçues:')
      console.log('   - Token présent:', !!response.data.accessToken)
      console.log('   - Refresh token présent:', !!response.data.refreshToken)
      console.log('   - Utilisateur:', response.data.user?.email)
      console.log('   - Rôle:', response.data.user?.role)
      console.log('\n🎉 Le compte admin fonctionne parfaitement!')
      return true
    } else {
      console.log('⚠️  Statut inattendu:', response.status)
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
      }
    } else {
      console.log('❌ ERREUR:', error.message)
    }
    return false
  }
}

testLogin()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
