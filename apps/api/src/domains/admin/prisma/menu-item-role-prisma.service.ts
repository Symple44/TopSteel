import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { MenuItemRole } from '@prisma/client'

/**
 * MenuItemRolePrismaService - Phase 2.3
 *
 * Service pour gestion des associations menu-role avec Prisma
 *
 * MenuItemRole = Junction table entre MenuItem et Role
 * Définit quels rôles ont accès à quels items de menu
 *
 * Fonctionnalités:
 * - Assigner/retirer rôles aux menu items
 * - Vérifier accès par rôle
 * - Lister menu items par rôle
 */
@Injectable()
export class MenuItemRolePrismaService {
  private readonly logger = new Logger(MenuItemRolePrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Assigner un rôle à un menu item
   */
  async assignRoleToMenuItem(menuItemId: string, roleId: string): Promise<MenuItemRole> {
    this.logger.log(`Assigning role ${roleId} to menu item ${menuItemId}`)

    try {
      const menuItemRole = await this.prisma.menuItemRole.create({
        data: {
          menuItemId,
          roleId,
        },
      })

      this.logger.log(`Role assigned to menu item successfully`)
      return menuItemRole
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error assigning role to menu item: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Retirer un rôle d'un menu item
   */
  async removeRoleFromMenuItem(menuItemId: string, roleId: string): Promise<void> {
    this.logger.log(`Removing role ${roleId} from menu item ${menuItemId}`)

    try {
      await this.prisma.menuItemRole.delete({
        where: {
          menuItemId_roleId: {
            menuItemId,
            roleId,
          },
        },
      })

      this.logger.log(`Role removed from menu item successfully`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error removing role from menu item: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer tous les rôles d'un menu item
   */
  async getMenuItemRoles(menuItemId: string) {
    this.logger.debug(`Getting roles for menu item: ${menuItemId}`)

    try {
      return await this.prisma.menuItemRole.findMany({
        where: { menuItemId },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              label: true,
              level: true,
            },
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting menu item roles: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer tous les menu items pour un rôle
   */
  async getRoleMenuItems(roleId: string) {
    this.logger.debug(`Getting menu items for role: ${roleId}`)

    try {
      return await this.prisma.menuItemRole.findMany({
        where: { roleId },
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
      this.logger.error(`Error getting role menu items: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Vérifier si un rôle a accès à un menu item
   */
  async hasRoleAccess(menuItemId: string, roleId: string): Promise<boolean> {
    this.logger.debug(`Checking role access: menuItem=${menuItemId}, role=${roleId}`)

    try {
      const access = await this.prisma.menuItemRole.findUnique({
        where: {
          menuItemId_roleId: {
            menuItemId,
            roleId,
          },
        },
      })

      return access !== null
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking role access: ${err.message}`, err.stack)
      return false
    }
  }

  /**
   * Assigner plusieurs rôles à un menu item
   */
  async assignMultipleRoles(menuItemId: string, roleIds: string[]): Promise<void> {
    this.logger.log(`Assigning ${roleIds.length} roles to menu item ${menuItemId}`)

    try {
      for (const roleId of roleIds) {
        await this.assignRoleToMenuItem(menuItemId, roleId)
      }

      this.logger.log('Multiple roles assigned successfully')
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error assigning multiple roles: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Remplacer tous les rôles d'un menu item
   */
  async replaceMenuItemRoles(menuItemId: string, roleIds: string[]): Promise<void> {
    this.logger.log(`Replacing roles for menu item ${menuItemId}`)

    try {
      // Supprimer tous les rôles existants
      await this.prisma.menuItemRole.deleteMany({
        where: { menuItemId },
      })

      // Ajouter les nouveaux rôles
      await this.assignMultipleRoles(menuItemId, roleIds)

      this.logger.log('Menu item roles replaced successfully')
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error replacing menu item roles: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les rôles pour un menu item
   */
  async countMenuItemRoles(menuItemId: string): Promise<number> {
    this.logger.debug(`Counting roles for menu item: ${menuItemId}`)

    try {
      return await this.prisma.menuItemRole.count({
        where: { menuItemId },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting menu item roles: ${err.message}`, err.stack)
      throw error
    }
  }
}
