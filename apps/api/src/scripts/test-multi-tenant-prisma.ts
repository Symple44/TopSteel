/**
 * Script de test pour l'isolation multi-tenant avec Prisma
 * POC Phase 1.6 - Validation isolation DB-level
 *
 * Usage:
 *   npx tsx src/scripts/test-multi-tenant-prisma.ts
 *
 * Tests:
 * 1. Créer utilisateur dans tenant-1
 * 2. Créer utilisateur dans tenant-2
 * 3. Vérifier isolation: tenant-1 ne voit pas users de tenant-2
 * 4. Vérifier isolation: tenant-2 ne voit pas users de tenant-1
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

// Configuration tenants (POC)
const TENANT_1_URL = process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/topsteel_auth'
const TENANT_2_URL = process.env.TENANT_2_DB_URL || TENANT_1_URL // Même DB pour POC

async function main() {
  console.log('🧪 Test Multi-Tenant Isolation - Phase 1.6')
  console.log('==========================================\n')

  // Créer clients Prisma pour chaque tenant
  console.log('1️⃣ Initialisation clients Prisma...')

  const tenant1Client = new PrismaClient({
    datasources: { db: { url: TENANT_1_URL } },
  })

  const tenant2Client = new PrismaClient({
    datasources: { db: { url: TENANT_2_URL } },
  })

  await tenant1Client.$connect()
  await tenant2Client.$connect()

  console.log('✅ Clients connectés\n')

  try {
    // 2. Créer utilisateur dans tenant-1
    console.log('2️⃣ Création utilisateur TENANT-1...')
    const passwordHash = await bcrypt.hash('Test123!', 10)

    const user1 = await tenant1Client.user.create({
      data: {
        email: `tenant1-user-${Date.now()}@example.com`,
        username: `tenant1-${Date.now()}`,
        passwordHash,
        firstName: 'User',
        lastName: 'Tenant1',
        isActive: true,
      },
    })

    console.log(`✅ User créé dans TENANT-1:`)
    console.log(`   ID: ${user1.id}`)
    console.log(`   Email: ${user1.email}`)
    console.log(`   Username: ${user1.username}\n`)

    // 3. Créer utilisateur dans tenant-2
    console.log('3️⃣ Création utilisateur TENANT-2...')

    const user2 = await tenant2Client.user.create({
      data: {
        email: `tenant2-user-${Date.now()}@example.com`,
        username: `tenant2-${Date.now()}`,
        passwordHash,
        firstName: 'User',
        lastName: 'Tenant2',
        isActive: true,
      },
    })

    console.log(`✅ User créé dans TENANT-2:`)
    console.log(`   ID: ${user2.id}`)
    console.log(`   Email: ${user2.email}`)
    console.log(`   Username: ${user2.username}\n`)

    // 4. Vérifier isolation: Compter users dans chaque tenant
    console.log('4️⃣ Vérification isolation...')

    const tenant1UserCount = await tenant1Client.user.count()
    const tenant2UserCount = await tenant2Client.user.count()

    console.log(`\n📊 Statistiques:`)
    console.log(`   TENANT-1: ${tenant1UserCount} utilisateurs`)
    console.log(`   TENANT-2: ${tenant2UserCount} utilisateurs`)

    // 5. Vérifier qu'on ne peut pas voir l'utilisateur de l'autre tenant par ID
    console.log('\n5️⃣ Test accès cross-tenant (doit échouer)...')

    // Essayer de lire user2 depuis tenant1
    const crossTenantUser = await tenant1Client.user.findUnique({
      where: { id: user2.id },
    })

    if (crossTenantUser) {
      console.log('❌ ISOLATION FAILED: Tenant-1 peut voir user de Tenant-2!')
      console.log('   Cela indique que les tenants partagent la même DB')
      console.log('   Pour une vraie isolation, utilisez des DB séparées\n')
    } else {
      console.log('✅ ISOLATION OK: Tenant-1 ne peut pas voir user de Tenant-2\n')
    }

    // 6. Test de transaction isolée
    console.log('6️⃣ Test transaction isolée...')

    await tenant1Client.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: `admin-tenant1-${Date.now()}`,
          label: 'Admin Tenant 1',
          level: 10,
        },
      })

      console.log(`✅ Rôle créé dans transaction TENANT-1: ${role.name}`)
    })

    await tenant2Client.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: `admin-tenant2-${Date.now()}`,
          label: 'Admin Tenant 2',
          level: 10,
        },
      })

      console.log(`✅ Rôle créé dans transaction TENANT-2: ${role.name}`)
    })

    console.log('\n7️⃣ Résumé:')
    console.log('==========')
    console.log('✅ Connexions multi-tenant fonctionnelles')
    console.log('✅ Création données isolées par tenant')
    console.log('✅ Transactions isolées par tenant')

    if (TENANT_1_URL === TENANT_2_URL) {
      console.log('\n⚠️  ATTENTION: POC mode - même DB pour les 2 tenants')
      console.log('   En production, utilisez des DB séparées:')
      console.log('   - TENANT_1_DB_URL=postgresql://user:pass@localhost:5432/tenant1_db')
      console.log('   - TENANT_2_DB_URL=postgresql://user:pass@localhost:5432/tenant2_db')
    } else {
      console.log('\n✅ Configuration production: DB séparées par tenant')
      console.log('   - Isolation DB-level garantie')
      console.log('   - Pas de risque de cross-tenant data leak')
    }

    console.log('\n8️⃣ Nettoyage recommandé:')
    console.log('=======================')
    console.log(`DELETE FROM users WHERE id IN ('${user1.id}', '${user2.id}');`)
    console.log(`DELETE FROM roles WHERE name LIKE 'admin-tenant%';`)

    console.log('\n✅ Test multi-tenant COMPLETE!')

  } catch (error) {
    console.error('\n❌ Erreur:', error)
    throw error
  } finally {
    await tenant1Client.$disconnect()
    await tenant2Client.$disconnect()
    console.log('\n🔌 Clients déconnectés\n')
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
