import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { MenuItemPermission } from '@prisma/client'

/**
 * MenuItemPermissionPrismaService - Phase 2.3
 *
 * Service pour gestion des associations menu-permission avec Prisma
 *
 * MenuItemPermission = Junction table entre MenuItem et Permission
 * Définit quelles permissions sont requises pour accéder aux items de menu
 *
 * Fonctionnalités:
 * - Assigner/retirer permissions aux menu items
 * - Vérifier accès par permission
 * - Lister menu items par permission
 */
@Injectable()
export class MenuItemPermissionPrismaService {
  private readonly logger = new Logger(MenuItemPermissionPrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Assigner une permission à un menu item
   */
  async assignPermissionToMenuItem(menuItemId: string, permissionId: string): Promise<MenuItemPermission> {
    this.logger.log(`Assigning permission ${permissionId} to menu item ${menuItemId}`)

    try {
      const menuItemPermission = await this.prisma.menuItemPermission.create({
        data: {
          menuItemId,
          permissionId,
        },
      })

      this.logger.log(`Permission assigned to menu item successfully`)
      return menuItemPermission
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error assigning permission to menu item: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Retirer une permission d'un menu item
   */
  async removePermissionFromMenuItem(menuItemId: string, permissionId: string): Promise<void> {
    this.logger.log(`Removing permission ${permissionId} from menu item ${menuItemId}`)

    try {
      await this.prisma.menuItemPermission.delete({
        where: {
          menuItemId_permissionId: {
            menuItemId,
            permissionId,
          },
        },
      })

      this.logger.log(`Permission removed from menu item successfully`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error removing permission from menu item: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer toutes les permissions d'un menu item
   */
  async getMenuItemPermissions(menuItemId: string) {
    this.logger.debug(`Getting permissions for menu item: ${menuItemId}`)

    try {
      return await this.prisma.menuItemPermission.findMany({
        where: { menuItemId },
        include: {
          permission: {
            select: {
              id: true,
              name: true,
              label: true,
              module: true,
              action: true,
            },
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting menu item permissions: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer tous les menu items pour une permission
   */
  async getPermissionMenuItems(permissionId: string) {
    this.logger.debug(`Getting menu items for permission: ${permissionId}`)

    try {
      return await this.prisma.menuItemPermission.findMany({
        where: { permissionId },
        include: {
          menuItem: {
            select: {
              id: true,
              label: true,
              icon: true,
              path: true,
              order: true,
              isActive: true,
              isVisible: true,
            },
          },
        },
        orderBy: {
          menuItem: {
            order: 'asc',
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting permission menu items: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Vérifier si une permission donne accès à un menu item
   */
  async hasPermissionAccess(menuItemId: string, permissionId: string): Promise<boolean> {
    this.logger.debug(`Checking permission access: menuItem=${menuItemId}, permission=${permissionId}`)

    try {
      const access = await this.prisma.menuItemPermission.findUnique({
        where: {
          menuItemId_permissionId: {
            menuItemId,
            permissionId,
          },
        },
      })

      return access !== null
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking permission access: ${err.message}`, err.stack)
      return false
    }
  }

  /**
   * Assigner plusieurs permissions à un menu item
   */
  async assignMultiplePermissions(menuItemId: string, permissionIds: string[]): Promise<void> {
    this.logger.log(`Assigning ${permissionIds.length} permissions to menu item ${menuItemId}`)

    try {
      for (const permissionId of permissionIds) {
        await this.assignPermissionToMenuItem(menuItemId, permissionId)
      }

      this.logger.log('Multiple permissions assigned successfully')
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error assigning multiple permissions: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Remplacer toutes les permissions d'un menu item
   */
  async replaceMenuItemPermissions(menuItemId: string, permissionIds: string[]): Promise<void> {
    this.logger.log(`Replacing permissions for menu item ${menuItemId}`)

    try {
      // Supprimer toutes les permissions existantes
      await this.prisma.menuItemPermission.deleteMany({
        where: { menuItemId },
      })

      // Ajouter les nouvelles permissions
      await this.assignMultiplePermissions(menuItemId, permissionIds)

      this.logger.log('Menu item permissions replaced successfully')
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error replacing menu item permissions: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les permissions pour un menu item
   */
  async countMenuItemPermissions(menuItemId: string): Promise<number> {
    this.logger.debug(`Counting permissions for menu item: ${menuItemId}`)

    try {
      return await this.prisma.menuItemPermission.count({
        where: { menuItemId },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting menu item permissions: ${err.message}`, err.stack)
      throw error
    }
  }
}
