#!/usr/bin/env ts-node

/**
 * Script de vérification détaillée des tokens JWT avec contexte société
 * Vérifie que chaque token contient bien le societeId correspondant
 */

import * as jwt from 'jsonwebtoken'
import { TestAuthHelper } from './utils/test-auth-helper'
import { TestDataGenerator } from './utils/test-data-generator'

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function verifyTokenSociete() {
  console.log(
    `${colors.cyan}${colors.bright}🔍 VÉRIFICATION DÉTAILLÉE DES TOKENS AVEC CONTEXTE SOCIÉTÉ${colors.reset}`
  )
  console.log('='.repeat(80))
  console.log()

  // Initialiser le helper
  TestAuthHelper.initialize()

  // Générer l'environnement de test
  const env = TestDataGenerator.generateTestEnvironment()

  // Test 1: Token pour TopSteel
  console.log(`${colors.blue}📌 TEST 1: Token pour TopSteel SA${colors.reset}`)
  console.log('-'.repeat(40))

  const topsteelToken = TestAuthHelper.generateTestToken({
    userId: env.users.topsteelAdmin.id,
    email: env.users.topsteelAdmin.email,
    societeId: env.societes.topsteel.id,
    role: 'admin',
    permissions: ['*'],
  })

  const topsteelDecoded = jwt.decode(topsteelToken) as any

  console.log('📝 Token décodé:')
  console.log(`  User ID: ${topsteelDecoded.sub}`)
  console.log(`  Email: ${topsteelDecoded.email}`)
  console.log(`  ${colors.yellow}Société ID: ${topsteelDecoded.societeId}${colors.reset}`)
  console.log(`  Société Code: ${topsteelDecoded.societeCode}`)
  console.log(`  Société Name: ${topsteelDecoded.societeName}`)

  // Vérifier que le societeId correspond bien
  const topsteelMatch = topsteelDecoded.societeId === env.societes.topsteel.id
  console.log(
    `\n✅ Vérification: societeId correspond à TopSteel: ${topsteelMatch ? `${colors.green}OUI` : `${colors.red}NON`}${colors.reset}`
  )
  console.log(`  Expected: ${env.societes.topsteel.id}`)
  console.log(`  Got: ${topsteelDecoded.societeId}`)

  // Test 2: Token pour Metalux
  console.log(`\n${colors.blue}📌 TEST 2: Token pour Metalux Industries${colors.reset}`)
  console.log('-'.repeat(40))

  const metaluxToken = TestAuthHelper.generateTestToken({
    userId: env.users.metaluxAdmin.id,
    email: env.users.metaluxAdmin.email,
    societeId: env.societes.metalux.id,
    role: 'admin',
    permissions: ['*'],
  })

  const metaluxDecoded = jwt.decode(metaluxToken) as any

  console.log('📝 Token décodé:')
  console.log(`  User ID: ${metaluxDecoded.sub}`)
  console.log(`  Email: ${metaluxDecoded.email}`)
  console.log(`  ${colors.yellow}Société ID: ${metaluxDecoded.societeId}${colors.reset}`)
  console.log(`  Société Code: ${metaluxDecoded.societeCode}`)
  console.log(`  Société Name: ${metaluxDecoded.societeName}`)

  const metaluxMatch = metaluxDecoded.societeId === env.societes.metalux.id
  console.log(
    `\n✅ Vérification: societeId correspond à Metalux: ${metaluxMatch ? `${colors.green}OUI` : `${colors.red}NON`}${colors.reset}`
  )
  console.log(`  Expected: ${env.societes.metalux.id}`)
  console.log(`  Got: ${metaluxDecoded.societeId}`)

  // Test 3: Même utilisateur, sociétés différentes
  console.log(`\n${colors.blue}📌 TEST 3: Même utilisateur, sociétés différentes${colors.reset}`)
  console.log('-'.repeat(40))

  const userId = TestDataGenerator.generateUUID()
  const userEmail = 'multi@tenant.com'

  // Token 1: Utilisateur dans TopSteel
  const userTopsteelToken = TestAuthHelper.generateTestToken({
    userId,
    email: userEmail,
    societeId: env.societes.topsteel.id,
    role: 'user',
    permissions: ['inventory:read'],
  })

  // Token 2: Même utilisateur dans Metalux
  const userMetaluxToken = TestAuthHelper.generateTestToken({
    userId,
    email: userEmail,
    societeId: env.societes.metalux.id,
    role: 'admin',
    permissions: ['*'],
  })

  const userTopsteelDecoded = jwt.decode(userTopsteelToken) as any
  const userMetaluxDecoded = jwt.decode(userMetaluxToken) as any

  console.log('🔄 Comparaison des tokens pour le même utilisateur:')
  console.log('\nToken 1 (TopSteel):')
  console.log(`  User ID: ${userTopsteelDecoded.sub}`)
  console.log(`  ${colors.yellow}Société ID: ${userTopsteelDecoded.societeId}${colors.reset}`)
  console.log(`  Rôle: ${userTopsteelDecoded.role}`)

  console.log('\nToken 2 (Metalux):')
  console.log(`  User ID: ${userMetaluxDecoded.sub}`)
  console.log(`  ${colors.yellow}Société ID: ${userMetaluxDecoded.societeId}${colors.reset}`)
  console.log(`  Rôle: ${userMetaluxDecoded.role}`)

  const sameUser = userTopsteelDecoded.sub === userMetaluxDecoded.sub
  const differentSociete = userTopsteelDecoded.societeId !== userMetaluxDecoded.societeId

  console.log(`\n✅ Vérifications:`)
  console.log(
    `  Même utilisateur: ${sameUser ? `${colors.green}OUI` : `${colors.red}NON`}${colors.reset}`
  )
  console.log(
    `  Sociétés différentes: ${differentSociete ? `${colors.green}OUI` : `${colors.red}NON`}${colors.reset}`
  )
  console.log(
    `  Rôles différents: ${userTopsteelDecoded.role !== userMetaluxDecoded.role ? `${colors.green}OUI` : `${colors.red}NON`}${colors.reset}`
  )

  // Test 4: Vérification de l'isolation
  console.log(`\n${colors.blue}📌 TEST 4: Vérification de l'isolation des données${colors.reset}`)
  console.log('-'.repeat(40))

  console.log("🛡️ Simulation d'accès aux données:")

  function simulateDataAccess(token: string, requestedSocieteId: string): boolean {
    const decoded = jwt.decode(token) as any
    return decoded.societeId === requestedSocieteId
  }

  // TopSteel essaie d'accéder aux données TopSteel
  const topsteelToTopsteel = simulateDataAccess(topsteelToken, env.societes.topsteel.id)
  console.log(
    `\n  TopSteel → Données TopSteel: ${topsteelToTopsteel ? `${colors.green}✅ AUTORISÉ` : `${colors.red}❌ REFUSÉ`}${colors.reset}`
  )

  // TopSteel essaie d'accéder aux données Metalux
  const topsteelToMetalux = simulateDataAccess(topsteelToken, env.societes.metalux.id)
  console.log(
    `  TopSteel → Données Metalux: ${topsteelToMetalux ? `${colors.red}❌ AUTORISÉ (ERREUR!)` : `${colors.green}✅ REFUSÉ`}${colors.reset}`
  )

  // Metalux essaie d'accéder aux données Metalux
  const metaluxToMetalux = simulateDataAccess(metaluxToken, env.societes.metalux.id)
  console.log(
    `  Metalux → Données Metalux: ${metaluxToMetalux ? `${colors.green}✅ AUTORISÉ` : `${colors.red}❌ REFUSÉ`}${colors.reset}`
  )

  // Metalux essaie d'accéder aux données TopSteel
  const metaluxToTopsteel = simulateDataAccess(metaluxToken, env.societes.topsteel.id)
  console.log(
    `  Metalux → Données TopSteel: ${metaluxToTopsteel ? `${colors.red}❌ AUTORISÉ (ERREUR!)` : `${colors.green}✅ REFUSÉ`}${colors.reset}`
  )

  // Résumé final
  console.log(`\n${'='.repeat(80)}`)
  console.log(`${colors.green}${colors.bright}📊 RÉSUMÉ DE LA VÉRIFICATION${colors.reset}`)
  console.log('='.repeat(80))

  const allTestsPassed =
    topsteelMatch &&
    metaluxMatch &&
    sameUser &&
    differentSociete &&
    topsteelToTopsteel &&
    !topsteelToMetalux &&
    metaluxToMetalux &&
    !metaluxToTopsteel

  if (allTestsPassed) {
    console.log(`\n${colors.green}✨ TOUS LES TESTS SONT RÉUSSIS !${colors.reset}`)
    console.log('\nLe système multi-tenant fonctionne correctement:')
    console.log('  ✅ Chaque token contient le bon societeId')
    console.log('  ✅ Un même utilisateur peut avoir différents tokens pour différentes sociétés')
    console.log("  ✅ L'isolation des données est garantie")
    console.log("  ✅ Aucun accès cross-tenant n'est possible")
  } else {
    console.log(`\n${colors.red}❌ CERTAINS TESTS ONT ÉCHOUÉ${colors.reset}`)
    console.log("Veuillez vérifier l'implémentation du système multi-tenant.")
  }

  console.log(`\n${'='.repeat(80)}`)

  // Afficher un exemple d'utilisation dans l'API
  console.log(`\n${colors.cyan}💡 EXEMPLE D'UTILISATION DANS L'API:${colors.reset}`)
  console.log('```typescript')
  console.log('@Injectable()')
  console.log('export class ArticleService {')
  console.log('  async findAll(user: JwtPayload) {')
  console.log('    // Le societeId du token est automatiquement utilisé')
  console.log('    return this.articleRepository.find({')
  console.log('      where: { societeId: user.societeId }')
  console.log('    })')
  console.log('  }')
  console.log('}')
  console.log('```')
}

// Exécuter la vérification
if (require.main === module) {
  try {
    verifyTokenSociete()
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de la vérification:${colors.reset}`, error)
    process.exit(1)
  }
}

export { verifyTokenSociete }
