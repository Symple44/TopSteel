import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { QueryBuilderPermission } from '@prisma/client'

/**
 * QueryBuilderPermissionPrismaService - Phase 2.6
 *
 * Service pour gestion des permissions de query builder avec Prisma
 *
 * QueryBuilderPermission = Permissions d'accès au query builder
 * Définit qui peut voir/éditer/supprimer/partager le query builder
 *
 * Fonctionnalités:
 * - CRUD permissions
 * - Permissions par utilisateur ou rôle
 * - Niveaux: canView, canEdit, canDelete, canShare
 * - Vérification d'accès
 * - Relations avec query builder, user, role
 */
@Injectable()
export class QueryBuilderPermissionPrismaService {
  private readonly logger = new Logger(QueryBuilderPermissionPrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer une permission
   */
  async createQueryBuilderPermission(data: {
    queryBuilderId: string
    userId?: string
    roleId?: string
    canView?: boolean
    canEdit?: boolean
    canDelete?: boolean
    canShare?: boolean
  }): Promise<QueryBuilderPermission> {
    this.logger.log(`Creating permission for query builder: ${data.queryBuilderId}`)

    try {
      const permission = await this.prisma.queryBuilderPermission.create({
        data: {
          queryBuilderId: data.queryBuilderId,
          userId: data.userId || null,
          roleId: data.roleId || null,
          canView: data.canView !== undefined ? data.canView : true,
          canEdit: data.canEdit !== undefined ? data.canEdit : false,
          canDelete: data.canDelete !== undefined ? data.canDelete : false,
          canShare: data.canShare !== undefined ? data.canShare : false,
        },
      })

      this.logger.log(`Permission created: ${permission.id}`)
      return permission
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating permission: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une permission par ID
   */
  async getPermissionById(id: string): Promise<QueryBuilderPermission | null> {
    this.logger.debug(`Getting permission: ${id}`)

    try {
      return await this.prisma.queryBuilderPermission.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting permission: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les permissions d'un query builder
   */
  async getQueryBuilderPermissions(queryBuilderId: string) {
    this.logger.debug(`Getting permissions for query builder: ${queryBuilderId}`)

    try {
      return await this.prisma.queryBuilderPermission.findMany({
        where: { queryBuilderId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nom: true,
              prenom: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
              label: true,
            },
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting query builder permissions: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les permissions d'un utilisateur
   */
  async getUserPermissions(userId: string) {
    this.logger.debug(`Getting permissions for user: ${userId}`)

    try {
      return await this.prisma.queryBuilderPermission.findMany({
        where: { userId },
        include: {
          queryBuilder: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting user permissions: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les permissions d'un rôle
   */
  async getRolePermissions(roleId: string) {
    this.logger.debug(`Getting permissions for role: ${roleId}`)

    try {
      return await this.prisma.queryBuilderPermission.findMany({
        where: { roleId },
        include: {
          queryBuilder: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting role permissions: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Vérifier si un utilisateur peut voir un query builder
   */
  async canView(queryBuilderId: string, userId: string): Promise<boolean> {
    this.logger.debug(`Checking view permission: queryBuilder=${queryBuilderId}, user=${userId}`)

    try {
      const permission = await this.prisma.queryBuilderPermission.findFirst({
        where: {
          queryBuilderId,
          userId,
          canView: true,
        },
      })

      return permission !== null
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking view permission: ${err.message}`, err.stack)
      return false
    }
  }

  /**
   * Vérifier si un utilisateur peut éditer un query builder
   */
  async canEdit(queryBuilderId: string, userId: string): Promise<boolean> {
    this.logger.debug(`Checking edit permission: queryBuilder=${queryBuilderId}, user=${userId}`)

    try {
      const permission = await this.prisma.queryBuilderPermission.findFirst({
        where: {
          queryBuilderId,
          userId,
          canEdit: true,
        },
      })

      return permission !== null
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking edit permission: ${err.message}`, err.stack)
      return false
    }
  }

  /**
   * Vérifier si un utilisateur peut supprimer un query builder
   */
  async canDelete(queryBuilderId: string, userId: string): Promise<boolean> {
    this.logger.debug(`Checking delete permission: queryBuilder=${queryBuilderId}, user=${userId}`)

    try {
      const permission = await this.prisma.queryBuilderPermission.findFirst({
        where: {
          queryBuilderId,
          userId,
          canDelete: true,
        },
      })

      return permission !== null
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking delete permission: ${err.message}`, err.stack)
      return false
    }
  }

  /**
   * Vérifier si un utilisateur peut partager un query builder
   */
  async canShare(queryBuilderId: string, userId: string): Promise<boolean> {
    this.logger.debug(`Checking share permission: queryBuilder=${queryBuilderId}, user=${userId}`)

    try {
      const permission = await this.prisma.queryBuilderPermission.findFirst({
        where: {
          queryBuilderId,
          userId,
          canShare: true,
        },
      })

      return permission !== null
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking share permission: ${err.message}`, err.stack)
      return false
    }
  }

  /**
   * Mettre à jour une permission
   */
  async updatePermission(
    id: string,
    data: {
      canView?: boolean
      canEdit?: boolean
      canDelete?: boolean
      canShare?: boolean
    }
  ): Promise<QueryBuilderPermission> {
    this.logger.log(`Updating permission: ${id}`)

    try {
      const updateData: any = {}

      if (data.canView !== undefined) updateData.canView = data.canView
      if (data.canEdit !== undefined) updateData.canEdit = data.canEdit
      if (data.canDelete !== undefined) updateData.canDelete = data.canDelete
      if (data.canShare !== undefined) updateData.canShare = data.canShare

      const permission = await this.prisma.queryBuilderPermission.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`Permission updated: ${id}`)
      return permission
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating permission: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Accorder des permissions complètes
   */
  async grantFullPermissions(queryBuilderId: string, userId: string): Promise<QueryBuilderPermission> {
    this.logger.log(`Granting full permissions: queryBuilder=${queryBuilderId}, user=${userId}`)

    return this.createQueryBuilderPermission({
      queryBuilderId,
      userId,
      canView: true,
      canEdit: true,
      canDelete: true,
      canShare: true,
    })
  }

  /**
   * Accorder des permissions en lecture seule
   */
  async grantReadOnlyPermissions(queryBuilderId: string, userId: string): Promise<QueryBuilderPermission> {
    this.logger.log(`Granting read-only permissions: queryBuilder=${queryBuilderId}, user=${userId}`)

    return this.createQueryBuilderPermission({
      queryBuilderId,
      userId,
      canView: true,
      canEdit: false,
      canDelete: false,
      canShare: false,
    })
  }

  /**
   * Supprimer une permission
   */
  async deletePermission(id: string): Promise<void> {
    this.logger.log(`Deleting permission: ${id}`)

    try {
      await this.prisma.queryBuilderPermission.delete({
        where: { id },
      })

      this.logger.log(`Permission deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting permission: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer toutes les permissions d'un query builder
   */
  async deleteAllPermissions(queryBuilderId: string): Promise<number> {
    this.logger.log(`Deleting all permissions for query builder: ${queryBuilderId}`)

    try {
      const result = await this.prisma.queryBuilderPermission.deleteMany({
        where: { queryBuilderId },
      })

      this.logger.log(`${result.count} permissions deleted`)
      return result.count
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting all permissions: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les permissions
   */
  async countPermissions(queryBuilderId: string): Promise<number> {
    this.logger.debug(`Counting permissions for query builder: ${queryBuilderId}`)

    try {
      return await this.prisma.queryBuilderPermission.count({
        where: { queryBuilderId },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting permissions: ${err.message}`, err.stack)
      throw error
    }
  }
}
