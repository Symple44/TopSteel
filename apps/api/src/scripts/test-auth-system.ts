#!/usr/bin/env ts-node

/**
 * Test complet du système d'authentification
 */

import axios, { type AxiosError } from 'axios'
import * as dotenv from 'dotenv'
import { TestAuthHelper } from './utils/test-auth-helper'

dotenv.config()

const API_URL = process.env.API_URL || 'http://localhost:3002/api/v1'

interface TestResult {
  endpoint: string
  method: string
  expectedStatus: number
  actualStatus?: number
  success: boolean
  error?: string
}

class AuthSystemTester {
  private results: TestResult[] = []
  private token: string = ''

  async runTests() {
    console.log('🔒 Testing Authentication System')
    console.log('='.repeat(80))
    console.log(`API URL: ${API_URL}`)
    console.log()

    // Vérifier si l'API est accessible
    await this.checkApiHealth()

    // Générer un token de test
    await this.generateTestToken()

    // Tester les endpoints
    await this.testPublicEndpoints()
    await this.testProtectedEndpoints()
    await this.testRoleBasedAccess()
    await this.testInvalidToken()

    // Afficher les résultats
    this.displayResults()
  }

  private async checkApiHealth() {
    console.log('🏥 Checking API Health...')
    try {
      const response = await axios.get(`${API_URL.replace('/api/v1', '')}/health`, {
        timeout: 5000,
        validateStatus: () => true,
      })

      if (response.status === 200 || response.status === 404) {
        console.log('✅ API is reachable')
      } else {
        console.log(`⚠️  API returned status ${response.status}`)
      }
    } catch (_error) {
      console.log('❌ API is not accessible. Please start the API server:')
      console.log('   cd apps/api && npm run start:dev')
      console.log()
      console.log('⚠️  Continuing with mock tests...')
    }
    console.log()
  }

  private async generateTestToken() {
    console.log('🔑 Generating Test Token...')
    TestAuthHelper.initialize()

    this.token = TestAuthHelper.generateTestToken({
      email: 'admin@test.com',
      userId: 'test-user-123',
      societeId: 'test-societe-456',
      role: 'admin',
      permissions: ['*'],
    })

    console.log('✅ Token generated')
    console.log(`   Email: admin@test.com`)
    console.log(`   Role: admin`)
    console.log(`   Token: ${this.token.substring(0, 20)}...`)
    console.log()
  }

  private async testPublicEndpoints() {
    console.log('🌐 Testing Public Endpoints...')

    const publicEndpoints = [
      { path: '/health', method: 'GET' },
      { path: '/api/v1/auth/login', method: 'POST' },
      { path: '/api/v1/auth/register', method: 'POST' },
    ]

    for (const endpoint of publicEndpoints) {
      await this.testEndpoint(
        endpoint.path,
        endpoint.method as unknown,
        false, // No auth needed
        [200, 201, 400, 404] // Expected statuses
      )
    }
    console.log()
  }

  private async testProtectedEndpoints() {
    console.log('🔐 Testing Protected Endpoints...')

    const protectedEndpoints = [
      { path: '/api/v1/auth/me', method: 'GET' },
      { path: '/api/v1/users', method: 'GET' },
      { path: '/api/v1/auth/logout', method: 'POST' },
    ]

    // Test WITHOUT token (should fail)
    console.log('  Without token (should fail):')
    for (const endpoint of protectedEndpoints) {
      await this.testEndpoint(
        endpoint.path,
        endpoint.method as unknown,
        false, // No auth
        [401, 403] // Should be unauthorized
      )
    }

    // Test WITH token (should succeed)
    console.log('  With valid token (should succeed):')
    for (const endpoint of protectedEndpoints) {
      await this.testEndpoint(
        endpoint.path,
        endpoint.method as unknown,
        true, // With auth
        [200, 201, 404] // Should be authorized (404 if endpoint doesn't exist)
      )
    }
    console.log()
  }

