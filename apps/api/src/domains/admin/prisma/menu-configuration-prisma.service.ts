import { Injectable, Logger } from '@nestjs/common'
import { TenantPrismaService } from '../../../core/multi-tenant/tenant-prisma.service'
import type { MenuConfiguration, Prisma } from '@prisma/client'

/**
 * MenuConfigurationPrismaService - Phase 2.3
 *
 * Service pour gestion des configurations de menu avec Prisma
 *
 * MenuConfiguration = Configuration globale d'un menu (ensemble de MenuItems)
 *
 * Fonctionnalités:
 * - CRUD MenuConfiguration
 * - Gestion menu par défaut
 * - Activation/désactivation
 */
@Injectable()
export class MenuConfigurationPrismaService {
  private readonly logger = new Logger(MenuConfigurationPrismaService.name)

  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  /** Client Prisma avec filtrage automatique par tenant */
  private get prisma() {
    return this.tenantPrisma.client
  }

  /**
   * Créer une configuration de menu
   */
  async createMenuConfiguration(data: {
    name: string
    description?: string
    isActive?: boolean
    isDefault?: boolean
  }): Promise<MenuConfiguration> {
    this.logger.log(`Creating menu configuration: ${data.name}`)

    try {
      // Si isDefault=true, désactiver l'ancien menu par défaut
      if (data.isDefault) {
        await this.prisma.menuConfiguration.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        })
      }

      const menuConfig = await this.prisma.menuConfiguration.create({
        data: {
          name: data.name,
          description: data.description || null,
          isActive: data.isActive !== undefined ? data.isActive : true,
          isDefault: data.isDefault || false,
        },
      })

      this.logger.log(`Menu configuration created: ${menuConfig.id}`)
      return menuConfig
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating menu configuration: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une configuration par ID
   */
  async getMenuConfigurationById(id: string): Promise<MenuConfiguration | null> {
    this.logger.debug(`Getting menu configuration: ${id}`)

    try {
      return await this.prisma.menuConfiguration.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting menu configuration: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une configuration par nom
   */
  async getMenuConfigurationByName(name: string): Promise<MenuConfiguration | null> {
    this.logger.debug(`Getting menu configuration by name: ${name}`)

    try {
      return await this.prisma.menuConfiguration.findUnique({
        where: { name },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting menu configuration by name: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer le menu par défaut
   */
  async getDefaultMenuConfiguration(): Promise<MenuConfiguration | null> {
    this.logger.debug('Getting default menu configuration')

    try {
      return await this.prisma.menuConfiguration.findFirst({
        where: {
          isDefault: true,
          isActive: true,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting default menu configuration: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Lister toutes les configurations
   */
  async getAllMenuConfigurations(includeInactive = false): Promise<MenuConfiguration[]> {
    this.logger.debug(`Getting all menu configurations (includeInactive: ${includeInactive})`)

    try {
      return await this.prisma.menuConfiguration.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting all menu configurations: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une configuration avec ses items
   */
  async getMenuConfigurationWithItems(id: string) {
    this.logger.debug(`Getting menu configuration with items: ${id}`)

    try {
      return await this.prisma.menuConfiguration.findUnique({
        where: { id },
        include: {
          menuItems: {
            where: { isActive: true },
            orderBy: { order: 'asc' },
            include: {
              children: {
                where: { isActive: true },
                orderBy: { order: 'asc' },
              },
              roles: {
                include: {
                  role: {
                    select: {
                      id: true,
                      name: true,
                      label: true,
                    },
                  },
                },
              },
              permissions: {
                include: {
                  permission: {
                    select: {
                      id: true,
                      name: true,
                      label: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting menu configuration with items: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour une configuration
   */
  async updateMenuConfiguration(
    id: string,
    data: Partial<Omit<MenuConfiguration, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<MenuConfiguration> {
    this.logger.log(`Updating menu configuration: ${id}`)

    try {
      // Si isDefault=true, désactiver l'ancien menu par défaut
      if (data.isDefault) {
        await this.prisma.menuConfiguration.updateMany({
          where: { isDefault: true, NOT: { id } },
          data: { isDefault: false },
        })
      }

      // Convert metadata if present
      const updateData: any = { ...data }
      if ('metadata' in data && data.metadata !== undefined) {
        updateData.metadata = data.metadata as Prisma.InputJsonValue
      }

      const menuConfig = await this.prisma.menuConfiguration.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`Menu configuration updated: ${id}`)
      return menuConfig
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating menu configuration: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Définir comme menu par défaut
   */
  async setAsDefault(id: string): Promise<MenuConfiguration> {
    this.logger.log(`Setting menu configuration as default: ${id}`)

    return this.updateMenuConfiguration(id, { isDefault: true, isActive: true })
  }

  /**
   * Activer/désactiver une configuration
   */
  async setActive(id: string, isActive: boolean): Promise<MenuConfiguration> {
    this.logger.log(`Setting menu configuration active: ${id} -> ${isActive}`)

    return this.updateMenuConfiguration(id, { isActive })
  }

  /**
   * Supprimer une configuration
   */
  async deleteMenuConfiguration(id: string): Promise<void> {
    this.logger.log(`Deleting menu configuration: ${id}`)

    try {
      // Les menu items seront supprimés en cascade
      await this.prisma.menuConfiguration.delete({
        where: { id },
      })

      this.logger.log(`Menu configuration deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting menu configuration: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Dupliquer une configuration
   */
  async duplicateMenuConfiguration(id: string, newName: string): Promise<MenuConfiguration> {
    this.logger.log(`Duplicating menu configuration: ${id} -> ${newName}`)

    try {
      const original = await this.getMenuConfigurationWithItems(id)
      if (!original) {
        throw new Error(`Menu configuration not found: ${id}`)
      }

      const duplicate = await this.createMenuConfiguration({
        name: newName,
        description: original.description || undefined,
        isActive: false,
        isDefault: false,
      })

      this.logger.log(`Menu configuration duplicated: ${duplicate.id}`)
      return duplicate
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error duplicating menu configuration: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les configurations
   */
  async countMenuConfigurations(includeInactive = false): Promise<number> {
    this.logger.debug('Counting menu configurations')

    try {
      return await this.prisma.menuConfiguration.count({
        where: includeInactive ? {} : { isActive: true },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting menu configurations: ${err.message}`, err.stack)
      throw error
    }
  }
}
