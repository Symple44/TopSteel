import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { ParameterSystem, Prisma } from '@prisma/client'

/**
 * ParameterSystemPrismaService - Phase 2.4
 *
 * Service pour gestion des paramètres système avec Prisma
 *
 * ParameterSystem = Paramètres système critiques de bas niveau
 * Configuration système non-modifiable par utilisateurs finaux
 *
 * Fonctionnalités:
 * - CRUD paramètres système
 * - Types variés (string, number, boolean, array, object)
 * - Validation configurable
 * - Valeurs par défaut
 * - Métadonnées extensibles (Json)
 * - Protection édition (isEditable, isRequired)
 * - Catégorisation
 */
@Injectable()
export class ParameterSystemPrismaService {
  private readonly logger = new Logger(ParameterSystemPrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer un paramètre système
   */
  async createParameterSystem(data: {
    code: string
    label: string
    description?: string
    type: string
    value?: string
    defaultValue?: string
    category: string
    isRequired?: boolean
    isEditable?: boolean
    validation?: string
    metadata?: Record<string, any>
    arrayValues?: any[]
    objectValues?: Record<string, any>
  }): Promise<ParameterSystem> {
    this.logger.log(`Creating system parameter: ${data.code}`)

    try {
      const parameter = await this.prisma.parameterSystem.create({
        data: {
          code: data.code,
          label: data.label,
          description: data.description || null,
          type: data.type,
          value: data.value || null,
          defaultValue: data.defaultValue || null,
          category: data.category,
          isRequired: data.isRequired !== undefined ? data.isRequired : false,
          isEditable: data.isEditable !== undefined ? data.isEditable : true,
          validation: data.validation || null,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
          arrayValues: data.arrayValues ? (data.arrayValues as Prisma.InputJsonValue) : undefined,
          objectValues: data.objectValues ? (data.objectValues as Prisma.InputJsonValue) : undefined,
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
  async getParameterSystemById(id: string): Promise<ParameterSystem | null> {
    this.logger.debug(`Getting system parameter: ${id}`)

    try {
      return await this.prisma.parameterSystem.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting system parameter: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un paramètre par code
   */
  async getParameterSystemByCode(code: string): Promise<ParameterSystem | null> {
    this.logger.debug(`Getting system parameter by code: ${code}`)

    try {
      return await this.prisma.parameterSystem.findUnique({
        where: { code },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting system parameter by code: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Lister tous les paramètres système
   */
  async getAllParametersSystem(): Promise<ParameterSystem[]> {
    this.logger.debug('Getting all system parameters')

    try {
      return await this.prisma.parameterSystem.findMany({
        orderBy: [{ category: 'asc' }, { code: 'asc' }],
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting all system parameters: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les paramètres par catégorie
   */
  async getParametersSystemByCategory(category: string): Promise<ParameterSystem[]> {
    this.logger.debug(`Getting system parameters by category: ${category}`)

    try {
      return await this.prisma.parameterSystem.findMany({
        where: { category },
        orderBy: { code: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting system parameters by category: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer toutes les catégories
   */
  async getAllCategories(): Promise<string[]> {
    this.logger.debug('Getting all system parameter categories')

    try {
      const parameters = await this.prisma.parameterSystem.findMany({
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      })

      return parameters.map((p) => p.category)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting system parameter categories: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les paramètres requis
   */
  async getRequiredParameters(): Promise<ParameterSystem[]> {
    this.logger.debug('Getting required system parameters')

    try {
      return await this.prisma.parameterSystem.findMany({
        where: { isRequired: true },
        orderBy: [{ category: 'asc' }, { code: 'asc' }],
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting required system parameters: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les paramètres éditables
   */
  async getEditableParameters(): Promise<ParameterSystem[]> {
    this.logger.debug('Getting editable system parameters')

    try {
      return await this.prisma.parameterSystem.findMany({
        where: { isEditable: true },
        orderBy: [{ category: 'asc' }, { code: 'asc' }],
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting editable system parameters: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer la valeur typée d'un paramètre
   */
  async getTypedValue<T = any>(code: string): Promise<T | null> {
    const parameter = await this.getParameterSystemByCode(code)
    if (!parameter) return null

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
   * Mettre à jour un paramètre système
   */
  async updateParameterSystem(
    id: string,
    data: {
      label?: string
      description?: string
      type?: string
      value?: string
      defaultValue?: string
      category?: string
      isRequired?: boolean
      isEditable?: boolean
      validation?: string
      metadata?: Record<string, any>
      arrayValues?: any[]
      objectValues?: Record<string, any>
    }
  ): Promise<ParameterSystem> {
    this.logger.log(`Updating system parameter: ${id}`)

    try {
      const updateData: any = {}

      if (data.label !== undefined) updateData.label = data.label
      if (data.description !== undefined) updateData.description = data.description
      if (data.type !== undefined) updateData.type = data.type
      if (data.value !== undefined) updateData.value = data.value
      if (data.defaultValue !== undefined) updateData.defaultValue = data.defaultValue
      if (data.category !== undefined) updateData.category = data.category
      if (data.isRequired !== undefined) updateData.isRequired = data.isRequired
      if (data.isEditable !== undefined) updateData.isEditable = data.isEditable
      if (data.validation !== undefined) updateData.validation = data.validation
      if (data.metadata !== undefined) updateData.metadata = data.metadata as Prisma.InputJsonValue
      if (data.arrayValues !== undefined) updateData.arrayValues = data.arrayValues as Prisma.InputJsonValue
      if (data.objectValues !== undefined) updateData.objectValues = data.objectValues as Prisma.InputJsonValue

      const parameter = await this.prisma.parameterSystem.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`System parameter updated: ${id}`)
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
  async updateValue(code: string, value: string): Promise<ParameterSystem> {
    this.logger.log(`Updating value for system parameter ${code}: ${value}`)

    const parameter = await this.getParameterSystemByCode(code)
    if (!parameter) {
      throw new Error(`System parameter not found: ${code}`)
    }

    if (!parameter.isEditable) {
      throw new Error(`System parameter is not editable: ${code}`)
    }

    return this.updateParameterSystem(parameter.id, { value })
  }

  /**
   * Réinitialiser à la valeur par défaut
   */
  async resetToDefault(code: string): Promise<ParameterSystem> {
    this.logger.log(`Resetting system parameter to default: ${code}`)

    const parameter = await this.getParameterSystemByCode(code)
    if (!parameter) {
      throw new Error(`System parameter not found: ${code}`)
    }

    return this.updateParameterSystem(parameter.id, {
      value: parameter.defaultValue || undefined,
    })
  }

  /**
   * Créer ou mettre à jour un paramètre (upsert)
   */
  async upsertParameterSystem(data: {
    code: string
    label: string
    description?: string
    type: string
    value?: string
    defaultValue?: string
    category: string
    isRequired?: boolean
    isEditable?: boolean
    validation?: string
    metadata?: Record<string, any>
    arrayValues?: any[]
    objectValues?: Record<string, any>
  }): Promise<ParameterSystem> {
    this.logger.log(`Upserting system parameter: ${data.code}`)

    try {
      const parameter = await this.prisma.parameterSystem.upsert({
        where: { code: data.code },
        create: {
          code: data.code,
          label: data.label,
          description: data.description || null,
          type: data.type,
          value: data.value || null,
          defaultValue: data.defaultValue || null,
          category: data.category,
          isRequired: data.isRequired !== undefined ? data.isRequired : false,
          isEditable: data.isEditable !== undefined ? data.isEditable : true,
          validation: data.validation || null,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
          arrayValues: data.arrayValues ? (data.arrayValues as Prisma.InputJsonValue) : undefined,
          objectValues: data.objectValues ? (data.objectValues as Prisma.InputJsonValue) : undefined,
        },
        update: {
          label: data.label,
          description: data.description,
          type: data.type,
          value: data.value,
          defaultValue: data.defaultValue,
          category: data.category,
          isRequired: data.isRequired,
          isEditable: data.isEditable,
          validation: data.validation,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
          arrayValues: data.arrayValues ? (data.arrayValues as Prisma.InputJsonValue) : undefined,
          objectValues: data.objectValues ? (data.objectValues as Prisma.InputJsonValue) : undefined,
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
   * Supprimer un paramètre système
   */
  async deleteParameterSystem(id: string): Promise<void> {
    this.logger.log(`Deleting system parameter: ${id}`)

    try {
      await this.prisma.parameterSystem.delete({
        where: { id },
      })

      this.logger.log(`System parameter deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting system parameter: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Rechercher des paramètres
   */
  async searchParametersSystem(searchTerm: string): Promise<ParameterSystem[]> {
    this.logger.debug(`Searching system parameters: ${searchTerm}`)

    try {
      return await this.prisma.parameterSystem.findMany({
        where: {
          OR: [
            { code: { contains: searchTerm, mode: 'insensitive' } },
            { label: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        orderBy: [{ category: 'asc' }, { code: 'asc' }],
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error searching system parameters: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les paramètres système
   */
  async countParametersSystem(): Promise<number> {
    this.logger.debug('Counting system parameters')

    try {
      return await this.prisma.parameterSystem.count()
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting system parameters: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter par catégorie
   */
  async countByCategory(category: string): Promise<number> {
    this.logger.debug(`Counting system parameters by category: ${category}`)

    try {
      return await this.prisma.parameterSystem.count({
        where: { category },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting system parameters by category: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Vérifier si un code existe
   */
  async existsByCode(code: string): Promise<boolean> {
    this.logger.debug(`Checking if system parameter exists: ${code}`)

    try {
      const parameter = await this.getParameterSystemByCode(code)
      return parameter !== null
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking system parameter existence: ${err.message}`, err.stack)
      return false
    }
  }

  /**
   * Valider une valeur selon les règles de validation
   */
  validateValue(parameter: ParameterSystem, value: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Vérifier que le paramètre est requis
    if (parameter.isRequired && !value) {
      errors.push('Value is required')
    }

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

    // Vérifier les règles de validation custom (si présentes)
    if (parameter.validation && value) {
      try {
        const regex = new RegExp(parameter.validation)
        if (!regex.test(value)) {
          errors.push(`Value does not match validation pattern: ${parameter.validation}`)
        }
      } catch (err) {
        this.logger.warn(`Invalid validation pattern for parameter ${parameter.code}: ${parameter.validation}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
