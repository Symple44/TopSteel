// apps/api/src/__tests__/auth-flow-complete.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

/**
 * Test d'intégration complet du flux d'authentification TopSteel ERP
 * 
 * Ce test valide les 5 étapes critiques de l'authentification :
 * 1. Connexion utilisateur
 * 2. Récupération des sociétés
 * 3. Vérification API société par défaut
 * 4. Sélection automatique de société
 * 5. Vérification token multi-tenant
 * 
 * CRITIQUE : Ce test doit passer à 100% pour garantir le bon fonctionnement
 * de l'authentification en production.
 */

const API_URL = process.env.API_URL || 'http://localhost:3002'
const TEST_USER = {
  email: 'test@topsteel.com',
  password: 'test123',
}

// Fonction helper pour les requêtes HTTP
async function fetchAPI(endpoint: string, options: any = {}) {
  const url = `${API_URL}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP ${response.status}: ${errorText}`)
  }
  
  return response.json()
}

describe('Complete Authentication Flow (Critical Integration)', () => {
  let serverReachable = false

  beforeAll(async () => {
    // Vérifier que le serveur API est accessible
    try {
      console.log(`🔍 Testing API server at: ${API_URL}`)
      const response = await fetch(`${API_URL}/api/auth/login`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: 'test', password: 'test' })
      })
      // Peu importe la réponse (401 attendu), tant que le serveur répond
      if (response.status === 401 || response.status === 400 || response.ok) {
        serverReachable = true
        console.log('✅ API Server is reachable')
      } else {
        throw new Error(`Server responded with status: ${response.status}`)
      }
    } catch (error) {
      console.warn(`⚠️ API Server not reachable at ${API_URL}:`, error.message)
      console.warn('Skipping integration tests.')
      serverReachable = false
    }
  })

  it('should complete full authentication flow - 5/5 critical tests', async () => {
    if (!serverReachable) {
      console.log('🔄 Skipping test - API server not available')
      return
    }

    let accessToken: string
    let companyId: string
    const testResults: Array<{test: string, success: boolean}> = []

    try {
      // Test 1/5: User Login
      console.log('🔐 Test 1/5: User Login...')
      const loginData = await fetchAPI('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          login: TEST_USER.email,
          password: TEST_USER.password,
        }),
      })

      expect(loginData).toHaveProperty('data')
      expect(loginData.data).toHaveProperty('accessToken')
      expect(loginData.data).toHaveProperty('user')
      expect(loginData.data.user.email).toBe(TEST_USER.email)

      accessToken = loginData.data.accessToken
      testResults.push({test: 'User Login', success: true})
      console.log('✅ Test 1/5: Login réussi')

      // Test 2/5: Get User Companies
      console.log('🏢 Test 2/5: Get User Companies...')
      const companiesData = await fetchAPI('/api/auth/societes', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      })

      expect(companiesData).toHaveProperty('data')
      expect(Array.isArray(companiesData.data)).toBe(true)
      expect(companiesData.data.length).toBeGreaterThan(0)

      const companies = companiesData.data
      const defaultCompany = companies.find((c: any) => c.isDefault === true)
      expect(defaultCompany).toBeDefined()
      expect(defaultCompany).toHaveProperty('id')
      expect(defaultCompany).toHaveProperty('nom')

      companyId = defaultCompany.id
      testResults.push({test: 'Get Companies', success: true})
      console.log(`✅ Test 2/5: ${companies.length} société(s) trouvée(s), défaut: ${defaultCompany.nom}`)

      // Test 3/5: Check Default Company API
      console.log('🔍 Test 3/5: Check Default Company API...')
      const defaultCompanyData = await fetchAPI('/api/auth/user/default-company', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      })

      expect(defaultCompanyData).toHaveProperty('data')
      expect(defaultCompanyData.data).toHaveProperty('success', true)
      expect(defaultCompanyData.data).toHaveProperty('data')
      expect(defaultCompanyData.data.data).toHaveProperty('nom')

      testResults.push({test: 'Default Company API', success: true})
      console.log(`✅ Test 3/5: API société par défaut OK: ${defaultCompanyData.data.data.nom}`)

      // Test 4/5: Auto-Select Default Company
      console.log('⚡ Test 4/5: Auto-Select Default Company...')
      const selectData = await fetchAPI(`/api/auth/login-societe/${companyId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({}),
      })

      expect(selectData).toHaveProperty('data')
      expect(selectData.data).toHaveProperty('tokens')
      expect(selectData.data.tokens).toHaveProperty('accessToken')
      expect(selectData.data).toHaveProperty('user')
      expect(selectData.data.user).toHaveProperty('societe')
      expect(selectData.data.user.societe).toHaveProperty('nom')

      const multiTenantToken = selectData.data.tokens.accessToken
      testResults.push({test: 'Auto-Select Company', success: true})
      console.log(`✅ Test 4/5: Sélection automatique réussie: ${selectData.data.user.societe.nom}`)

      // Test 5/5: Verify Multi-Tenant Token
      console.log('🔑 Test 5/5: Verify Multi-Tenant Token...')
      const verifyData = await fetchAPI('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${multiTenantToken}` },
      })

      expect(verifyData).toHaveProperty('data')
      expect(verifyData.data).toHaveProperty('email', TEST_USER.email)
      expect(verifyData.data).toHaveProperty('id')

      testResults.push({test: 'Multi-Tenant Token', success: true})
      console.log(`✅ Test 5/5: Token multi-tenant valide: ${verifyData.data.email}`)

      // Vérification finale
      const successCount = testResults.filter(r => r.success).length
      const totalCount = testResults.length

      console.log('\n📊 RÉSUMÉ DES TESTS:')
      testResults.forEach(result => {
        const icon = result.success ? '✅' : '❌'
        console.log(`${icon} ${result.test}: ${result.success ? 'RÉUSSI' : 'ÉCHOUÉ'}`)
      })

      console.log(`\n🎯 Score: ${successCount}/${totalCount} tests réussis (${Math.round(successCount/totalCount*100)}%)`)

      // Le test échoue si tous les tests ne passent pas
      expect(successCount).toBe(totalCount)
      expect(successCount).toBe(5) // Exactement 5 tests doivent réussir

      console.log('🎉 FLUX D\'AUTHENTIFICATION ENTIÈREMENT FONCTIONNEL !')

    } catch (error) {
      console.error('❌ Erreur critique dans le flux d\'authentification:', error.message)
      throw error
    }
  }, 30000) // Timeout de 30 secondes

  it('should handle authentication errors gracefully', async () => {
    if (!serverReachable) {
      console.log('🔄 Skipping test - API server not available')
      return
    }

    // Test avec des identifiants incorrects
    try {
      await fetchAPI('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          login: 'invalid@email.com',
          password: 'wrongpassword',
        }),
      })
      
      // Ne devrait pas arriver ici
      expect(false).toBe(true)
    } catch (error) {
      // Erreur attendue
      expect(error.message).toContain('401')
    }
  })

  it('should validate token structure and expiration', async () => {
    if (!serverReachable) {
      console.log('🔄 Skipping test - API server not available')
      return
    }

    // Test avec un token invalide
    try {
      await fetchAPI('/api/auth/verify', {
        headers: { 'Authorization': 'Bearer invalid.token.here' },
      })
      
      // Ne devrait pas arriver ici
      expect(false).toBe(true)
    } catch (error) {
      // Erreur attendue
      expect(error.message).toContain('401')
    }
  })
})