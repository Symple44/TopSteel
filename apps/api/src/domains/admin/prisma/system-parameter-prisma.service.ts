import { Injectable, Logger } from '@nestjs/common'
import { TenantPrismaService } from '../../../core/multi-tenant/tenant-prisma.service'
import type { SystemParameter } from '@prisma/client'

/**
 * SystemParameterPrismaService - Phase 2.3
 *
 * Service pour gestion des paramètres système simples avec Prisma
 *
 * SystemParameters = Paramètres système simplifiés (key-value)
 * Plus simple que SystemSettings (pas de catégorie, type, etc.)
 *
 * Fonctionnalités:
 * - CRUD SystemParameters
 * - Get/Set par clé
 * - Upsert
 */
@Injectable()
export class SystemParameterPrismaService {
  private readonly logger = new Logger(SystemParameterPrismaService.name)

  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  /** Client Prisma avec filtrage automatique par tenant */
  private get prisma() {
    return this.tenantPrisma.client
  }

  /**
   * Créer un paramètre
   */
  async createSystemParameter(data: {
    key: string
    value: string
    description?: string
  }): Promise<SystemParameter> {
    this.logger.log(`Creating system parameter: ${data.key}`)

    try {
      const parameter = await this.prisma.systemParameter.create({
        data: {
          key: data.key,
          value: data.value,
          description: data.description || null,
        },
      })

      this.logger.log(`System parameter created: ${parameter.id}`)
      return parameter
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating system parameter: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un paramètre par ID
   */
  async getSystemParameterById(id: string): Promise<SystemParameter | null> {
    this.logger.debug(`Getting system parameter: ${id}`)

    try {
      return await this.prisma.systemParameter.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting system parameter: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un paramètre par clé
   */
  async getSystemParameterByKey(key: string): Promise<SystemParameter | null> {
    this.logger.debug(`Getting system parameter by key: ${key}`)

    try {
      return await this.prisma.systemParameter.findUnique({
        where: { key },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting system parameter by key: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer la valeur d'un paramètre
   */
  async getValue(key: string): Promise<string | null> {
    const parameter = await this.getSystemParameterByKey(key)
    return parameter?.value || null
  }

  /**
   * Lister tous les paramètres
   */
  async getAllSystemParameters(): Promise<SystemParameter[]> {
    this.logger.debug('Getting all system parameters')

    try {
      return await this.prisma.systemParameter.findMany({
        orderBy: { key: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting all system parameters: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour un paramètre
   */
  async updateSystemParameter(
    key: string,
    data: {
      value?: string
      description?: string
    }
  ): Promise<SystemParameter> {
    this.logger.log(`Updating system parameter: ${key}`)

    try {
      const parameter = await this.prisma.systemParameter.update({
        where: { key },
        data,
      })

      this.logger.log(`System parameter updated: ${key}`)
      return parameter
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating system parameter: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour la valeur d'un paramètre
   */
  async setValue(key: string, value: string): Promise<SystemParameter> {
    this.logger.log(`Setting value for ${key}`)

    return this.updateSystemParameter(key, { value })
  }

  /**
   * Créer ou mettre à jour un paramètre
   */
  async upsertSystemParameter(data: {
    key: string
    value: string
    description?: string
  }): Promise<SystemParameter> {
    this.logger.log(`Upserting system parameter: ${data.key}`)

    try {
      const parameter = await this.prisma.systemParameter.upsert({
        where: { key: data.key },
        create: {
          key: data.key,
          value: data.value,
          description: data.description || null,
        },
        update: {
          value: data.value,
          description: data.description,
        },
      })

      this.logger.log(`System parameter upserted: ${parameter.id}`)
      return parameter
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error upserting system parameter: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer un paramètre
   */
  async deleteSystemParameter(key: string): Promise<void> {
    this.logger.log(`Deleting system parameter: ${key}`)

    try {
      await this.prisma.systemParameter.delete({
        where: { key },
      })

      this.logger.log(`System parameter deleted: ${key}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting system parameter: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les paramètres
   */
  async countSystemParameters(): Promise<number> {
    this.logger.debug('Counting system parameters')

    try {
      return await this.prisma.systemParameter.count()
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting system parameters: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Rechercher des paramètres par clé (pattern matching)
   */
  async searchByKey(keyPattern: string): Promise<SystemParameter[]> {
    this.logger.debug(`Searching parameters by key pattern: ${keyPattern}`)

    try {
      return await this.prisma.systemParameter.findMany({
        where: {
          key: {
            contains: keyPattern,
            mode: 'insensitive',
          },
        },
        orderBy: { key: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error searching parameters: ${err.message}`, err.stack)
      throw error
    }
  }
}
