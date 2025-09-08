import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Group } from './core/entities/group.entity'
import { Module as ModuleEntity } from './core/entities/module.entity'
import { Permission } from './core/entities/permission.entity'
// Entities
import { Role } from './core/entities/role.entity'
import { RolePermission } from './core/entities/role-permission.entity'
import { UserGroup } from './core/entities/user-group.entity'
import { UserRole } from './core/entities/user-role.entity'
import { GroupController } from './external/controllers/group.controller'
import { ModuleController } from './external/controllers/module.controller'
// Controllers
import { RoleController } from './external/controllers/role.controller'
import { GroupService } from './services/group.service'
// Services
import { RoleService } from './services/role.service'

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
  controllers: [RoleController, GroupController, ModuleController],
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
