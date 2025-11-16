import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { ParameterClient, Prisma } from '@prisma/client'

/**
 * ParameterClientPrismaService - Phase 2.4
 *
 * Service pour gestion des paramètres client avec Prisma
 *
 * ParameterClient = Paramètres utilisateur final/client
 * Configuration UI et UX modifiable par utilisateurs finaux
 *
 * Fonctionnalités:
 * - CRUD paramètres client
 * - Types variés (string, number, boolean, array, object)
 * - Contraintes de validation (constraints Json)
 * - Traductions personnalisées (customTranslations Json)
 * - Valeurs par défaut
 * - Métadonnées extensibles (Json)
 * - Visibilité et édition contrôlées
 * - Catégorisation
 */
@Injectable()
export class ParameterClientPrismaService {
  private readonly logger = new Logger(ParameterClientPrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer un paramètre client
   */
  async createParameterClient(data: {
    code: string
    label: string
    description?: string
    type: string
    value?: string
    defaultValue?: string
    category: string
    isVisible?: boolean
    isEditable?: boolean
    constraints?: Record<string, any>
    metadata?: Record<string, any>
    arrayValues?: any[]
    objectValues?: Record<string, any>
    customTranslations?: Record<string, any>
  }): Promise<ParameterClient> {
    this.logger.log(`Creating client parameter: ${data.code}`)

    try {
      const parameter = await this.prisma.parameterClient.create({
        data: {
          code: data.code,
          label: data.label,
          description: data.description || null,
          type: data.type,
          value: data.value || null,
          defaultValue: data.defaultValue || null,
          category: data.category,
          isVisible: data.isVisible !== undefined ? data.isVisible : true,
          isEditable: data.isEditable !== undefined ? data.isEditable : true,
          constraints: data.constraints ? (data.constraints as Prisma.InputJsonValue) : undefined,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
          arrayValues: data.arrayValues ? (data.arrayValues as Prisma.InputJsonValue) : undefined,
          objectValues: data.objectValues ? (data.objectValues as Prisma.InputJsonValue) : undefined,
          customTranslations: data.customTranslations ? (data.customTranslations as Prisma.InputJsonValue) : undefined,
        },
      })

      this.logger.log(`Client parameter created: ${parameter.id}`)
      return parameter
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating client parameter: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un paramètre par ID
   */
  async getParameterClientById(id: string): Promise<ParameterClient | null> {
    this.logger.debug(`Getting client parameter: ${id}`)

    try {
      return await this.prisma.parameterClient.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting client parameter: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un paramètre par code
   */
  async getParameterClientByCode(code: string): Promise<ParameterClient | null> {
    this.logger.debug(`Getting client parameter by code: ${code}`)

    try {
      return await this.prisma.parameterClient.findUnique({
        where: { code },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting client parameter by code: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Lister tous les paramètres client
   */
  async getAllParametersClient(includeHidden = false): Promise<ParameterClient[]> {
    this.logger.debug('Getting all client parameters')

    try {
      return await this.prisma.parameterClient.findMany({
        where: includeHidden ? {} : { isVisible: true },
        orderBy: [{ category: 'asc' }, { code: 'asc' }],
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting all client parameters: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les paramètres visibles
   */
  async getVisibleParametersClient(): Promise<ParameterClient[]> {
    this.logger.debug('Getting visible client parameters')

    return this.getAllParametersClient(false)
  }

  /**
   * Récupérer les paramètres éditables
   */
  async getEditableParametersClient(): Promise<ParameterClient[]> {
    this.logger.debug('Getting editable client parameters')

    try {
      return await this.prisma.parameterClient.findMany({
        where: {
          isVisible: true,
          isEditable: true,
        },
        orderBy: [{ category: 'asc' }, { code: 'asc' }],
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting editable client parameters: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les paramètres par catégorie
   */
  async getParametersClientByCategory(category: string, includeHidden = false): Promise<ParameterClient[]> {
    this.logger.debug(`Getting client parameters by category: ${category}`)

    try {
      return await this.prisma.parameterClient.findMany({
        where: {
          category,
          ...(includeHidden ? {} : { isVisible: true }),
        },
        orderBy: { code: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting client parameters by category: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer toutes les catégories
   */
  async getAllCategories(): Promise<string[]> {
    this.logger.debug('Getting all client parameter categories')

    try {
      const parameters = await this.prisma.parameterClient.findMany({
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      })

      return parameters.map((p) => p.category)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting client parameter categories: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer la valeur typée d'un paramètre
   */
  async getTypedValue<T = any>(code: string): Promise<T | null> {
    const parameter = await this.getParameterClientByCode(code)
    if (!parameter || !parameter.isVisible) return null

    const value = parameter.value || parameter.defaultValue
    if (!value) return null

    switch (parameter.type) {
      case 'boolean':
        return (value === 'true') as T
      case 'number':
        return Number(value) as T
      case 'json':
      case 'object':
        return (parameter.objectValues || JSON.parse(value)) as T
      case 'array':
        return (parameter.arrayValues || JSON.parse(value)) as T
      default:
        return value as T
    }
  }

  /**
   * Récupérer un paramètre avec traduction
   */
  async getParameterWithTranslation(code: string, locale: string): Promise<ParameterClient | null> {
    this.logger.debug(`Getting client parameter with translation: ${code} (${locale})`)

    const parameter = await this.getParameterClientByCode(code)
    if (!parameter) return null

    // Appliquer les traductions personnalisées si disponibles
    if (parameter.customTranslations) {
      const translations = parameter.customTranslations as Record<string, any>
      if (translations[locale]) {
        const translated = { ...parameter }
        if (translations[locale].label) translated.label = translations[locale].label
        if (translations[locale].description) translated.description = translations[locale].description
        return translated
      }
    }

    return parameter
  }

  /**
   * Mettre à jour un paramètre client
   */
  async updateParameterClient(
    id: string,
    data: {
      label?: string
      description?: string
      type?: string
      value?: string
      defaultValue?: string
      category?: string
      isVisible?: boolean
      isEditable?: boolean
      constraints?: Record<string, any>
      metadata?: Record<string, any>
      arrayValues?: any[]
      objectValues?: Record<string, any>
      customTranslations?: Record<string, any>
    }
  ): Promise<ParameterClient> {
    this.logger.log(`Updating client parameter: ${id}`)

    try {
      const updateData: any = {}

      if (data.label !== undefined) updateData.label = data.label
      if (data.description !== undefined) updateData.description = data.description
      if (data.type !== undefined) updateData.type = data.type
      if (data.value !== undefined) updateData.value = data.value
      if (data.defaultValue !== undefined) updateData.defaultValue = data.defaultValue
      if (data.category !== undefined) updateData.category = data.category
      if (data.isVisible !== undefined) updateData.isVisible = data.isVisible
      if (data.isEditable !== undefined) updateData.isEditable = data.isEditable
      if (data.constraints !== undefined) updateData.constraints = data.constraints as Prisma.InputJsonValue
      if (data.metadata !== undefined) updateData.metadata = data.metadata as Prisma.InputJsonValue
      if (data.arrayValues !== undefined) updateData.arrayValues = data.arrayValues as Prisma.InputJsonValue
      if (data.objectValues !== undefined) updateData.objectValues = data.objectValues as Prisma.InputJsonValue
      if (data.customTranslations !== undefined)
        updateData.customTranslations = data.customTranslations as Prisma.InputJsonValue

      const parameter = await this.prisma.parameterClient.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`Client parameter updated: ${id}`)
      return parameter
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating client parameter: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour la valeur d'un paramètre
   */
  async updateValue(code: string, value: string): Promise<ParameterClient> {
    this.logger.log(`Updating value for client parameter ${code}: ${value}`)

    const parameter = await this.getParameterClientByCode(code)
    if (!parameter) {
      throw new Error(`Client parameter not found: ${code}`)
    }

    if (!parameter.isEditable) {
      throw new Error(`Client parameter is not editable: ${code}`)
    }

    // Valider la valeur
    const validation = this.validateValue(parameter, value)
    if (!validation.valid) {
      throw new Error(`Invalid value: ${validation.errors.join(', ')}`)
    }

    return this.updateParameterClient(parameter.id, { value })
  }

  /**
   * Montrer/cacher un paramètre
   */
  async setVisible(id: string, isVisible: boolean): Promise<ParameterClient> {
    this.logger.log(`Setting client parameter visible: ${id} -> ${isVisible}`)

    return this.updateParameterClient(id, { isVisible })
  }

  /**
   * Activer/désactiver l'édition
   */
  async setEditable(id: string, isEditable: boolean): Promise<ParameterClient> {
    this.logger.log(`Setting client parameter editable: ${id} -> ${isEditable}`)

    return this.updateParameterClient(id, { isEditable })
  }

  /**
   * Réinitialiser à la valeur par défaut
   */
  async resetToDefault(code: string): Promise<ParameterClient> {
    this.logger.log(`Resetting client parameter to default: ${code}`)

    const parameter = await this.getParameterClientByCode(code)
    if (!parameter) {
      throw new Error(`Client parameter not found: ${code}`)
    }

    return this.updateParameterClient(parameter.id, {
      value: parameter.defaultValue || undefined,
    })
  }

  /**
   * Mettre à jour les traductions personnalisées
   */
  async updateCustomTranslations(id: string, customTranslations: Record<string, any>): Promise<ParameterClient> {
    this.logger.log(`Updating custom translations for client parameter: ${id}`)

    return this.updateParameterClient(id, { customTranslations })
  }

  /**
   * Ajouter une traduction pour une locale
   */
  async addTranslation(
    id: string,
    locale: string,
    translation: { label?: string; description?: string }
  ): Promise<ParameterClient> {
    this.logger.log(`Adding translation for client parameter ${id}: ${locale}`)

    const parameter = await this.getParameterClientById(id)
    if (!parameter) {
      throw new Error(`Client parameter not found: ${id}`)
    }

    const currentTranslations = (parameter.customTranslations as Record<string, any>) || {}
    const updatedTranslations = {
      ...currentTranslations,
      [locale]: translation,
    }

    return this.updateCustomTranslations(id, updatedTranslations)
  }

  /**
   * Créer ou mettre à jour un paramètre (upsert)
   */
  async upsertParameterClient(data: {
    code: string
    label: string
    description?: string
    type: string
    value?: string
    defaultValue?: string
    category: string
    isVisible?: boolean
    isEditable?: boolean
    constraints?: Record<string, any>
    metadata?: Record<string, any>
    arrayValues?: any[]
    objectValues?: Record<string, any>
    customTranslations?: Record<string, any>
  }): Promise<ParameterClient> {
    this.logger.log(`Upserting client parameter: ${data.code}`)

    try {
      const parameter = await this.prisma.parameterClient.upsert({
        where: { code: data.code },
        create: {
          code: data.code,
          label: data.label,
          description: data.description || null,
          type: data.type,
          value: data.value || null,
          defaultValue: data.defaultValue || null,
          category: data.category,
          isVisible: data.isVisible !== undefined ? data.isVisible : true,
          isEditable: data.isEditable !== undefined ? data.isEditable : true,
          constraints: data.constraints ? (data.constraints as Prisma.InputJsonValue) : undefined,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
          arrayValues: data.arrayValues ? (data.arrayValues as Prisma.InputJsonValue) : undefined,
          objectValues: data.objectValues ? (data.objectValues as Prisma.InputJsonValue) : undefined,
          customTranslations: data.customTranslations ? (data.customTranslations as Prisma.InputJsonValue) : undefined,
        },
        update: {
          label: data.label,
          description: data.description,
          type: data.type,
          value: data.value,
          defaultValue: data.defaultValue,
          category: data.category,
          isVisible: data.isVisible,
          isEditable: data.isEditable,
          constraints: data.constraints ? (data.constraints as Prisma.InputJsonValue) : undefined,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
          arrayValues: data.arrayValues ? (data.arrayValues as Prisma.InputJsonValue) : undefined,
          objectValues: data.objectValues ? (data.objectValues as Prisma.InputJsonValue) : undefined,
          customTranslations: data.customTranslations ? (data.customTranslations as Prisma.InputJsonValue) : undefined,
        },
      })

      this.logger.log(`Client parameter upserted: ${parameter.id}`)
      return parameter
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error upserting client parameter: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer un paramètre client
   */
  async deleteParameterClient(id: string): Promise<void> {
    this.logger.log(`Deleting client parameter: ${id}`)

    try {
      await this.prisma.parameterClient.delete({
        where: { id },
      })

      this.logger.log(`Client parameter deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting client parameter: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Rechercher des paramètres
   */
  async searchParametersClient(searchTerm: string): Promise<ParameterClient[]> {
    this.logger.debug(`Searching client parameters: ${searchTerm}`)

    try {
      return await this.prisma.parameterClient.findMany({
        where: {
          OR: [
            { code: { contains: searchTerm, mode: 'insensitive' } },
            { label: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
          isVisible: true,
        },
        orderBy: [{ category: 'asc' }, { code: 'asc' }],
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error searching client parameters: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les paramètres client
   */
  async countParametersClient(includeHidden = false): Promise<number> {
    this.logger.debug('Counting client parameters')

    try {
      return await this.prisma.parameterClient.count({
        where: includeHidden ? {} : { isVisible: true },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting client parameters: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter par catégorie
   */
  async countByCategory(category: string): Promise<number> {
    this.logger.debug(`Counting client parameters by category: ${category}`)

    try {
      return await this.prisma.parameterClient.count({
        where: {
          category,
          isVisible: true,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting client parameters by category: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Vérifier si un code existe
   */
  async existsByCode(code: string): Promise<boolean> {
    this.logger.debug(`Checking if client parameter exists: ${code}`)

    try {
      const parameter = await this.getParameterClientByCode(code)
      return parameter !== null
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking client parameter existence: ${err.message}`, err.stack)
      return false
    }
  }

  /**
   * Valider une valeur selon le type et les contraintes
   */
  validateValue(parameter: ParameterClient, value: string): { valid: boolean; errors: string[] } {
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

    // Vérifier les contraintes
    if (parameter.constraints && value) {
      const constraints = parameter.constraints as Record<string, any>

      if (constraints.min !== undefined && Number(value) < constraints.min) {
        errors.push(`Value must be >= ${constraints.min}`)
      }

      if (constraints.max !== undefined && Number(value) > constraints.max) {
        errors.push(`Value must be <= ${constraints.max}`)
      }

      if (constraints.minLength !== undefined && value.length < constraints.minLength) {
        errors.push(`Value must be at least ${constraints.minLength} characters`)
      }

      if (constraints.maxLength !== undefined && value.length > constraints.maxLength) {
        errors.push(`Value must be at most ${constraints.maxLength} characters`)
      }

      if (constraints.pattern) {
        try {
          const regex = new RegExp(constraints.pattern)
          if (!regex.test(value)) {
            errors.push(`Value does not match required pattern`)
          }
        } catch (err) {
          this.logger.warn(`Invalid constraint pattern for parameter ${parameter.code}`)
        }
      }

      if (constraints.enum && Array.isArray(constraints.enum)) {
        if (!constraints.enum.includes(value)) {
          errors.push(`Value must be one of: ${constraints.enum.join(', ')}`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
