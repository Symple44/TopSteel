import { Injectable, Logger } from '@nestjs/common'
import { TenantPrismaService } from '../../../core/multi-tenant/tenant-prisma.service'
import type { MenuConfigurationSimple, Prisma } from '@prisma/client'

/**
 * MenuConfigurationSimplePrismaService - Phase 2.3
 *
 * Service pour gestion des configurations de menu simplifiées avec Prisma
 *
 * MenuConfigurationSimple = Configuration menu stockée en Json
 * Alternative plus simple à MenuConfiguration pour menus statiques/simples
 *
 * Fonctionnalités:
 * - CRUD configurations simples
 * - Stockage complet en Json (config)
 * - Activation/désactivation
 * - Recherche et validation
 */
@Injectable()
export class MenuConfigurationSimplePrismaService {
  private readonly logger = new Logger(MenuConfigurationSimplePrismaService.name)

  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  /** Client Prisma avec filtrage automatique par tenant */
  private get prisma() {
    return this.tenantPrisma.client
  }

  /**
   * Créer une configuration de menu simple
   */
  async createMenuConfigurationSimple(data: {
    name: string
    config: Record<string, any>
    isActive?: boolean
  }): Promise<MenuConfigurationSimple> {
    this.logger.log(`Creating simple menu configuration: ${data.name}`)

    try {
      const menuConfig = await this.prisma.menuConfigurationSimple.create({
        data: {
          name: data.name,
          config: data.config as Prisma.InputJsonValue,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
      })

      this.logger.log(`Simple menu configuration created: ${menuConfig.id}`)
      return menuConfig
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating simple menu configuration: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une configuration par ID
   */
  async getMenuConfigurationSimpleById(id: string): Promise<MenuConfigurationSimple | null> {
    this.logger.debug(`Getting simple menu configuration: ${id}`)

    try {
      return await this.prisma.menuConfigurationSimple.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting simple menu configuration: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une configuration par nom
   */
  async getMenuConfigurationSimpleByName(name: string): Promise<MenuConfigurationSimple | null> {
    this.logger.debug(`Getting simple menu configuration by name: ${name}`)

    try {
      return await this.prisma.menuConfigurationSimple.findUnique({
        where: { name },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting simple menu configuration by name: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Lister toutes les configurations
   */
  async getAllMenuConfigurationsSimple(includeInactive = false): Promise<MenuConfigurationSimple[]> {
    this.logger.debug('Getting all simple menu configurations')

    try {
      return await this.prisma.menuConfigurationSimple.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting all simple menu configurations: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les configurations actives
   */
  async getActiveMenuConfigurationsSimple(): Promise<MenuConfigurationSimple[]> {
    this.logger.debug('Getting active simple menu configurations')

    return this.getAllMenuConfigurationsSimple(false)
  }

  /**
   * Mettre à jour une configuration
   */
  async updateMenuConfigurationSimple(
    id: string,
    data: {
      name?: string
      config?: Record<string, any>
      isActive?: boolean
    }
  ): Promise<MenuConfigurationSimple> {
    this.logger.log(`Updating simple menu configuration: ${id}`)

    try {
      const updateData: any = {}

      if (data.name !== undefined) updateData.name = data.name
      if (data.config !== undefined) updateData.config = data.config as Prisma.InputJsonValue
      if (data.isActive !== undefined) updateData.isActive = data.isActive

      const menuConfig = await this.prisma.menuConfigurationSimple.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`Simple menu configuration updated: ${id}`)
      return menuConfig
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating simple menu configuration: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour la configuration Json
   */
  async updateConfig(id: string, config: Record<string, any>): Promise<MenuConfigurationSimple> {
    this.logger.log(`Updating config for simple menu configuration: ${id}`)

    return this.updateMenuConfigurationSimple(id, { config })
  }

  /**
   * Activer/désactiver une configuration
   */
  async setActive(id: string, isActive: boolean): Promise<MenuConfigurationSimple> {
    this.logger.log(`Setting simple menu configuration active: ${id} -> ${isActive}`)

    return this.updateMenuConfigurationSimple(id, { isActive })
  }

  /**
   * Créer ou mettre à jour une configuration (upsert)
   */
  async upsertMenuConfigurationSimple(data: {
    name: string
    config: Record<string, any>
    isActive?: boolean
  }): Promise<MenuConfigurationSimple> {
    this.logger.log(`Upserting simple menu configuration: ${data.name}`)

    try {
      const menuConfig = await this.prisma.menuConfigurationSimple.upsert({
        where: { name: data.name },
        create: {
          name: data.name,
          config: data.config as Prisma.InputJsonValue,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
        update: {
          config: data.config as Prisma.InputJsonValue,
          isActive: data.isActive,
        },
      })

      this.logger.log(`Simple menu configuration upserted: ${menuConfig.id}`)
      return menuConfig
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error upserting simple menu configuration: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer une configuration
   */
  async deleteMenuConfigurationSimple(id: string): Promise<void> {
    this.logger.log(`Deleting simple menu configuration: ${id}`)

    try {
      await this.prisma.menuConfigurationSimple.delete({
        where: { id },
      })

      this.logger.log(`Simple menu configuration deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting simple menu configuration: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les configurations
   */
  async countMenuConfigurationsSimple(includeInactive = false): Promise<number> {
    this.logger.debug('Counting simple menu configurations')

    try {
      return await this.prisma.menuConfigurationSimple.count({
        where: includeInactive ? {} : { isActive: true },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting simple menu configurations: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Vérifier si une configuration existe par nom
   */
  async existsByName(name: string): Promise<boolean> {
    this.logger.debug(`Checking if simple menu configuration exists: ${name}`)

    try {
      const config = await this.getMenuConfigurationSimpleByName(name)
      return config !== null
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking simple menu configuration existence: ${err.message}`, err.stack)
      return false
    }
  }

  /**
   * Rechercher des configurations par nom
   */
  async searchMenuConfigurationsSimple(searchTerm: string): Promise<MenuConfigurationSimple[]> {
    this.logger.debug(`Searching simple menu configurations: ${searchTerm}`)

    try {
      return await this.prisma.menuConfigurationSimple.findMany({
        where: {
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
          isActive: true,
        },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error searching simple menu configurations: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Valider la structure de la configuration Json
   */
  validateConfig(config: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Vérifier que c'est un objet
    if (typeof config !== 'object' || config === null || Array.isArray(config)) {
      errors.push('Config must be a non-null object')
      return { valid: false, errors }
    }

    // Vérifier les champs requis (exemple)
    if (!config.items || !Array.isArray(config.items)) {
      errors.push('Config must have an "items" array')
    }

    // Valider chaque item
    if (config.items && Array.isArray(config.items)) {
      config.items.forEach((item: any, index: number) => {
        if (!item.label) {
          errors.push(`Item at index ${index} must have a "label"`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Créer une configuration avec validation
   */
  async createWithValidation(data: {
    name: string
    config: Record<string, any>
    isActive?: boolean
  }): Promise<MenuConfigurationSimple> {
    this.logger.log(`Creating simple menu configuration with validation: ${data.name}`)

    const validation = this.validateConfig(data.config)
    if (!validation.valid) {
      const errorMsg = `Invalid config: ${validation.errors.join(', ')}`
      this.logger.error(errorMsg)
      throw new Error(errorMsg)
    }

    return this.createMenuConfigurationSimple(data)
  }
}
