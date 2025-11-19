import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OptimizedCacheService } from '../../infrastructure/cache/redis-optimized.service'


import { UserAuthRepositoryService } from './services/user-auth-repository.service'
import { UsersService } from './users.service'

@Module({
  imports: [TypeOrmModule.forFeature([User, UserSettings], 'auth')],
  controllers: [], // Controller removed - new Prisma controller should be imported elsewhere
  providers: [UsersService, OptimizedCacheService, UserAuthRepositoryService],
  exports: [UsersService, UserAuthRepositoryService, TypeOrmModule],
})
export class UsersModule {}
import { User } from '../../domains/users/entities/user.entity'
import { UserSettings } from '../../domains/users/entities/user-settings.entity'
