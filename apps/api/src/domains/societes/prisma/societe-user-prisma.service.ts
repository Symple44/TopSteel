import { Injectable, Logger } from '@nestjs/common'
import { TenantPrismaService } from '../../../core/multi-tenant/tenant-prisma.service'
import type { SocieteUser, Prisma } from '@prisma/client'

/**
 * SocieteUserPrismaService - Phase 2.2
 *
 * Service pour gestion des associations utilisateur-societe avec Prisma
 *
 * Fonctionnalités:
 * - CRUD SocieteUser
 * - Gestion memberships societe
 * - Permissions et préférences spécifiques
 * - Activation/désactivation
 */
@Injectable()
export class SocieteUserPrismaService {
  private readonly logger = new Logger(SocieteUserPrismaService.name)

  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  /** Client Prisma avec filtrage automatique par tenant */
  private get prisma() {
    return this.tenantPrisma.client
  }

  /**
   * Ajouter un utilisateur à une societe
   */
  async addUserToSociete(data: {
    userId: string
    societeId: string
    permissions?: Record<string, any>
    preferences?: Record<string, any>
    isActive?: boolean
  }): Promise<SocieteUser> {
    this.logger.log(`Adding user ${data.userId} to societe ${data.societeId}`)

    try {
      const createData: any = {
        userId: data.userId,
        societeId: data.societeId,
      }

      if (data.permissions) {
        createData.permissions = data.permissions as Prisma.InputJsonValue
      }

      if (data.preferences) {
        createData.preferences = data.preferences as Prisma.InputJsonValue
      }

      if (data.isActive !== undefined) {
        createData.isActive = data.isActive
      }

      const societeUser = await this.prisma.societeUser.create({
        data: createData,
      })

      this.logger.log(`User added to societe successfully`)
      return societeUser
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error adding user to societe: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une association par ID
   */
  async getSocieteUserById(id: string): Promise<SocieteUser | null> {
    this.logger.debug(`Getting societe-user: ${id}`)

    try {
      return await this.prisma.societeUser.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting societe-user: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une association par userId + societeId
   */
  async getSocieteUserByIds(userId: string, societeId: string): Promise<SocieteUser | null> {
    this.logger.debug(`Getting societe-user for user ${userId} and societe ${societeId}`)

    try {
      return await this.prisma.societeUser.findUnique({
        where: {
          userId_societeId: {
            userId,
            societeId,
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting societe-user by IDs: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer toutes les societes d'un utilisateur
   */
  async getUserSocietes(userId: string, includeInactive = false) {
    this.logger.debug(`Getting societes for user: ${userId}`)

    try {
      return await this.prisma.societeUser.findMany({
        where: {
          userId,
          ...(includeInactive ? {} : { isActive: true }),
        },
        include: {
          societe: {
            select: {
              id: true,
              code: true,
              name: true,
              isActive: true,
              city: true,
              country: true,
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting user societes: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer tous les utilisateurs d'une societe
   */
  async getSocieteUsers(societeId: string, includeInactive = false) {
    this.logger.debug(`Getting users for societe: ${societeId}`)

    try {
      return await this.prisma.societeUser.findMany({
        where: {
          societeId,
          ...(includeInactive ? {} : { isActive: true }),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nom: true,
              prenom: true,
              role: true,
              actif: true,
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting societe users: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour une association
   */
  async updateSocieteUser(
    id: string,
    data: {
      permissions?: Record<string, any>
      preferences?: Record<string, any>
      isActive?: boolean
    }
  ): Promise<SocieteUser> {
    this.logger.log(`Updating societe-user: ${id}`)

    try {
      const updateData: any = {}

      if (data.permissions !== undefined) {
        updateData.permissions = data.permissions as Prisma.InputJsonValue
      }
      if (data.preferences !== undefined) {
        updateData.preferences = data.preferences as Prisma.InputJsonValue
      }
      if (data.isActive !== undefined) {
        updateData.isActive = data.isActive

        // Si désactivation, mettre leftAt
        if (!data.isActive) {
          updateData.leftAt = new Date()
        }
      }

      const societeUser = await this.prisma.societeUser.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`Societe-user updated: ${id}`)
      return societeUser
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating societe-user: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour les permissions
   */
  async updatePermissions(
    userId: string,
    societeId: string,
    permissions: Record<string, any>
  ): Promise<SocieteUser> {
    this.logger.log(`Updating permissions for user ${userId} in societe ${societeId}`)

    const societeUser = await this.getSocieteUserByIds(userId, societeId)
    if (!societeUser) {
      throw new Error(`SocieteUser not found for user ${userId} and societe ${societeId}`)
    }

    return this.updateSocieteUser(societeUser.id, { permissions })
  }

  /**
   * Mettre à jour les préférences
   */
  async updatePreferences(
    userId: string,
    societeId: string,
    preferences: Record<string, any>
  ): Promise<SocieteUser> {
    this.logger.log(`Updating preferences for user ${userId} in societe ${societeId}`)

    const societeUser = await this.getSocieteUserByIds(userId, societeId)
    if (!societeUser) {
      throw new Error(`SocieteUser not found for user ${userId} and societe ${societeId}`)
    }

    return this.updateSocieteUser(societeUser.id, { preferences })
  }

  /**
   * Activer/désactiver une association
   */
  async setActive(userId: string, societeId: string, isActive: boolean): Promise<SocieteUser> {
    this.logger.log(`Setting societe-user active: ${isActive}`)

    const societeUser = await this.getSocieteUserByIds(userId, societeId)
    if (!societeUser) {
      throw new Error(`SocieteUser not found for user ${userId} and societe ${societeId}`)
    }

    return this.updateSocieteUser(societeUser.id, { isActive })
  }

  /**
   * Retirer un utilisateur d'une societe
   */
  async removeUserFromSociete(userId: string, societeId: string): Promise<void> {
    this.logger.log(`Removing user ${userId} from societe ${societeId}`)

    try {
      await this.prisma.societeUser.delete({
        where: {
          userId_societeId: {
            userId,
            societeId,
          },
        },
      })

      this.logger.log(`User removed from societe successfully`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error removing user from societe: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Vérifier si un utilisateur appartient à une societe
   */
  async isUserInSociete(userId: string, societeId: string): Promise<boolean> {
    this.logger.debug(`Checking if user ${userId} is in societe ${societeId}`)

    try {
      const societeUser = await this.getSocieteUserByIds(userId, societeId)
      return societeUser !== null && societeUser.isActive
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking societe membership: ${err.message}`, err.stack)
      return false
    }
  }

  /**
   * Compter les utilisateurs actifs d'une societe
   */
  async countActiveSocieteUsers(societeId: string): Promise<number> {
    this.logger.debug(`Counting active users for societe: ${societeId}`)

    try {
      return await this.prisma.societeUser.count({
        where: {
          societeId,
          isActive: true,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting societe users: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les societes actives d'un utilisateur
   */
  async countUserActiveSocietes(userId: string): Promise<number> {
    this.logger.debug(`Counting active societes for user: ${userId}`)

    try {
      return await this.prisma.societeUser.count({
        where: {
          userId,
          isActive: true,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting user societes: ${err.message}`, err.stack)
      throw error
    }
  }
}
