import { Injectable, Logger } from '@nestjs/common'
import { TenantPrismaService } from '../../../core/multi-tenant/tenant-prisma.service'
import type { SystemSetting } from '@prisma/client'

/**
 * SystemSettingPrismaService - Phase 2.3
 *
 * Service pour gestion des paramètres système avec Prisma
 *
 * SystemSettings = Configuration système (key-value)
 * Peut être publique (accessible aux clients) ou privée (serveur only)
 *
 * Fonctionnalités:
 * - CRUD SystemSettings
 * - Gestion par catégorie
 * - Settings publics/privés
 * - Type safety avec conversion
 */
@Injectable()
export class SystemSettingPrismaService {
  private readonly logger = new Logger(SystemSettingPrismaService.name)

  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  /** Client Prisma avec filtrage automatique par tenant */
  private get prisma() {
    return this.tenantPrisma.client
  }

  /**
   * Créer un setting
   */
  async createSystemSetting(data: {
    key: string
    value: string
    type: string
    category: string
    description?: string
    isPublic?: boolean
    updatedBy?: string
  }): Promise<SystemSetting> {
    this.logger.log(`Creating system setting: ${data.key}`)

    try {
      const setting = await this.prisma.systemSetting.create({
        data: {
          key: data.key,
          value: data.value,
          type: data.type,
          category: data.category,
          description: data.description || null,
          isPublic: data.isPublic || false,
          updatedBy: data.updatedBy || null,
        },
      })

      this.logger.log(`System setting created: ${setting.id}`)
      return setting
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating system setting: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un setting par ID
   */
  async getSystemSettingById(id: string): Promise<SystemSetting | null> {
    this.logger.debug(`Getting system setting: ${id}`)

    try {
      return await this.prisma.systemSetting.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting system setting: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un setting par clé
   */
  async getSystemSettingByKey(key: string): Promise<SystemSetting | null> {
    this.logger.debug(`Getting system setting by key: ${key}`)

    try {
      return await this.prisma.systemSetting.findUnique({
        where: { key },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting system setting by key: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer la valeur d'un setting
   */
  async getValue(key: string): Promise<string | null> {
    const setting = await this.getSystemSettingByKey(key)
    return setting?.value || null
  }

  /**
   * Récupérer la valeur typée d'un setting
   */
  async getTypedValue<T = any>(key: string): Promise<T | null> {
    const setting = await this.getSystemSettingByKey(key)
    if (!setting) return null

    try {
      switch (setting.type) {
        case 'boolean':
          return (setting.value === 'true') as T
        case 'number':
          return Number(setting.value) as T
        case 'json':
          return JSON.parse(setting.value) as T
        default:
          return setting.value as T
      }
    } catch (error) {
      this.logger.error(`Error parsing setting value for ${key}:`, error)
      return null
    }
  }

  /**
   * Lister tous les settings
   */
  async getAllSystemSettings(): Promise<SystemSetting[]> {
    this.logger.debug('Getting all system settings')

    try {
      return await this.prisma.systemSetting.findMany({
        orderBy: [{ category: 'asc' }, { key: 'asc' }],
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting all system settings: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Lister les settings par catégorie
   */
  async getSettingsByCategory(category: string): Promise<SystemSetting[]> {
    this.logger.debug(`Getting settings for category: ${category}`)

    try {
      return await this.prisma.systemSetting.findMany({
        where: { category },
        orderBy: { key: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting settings by category: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Lister les settings publics
   */
  async getPublicSettings(): Promise<SystemSetting[]> {
    this.logger.debug('Getting public system settings')

    try {
      return await this.prisma.systemSetting.findMany({
        where: { isPublic: true },
        orderBy: [{ category: 'asc' }, { key: 'asc' }],
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting public settings: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour un setting
   */
  async updateSystemSetting(
    key: string,
    data: {
      value?: string
      type?: string
      category?: string
      description?: string
      isPublic?: boolean
      updatedBy?: string
    }
  ): Promise<SystemSetting> {
    this.logger.log(`Updating system setting: ${key}`)

    try {
      const setting = await this.prisma.systemSetting.update({
        where: { key },
        data,
      })

      this.logger.log(`System setting updated: ${key}`)
      return setting
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating system setting: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour la valeur d'un setting
   */
  async setValue(key: string, value: string, updatedBy?: string): Promise<SystemSetting> {
    this.logger.log(`Setting value for ${key}`)

    return this.updateSystemSetting(key, { value, updatedBy })
  }

  /**
   * Créer ou mettre à jour un setting
   */
  async upsertSystemSetting(data: {
    key: string
    value: string
    type: string
    category: string
    description?: string
    isPublic?: boolean
    updatedBy?: string
  }): Promise<SystemSetting> {
    this.logger.log(`Upserting system setting: ${data.key}`)

    try {
      const setting = await this.prisma.systemSetting.upsert({
        where: { key: data.key },
        create: {
          key: data.key,
          value: data.value,
          type: data.type,
          category: data.category,
          description: data.description || null,
          isPublic: data.isPublic || false,
          updatedBy: data.updatedBy || null,
        },
        update: {
          value: data.value,
          type: data.type,
          category: data.category,
          description: data.description,
          isPublic: data.isPublic,
          updatedBy: data.updatedBy,
        },
      })

      this.logger.log(`System setting upserted: ${setting.id}`)
      return setting
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error upserting system setting: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer un setting
   */
  async deleteSystemSetting(key: string): Promise<void> {
    this.logger.log(`Deleting system setting: ${key}`)

    try {
      await this.prisma.systemSetting.delete({
        where: { key },
      })

      this.logger.log(`System setting deleted: ${key}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting system setting: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les settings
   */
  async countSystemSettings(): Promise<number> {
    this.logger.debug('Counting system settings')

    try {
      return await this.prisma.systemSetting.count()
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting system settings: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer toutes les catégories
   */
  async getCategories(): Promise<string[]> {
    this.logger.debug('Getting all setting categories')

    try {
      const categories = await this.prisma.systemSetting.findMany({
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      })

      return categories.map((c) => c.category)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting categories: ${err.message}`, err.stack)
      throw error
    }
  }
}
