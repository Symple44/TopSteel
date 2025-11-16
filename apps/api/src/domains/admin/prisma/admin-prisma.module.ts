import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../core/database/prisma/prisma.module'
import { MenuConfigurationPrismaService } from './menu-configuration-prisma.service'
import { SystemSettingPrismaService } from './system-setting-prisma.service'
import { SystemParameterPrismaService } from './system-parameter-prisma.service'
import { MenuItemPrismaService } from './menu-item-prisma.service'
import { MenuItemRolePrismaService } from './menu-item-role-prisma.service'
import { MenuItemPermissionPrismaService } from './menu-item-permission-prisma.service'
import { UserMenuPreferencesPrismaService } from './user-menu-preferences-prisma.service'
import { UserMenuItemPreferencePrismaService } from './user-menu-item-preference-prisma.service'
import { MenuConfigurationSimplePrismaService } from './menu-configuration-simple-prisma.service'
import { UserMenuPreferencePrismaService } from './user-menu-preference-prisma.service'
import { DiscoveredPagePrismaService } from './discovered-page-prisma.service'

/**
 * AdminPrismaModule - Phase 2.3 (Complete - 11/11 entities)
 *
 * Module pour gestion admin et menu avec Prisma
 *
 * Provides:
 * - MenuConfigurationPrismaService pour configurations de menu
 * - SystemSettingPrismaService pour paramètres système
 * - SystemParameterPrismaService pour paramètres simples
 * - MenuItemPrismaService pour items de menu hiérarchiques
 * - MenuItemRolePrismaService pour associations menu-rôle
 * - MenuItemPermissionPrismaService pour associations menu-permission
 * - UserMenuPreferencesPrismaService pour préférences menu utilisateur
 * - UserMenuItemPreferencePrismaService pour préférences par item
 * - MenuConfigurationSimplePrismaService pour configurations simples (Json)
 * - UserMenuPreferencePrismaService pour menus dynamiques (Json)
 * - DiscoveredPagePrismaService pour pages découvertes automatiquement
 */
@Module({
  imports: [PrismaModule],
  providers: [
    MenuConfigurationPrismaService,
    SystemSettingPrismaService,
    SystemParameterPrismaService,
    MenuItemPrismaService,
    MenuItemRolePrismaService,
    MenuItemPermissionPrismaService,
    UserMenuPreferencesPrismaService,
    UserMenuItemPreferencePrismaService,
    MenuConfigurationSimplePrismaService,
    UserMenuPreferencePrismaService,
    DiscoveredPagePrismaService,
  ],
  exports: [
    MenuConfigurationPrismaService,
    SystemSettingPrismaService,
    SystemParameterPrismaService,
    MenuItemPrismaService,
    MenuItemRolePrismaService,
    MenuItemPermissionPrismaService,
    UserMenuPreferencesPrismaService,
    UserMenuItemPreferencePrismaService,
    MenuConfigurationSimplePrismaService,
    UserMenuPreferencePrismaService,
    DiscoveredPagePrismaService,
  ],
})
export class AdminPrismaModule {}
