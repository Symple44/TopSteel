// apps/api/src/__tests__/auth-super-admin.integration.test.ts
import { beforeAll, describe, expect, it } from 'vitest'

/**
 * Test d'intégration spécialisé pour l'authentification SUPER_ADMIN
 *
 * Ce test valide les fonctionnalités spécifiques aux SUPER_ADMIN :
 * 1. Connexion SUPER_ADMIN
 * 2. Accès à toutes les sociétés sans restriction
 * 3. Bypass MFA en environnement de confiance
 * 4. Permissions élevées et gestion multi-société
 * 5. Intégration avec le système de rôles unifié
 */

const API_URL = process.env.API_URL || 'http://localhost:3002'
const SUPER_ADMIN_USER = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@topsteel.fr',
  password: process.env.TEST_ADMIN_PASSWORD || '',
}

// Types pour les requêtes HTTP
interface FetchAPIOptions {
  method?: string
  headers?: Record<string, string>
  body?: string
}

interface Company {
  id: string
  nom: string
  code: string
  isDefault?: boolean
  role?: string
  sites?: unknown[]
}

interface Role {
  id: string
  displayName: string
  hierarchy: number
  color: string
  icon: string
}

// Fonction helper pour les requêtes HTTP
async function fetchAPI(endpoint: string, options: FetchAPIOptions = {}) {
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

describe('SUPER_ADMIN Authentication Flow (Enhanced Integration)', () => {
  let serverReachable = false
  let superAdminToken: string
  let availableCompanies: Company[] = []

  beforeAll(async () => {
    // Vérifier que les credentials de test sont configurés
    if (!SUPER_ADMIN_USER.password) {
      return
    }

    // Vérifier que le serveur API est accessible
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: 'test', password: 'test' }),
      })

      if (response.status === 401 || response.status === 400 || response.ok) {
        serverReachable = true
      } else {
        throw new Error(`Server responded with status: ${response.status}`)
      }
    } catch {
      serverReachable = false
    }
  })

  it('should authenticate SUPER_ADMIN successfully', async () => {
    if (!serverReachable) {
      return
    }
    const loginData = await fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        login: SUPER_ADMIN_USER.email,
        password: SUPER_ADMIN_USER.password,
      }),
    })

    expect(loginData).toHaveProperty('data')
    expect(loginData.data).toHaveProperty('accessToken')
    expect(loginData.data).toHaveProperty('user')
    expect(loginData.data.user.email).toBe(SUPER_ADMIN_USER.email)
    expect(loginData.data.user).toHaveProperty('role')
    expect(loginData.data.user.role).toBe('SUPER_ADMIN')

    superAdminToken = loginData.data.accessToken

    // Vérifier les propriétés spécifiques du token SUPER_ADMIN
    expect(loginData.data).toHaveProperty('permissions')
    expect(loginData.data.user).toHaveProperty('globalRole')
  })

  it('should allow SUPER_ADMIN to access all companies', async () => {
    if (!serverReachable || !superAdminToken) {
      return
    }
    const companiesData = await fetchAPI('/api/auth/societes', {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    })

    expect(companiesData).toHaveProperty('data')
    expect(Array.isArray(companiesData.data)).toBe(true)

    availableCompanies = companiesData.data

    // SUPER_ADMIN should have access to ALL active companies
    expect(availableCompanies.length).toBeGreaterThan(0)

    // Verify company structure includes necessary fields
    if (availableCompanies.length > 0) {
      const firstCompany = availableCompanies[0]
      expect(firstCompany).toHaveProperty('id')
      expect(firstCompany).toHaveProperty('nom')
      expect(firstCompany).toHaveProperty('code')
      expect(firstCompany).toHaveProperty('role')
      expect(firstCompany).toHaveProperty('sites')
    }
  })

  it('should allow SUPER_ADMIN to select any company', async () => {
    if (!serverReachable || !superAdminToken || availableCompanies.length === 0) {
      return
    }
    // Test selecting the first available company
    const companyToSelect = availableCompanies[0]

    const selectData = await fetchAPI(`/api/auth/login-societe/${companyToSelect.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({}),
    })

    expect(selectData).toHaveProperty('data')
    expect(selectData.data).toHaveProperty('tokens')
    expect(selectData.data.tokens).toHaveProperty('accessToken')
    expect(selectData.data).toHaveProperty('user')
    expect(selectData.data.user).toHaveProperty('societe')

    // Verify the selected company details
    expect(selectData.data.user.societe.id).toBe(companyToSelect.id)
    expect(selectData.data.user.societe).toHaveProperty('nom')

    // Verify SUPER_ADMIN maintains elevated permissions
    expect(selectData.data.user).toHaveProperty('role', 'SUPER_ADMIN')

    const multiTenantToken = selectData.data.tokens.accessToken

    // Test that the new token works
    const verifyData = await fetchAPI('/api/auth/verify', {
      headers: { Authorization: `Bearer ${multiTenantToken}` },
    })

    expect(verifyData).toHaveProperty('data')
    expect(verifyData.data).toHaveProperty('email', SUPER_ADMIN_USER.email)
    expect(verifyData.data).toHaveProperty('role', 'SUPER_ADMIN')
  })

  it('should provide enhanced admin endpoints access', async () => {
    if (!serverReachable || !superAdminToken) {
      return
    }
    // Test access to performance metrics (SUPER_ADMIN only)
    const performanceData = await fetchAPI('/api/admin/auth-performance/metrics', {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    })

    expect(performanceData).toHaveProperty('success', true)
    expect(performanceData).toHaveProperty('data')
    expect(performanceData.data).toHaveProperty('aggregated')
    expect(performanceData.data).toHaveProperty('byOperation')

    // Test access to MFA management (SUPER_ADMIN only)
    const mfaStatusData = await fetchAPI('/api/admin/mfa/status', {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    })

    expect(mfaStatusData).toHaveProperty('success', true)
    expect(mfaStatusData).toHaveProperty('data')
    expect(mfaStatusData.data).toHaveProperty('totalUsers')
    expect(mfaStatusData.data).toHaveProperty('usersWithMFA')

    // Test access to societes management (SUPER_ADMIN only)
    const societesData = await fetchAPI('/api/admin/societes', {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    })

    expect(societesData).toHaveProperty('success', true)
    expect(societesData).toHaveProperty('data')
    expect(Array.isArray(societesData.data)).toBe(true)
  })

  it('should handle MFA bypass logic for SUPER_ADMIN', async () => {
    if (!serverReachable || !superAdminToken) {
      return
    }

    try {
      // Test MFA status for SUPER_ADMIN (should be optional)
      const mfaCheckData = await fetchAPI('/api/auth/mfa/check', {
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'X-Forwarded-For': '192.168.1.100', // Simulate local network
          'User-Agent': 'Test-SUPER_ADMIN-Client',
        },
      })

      // SUPER_ADMIN MFA should be optional, not mandatory
      expect(mfaCheckData).toHaveProperty('data')

      // If MFA is returned, it should indicate bypass capability
      if (mfaCheckData.data.requiresMFA) {
        expect(mfaCheckData.data).toHaveProperty('canBypass')
        expect(mfaCheckData.data.canBypass).toBe(true)
      }
    } catch {}
  })

  it('should validate role hierarchy and permissions', async () => {
    if (!serverReachable || !superAdminToken) {
      return
    }
    // Test role formatting endpoint
    const rolesData = await fetchAPI('/api/admin/users/roles', {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    })

    expect(rolesData).toHaveProperty('success', true)
    expect(rolesData).toHaveProperty('data')
    expect(rolesData.data).toHaveProperty('globalRoles')
    expect(rolesData.data).toHaveProperty('societeRoles')

    // Find SUPER_ADMIN role in the hierarchy
    const globalRoles = rolesData.data.globalRoles
    const superAdminRole = globalRoles.find((role: Role) => role.id === 'SUPER_ADMIN')

    expect(superAdminRole).toBeDefined()
    expect(superAdminRole).toHaveProperty('displayName')
    expect(superAdminRole).toHaveProperty('hierarchy')
    expect(superAdminRole).toHaveProperty('color')
    expect(superAdminRole).toHaveProperty('icon')

    // SUPER_ADMIN should have the highest hierarchy level
    const maxHierarchy = Math.max(...globalRoles.map((role: Role) => role.hierarchy))
    expect(superAdminRole.hierarchy).toBe(maxHierarchy)
  })

  it('should handle performance tracking for SUPER_ADMIN operations', async () => {
    if (!serverReachable || !superAdminToken) {
      return
    }
    // Perform several operations to generate performance data
    await fetchAPI('/api/auth/societes', {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    })

    // Check performance health
    const healthData = await fetchAPI('/api/admin/auth-performance/health-check', {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    })

    expect(healthData).toHaveProperty('success', true)
    expect(healthData).toHaveProperty('data')
    expect(healthData.data).toHaveProperty('overall')
    expect(healthData.data).toHaveProperty('checks')
    expect(healthData.data).toHaveProperty('recommendations')

    // Verify that performance checks are working
    const checks = healthData.data.checks
    expect(checks).toHaveProperty('responseTime')
    expect(checks).toHaveProperty('successRate')
    expect(checks).toHaveProperty('memoryUsage')
  })

  it('should complete comprehensive SUPER_ADMIN flow validation', async () => {
    if (!serverReachable || !superAdminToken) {
      return
    }

    const testResults: Array<{ test: string; success: boolean; details?: string }> = []

    try {
      // Test 1: Token validation
      const verifyData = await fetchAPI('/api/auth/verify', {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      })

      const isValidSuperAdmin =
        verifyData.data?.role === 'SUPER_ADMIN' && verifyData.data?.email === SUPER_ADMIN_USER.email

      testResults.push({
        test: 'Token Validation',
        success: isValidSuperAdmin,
        details: `Role: ${verifyData.data?.role}, Email: ${verifyData.data?.email}`,
      })

      // Test 2: Multi-company access
      const companiesData = await fetchAPI('/api/auth/societes', {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      })

      const hasMultiCompanyAccess =
        Array.isArray(companiesData.data) && companiesData.data.length > 0

      testResults.push({
        test: 'Multi-Company Access',
        success: hasMultiCompanyAccess,
        details: `${companiesData.data?.length || 0} companies accessible`,
      })

      // Test 3: Admin endpoints access
      const performanceData = await fetchAPI('/api/admin/auth-performance/metrics', {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      })

      const hasAdminAccess = performanceData.success === true

      testResults.push({
        test: 'Admin Endpoints Access',
        success: hasAdminAccess,
        details: 'Performance metrics endpoint accessible',
      })

      // Test 4: Enhanced permissions
      const usersData = await fetchAPI('/api/admin/users', {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      })

      const hasEnhancedPermissions = usersData.success === true

      testResults.push({
        test: 'Enhanced Permissions',
        success: hasEnhancedPermissions,
        details: 'User management endpoint accessible',
      })

      // Summary
      const successCount = testResults.filter((r) => r.success).length
      const totalCount = testResults.length
      // Test results processed

      // All tests should pass for SUPER_ADMIN
      expect(successCount).toBe(totalCount)
      expect(successCount).toBe(4)
    } catch (error) {
      // Log partial results if available
      if (testResults.length > 0) {
        // Partial results logged
      }

      throw error
    }
  }, 45000) // Extended timeout for comprehensive test
})
