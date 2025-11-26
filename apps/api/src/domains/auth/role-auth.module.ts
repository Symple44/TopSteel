import { DatabaseModule } from '../../core/database/database.module'
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'

// Controllers
import { GroupController } from './external/controllers/group.controller'

// Services - All migrated to Prisma
import { GroupService } from './services/group.service'
import { RoleService } from './services/role.service'

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: (() => {
        const secret = process.env.JWT_SECRET
        const isProduction = process.env.NODE_ENV === 'production'

        if (isProduction && !secret) {
          throw new Error('JWT_SECRET environment variable is required in production')
        }

        if (secret && secret.length < 32) {
          throw new Error('JWT_SECRET must be at least 32 characters long')
        }

        return (
          secret || (isProduction ? undefined : 'development-jwt-secret-min-32-chars-for-testing')
        )
      })(),
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
    }),
  ],
  controllers: [
    GroupController,
  ],
  providers: [
    RoleService,
    GroupService,
  ],
  exports: [
    RoleService,
    GroupService,
  ],
})
export class RoleAuthModule {}

