import { Injectable, Logger } from '@nestjs/common'
import { TenantPrismaService } from '../../../core/multi-tenant/tenant-prisma.service'
import type { ParameterApplication, Prisma } from '@prisma/client'

/**
 * ParameterApplicationPrismaService - Phase 2.4
 *
 * Service pour gestion des paramètres application avec Prisma
 *
 * ParameterApplication = Paramètres métier de l'application
 * Configuration business logic modifiable par administrateurs
 *
 * Fonctionnalités:
 * - CRUD paramètres application
 * - Types variés (string, number, boolean, array, object)
 * - Règles métier (businessRules Json)
 * - Valeurs par défaut
 * - Métadonnées extensibles (Json)
 * - Activation/désactivation
 * - Catégorisation
 */
@Injectable()
export class ParameterApplicationPrismaService {
  private readonly logger = new Logger(ParameterApplicationPrismaService.name)

  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  /** Client Prisma avec filtrage automatique par tenant */
  private get prisma() {
    return this.tenantPrisma.client
  }

  /**
   * Créer un paramètre application
   */
  async createParameterApplication(data: {
    code: string
    label: string
    description?: string
    type: string
    value?: string
    defaultValue?: string
    category: string
    isActive?: boolean
    businessRules?: Record<string, any>
    metadata?: Record<string, any>
    arrayValues?: any[]
  }): Promise<ParameterApplication> {
    this.logger.log(`Creating application parameter: ${data.code}`)

    try {
      const parameter = await this.prisma.parameterApplication.create({
        data: {
          code: data.code,
          label: data.label,
          description: data.description || null,
          type: data.type,
          value: data.value || null,
          defaultValue: data.defaultValue || null,
          category: data.category,
          isActive: data.isActive !== undefined ? data.isActive : true,
          businessRules: data.businessRules ? (data.businessRules as Prisma.InputJsonValue) : undefined,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
          arrayValues: data.arrayValues ? (data.arrayValues as Prisma.InputJsonValue) : undefined,
        },
      })

      this.logger.log(`Application parameter created: ${parameter.id}`)
      return parameter
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating application parameter: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un paramètre par ID
   */
  async getParameterApplicationById(id: string): Promise<ParameterApplication | null> {
    this.logger.debug(`Getting application parameter: ${id}`)

    try {
      return await this.prisma.parameterApplication.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting application parameter: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un paramètre par code
   */
  async getParameterApplicationByCode(code: string): Promise<ParameterApplication | null> {
    this.logger.debug(`Getting application parameter by code: ${code}`)

    try {
      return await this.prisma.parameterApplication.findUnique({
        where: { code },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting application parameter by code: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Lister tous les paramètres application
   */
  async getAllParametersApplication(includeInactive = false): Promise<ParameterApplication[]> {
    this.logger.debug('Getting all application parameters')

    try {
      return await this.prisma.parameterApplication.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: [{ category: 'asc' }, { code: 'asc' }],
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting all application parameters: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les paramètres actifs
   */
  async getActiveParametersApplication(): Promise<ParameterApplication[]> {
    this.logger.debug('Getting active application parameters')

    return this.getAllParametersApplication(false)
  }

  /**
   * Récupérer les paramètres par catégorie
   */
  async getParametersApplicationByCategory(category: string, includeInactive = false): Promise<ParameterApplication[]> {
    this.logger.debug(`Getting application parameters by category: ${category}`)

    try {
      return await this.prisma.parameterApplication.findMany({
        where: {
          category,
          ...(includeInactive ? {} : { isActive: true }),
        },
        orderBy: { code: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting application parameters by category: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer toutes les catégories
   */
  async getAllCategories(): Promise<string[]> {
    this.logger.debug('Getting all application parameter categories')

    try {
      const parameters = await this.prisma.parameterApplication.findMany({
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      })

      return parameters.map((p) => p.category)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting application parameter categories: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer la valeur typée d'un paramètre
   */
  async getTypedValue<T = any>(code: string): Promise<T | null> {
    const parameter = await this.getParameterApplicationByCode(code)
    if (!parameter || !parameter.isActive) return null

    const value = parameter.value || parameter.defaultValue
    if (!value) return null

    switch (parameter.type) {
      case 'boolean':
        return (value === 'true') as T
      case 'number':
        return Number(value) as T
      case 'json':
      case 'object':
        return JSON.parse(value) as T
      case 'array':
        return (parameter.arrayValues || JSON.parse(value)) as T
      default:
        return value as T
    }
  }

  /**
   * Mettre à jour un paramètre application
   */
  async updateParameterApplication(
    id: string,
    data: {
      label?: string
      description?: string
      type?: string
      value?: string
      defaultValue?: string
      category?: string
      isActive?: boolean
      businessRules?: Record<string, any>
      metadata?: Record<string, any>
      arrayValues?: any[]
    }
  ): Promise<ParameterApplication> {
    this.logger.log(`Updating application parameter: ${id}`)

    try {
      const updateData: any = {}

      if (data.label !== undefined) updateData.label = data.label
      if (data.description !== undefined) updateData.description = data.description
      if (data.type !== undefined) updateData.type = data.type
      if (data.value !== undefined) updateData.value = data.value
      if (data.defaultValue !== undefined) updateData.defaultValue = data.defaultValue
      if (data.category !== undefined) updateData.category = data.category
      if (data.isActive !== undefined) updateData.isActive = data.isActive
      if (data.businessRules !== undefined) updateData.businessRules = data.businessRules as Prisma.InputJsonValue
      if (data.metadata !== undefined) updateData.metadata = data.metadata as Prisma.InputJsonValue
      if (data.arrayValues !== undefined) updateData.arrayValues = data.arrayValues as Prisma.InputJsonValue

      const parameter = await this.prisma.parameterApplication.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`Application parameter updated: ${id}`)
      return parameter
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating application parameter: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour la valeur d'un paramètre
   */
  async updateValue(code: string, value: string): Promise<ParameterApplication> {
    this.logger.log(`Updating value for application parameter ${code}: ${value}`)

    const parameter = await this.getParameterApplicationByCode(code)
    if (!parameter) {
      throw new Error(`Application parameter not found: ${code}`)
    }

    if (!parameter.isActive) {
      throw new Error(`Application parameter is not active: ${code}`)
    }

    return this.updateParameterApplication(parameter.id, { value })
  }

  /**
   * Activer/désactiver un paramètre
   */
  async setActive(id: string, isActive: boolean): Promise<ParameterApplication> {
    this.logger.log(`Setting application parameter active: ${id} -> ${isActive}`)

    return this.updateParameterApplication(id, { isActive })
  }

  /**
   * Réinitialiser à la valeur par défaut
   */
  async resetToDefault(code: string): Promise<ParameterApplication> {
    this.logger.log(`Resetting application parameter to default: ${code}`)

    const parameter = await this.getParameterApplicationByCode(code)
    if (!parameter) {
      throw new Error(`Application parameter not found: ${code}`)
    }

    return this.updateParameterApplication(parameter.id, {
      value: parameter.defaultValue || undefined,
    })
  }

  /**
   * Mettre à jour les règles métier
   */
  async updateBusinessRules(id: string, businessRules: Record<string, any>): Promise<ParameterApplication> {
    this.logger.log(`Updating business rules for application parameter: ${id}`)

    return this.updateParameterApplication(id, { businessRules })
  }

  /**
   * Fusionner les règles métier (merge)
   */
  async mergeBusinessRules(id: string, partialRules: Record<string, any>): Promise<ParameterApplication> {
    this.logger.log(`Merging business rules for application parameter: ${id}`)

    try {
      const parameter = await this.getParameterApplicationById(id)
      if (!parameter) {
        throw new Error(`Application parameter not found: ${id}`)
      }

      const currentRules = (parameter.businessRules as Record<string, any>) || {}
      const mergedRules = {
        ...currentRules,
        ...partialRules,
      }

      return this.updateBusinessRules(id, mergedRules)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error merging business rules: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Créer ou mettre à jour un paramètre (upsert)
   */
  async upsertParameterApplication(data: {
    code: string
    label: string
    description?: string
    type: string
    value?: string
    defaultValue?: string
    category: string
    isActive?: boolean
    businessRules?: Record<string, any>
    metadata?: Record<string, any>
    arrayValues?: any[]
  }): Promise<ParameterApplication> {
    this.logger.log(`Upserting application parameter: ${data.code}`)

    try {
      const parameter = await this.prisma.parameterApplication.upsert({
        where: { code: data.code },
        create: {
          code: data.code,
          label: data.label,
          description: data.description || null,
          type: data.type,
          value: data.value || null,
          defaultValue: data.defaultValue || null,
          category: data.category,
          isActive: data.isActive !== undefined ? data.isActive : true,
          businessRules: data.businessRules ? (data.businessRules as Prisma.InputJsonValue) : undefined,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
          arrayValues: data.arrayValues ? (data.arrayValues as Prisma.InputJsonValue) : undefined,
        },
        update: {
          label: data.label,
          description: data.description,
          type: data.type,
          value: data.value,
          defaultValue: data.defaultValue,
          category: data.category,
          isActive: data.isActive,
          businessRules: data.businessRules ? (data.businessRules as Prisma.InputJsonValue) : undefined,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
          arrayValues: data.arrayValues ? (data.arrayValues as Prisma.InputJsonValue) : undefined,
        },
      })

      this.logger.log(`Application parameter upserted: ${parameter.id}`)
      return parameter
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error upserting application parameter: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer un paramètre application
   */
  async deleteParameterApplication(id: string): Promise<void> {
    this.logger.log(`Deleting application parameter: ${id}`)

    try {
      await this.prisma.parameterApplication.delete({
        where: { id },
      })

      this.logger.log(`Application parameter deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting application parameter: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Rechercher des paramètres
   */
  async searchParametersApplication(searchTerm: string): Promise<ParameterApplication[]> {
    this.logger.debug(`Searching application parameters: ${searchTerm}`)

    try {
      return await this.prisma.parameterApplication.findMany({
        where: {
          OR: [
            { code: { contains: searchTerm, mode: 'insensitive' } },
            { label: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        orderBy: [{ category: 'asc' }, { code: 'asc' }],
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error searching application parameters: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les paramètres application
   */
  async countParametersApplication(includeInactive = false): Promise<number> {
    this.logger.debug('Counting application parameters')

    try {
      return await this.prisma.parameterApplication.count({
        where: includeInactive ? {} : { isActive: true },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting application parameters: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter par catégorie
   */
  async countByCategory(category: string): Promise<number> {
    this.logger.debug(`Counting application parameters by category: ${category}`)

    try {
      return await this.prisma.parameterApplication.count({
        where: {
          category,
          isActive: true,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting application parameters by category: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Vérifier si un code existe
   */
  async existsByCode(code: string): Promise<boolean> {
    this.logger.debug(`Checking if application parameter exists: ${code}`)

    try {
      const parameter = await this.getParameterApplicationByCode(code)
      return parameter !== null
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking application parameter existence: ${err.message}`, err.stack)
      return false
    }
  }

  /**
   * Valider une valeur selon le type
   */
  validateValue(parameter: ParameterApplication, value: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Vérifier le type
    switch (parameter.type) {
      case 'number':
        if (value && isNaN(Number(value))) {
          errors.push('Value must be a number')
        }
        break
      case 'boolean':
        if (value && value !== 'true' && value !== 'false') {
          errors.push('Value must be true or false')
        }
        break
      case 'json':
      case 'object':
        if (value) {
          try {
            JSON.parse(value)
          } catch {
            errors.push('Value must be valid JSON')
          }
        }
        break
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
