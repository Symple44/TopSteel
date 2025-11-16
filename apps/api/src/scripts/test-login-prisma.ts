/**
 * Script de test pour l'endpoint /auth-prisma/login
 * POC Phase 1.4 - Validation Login/JWT avec Prisma
 *
 * Usage:
 *   npx tsx src/scripts/test-login-prisma.ts
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Test Login Prisma - Phase 1.4')
  console.log('=====================================\n')

  try {
    // 1. Créer un utilisateur de test
    console.log('1️⃣ Création utilisateur de test...')

    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'Test123!'
    const passwordHash = await bcrypt.hash(testPassword, 10)

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        username: `test${Date.now()}`,
        passwordHash,
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
      },
    })

    console.log(`✅ Utilisateur créé: ${user.email} (ID: ${user.id})\n`)

    // 2. Afficher les instructions de test
    console.log('2️⃣ Test du endpoint:')
    console.log('===================')
    console.log('\nPOST http://localhost:4000/auth-prisma/login')
    console.log('\nBody:')
    console.log(JSON.stringify({
      email: testEmail,
      password: testPassword,
    }, null, 2))

    console.log('\n3️⃣ Commande curl:')
    console.log('================')
    console.log(`curl -X POST http://localhost:4000/auth-prisma/login \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ email: testEmail, password: testPassword })}'`)

    console.log('\n4️⃣ Réponse attendue:')
    console.log('===================')
    console.log(`{
  "user": {
    "id": "${user.id}",
    "email": "${testEmail}",
    "username": "${user.username}",
    "firstName": "Test",
    "lastName": "User"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "sessionId": "uuid-v4",
  "expiresIn": 3600
}`)

    console.log('\n5️⃣ Vérifications:')
    console.log('================')
    console.log('- ✅ Utilisateur authentifié')
    console.log('- ✅ JWT accessToken généré')
    console.log('- ✅ JWT refreshToken généré')
    console.log('- ✅ Session créée en DB')
    console.log('- ✅ lastLoginAt mis à jour')

    console.log('\n6️⃣ Nettoyage (optionnel):')
    console.log('=========================')
    console.log(`DELETE FROM users WHERE id = '${user.id}';`)
    console.log(`DELETE FROM user_sessions WHERE user_id = '${user.id}';`)

    console.log('\n✅ Utilisateur de test prêt!')
    console.log(`\n📧 Email: ${testEmail}`)
    console.log(`🔑 Password: ${testPassword}`)
    console.log(`\n🚀 Démarrez le serveur avec: pnpm --filter @topsteel/api dev`)
    console.log(`puis testez avec la commande curl ci-dessus\n`)

  } catch (error) {
    console.error('❌ Erreur:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
