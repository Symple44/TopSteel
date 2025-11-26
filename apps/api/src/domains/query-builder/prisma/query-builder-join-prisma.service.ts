import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { QueryBuilderJoin } from '@prisma/client'

/**
 * QueryBuilderJoinPrismaService - Phase 2.6
 *
 * Service pour gestion des jointures de query builder avec Prisma
 *
 * QueryBuilderJoin = Jointure entre tables
 * Définit les relations entre tables dans le query builder
 *
 * Fonctionnalités:
 * - CRUD jointures
 * - Types de join (INNER, LEFT, RIGHT, FULL)
 * - Conditions de jointure
 * - Ordering
 * - Relations avec query builder
 */
@Injectable()
export class QueryBuilderJoinPrismaService {
  private readonly logger = new Logger(QueryBuilderJoinPrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer une jointure
   */
  async createQueryBuilderJoin(data: {
    queryBuilderId: string
    joinTable: string
    joinType: string
    condition: string
    order?: number
  }): Promise<QueryBuilderJoin> {
    this.logger.log(`Creating join for query builder ${data.queryBuilderId}: ${data.joinTable}`)

    try {
      const join = await this.prisma.queryBuilderJoin.create({
        data: {
          queryBuilderId: data.queryBuilderId,
          joinTable: data.joinTable,
          joinType: data.joinType,
          condition: data.condition,
          order: data.order || 0,
        },
      })

      this.logger.log(`Join created: ${join.id}`)
      return join
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating join: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une jointure par ID
   */
  async getQueryBuilderJoinById(id: string): Promise<QueryBuilderJoin | null> {
    this.logger.debug(`Getting join: ${id}`)

    try {
      return await this.prisma.queryBuilderJoin.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting join: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les jointures d'un query builder
   */
  async getQueryBuilderJoins(queryBuilderId: string): Promise<QueryBuilderJoin[]> {
    this.logger.debug(`Getting joins for query builder: ${queryBuilderId}`)

    try {
      return await this.prisma.queryBuilderJoin.findMany({
        where: { queryBuilderId },
        orderBy: { order: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting joins: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les jointures par type
   */
  async getJoinsByType(queryBuilderId: string, joinType: string): Promise<QueryBuilderJoin[]> {
    this.logger.debug(`Getting joins by type: ${joinType}`)

    try {
      return await this.prisma.queryBuilderJoin.findMany({
        where: {
          queryBuilderId,
          joinType,
        },
        orderBy: { order: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting joins by type: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour une jointure
   */
  async updateQueryBuilderJoin(
    id: string,
    data: {
      joinTable?: string
      joinType?: string
      condition?: string
      order?: number
    }
  ): Promise<QueryBuilderJoin> {
    this.logger.log(`Updating join: ${id}`)

    try {
      const updateData: any = {}

      if (data.joinTable !== undefined) updateData.joinTable = data.joinTable
      if (data.joinType !== undefined) updateData.joinType = data.joinType
      if (data.condition !== undefined) updateData.condition = data.condition
      if (data.order !== undefined) updateData.order = data.order

      const join = await this.prisma.queryBuilderJoin.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`Join updated: ${id}`)
      return join
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating join: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour l'ordre
   */
  async updateOrder(id: string, order: number): Promise<QueryBuilderJoin> {
    this.logger.log(`Updating join order ${id}: ${order}`)

    return this.updateQueryBuilderJoin(id, { order })
  }

  /**
   * Réorganiser les jointures (batch)
   */
  async reorderJoins(joinOrders: Array<{ id: string; order: number }>): Promise<void> {
    this.logger.log(`Reordering ${joinOrders.length} joins`)

    try {
      for (const { id, order } of joinOrders) {
        await this.updateOrder(id, order)
      }

      this.logger.log('Joins reordered successfully')
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error reordering joins: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer une jointure
   */
  async deleteQueryBuilderJoin(id: string): Promise<void> {
    this.logger.log(`Deleting join: ${id}`)

    try {
      await this.prisma.queryBuilderJoin.delete({
        where: { id },
      })

      this.logger.log(`Join deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting join: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer toutes les jointures d'un query builder
   */
  async deleteAllJoins(queryBuilderId: string): Promise<number> {
    this.logger.log(`Deleting all joins for query builder: ${queryBuilderId}`)

    try {
      const result = await this.prisma.queryBuilderJoin.deleteMany({
        where: { queryBuilderId },
      })

      this.logger.log(`${result.count} joins deleted`)
      return result.count
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting all joins: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les jointures
   */
  async countJoins(queryBuilderId: string): Promise<number> {
    this.logger.debug(`Counting joins for query builder: ${queryBuilderId}`)

    try {
      return await this.prisma.queryBuilderJoin.count({
        where: { queryBuilderId },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting joins: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter par type de join
   */
  async countByJoinType(queryBuilderId: string, joinType: string): Promise<number> {
    this.logger.debug(`Counting joins by type: ${joinType}`)

    try {
      return await this.prisma.queryBuilderJoin.count({
        where: {
          queryBuilderId,
          joinType,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting joins by type: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Alias methods for backward compatibility
   */

  /**
   * Créer une jointure avec interface legacy
   */
  async createJoin(data: {
    queryBuilderId: string
    joinType: string
    sourceTable?: string
    leftTable?: string
    targetTable?: string
    rightTable?: string
    sourceColumn?: string
    leftColumn?: string
    targetColumn?: string
    rightColumn?: string
    order?: number
  }): Promise<QueryBuilderJoin> {
    const sourceTable = data.sourceTable || data.leftTable || ''
    const targetTable = data.targetTable || data.rightTable || ''
    const sourceColumn = data.sourceColumn || data.leftColumn || ''
    const targetColumn = data.targetColumn || data.rightColumn || ''

    // Construire la condition de jointure
    const condition = `${sourceTable}.${sourceColumn} = ${targetTable}.${targetColumn}`

    return this.createQueryBuilderJoin({
      queryBuilderId: data.queryBuilderId,
      joinTable: targetTable,
      joinType: data.joinType,
      condition,
      order: data.order,
    })
  }

  /**
   * Alias pour deleteAllJoins
   */
  async deleteByQueryBuilderId(queryBuilderId: string): Promise<number> {
    return this.deleteAllJoins(queryBuilderId)
  }
}