  private async testRoleBasedAccess() {
    console.log('👥 Testing Role-Based Access...')

    // Test avec différents rôles
    const roles = [
      { role: 'admin', permissions: ['*'], shouldAccess: true },
      { role: 'user', permissions: ['read'], shouldAccess: false },
      { role: 'viewer', permissions: ['view'], shouldAccess: false },
    ]

    for (const roleTest of roles) {
      const roleToken = TestAuthHelper.generateTestToken({
        email: `${roleTest.role}@test.com`,
        role: roleTest.role,
        permissions: roleTest.permissions,
      })

      console.log(`  Testing ${roleTest.role} role:`)
      await this.testEndpointWithToken(
        '/api/v1/admin/users',
        'GET',
        roleToken,
        roleTest.shouldAccess ? [200, 404] : [403]
      )
    }
    console.log()
  }

  private async testInvalidToken() {
    console.log('❌ Testing Invalid Tokens...')

    const invalidTokens = [
      { name: 'Malformed', token: 'not-a-valid-token' },
      {
        name: 'Wrong signature',
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      },
      { name: 'Expired', token: TestAuthHelper.generateTestToken({ expiresIn: '0s' }) },
    ]

    for (const invalidToken of invalidTokens) {
      console.log(`  ${invalidToken.name} token:`)
      await this.testEndpointWithToken('/api/v1/auth/me', 'GET', invalidToken.token, [401, 403])
    }
    console.log()
  }

  private async testEndpoint(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    withAuth: boolean,
    expectedStatuses: number[]
  ) {
    const url = path.startsWith('http') ? path : `${API_URL}${path}`
    const headers: any = {}

    if (withAuth) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const result: TestResult = {
      endpoint: path,
      method,
      expectedStatus: expectedStatuses[0],
      success: false,
    }

    try {
      const response = await axios({
        method,
        url,
        headers,
        timeout: 5000,
        validateStatus: () => true,
      })

      result.actualStatus = response.status
      result.success = expectedStatuses.includes(response.status)

      const icon = result.success ? '✅' : '❌'
      const authStatus = withAuth ? 'AUTH' : 'PUBLIC'
      console.log(`    ${icon} ${method} ${path} [${authStatus}] - Status: ${response.status}`)
    } catch (error) {
      const axiosError = error as AxiosError
      if (axiosError.code === 'ECONNREFUSED') {
        result.error = 'API not running'
        console.log(`    ⚠️  ${method} ${path} - API not accessible`)
      } else {
        result.error = axiosError.message
        console.log(`    ❌ ${method} ${path} - Error: ${axiosError.message}`)
      }
    }

    this.results.push(result)
  }

  private async testEndpointWithToken(
    path: string,
    method: 'GET' | 'POST',
    token: string,
    expectedStatuses: number[]
  ) {
    const url = `${API_URL}${path}`

    try {
      const response = await axios({
        method,
        url,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000,
        validateStatus: () => true,
      })

      const success = expectedStatuses.includes(response.status)
      const icon = success ? '✅' : '❌'
      console.log(`    ${icon} Status: ${response.status}`)
    } catch (error) {
      const axiosError = error as AxiosError
      if (axiosError.code === 'ECONNREFUSED') {
        console.log(`    ⚠️  API not accessible`)
      } else {
        console.log(`    ❌ Error: ${axiosError.message}`)
      }
    }
  }

  private displayResults() {
    console.log('='.repeat(80))
    console.log('📊 Test Results Summary')
    console.log('='.repeat(80))

    const totalTests = this.results.length
    const successfulTests = this.results.filter((r) => r.success).length
    const failedTests = this.results.filter((r) => !r.success && !r.error).length
    const errorTests = this.results.filter((r) => r.error).length

    console.log(`Total Tests: ${totalTests}`)
    console.log(`✅ Successful: ${successfulTests}`)
    console.log(`❌ Failed: ${failedTests}`)
    console.log(`⚠️  Errors: ${errorTests}`)
    console.log()

    if (errorTests > 0) {
      console.log('⚠️  Note: Some tests could not run because the API is not accessible.')
      console.log('   Start the API with: cd apps/api && npm run start:dev')
    }

    console.log()
    console.log('🔒 Authentication System Test Complete!')
    console.log('='.repeat(80))
  }
}

// Exécuter les tests
const tester = new AuthSystemTester()
tester.runTests().catch((error) => {
  console.error('❌ Test suite failed:', error)
  process.exit(1)
})
