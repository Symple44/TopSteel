import { Module } from '@nestjs/common'
import { OptimizedCacheService } from '../../infrastructure/cache/redis-optimized.service'
import { PrismaModule } from '../../core/database/prisma/prisma.module'
import { UsersPrismaService } from './users-prisma.service'
import { UserAuthPrismaRepositoryService } from './services/user-auth-prisma-repository.service'
import { UsersService } from './users.service'
import { UserAuthRepositoryService } from './services/user-auth-repository.service'

@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [
    UsersPrismaService,
    UserAuthPrismaRepositoryService,

    // Alias: UsersService → UsersPrismaService
    {
      provide: UsersService,
      useExisting: UsersPrismaService,
    },
    {
      provide: UserAuthRepositoryService,
      useExisting: UserAuthPrismaRepositoryService,
    },

    OptimizedCacheService,
  ],
  exports: [
    UsersPrismaService,
    UserAuthPrismaRepositoryService,
    UsersService,
    UserAuthRepositoryService,
  ],
})
export class UsersModule {}
