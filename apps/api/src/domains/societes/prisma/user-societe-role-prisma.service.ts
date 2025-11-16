import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { UserSocieteRole, Prisma } from '@prisma/client'

/**
 * UserSocieteRolePrismaService - Phase 2.2
 *
 * Service pour gestion des rôles utilisateur-societe avec Prisma
 *
 * Junction table entre User, Societe et Role
 * Permet d'assigner différents rôles à un utilisateur dans différentes sociétés
 *
 * Fonctionnalités:
 * - CRUD UserSocieteRole
 * - Gestion permissions spécifiques
 * - Activation/désactivation rôles
 * - Historique activations/désactivations
 */
@Injectable()
export class UserSocieteRolePrismaService {
  private readonly logger = new Logger(UserSocieteRolePrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Assigner un rôle à un utilisateur dans une societe
   */
  async assignRole(data: {
    userId: string
    societeId: string
    roleId: string
    permissions?: Record<string, any>
    isActive?: boolean
  }): Promise<UserSocieteRole> {
    this.logger.log(
      `Assigning role ${data.roleId} to user ${data.userId} in societe ${data.societeId}`
    )

    try {
      const now = new Date()

      const userSocieteRole = await this.prisma.userSocieteRole.create({
        data: {
          userId: data.userId,
          societeId: data.societeId,
          roleId: data.roleId,
          permissions: data.permissions ? (data.permissions as Prisma.InputJsonValue) : undefined,
          isActive: data.isActive !== undefined ? data.isActive : true,
          activatedAt: data.isActive !== false ? now : null,
        },
      })

      this.logger.log(`Role assigned successfully: ${userSocieteRole.id}`)
      return userSocieteRole
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error assigning role: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une association par ID
   */
  async getUserSocieteRoleById(id: string): Promise<UserSocieteRole | null> {
    this.logger.debug(`Getting user-societe-role: ${id}`)

    try {
      return await this.prisma.userSocieteRole.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting user-societe-role: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une association par IDs uniques
   */
  async getUserSocieteRoleByIds(
    userId: string,
    societeId: string,
    roleId: string
  ): Promise<UserSocieteRole | null> {
    this.logger.debug(`Getting role for user ${userId}, societe ${societeId}, role ${roleId}`)

    try {
      return await this.prisma.userSocieteRole.findUnique({
        where: {
          userId_societeId_roleId: {
            userId,
            societeId,
            roleId,
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting user-societe-role by IDs: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer tous les rôles d'un utilisateur
   */
  async getUserRoles(userId: string, includeInactive = false) {
    this.logger.debug(`Getting roles for user: ${userId}`)

    try {
      return await this.prisma.userSocieteRole.findMany({
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
            },
          },
          role: {
            select: {
              id: true,
              name: true,
              label: true,
              level: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting user roles: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer tous les rôles dans une societe
   */
  async getSocieteRoles(societeId: string, includeInactive = false) {
    this.logger.debug(`Getting roles for societe: ${societeId}`)

    try {
      return await this.prisma.userSocieteRole.findMany({
        where: {
          societeId,
          ...(includeInactive ? {} : { isActive: true }),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              isActive: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
              label: true,
              level: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting societe roles: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les rôles d'un utilisateur dans une societe
   */
  async getUserSocieteRoles(userId: string, societeId: string, includeInactive = false) {
    this.logger.debug(`Getting roles for user ${userId} in societe ${societeId}`)

    try {
      return await this.prisma.userSocieteRole.findMany({
        where: {
          userId,
          societeId,
          ...(includeInactive ? {} : { isActive: true }),
        },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              label: true,
              level: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting user-societe roles: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour une association
   */
  async updateUserSocieteRole(
    id: string,
    data: {
      permissions?: Record<string, any>
      isActive?: boolean
    }
  ): Promise<UserSocieteRole> {
    this.logger.log(`Updating user-societe-role: ${id}`)

    try {
      const updateData: any = {}

      if (data.permissions !== undefined) {
        updateData.permissions = data.permissions as Prisma.InputJsonValue
      }

      if (data.isActive !== undefined) {
        updateData.isActive = data.isActive

        if (data.isActive) {
          updateData.activatedAt = new Date()
          updateData.deactivatedAt = null
        } else {
          updateData.deactivatedAt = new Date()
        }
      }

      const userSocieteRole = await this.prisma.userSocieteRole.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`User-societe-role updated: ${id}`)
      return userSocieteRole
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating user-societe-role: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Activer un rôle
   */
  async activateRole(userId: string, societeId: string, roleId: string): Promise<UserSocieteRole> {
    this.logger.log(`Activating role for user ${userId} in societe ${societeId}`)

    const role = await this.getUserSocieteRoleByIds(userId, societeId, roleId)
    if (!role) {
      throw new Error(
        `UserSocieteRole not found for user ${userId}, societe ${societeId}, role ${roleId}`
      )
    }

    return this.updateUserSocieteRole(role.id, { isActive: true })
  }

  /**
   * Désactiver un rôle
   */
  async deactivateRole(userId: string, societeId: string, roleId: string): Promise<UserSocieteRole> {
    this.logger.log(`Deactivating role for user ${userId} in societe ${societeId}`)

    const role = await this.getUserSocieteRoleByIds(userId, societeId, roleId)
    if (!role) {
      throw new Error(
        `UserSocieteRole not found for user ${userId}, societe ${societeId}, role ${roleId}`
      )
    }

    return this.updateUserSocieteRole(role.id, { isActive: false })
  }

  /**
   * Retirer un rôle
   */
  async removeRole(userId: string, societeId: string, roleId: string): Promise<void> {
    this.logger.log(`Removing role ${roleId} from user ${userId} in societe ${societeId}`)

    try {
      await this.prisma.userSocieteRole.delete({
        where: {
          userId_societeId_roleId: {
            userId,
            societeId,
            roleId,
          },
        },
      })

      this.logger.log(`Role removed successfully`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error removing role: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Vérifier si un utilisateur a un rôle dans une societe
   */
  async hasRole(userId: string, societeId: string, roleId: string): Promise<boolean> {
    this.logger.debug(`Checking if user ${userId} has role ${roleId} in societe ${societeId}`)

    try {
      const role = await this.getUserSocieteRoleByIds(userId, societeId, roleId)
      return role !== null && role.isActive
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking role: ${err.message}`, err.stack)
      return false
    }
  }

  /**
   * Vérifier si un utilisateur a un rôle spécifique (par nom) dans une societe
   */
  async hasRoleByName(userId: string, societeId: string, roleName: string): Promise<boolean> {
    this.logger.debug(`Checking if user ${userId} has role ${roleName} in societe ${societeId}`)

    try {
      const roles = await this.getUserSocieteRoles(userId, societeId, false)
      return roles.some((r) => r.role.name === roleName)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking role by name: ${err.message}`, err.stack)
      return false
    }
  }

  /**
   * Compter les utilisateurs avec un rôle donné dans une societe
   */
  async countUsersWithRole(societeId: string, roleId: string): Promise<number> {
    this.logger.debug(`Counting users with role ${roleId} in societe ${societeId}`)

    try {
      return await this.prisma.userSocieteRole.count({
        where: {
          societeId,
          roleId,
          isActive: true,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting users with role: ${err.message}`, err.stack)
      throw error
    }
  }
}
