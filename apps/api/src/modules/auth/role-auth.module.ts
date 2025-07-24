import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'

// Entities
import { Role } from './entities/role.entity'
import { Module as ModuleEntity } from './entities/module.entity'
import { Permission } from './entities/permission.entity'
import { RolePermission } from './entities/role-permission.entity'
import { UserRole } from './entities/user-role.entity'
import { Group } from './entities/group.entity'
import { UserGroup } from './entities/user-group.entity'

// Services
import { RoleService } from './services/role.service'
import { GroupService } from './services/group.service'

// Controllers
import { RoleController } from './controllers/role.controller'
import { ModuleController } from './controllers/module.controller'
import { GroupController } from './controllers/group.controller'

// Guards & Strategies (à créer si nécessaire)
// import { JwtAuthGuard } from './guards/jwt-auth.guard'
// import { RolesGuard } from './guards/roles.guard'
// import { JwtStrategy } from './strategies/jwt.strategy'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      ModuleEntity,
      Permission,
      RolePermission,
      UserRole,
      Group,
      UserGroup
    ], 'auth'),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' }
    })
  ],
  controllers: [
    RoleController,
    ModuleController,
    GroupController
  ],
  providers: [
    RoleService,
    GroupService,
    // JwtStrategy,
    // JwtAuthGuard,
    // RolesGuard
  ],
  exports: [
    RoleService,
    TypeOrmModule
  ]
})
export class RoleAuthModule {}