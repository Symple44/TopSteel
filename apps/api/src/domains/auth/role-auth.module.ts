import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Module as ModuleEntity } from './core/entities/module.entity'

// Entities




import { GroupController } from './external/controllers/group.controller'
import { ModuleController } from './external/controllers/module.controller'
import { GroupService } from './services/group.service'
// Services
import { RoleService } from './services/role.service'
import { Group } from '../../domains/auth/core/entities/group.entity'
import { Module } from '../../domains/auth/core/entities/module.entity'
import { Permission } from '../../domains/auth/core/entities/permission.entity'
import { Role } from '../../domains/auth/core/entities/role.entity'
import { RolePermission } from '../../domains/auth/core/entities/role-permission.entity'
import { UserGroup } from '../../domains/auth/core/entities/user-group.entity'
import { UserRole } from '../../domains/auth/core/entities/user-role.entity'


// Guards & Strategies (à créer si nécessaire)
// import { JwtAuthGuard } from './guards/jwt-auth.guard'
// import { RolesGuard } from './guards/roles.guard'
// import { JwtStrategy } from './strategies/jwt.strategy'

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [Role, Permission, RolePermission, UserRole, Group, UserGroup, ModuleEntity],
      'auth'
    ),
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

        // Use a development default only in non-production environments
        return (
          secret || (isProduction ? undefined : 'development-jwt-secret-min-32-chars-for-testing')
        )
      })(),
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
    }),
  ],
  controllers: [GroupController, ModuleController],
  providers: [
    RoleService,
    GroupService,
    // JwtStrategy,
    // JwtAuthGuard,
    // RolesGuard
  ],
  exports: [RoleService, TypeOrmModule],
})
export class RoleAuthModule {}

