import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { QueryBuilder, Prisma } from '@prisma/client'

/**
 * QueryBuilderPrismaService - Phase 2.6
 *
 * Service pour gestion des query builders avec Prisma
 *
 * QueryBuilder = Constructeur de requêtes dynamiques
 * Permet aux utilisateurs de créer des requêtes personnalisées sans SQL
 *
 * Fonctionnalités:
 * - CRUD query builders
 * - Configuration settings (Json)
 * - Layout personnalisé (Json)
 * - Public/privé
 * - Relations avec columns, joins, calculated fields, permissions
 */
@Injectable()
export class QueryBuilderPrismaService {
  private readonly logger = new Logger(QueryBuilderPrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer un query builder
   */
  async createQueryBuilder(data: {
    name: string
    description?: string
    type: string
    baseTable: string
    createdBy: string
    isPublic?: boolean
    isActive?: boolean
    settings?: Record<string, any>
    layout?: Record<string, any>
  }): Promise<QueryBuilder> {
    this.logger.log(`Creating query builder: ${data.name}`)

    try {
      const queryBuilder = await this.prisma.queryBuilder.create({
        data: {
          name: data.name,
          description: data.description || null,
          type: data.type,
          baseTable: data.baseTable,
          createdBy: data.createdBy,
          isPublic: data.isPublic !== undefined ? data.isPublic : false,
          isActive: data.isActive !== undefined ? data.isActive : true,
          settings: data.settings ? (data.settings as Prisma.InputJsonValue) : undefined,
          layout: data.layout ? (data.layout as Prisma.InputJsonValue) : undefined,
        },
      })

      this.logger.log(`Query builder created: ${queryBuilder.id}`)
      return queryBuilder
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating query builder: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un query builder par ID
   */
  async getQueryBuilderById(id: string): Promise<QueryBuilder | null> {
    this.logger.debug(`Getting query builder: ${id}`)

    try {
      return await this.prisma.queryBuilder.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting query builder: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un query builder avec relations
   */
  async getQueryBuilderWithRelations(id: string) {
    this.logger.debug(`Getting query builder with relations: ${id}`)

    try {
      return await this.prisma.queryBuilder.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              nom: true,
              prenom: true,
            },
          },
          columns: {
            where: { isVisible: true },
            orderBy: { order: 'asc' },
          },
          joins: {
            orderBy: { order: 'asc' },
          },
          calculatedFields: {
            where: { isVisible: true },
            orderBy: { order: 'asc' },
          },
          permissions: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting query builder with relations: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Lister tous les query builders
   */
  async getAllQueryBuilders(includeInactive = false): Promise<QueryBuilder[]> {
    this.logger.debug('Getting all query builders')

    try {
      return await this.prisma.queryBuilder.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting all query builders: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les query builders d'un utilisateur
   */
  async getUserQueryBuilders(userId: string, includeInactive = false): Promise<QueryBuilder[]> {
    this.logger.debug(`Getting query builders for user: ${userId}`)

    try {
      return await this.prisma.queryBuilder.findMany({
        where: {
          createdBy: userId,
          ...(includeInactive ? {} : { isActive: true }),
        },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting user query builders: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les query builders publics
   */
  async getPublicQueryBuilders(includeInactive = false): Promise<QueryBuilder[]> {
    this.logger.debug('Getting public query builders')

    try {
      return await this.prisma.queryBuilder.findMany({
        where: {
          isPublic: true,
          ...(includeInactive ? {} : { isActive: true }),
        },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting public query builders: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les query builders par type
   */
  async getQueryBuildersByType(type: string, includeInactive = false): Promise<QueryBuilder[]> {
    this.logger.debug(`Getting query builders by type: ${type}`)

    try {
      return await this.prisma.queryBuilder.findMany({
        where: {
          type,
          ...(includeInactive ? {} : { isActive: true }),
        },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting query builders by type: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les query builders par table de base
   */
  async getQueryBuildersByBaseTable(baseTable: string, includeInactive = false): Promise<QueryBuilder[]> {
    this.logger.debug(`Getting query builders by base table: ${baseTable}`)

    try {
      return await this.prisma.queryBuilder.findMany({
        where: {
          baseTable,
          ...(includeInactive ? {} : { isActive: true }),
        },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting query builders by base table: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour un query builder
   */
  async updateQueryBuilder(
    id: string,
    data: {
      name?: string
      description?: string
      type?: string
      baseTable?: string
      isPublic?: boolean
      isActive?: boolean
      settings?: Record<string, any>
      layout?: Record<string, any>
    }
  ): Promise<QueryBuilder> {
    this.logger.log(`Updating query builder: ${id}`)

    try {
      const updateData: any = {}

      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.type !== undefined) updateData.type = data.type
      if (data.baseTable !== undefined) updateData.baseTable = data.baseTable
      if (data.isPublic !== undefined) updateData.isPublic = data.isPublic
      if (data.isActive !== undefined) updateData.isActive = data.isActive
      if (data.settings !== undefined) updateData.settings = data.settings as Prisma.InputJsonValue
      if (data.layout !== undefined) updateData.layout = data.layout as Prisma.InputJsonValue

      const queryBuilder = await this.prisma.queryBuilder.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`Query builder updated: ${id}`)
      return queryBuilder
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating query builder: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Rendre un query builder public/privé
   */
  async setPublic(id: string, isPublic: boolean): Promise<QueryBuilder> {
    this.logger.log(`Setting query builder public: ${id} -> ${isPublic}`)

    return this.updateQueryBuilder(id, { isPublic })
  }

  /**
   * Activer/désactiver un query builder
   */
  async setActive(id: string, isActive: boolean): Promise<QueryBuilder> {
    this.logger.log(`Setting query builder active: ${id} -> ${isActive}`)

    return this.updateQueryBuilder(id, { isActive })
  }

  /**
   * Mettre à jour les settings
   */
  async updateSettings(id: string, settings: Record<string, any>): Promise<QueryBuilder> {
    this.logger.log(`Updating settings for query builder: ${id}`)

    return this.updateQueryBuilder(id, { settings })
  }

  /**
   * Mettre à jour le layout
   */
  async updateLayout(id: string, layout: Record<string, any>): Promise<QueryBuilder> {
    this.logger.log(`Updating layout for query builder: ${id}`)

    return this.updateQueryBuilder(id, { layout })
  }

  /**
   * Dupliquer un query builder
   */
  async duplicateQueryBuilder(id: string, newName: string, userId: string): Promise<QueryBuilder> {
    this.logger.log(`Duplicating query builder ${id} as ${newName}`)

    try {
      const original = await this.getQueryBuilderWithRelations(id)
      if (!original) {
        throw new Error(`Query builder not found: ${id}`)
      }

      // Créer la copie
      const duplicate = await this.createQueryBuilder({
        name: newName,
        description: original.description || undefined,
        type: original.type,
        baseTable: original.baseTable,
        createdBy: userId,
        isPublic: false, // Les duplicatas sont privés par défaut
        isActive: true,
        settings: (original.settings as Record<string, any>) || undefined,
        layout: (original.layout as Record<string, any>) || undefined,
      })

      this.logger.log(`Query builder duplicated: ${duplicate.id}`)
      return duplicate
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error duplicating query builder: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer un query builder
   */
  async deleteQueryBuilder(id: string): Promise<void> {
    this.logger.log(`Deleting query builder: ${id}`)

    try {
      await this.prisma.queryBuilder.delete({
        where: { id },
      })

      this.logger.log(`Query builder deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting query builder: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Rechercher des query builders
   */
  async searchQueryBuilders(searchTerm: string): Promise<QueryBuilder[]> {
    this.logger.debug(`Searching query builders: ${searchTerm}`)

    try {
      return await this.prisma.queryBuilder.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error searching query builders: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les query builders
   */
  async countQueryBuilders(includeInactive = false): Promise<number> {
    this.logger.debug('Counting query builders')

    try {
      return await this.prisma.queryBuilder.count({
        where: includeInactive ? {} : { isActive: true },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting query builders: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter par type
   */
  async countByType(type: string): Promise<number> {
    this.logger.debug(`Counting query builders by type: ${type}`)

    try {
      return await this.prisma.queryBuilder.count({
        where: {
          type,
          isActive: true,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting query builders by type: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les query builders publics
   */
  async countPublicQueryBuilders(): Promise<number> {
    this.logger.debug('Counting public query builders')

    try {
      return await this.prisma.queryBuilder.count({
        where: {
          isPublic: true,
          isActive: true,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting public query builders: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer tous les types
   */
  async getAllTypes(): Promise<string[]> {
    this.logger.debug('Getting all query builder types')

    try {
      const builders = await this.prisma.queryBuilder.findMany({
        select: { type: true },
        distinct: ['type'],
        orderBy: { type: 'asc' },
      })

      return builders.map((b) => b.type)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting all types: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer toutes les tables de base
   */
  async getAllBaseTables(): Promise<string[]> {
    this.logger.debug('Getting all base tables')

    try {
      const builders = await this.prisma.queryBuilder.findMany({
        select: { baseTable: true },
        distinct: ['baseTable'],
        orderBy: { baseTable: 'asc' },
      })

      return builders.map((b) => b.baseTable)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting all base tables: ${err.message}`, err.stack)
      throw error
    }
  }
}
