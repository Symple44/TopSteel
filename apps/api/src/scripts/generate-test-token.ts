#!/usr/bin/env ts-node

/**
 * Script pour générer un token JWT de test sans avoir besoin de credentials
 * Usage: npm run generate-token [email] [role] [societeId]
 */

import { TestAuthHelper } from './utils/test-auth-helper'
import * as fs from 'fs'
import * as path from 'path'

async function generateTestToken() {
  console.log('🔑 Generating test JWT token...\n')

  // Récupérer les paramètres depuis les arguments ou l'environnement
  const email = process.argv[2] || process.env.TEST_USER_EMAIL || 'test@example.com'
  const role = process.argv[3] || process.env.TEST_USER_ROLE || 'admin'
  const societeId = process.argv[4] || process.env.TEST_SOCIETE_ID || 'test-societe-id'
  const userId = process.env.TEST_USER_ID || `user-${Date.now()}`

  // Initialiser le helper
  TestAuthHelper.initialize()

  // Générer le token
  const token = TestAuthHelper.generateTestToken({
    email,
    userId,
    societeId,
    role,
    permissions: role === 'admin' ? ['*'] : ['read'],
    expiresIn: '24h'
  })

  console.log('✅ Token generated successfully!\n')
  console.log('📧 Email:', email)
  console.log('👤 Role:', role)
  console.log('🏢 Société ID:', societeId)
  console.log('⏱️  Expires in: 24 hours\n')

  // Afficher le token
  console.log('🔐 Token:')
  console.log('━'.repeat(80))
  console.log(token)
  console.log('━'.repeat(80))
  console.log()

  // Options de sauvegarde
  console.log('💾 Save options:')
  console.log('1. Copy the token above')
  console.log('2. Set as environment variable:')
  console.log(`   export TEST_AUTH_TOKEN="${token}"`)
  console.log('3. Add to .env.test file:')
  console.log(`   TEST_AUTH_TOKEN=${token}`)
  
  // Sauvegarder dans un fichier si demandé
  if (process.argv.includes('--save')) {
    const tokenFile = await TestAuthHelper.saveTokenToFile(token)
    console.log(`\n4. Token saved to file: ${tokenFile}`)
    console.log('   ⚠️  Delete this file after use for security!')
  }

  // Créer un exemple de curl avec le token
  console.log('\n📡 Example API call:')
  console.log('━'.repeat(80))
  console.log(`curl -H "Authorization: Bearer ${token}" \\`)
  console.log('     http://localhost:3002/api/v1/auth/me')
  console.log('━'.repeat(80))

  // Créer un fichier .env.test si demandé
  if (process.argv.includes('--env')) {
    const envPath = path.join(process.cwd(), '.env.test')
    const envContent = `# Test Authentication Token
# Generated: ${new Date().toISOString()}
# Expires: 24 hours
TEST_AUTH_TOKEN=${token}
TEST_USER_EMAIL=${email}
TEST_USER_ROLE=${role}
TEST_SOCIETE_ID=${societeId}
TEST_USER_ID=${userId}
`
    fs.writeFileSync(envPath, envContent, { mode: 0o600 })
    console.log(`\n✅ .env.test file created: ${envPath}`)
    console.log('   Add to .gitignore: .env.test')
  }

  // Nettoyer les anciens fichiers de tokens
  if (process.argv.includes('--cleanup')) {
    TestAuthHelper.cleanupTokenFiles()
  }
}

// Exécuter le script
generateTestToken().catch(error => {
  console.error('❌ Error generating token:', error)
  process.exit(1)
})