import { ConfigService } from '@nestjs/config'
import type { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { DatatableHierarchicalPreferences } from '../../api/entities/datatable-hierarchical-preferences.entity'
import { DatatableHierarchyOrder } from '../../api/entities/datatable-hierarchy-order.entity'
import { UiPreferencesReorderableList } from '../../api/entities/ui-preferences-reorderable-list.entity'
import { Group } from '../../domains/auth/core/entities/group.entity'
import { MFASession } from '../../domains/auth/core/entities/mfa-session.entity'
import { Module } from '../../domains/auth/core/entities/module.entity'
import { Permission } from '../../domains/auth/core/entities/permission.entity'
import { Role } from '../../domains/auth/core/entities/role.entity'
import { RolePermission } from '../../domains/auth/core/entities/role-permission.entity'
import { UserGroup } from '../../domains/auth/core/entities/user-group.entity'
import { UserMFA } from '../../domains/auth/core/entities/user-mfa.entity'
import { UserRole } from '../../domains/auth/core/entities/user-role.entity'
import { UserSession } from '../../domains/auth/core/entities/user-session.entity'
import { User } from '../../domains/users/entities/user.entity'
import { UserSettings } from '../../domains/users/entities/user-settings.entity'
import { MenuConfiguration } from '../../features/admin/entities/menu-configuration.entity'
import { MenuItem } from '../../features/admin/entities/menu-item.entity'
import { MenuItemPermission } from '../../features/admin/entities/menu-item-permission.entity'
import { MenuItemRole } from '../../features/admin/entities/menu-item-role.entity'
import { UserMenuPreference } from '../../features/menu/entities/user-menu-preference.entity'
import { QueryBuilder } from '../../features/query-builder/entities/query-builder.entity'
import { QueryBuilderCalculatedField } from '../../features/query-builder/entities/query-builder-calculated-field.entity'
import { QueryBuilderColumn } from '../../features/query-builder/entities/query-builder-column.entity'
import { QueryBuilderJoin } from '../../features/query-builder/entities/query-builder-join.entity'
import { QueryBuilderPermission } from '../../features/query-builder/entities/query-builder-permission.entity'

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
      DatatableHierarchicalPreferences,
      DatatableHierarchyOrder,
      UiPreferencesReorderableList,
      `${__dirname}/../../features/**/*.entity.{ts,js}`,
      `${__dirname}/../../domains/**/*.entity.{ts,js}`,
      `${__dirname}/../../api/entities/**/*.entity.{ts,js}`,
      `${__dirname}/../common/**/*.entity.{ts,js}`,
    ],

    // Configuration basique - utilisation des migrations
    synchronize: false,
    dropSchema: false,
    logging: true,
    ssl: false,

    // Migrations
    migrations: [`${__dirname}/migrations/*{.ts,.js}`],
    migrationsTableName: 'migrations',
    migrationsRun: false, // Géré par le startup service
  }

  return config
}
