import { ConfigService } from '@nestjs/config'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { User } from '../modules/users/entities/user.entity'
import { UserSettings } from '../modules/users/entities/user-settings.entity'
import { MenuConfiguration } from '../modules/admin/entities/menu-configuration.entity'
import { MenuItem } from '../modules/admin/entities/menu-item.entity'
import { MenuItemPermission } from '../modules/admin/entities/menu-item-permission.entity'
import { MenuItemRole } from '../modules/admin/entities/menu-item-role.entity'
import { Role } from '../modules/auth/entities/role.entity'
import { Permission } from '../modules/auth/entities/permission.entity'
import { RolePermission } from '../modules/auth/entities/role-permission.entity'
import { UserRole } from '../modules/auth/entities/user-role.entity'
import { Group } from '../modules/auth/entities/group.entity'
import { UserGroup } from '../modules/auth/entities/user-group.entity'
import { Module } from '../modules/auth/entities/module.entity'
import { UserSession } from '../modules/auth/entities/user-session.entity'
import { UserMFA } from '../modules/auth/entities/user-mfa.entity'
import { MFASession } from '../modules/auth/entities/mfa-session.entity'
import { UserMenuPreference } from '../modules/menu/entities/user-menu-preference.entity'
import { QueryBuilder } from '../modules/query-builder/entities/query-builder.entity'
import { QueryBuilderColumn } from '../modules/query-builder/entities/query-builder-column.entity'
import { QueryBuilderJoin } from '../modules/query-builder/entities/query-builder-join.entity'
import { QueryBuilderCalculatedField } from '../modules/query-builder/entities/query-builder-calculated-field.entity'
import { QueryBuilderPermission } from '../modules/query-builder/entities/query-builder-permission.entity'

export const createSimpleDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const config: TypeOrmModuleOptions = {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', 'postgres'),
    database: configService.get<string>('DB_NAME', 'erp_topsteel'),
    
    // Entities avec import explicite pour User + patterns
    entities: [
      User,
      UserSettings,
      MenuConfiguration,
      MenuItem,
      MenuItemPermission,
      MenuItemRole,
      Role,
      Permission,
      RolePermission,
      UserRole,
      Group,
      UserGroup,
      Module,
      UserSession,
      UserMFA,
      MFASession,
      UserMenuPreference,
      QueryBuilder,
      QueryBuilderColumn,
      QueryBuilderJoin,
      QueryBuilderCalculatedField,
      QueryBuilderPermission,
      __dirname + '/../modules/**/*.entity.{ts,js}',
      __dirname + '/../common/**/*.entity.{ts,js}',
    ],
    
    // Configuration basique - utilisation des migrations
    synchronize: false,
    dropSchema: false,
    logging: true,
    ssl: false,
    
    // Migrations
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    migrationsTableName: 'migrations',
    migrationsRun: false, // Géré par le startup service
  }
  
  console.log('🔧 Configuration de base de données:', {
    host: config.host,
    port: config.port,
    database: config.database,
    username: config.username,
    ssl: config.ssl,
    entitiesPattern: config.entities,
  })
  
  return config
}