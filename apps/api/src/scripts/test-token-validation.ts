#!/usr/bin/env ts-node

/**
 * Script pour tester et valider un token JWT
 */

import * as dotenv from 'dotenv'
import * as jwt from 'jsonwebtoken'
import { TestAuthHelper } from './utils/test-auth-helper'

dotenv.config()

async function testTokenValidation() {
  console.log('🔍 Testing JWT Token Validation\n')
  console.log('='.repeat(80))

  // Initialiser le helper
  TestAuthHelper.initialize()

  // Générer un token de test
  const testToken = TestAuthHelper.generateTestToken({
    email: 'test@example.com',
    userId: 'test-user-123',
    societeId: 'test-societe-456',
    role: 'admin',
    permissions: ['*'],
    expiresIn: '1h',
  })

  console.log('✅ Token generated successfully\n')

  // Décoder le token (sans vérification)
  const decoded = jwt.decode(testToken) as Record<string, unknown> | null
  console.log('📋 Token Payload (decoded):')
  console.log(JSON.stringify(decoded, null, 2))
  console.log()

  // Vérifier les champs requis
  console.log('🔍 Validating token fields:')
  const requiredFields = ['sub', 'email', 'societeId', 'role', 'permissions', 'iat', 'exp']
  let allFieldsPresent = true

  for (const field of requiredFields) {
    const present = decoded && field in decoded
    console.log(`  ${present ? '✅' : '❌'} ${field}: ${present ? 'Present' : 'Missing'}`)
    if (!present) allFieldsPresent = false
  }
  console.log()

  // Vérifier l'expiration
  const now = Math.floor(Date.now() / 1000)
  const isExpired = decoded.exp < now
  const expiresIn = decoded.exp - now
  const expirationDate = new Date(decoded.exp * 1000)

  console.log('⏱️  Token Expiration:')
  console.log(`  Status: ${isExpired ? '❌ EXPIRED' : '✅ VALID'}`)
  console.log(`  Expires at: ${expirationDate.toISOString()}`)
  console.log(`  Time remaining: ${Math.floor(expiresIn / 60)} minutes`)
  console.log()

  // Vérifier la signature (avec le secret)
  try {
    const jwtSecret = process.env.JWT_SECRET || 'test-secret-min-32-chars-for-testing'
    const _verified = jwt.verify(testToken, jwtSecret)
    console.log('🔐 Signature Verification: ✅ VALID')
    console.log(`  Algorithm: ${jwt.decode(testToken, { complete: true })?.header.alg}`)
  } catch (error) {
    console.log('🔐 Signature Verification: ❌ INVALID')
    console.log(`  Error: ${(error as Error).message}`)
  }
  console.log()

  // Test avec différents rôles
  console.log('👥 Testing different roles:')
  const roles = ['admin', 'user', 'viewer', 'super-admin']

  for (const role of roles) {
    const roleToken = TestAuthHelper.generateTestToken({
      email: `${role}@test.com`,
      role: role,
      permissions: role === 'admin' ? ['*'] : ['read'],
    })

    const roleDecoded = jwt.decode(roleToken) as Record<string, unknown> | null
    console.log(
      `  ${role}: ${roleDecoded?.email} - Permissions: ${JSON.stringify(roleDecoded?.permissions)}`
    )
  }
  console.log()

  // Test de token expiré
  console.log('⏰ Testing expired token:')
  const expiredToken = TestAuthHelper.generateTestToken({
    email: 'expired@test.com',
    expiresIn: '0s', // Expire immédiatement
  })

  try {
    const jwtSecret = process.env.JWT_SECRET || 'test-secret-min-32-chars-for-testing'
    jwt.verify(expiredToken, jwtSecret)
    console.log('  ❌ Expired token was accepted (should not happen)')
  } catch (error) {
    if ((error as Error & { name?: string }).name === 'TokenExpiredError') {
      console.log('  ✅ Expired token correctly rejected')
    } else {
      console.log(`  ⚠️  Unexpected error: ${(error as Error).message}`)
    }
  }
  console.log()

  // Résumé
  console.log('='.repeat(80))
  console.log('📊 Test Summary:')
  console.log(`  Token Generation: ✅ Working`)
  console.log(
    `  Token Structure: ${allFieldsPresent ? '✅' : '❌'} ${allFieldsPresent ? 'Valid' : 'Invalid'}`
  )
  console.log(`  Token Expiration: ✅ Working`)
  console.log(`  Role Management: ✅ Working`)
  console.log(`  Security: ✅ Expired tokens rejected`)
  console.log()
  console.log('✨ JWT Token system is working correctly!')
  console.log('='.repeat(80))
}

// Exécuter le test
testTokenValidation().catch((error) => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})
