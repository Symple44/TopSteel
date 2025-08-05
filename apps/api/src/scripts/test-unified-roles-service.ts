import { ConfigService } from '@nestjs/config'
import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'
import { MultiTenantDatabaseConfig } from '../core/database/config/multi-tenant-database.config'
import { UserSocieteRole } from '../domains/auth/core/entities/user-societe-role.entity'
import { UnifiedRolesService } from '../domains/auth/services/unified-roles.service'
import { User } from '../domains/users/entities/user.entity'
import { OptimizedCacheService } from '../infrastructure/cache/redis-optimized.service'

dotenv.config({ path: '.env' })

async function testUnifiedRolesService() {
  // Use the same configuration as the app
  const configService = new ConfigService()
  const dbConfig = new MultiTenantDatabaseConfig(configService)
  const authConfig = dbConfig.getAuthDatabaseConfig()

  const dataSource = new DataSource({
    ...authConfig,
    logging: true, // Enable logging to see SQL queries
  } as any)

  try {
    await dataSource.initialize()
    console.log('✅ Base de données connectée\n')

    const userSocieteRoleRepository = dataSource.getRepository(UserSocieteRole)
    const userRepository = dataSource.getRepository(User)

    // Mock cache service
    const cacheService = {
      getWithMetrics: async () => null,
      setWithGroup: async () => {},
      set: async () => {},
      invalidateGroup: async () => {},
      invalidatePattern: async () => {},
    } as any

    const unifiedRolesService = new UnifiedRolesService(
      userSocieteRoleRepository,
      userRepository,
      cacheService
    )

    const userId = '0d2f2574-0ddf-4e50-ac45-58f7391367c8'
    const societeId = '73416fa9-f693-42f6-99d3-7c919cefe4d5'

    console.log('🧪 Test 1: getUserSocieteRole')
    console.log(`  userId: ${userId}`)
    console.log(`  societeId: ${societeId}`)

    try {
      const result = await unifiedRolesService.getUserSocieteRole(userId, societeId)
      console.log('\n✅ Résultat:', result)
    } catch (error: any) {
      console.error('\n❌ Erreur:', error.message)
      console.error('Stack:', error.stack)
    }

    console.log('\n🧪 Test 2: getUserSocieteRoles')
    try {
      const roles = await unifiedRolesService.getUserSocieteRoles(userId)
      console.log('\n✅ Rôles trouvés:', roles.length)
      roles.forEach((role) => {
        console.log(`  - Société ${role.societeId}: ${role.societeRole}`)
      })
    } catch (error: any) {
      console.error('\n❌ Erreur:', error.message)
      console.error('Stack:', error.stack)
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await dataSource.destroy()
  }
}

testUnifiedRolesService().catch(console.error)
