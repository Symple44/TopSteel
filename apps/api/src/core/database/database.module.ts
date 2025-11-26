// apps/api/src/database/database.module.ts
/**
 * LEGACY TypeORM DatabaseModule - DISABLED
 *
 * This module is no longer used. The project has migrated to Prisma.
 * All database operations now go through:
 * - PrismaModule (src/core/database/prisma/prisma.module.ts)
 * - PrismaService (src/core/database/prisma/prisma.service.ts)
 *
 * Database sync services have been disabled as Prisma handles migrations via:
 * - prisma migrate dev
 * - prisma db push
 */
import { Module } from '@nestjs/common'

// TypeORM imports disabled - migrated to Prisma
// import { ConfigModule, ConfigService } from '@nestjs/config'
// import { DatabaseCleanupService } from './database-cleanup.service'
// import { DatabasePreSyncService } from './database-pre-sync.service'
// import { DatabaseSyncService } from './database-sync.service'

@Module({
  imports: [
    // TypeORM configuration removed - using Prisma now
  ],
  providers: [
    // Legacy TypeORM sync services disabled
    // DatabaseCleanupService,
    // DatabaseSyncService,
    // DatabasePreSyncService
  ],
  exports: [
    // No exports - all database operations via PrismaService
  ],
})
export class DatabaseModule {}
