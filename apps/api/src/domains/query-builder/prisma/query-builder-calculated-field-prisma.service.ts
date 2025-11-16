import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { QueryBuilderCalculatedField, Prisma } from '@prisma/client'

/**
 * QueryBuilderCalculatedFieldPrismaService - Phase 2.6
 *
 * Service pour gestion des champs calculés de query builder avec Prisma
 *
 * QueryBuilderCalculatedField = Champ calculé/dérivé
 * Permet de créer des champs basés sur des expressions
 *
 * Fonctionnalités:
 * - CRUD champs calculés
 * - Expressions SQL
 * - Format de données (Json)
 * - Dépendances (Json)
 * - Ordering et visibilité
 * - Relations avec query builder
 */
@Injectable()
export class QueryBuilderCalculatedFieldPrismaService {
  private readonly logger = new Logger(QueryBuilderCalculatedFieldPrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer un champ calculé
   */
  async createCalculatedField(data: {
    queryBuilderId: string
    name: string
    expression: string
    dataType: string
    format?: Record<string, any>
    dependencies?: Record<string, any>
    order?: number
    isVisible?: boolean
  }): Promise<QueryBuilderCalculatedField> {
    this.logger.log(`Creating calculated field for query builder ${data.queryBuilderId}: ${data.name}`)

    try {
      const field = await this.prisma.queryBuilderCalculatedField.create({
        data: {
          queryBuilderId: data.queryBuilderId,
          name: data.name,
          expression: data.expression,
          dataType: data.dataType,
          format: data.format ? (data.format as Prisma.InputJsonValue) : undefined,
          dependencies: data.dependencies ? (data.dependencies as Prisma.InputJsonValue) : undefined,
          order: data.order || 0,
          isVisible: data.isVisible !== undefined ? data.isVisible : true,
        },
      })

      this.logger.log(`Calculated field created: ${field.id}`)
      return field
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating calculated field: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un champ calculé par ID
   */
  async getCalculatedFieldById(id: string): Promise<QueryBuilderCalculatedField | null> {
    this.logger.debug(`Getting calculated field: ${id}`)

    try {
      return await this.prisma.queryBuilderCalculatedField.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting calculated field: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les champs calculés d'un query builder
   */
  async getCalculatedFields(queryBuilderId: string, includeHidden = false): Promise<QueryBuilderCalculatedField[]> {
    this.logger.debug(`Getting calculated fields for query builder: ${queryBuilderId}`)

    try {
      return await this.prisma.queryBuilderCalculatedField.findMany({
        where: {
          queryBuilderId,
          ...(includeHidden ? {} : { isVisible: true }),
        },
        orderBy: { order: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting calculated fields: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les champs calculés visibles
   */
  async getVisibleCalculatedFields(queryBuilderId: string): Promise<QueryBuilderCalculatedField[]> {
    this.logger.debug(`Getting visible calculated fields for query builder: ${queryBuilderId}`)

    return this.getCalculatedFields(queryBuilderId, false)
  }

  /**
   * Mettre à jour un champ calculé
   */
  async updateCalculatedField(
    id: string,
    data: {
      name?: string
      expression?: string
      dataType?: string
      format?: Record<string, any>
      dependencies?: Record<string, any>
      order?: number
      isVisible?: boolean
    }
  ): Promise<QueryBuilderCalculatedField> {
    this.logger.log(`Updating calculated field: ${id}`)

    try {
      const updateData: any = {}

      if (data.name !== undefined) updateData.name = data.name
      if (data.expression !== undefined) updateData.expression = data.expression
      if (data.dataType !== undefined) updateData.dataType = data.dataType
      if (data.format !== undefined) updateData.format = data.format as Prisma.InputJsonValue
      if (data.dependencies !== undefined) updateData.dependencies = data.dependencies as Prisma.InputJsonValue
      if (data.order !== undefined) updateData.order = data.order
      if (data.isVisible !== undefined) updateData.isVisible = data.isVisible

      const field = await this.prisma.queryBuilderCalculatedField.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`Calculated field updated: ${id}`)
      return field
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating calculated field: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour l'ordre
   */
  async updateOrder(id: string, order: number): Promise<QueryBuilderCalculatedField> {
    this.logger.log(`Updating calculated field order ${id}: ${order}`)

    return this.updateCalculatedField(id, { order })
  }

  /**
   * Réorganiser les champs calculés (batch)
   */
  async reorderCalculatedFields(fieldOrders: Array<{ id: string; order: number }>): Promise<void> {
    this.logger.log(`Reordering ${fieldOrders.length} calculated fields`)

    try {
      for (const { id, order } of fieldOrders) {
        await this.updateOrder(id, order)
      }

      this.logger.log('Calculated fields reordered successfully')
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error reordering calculated fields: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Montrer/cacher un champ calculé
   */
  async setVisible(id: string, isVisible: boolean): Promise<QueryBuilderCalculatedField> {
    this.logger.log(`Setting calculated field visible: ${id} -> ${isVisible}`)

    return this.updateCalculatedField(id, { isVisible })
  }

  /**
   * Supprimer un champ calculé
   */
  async deleteCalculatedField(id: string): Promise<void> {
    this.logger.log(`Deleting calculated field: ${id}`)

    try {
      await this.prisma.queryBuilderCalculatedField.delete({
        where: { id },
      })

      this.logger.log(`Calculated field deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting calculated field: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer tous les champs calculés d'un query builder
   */
  async deleteAllCalculatedFields(queryBuilderId: string): Promise<number> {
    this.logger.log(`Deleting all calculated fields for query builder: ${queryBuilderId}`)

    try {
      const result = await this.prisma.queryBuilderCalculatedField.deleteMany({
        where: { queryBuilderId },
      })

      this.logger.log(`${result.count} calculated fields deleted`)
      return result.count
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting all calculated fields: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les champs calculés
   */
  async countCalculatedFields(queryBuilderId: string, includeHidden = false): Promise<number> {
    this.logger.debug(`Counting calculated fields for query builder: ${queryBuilderId}`)

    try {
      return await this.prisma.queryBuilderCalculatedField.count({
        where: {
          queryBuilderId,
          ...(includeHidden ? {} : { isVisible: true }),
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting calculated fields: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Valider une expression
   */
  validateExpression(expression: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Vérifications basiques
    if (!expression || expression.trim().length === 0) {
      errors.push('Expression cannot be empty')
    }

    // Vérifier les parenthèses équilibrées
    let openParens = 0
    for (const char of expression) {
      if (char === '(') openParens++
      if (char === ')') openParens--
      if (openParens < 0) {
        errors.push('Unbalanced parentheses')
        break
      }
    }
    if (openParens > 0) {
      errors.push('Unbalanced parentheses')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Créer un champ calculé avec validation
   */
  async createWithValidation(data: {
    queryBuilderId: string
    name: string
    expression: string
    dataType: string
    format?: Record<string, any>
    dependencies?: Record<string, any>
    order?: number
    isVisible?: boolean
  }): Promise<QueryBuilderCalculatedField> {
    this.logger.log(`Creating calculated field with validation: ${data.name}`)

    const validation = this.validateExpression(data.expression)
    if (!validation.valid) {
      const errorMsg = `Invalid expression: ${validation.errors.join(', ')}`
      this.logger.error(errorMsg)
      throw new Error(errorMsg)
    }

    return this.createCalculatedField(data)
  }
}
