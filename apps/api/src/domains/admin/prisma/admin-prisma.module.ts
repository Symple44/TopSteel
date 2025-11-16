import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../core/database/prisma/prisma.module'
import { MenuConfigurationPrismaService } from './menu-configuration-prisma.service'
import { SystemSettingPrismaService } from './system-setting-prisma.service'
import { SystemParameterPrismaService } from './system-parameter-prisma.service'

/**
 * AdminPrismaModule - Phase 2.3 (Partial - 3/11 entities)
 *
 * Module pour gestion admin et menu avec Prisma
 *
 * Provides (currently):
 * - MenuConfigurationPrismaService pour configurations de menu
 * - SystemSettingPrismaService pour paramètres système
 * - SystemParameterPrismaService pour paramètres simples
 *
 * TODO Phase 2.3 remaining (8/11 entities):
 * - MenuItem, MenuItemRole, MenuItemPermission
 * - UserMenuPreferences, UserMenuItemPreference
 * - MenuConfigurationSimple, UserMenuPreference
 * - DiscoveredPage
 */
@Module({
  imports: [PrismaModule],
  providers: [
    MenuConfigurationPrismaService,
    SystemSettingPrismaService,
    SystemParameterPrismaService,
  ],
  exports: [
    MenuConfigurationPrismaService,
    SystemSettingPrismaService,
    SystemParameterPrismaService,
  ],
})
export class AdminPrismaModule {}
