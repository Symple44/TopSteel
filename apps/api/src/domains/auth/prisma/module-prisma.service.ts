import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { Module, Prisma } from '@prisma/client'

/**
 * ModulePrismaService - Phase 2.1
 *
 * Service pour gestion des modules avec Prisma
 *
 * Modules = Groupes fonctionnels pour organiser permissions et features
 * Exemples: auth, users, admin, notifications, reporting, etc.
 *
 * Fonctionnalités:
 * - CRUD Modules
 * - Activation/désactivation modules
 * - Ordering
 */
@Injectable()
export class ModulePrismaService {
  private readonly logger = new Logger(ModulePrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer un module
   */
  async createModule(data: {
    name: string
    label: string
    description?: string
    icon?: string
    order?: number
    isActive?: boolean
  }): Promise<Module> {
    this.logger.log(`Creating module: ${data.name}`)

    try {
      const module = await this.prisma.module.create({
        data: {
          name: data.name,
          label: data.label,
          description: data.description || null,
          icon: data.icon || null,
          order: data.order || 0,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
      })

      this.logger.log(`Module created: ${module.id}`)
      return module
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating module: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un module par ID
   */
  async getModuleById(id: string): Promise<Module | null> {
    this.logger.debug(`Getting module: ${id}`)

    try {
      return await this.prisma.module.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting module: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un module par nom
   */
  async getModuleByName(name: string): Promise<Module | null> {
    this.logger.debug(`Getting module by name: ${name}`)

    try {
      return await this.prisma.module.findUnique({
        where: { name },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting module by name: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Lister tous les modules
   */
  async getAllModules(includeInactive = false): Promise<Module[]> {
    this.logger.debug(`Getting all modules (includeInactive: ${includeInactive})`)

    try {
      return await this.prisma.module.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: { order: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting all modules: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour un module
   */
  async updateModule(
    id: string,
    data: Partial<Omit<Module, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Module> {
    this.logger.log(`Updating module: ${id}`)

    try {
      // Convert metadata if present
      const updateData: any = { ...data }
      if ('metadata' in data && data.metadata !== undefined) {
        updateData.metadata = data.metadata as Prisma.InputJsonValue
      }

      const module = await this.prisma.module.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`Module updated: ${id}`)
      return module
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating module: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Activer/Désactiver un module
   */
  async setModuleActive(id: string, isActive: boolean): Promise<Module> {
    this.logger.log(`Setting module ${id} active: ${isActive}`)

    return this.updateModule(id, { isActive })
  }

  /**
   * Mettre à jour l'ordre d'affichage
   */
  async updateOrder(id: string, order: number): Promise<Module> {
    this.logger.log(`Updating module ${id} order: ${order}`)

    return this.updateModule(id, { order })
  }

  /**
   * Désactiver un module
   */
  async deactivateModule(id: string): Promise<Module> {
    this.logger.log(`Deactivating module: ${id}`)

    return this.setModuleActive(id, false)
  }

  /**
   * Supprimer un module (hard delete)
   */
  async deleteModule(id: string): Promise<void> {
    this.logger.log(`Deleting module: ${id}`)

    try {
      await this.prisma.module.delete({
        where: { id },
      })

      this.logger.log(`Module deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting module: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Vérifier si un module existe par nom
   */
  async moduleExists(name: string): Promise<boolean> {
    this.logger.debug(`Checking if module exists: ${name}`)

    try {
      const module = await this.getModuleByName(name)
      return module !== null
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking module existence: ${err.message}`, err.stack)
      return false
    }
  }

  /**
   * Créer des modules par défaut
   */
  async createDefaultModules(): Promise<Module[]> {
    this.logger.log('Creating default modules')

    const defaultModules = [
      {
        name: 'auth',
        label: 'Authentication',
        description: 'User authentication and authorization',
        icon: 'shield',
        order: 1,
      },
      {
        name: 'users',
        label: 'Users',
        description: 'User management',
        icon: 'users',
        order: 2,
      },
      {
        name: 'admin',
        label: 'Administration',
        description: 'System administration',
        icon: 'settings',
        order: 3,
      },
      {
        name: 'notifications',
        label: 'Notifications',
        description: 'Notification management',
        icon: 'bell',
        order: 4,
      },
      {
        name: 'reports',
        label: 'Reports',
        description: 'Reporting and analytics',
        icon: 'chart',
        order: 5,
      },
    ]

    const createdModules: Module[] = []

    for (const moduleData of defaultModules) {
      const exists = await this.moduleExists(moduleData.name)

      if (!exists) {
        const module = await this.createModule(moduleData)
        createdModules.push(module)
      }
    }

    this.logger.log(`Created ${createdModules.length} default modules`)
    return createdModules
  }

  /**
   * Compter les modules
   */
  async countModules(includeInactive = false): Promise<number> {
    this.logger.debug('Counting modules')

    try {
      return await this.prisma.module.count({
        where: includeInactive ? {} : { isActive: true },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting modules: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Réorganiser les modules (mettre à jour les ordres)
   */
  async reorderModules(moduleOrders: Array<{ id: string; order: number }>): Promise<void> {
    this.logger.log(`Reordering ${moduleOrders.length} modules`)

    try {
      for (const { id, order } of moduleOrders) {
        await this.updateOrder(id, order)
      }

      this.logger.log('Modules reordered successfully')
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error reordering modules: ${err.message}`, err.stack)
      throw error
    }
  }
}
