import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { QueryBuilderColumn, Prisma } from '@prisma/client'

/**
 * QueryBuilderColumnPrismaService - Phase 2.6
 *
 * Service pour gestion des colonnes de query builder avec Prisma
 *
 * QueryBuilderColumn = Colonne dans un query builder
 * Définit les champs sélectionnés avec format et agrégation
 *
 * Fonctionnalités:
 * - CRUD colonnes
 * - Format de données (Json)
 * - Agrégation (Json)
 * - Ordering et visibilité
 * - Relations avec query builder
 */
@Injectable()
export class QueryBuilderColumnPrismaService {
  private readonly logger = new Logger(QueryBuilderColumnPrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer une colonne
   */
  async createQueryBuilderColumn(data: {
    queryBuilderId: string
    columnName: string
    alias?: string
    dataType?: string
    format?: Record<string, any>
    aggregation?: Record<string, any>
    order?: number
    isVisible?: boolean
  }): Promise<QueryBuilderColumn> {
    this.logger.log(`Creating column for query builder ${data.queryBuilderId}: ${data.columnName}`)

    try {
      const column = await this.prisma.queryBuilderColumn.create({
        data: {
          queryBuilderId: data.queryBuilderId,
          columnName: data.columnName,
          alias: data.alias || null,
          dataType: data.dataType || null,
          format: data.format ? (data.format as Prisma.InputJsonValue) : undefined,
          aggregation: data.aggregation ? (data.aggregation as Prisma.InputJsonValue) : undefined,
          order: data.order || 0,
          isVisible: data.isVisible !== undefined ? data.isVisible : true,
        },
      })

      this.logger.log(`Column created: ${column.id}`)
      return column
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating column: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une colonne par ID
   */
  async getQueryBuilderColumnById(id: string): Promise<QueryBuilderColumn | null> {
    this.logger.debug(`Getting column: ${id}`)

    try {
      return await this.prisma.queryBuilderColumn.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting column: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les colonnes d'un query builder
   */
  async getQueryBuilderColumns(queryBuilderId: string, includeHidden = false): Promise<QueryBuilderColumn[]> {
    this.logger.debug(`Getting columns for query builder: ${queryBuilderId}`)

    try {
      return await this.prisma.queryBuilderColumn.findMany({
        where: {
          queryBuilderId,
          ...(includeHidden ? {} : { isVisible: true }),
        },
        orderBy: { order: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting columns: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les colonnes visibles
   */
  async getVisibleColumns(queryBuilderId: string): Promise<QueryBuilderColumn[]> {
    this.logger.debug(`Getting visible columns for query builder: ${queryBuilderId}`)

    return this.getQueryBuilderColumns(queryBuilderId, false)
  }

  /**
   * Mettre à jour une colonne
   */
  async updateQueryBuilderColumn(
    id: string,
    data: {
      columnName?: string
      alias?: string
      dataType?: string
      format?: Record<string, any>
      aggregation?: Record<string, any>
      order?: number
      isVisible?: boolean
    }
  ): Promise<QueryBuilderColumn> {
    this.logger.log(`Updating column: ${id}`)

    try {
      const updateData: any = {}

      if (data.columnName !== undefined) updateData.columnName = data.columnName
      if (data.alias !== undefined) updateData.alias = data.alias
      if (data.dataType !== undefined) updateData.dataType = data.dataType
      if (data.format !== undefined) updateData.format = data.format as Prisma.InputJsonValue
      if (data.aggregation !== undefined) updateData.aggregation = data.aggregation as Prisma.InputJsonValue
      if (data.order !== undefined) updateData.order = data.order
      if (data.isVisible !== undefined) updateData.isVisible = data.isVisible

      const column = await this.prisma.queryBuilderColumn.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`Column updated: ${id}`)
      return column
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating column: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour l'ordre
   */
  async updateOrder(id: string, order: number): Promise<QueryBuilderColumn> {
    this.logger.log(`Updating column order ${id}: ${order}`)

    return this.updateQueryBuilderColumn(id, { order })
  }

  /**
   * Réorganiser les colonnes (batch)
   */
  async reorderColumns(columnOrders: Array<{ id: string; order: number }>): Promise<void> {
    this.logger.log(`Reordering ${columnOrders.length} columns`)

    try {
      for (const { id, order } of columnOrders) {
        await this.updateOrder(id, order)
      }

      this.logger.log('Columns reordered successfully')
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error reordering columns: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Montrer/cacher une colonne
   */
  async setVisible(id: string, isVisible: boolean): Promise<QueryBuilderColumn> {
    this.logger.log(`Setting column visible: ${id} -> ${isVisible}`)

    return this.updateQueryBuilderColumn(id, { isVisible })
  }

  /**
   * Supprimer une colonne
   */
  async deleteQueryBuilderColumn(id: string): Promise<void> {
    this.logger.log(`Deleting column: ${id}`)

    try {
      await this.prisma.queryBuilderColumn.delete({
        where: { id },
      })

      this.logger.log(`Column deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting column: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer toutes les colonnes d'un query builder
   */
  async deleteAllColumns(queryBuilderId: string): Promise<number> {
    this.logger.log(`Deleting all columns for query builder: ${queryBuilderId}`)

    try {
      const result = await this.prisma.queryBuilderColumn.deleteMany({
        where: { queryBuilderId },
      })

      this.logger.log(`${result.count} columns deleted`)
      return result.count
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting all columns: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les colonnes
   */
  async countColumns(queryBuilderId: string, includeHidden = false): Promise<number> {
    this.logger.debug(`Counting columns for query builder: ${queryBuilderId}`)

    try {
      return await this.prisma.queryBuilderColumn.count({
        where: {
          queryBuilderId,
          ...(includeHidden ? {} : { isVisible: true }),
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting columns: ${err.message}`, err.stack)
      throw error
    }
  }
}
