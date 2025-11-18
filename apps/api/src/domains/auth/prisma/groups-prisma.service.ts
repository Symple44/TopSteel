import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { Group, UserGroup, Prisma } from '@prisma/client'

/**
 * GroupsPrismaService - Phase 2.1
 *
 * Service pour gestion des groupes utilisateurs avec Prisma
 *
 * Entités gérées:
 * - Group (groupes)
 * - UserGroup (associations user-group)
 *
 * Fonctionnalités:
 * - CRUD Groups
 * - Gestion memberships
 */
@Injectable()
export class GroupsPrismaService {
  private readonly logger = new Logger(GroupsPrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // GROUP OPERATIONS
  // ============================================

  /**
   * Créer un groupe
   */
  async createGroup(data: {
    name: string
    label: string
    description?: string
    isActive?: boolean
  }): Promise<Group> {
    this.logger.log(`Creating group: ${data.name}`)

    try {
      const group = await this.prisma.group.create({
        data: {
          name: data.name,
          label: data.label,
          description: data.description || null,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
      })

      this.logger.log(`Group created: ${group.id}`)
      return group
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating group: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un groupe par ID
   */
  async getGroupById(id: string): Promise<Group | null> {
    this.logger.debug(`Getting group: ${id}`)

    try {
      return await this.prisma.group.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting group: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un groupe par nom
   */
  async getGroupByName(name: string): Promise<Group | null> {
    this.logger.debug(`Getting group by name: ${name}`)

    try {
      return await this.prisma.group.findUnique({
        where: { name },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting group by name: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Lister tous les groupes
   */
  async getAllGroups(includeInactive = false): Promise<Group[]> {
    this.logger.debug(`Getting all groups (includeInactive: ${includeInactive})`)

    try {
      return await this.prisma.group.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting all groups: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un groupe avec ses membres
   */
  async getGroupWithMembers(id: string) {
    this.logger.debug(`Getting group with members: ${id}`)

    try {
      return await this.prisma.group.findUnique({
        where: { id },
        include: {
          users: {
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
            },
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting group with members: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour un groupe
   */
  async updateGroup(
    id: string,
    data: Partial<Omit<Group, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Group> {
    this.logger.log(`Updating group: ${id}`)

    try {
      // Convert metadata if present
      const updateData: any = { ...data }
      if ('metadata' in data && data.metadata !== undefined) {
        updateData.metadata = data.metadata as Prisma.InputJsonValue
      }

      const group = await this.prisma.group.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`Group updated: ${id}`)
      return group
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating group: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Désactiver un groupe
   */
  async deactivateGroup(id: string): Promise<Group> {
    this.logger.log(`Deactivating group: ${id}`)

    try {
      const group = await this.prisma.group.update({
        where: { id },
        data: {
          isActive: false,
        },
      })

      this.logger.log(`Group deactivated: ${id}`)
      return group
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deactivating group: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer un groupe (hard delete)
   */
  async deleteGroup(id: string): Promise<void> {
    this.logger.log(`Deleting group: ${id}`)

    try {
      // D'abord supprimer les memberships
      await this.prisma.userGroup.deleteMany({
        where: { groupId: id },
      })

      // Puis supprimer le groupe
      await this.prisma.group.delete({
        where: { id },
      })

      this.logger.log(`Group deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting group: ${err.message}`, err.stack)
      throw error
    }
  }

  // ============================================
  // USER-GROUP OPERATIONS
  // ============================================

  /**
   * Ajouter un utilisateur à un groupe
   */
  async addUserToGroup(userId: string, groupId: string): Promise<UserGroup> {
    this.logger.log(`Adding user ${userId} to group ${groupId}`)

    try {
      const userGroup = await this.prisma.userGroup.create({
        data: {
          userId,
          groupId,
        },
      })

      this.logger.log(`User added to group successfully`)
      return userGroup
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error adding user to group: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Retirer un utilisateur d'un groupe
   */
  async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    this.logger.log(`Removing user ${userId} from group ${groupId}`)

    try {
      await this.prisma.userGroup.delete({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
      })

      this.logger.log(`User removed from group successfully`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error removing user from group: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer tous les groupes d'un utilisateur
   */
  async getUserGroups(userId: string) {
    this.logger.debug(`Getting groups for user: ${userId}`)

    try {
      return await this.prisma.userGroup.findMany({
        where: { userId },
        include: {
          group: true,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting user groups: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer tous les membres d'un groupe
   */
  async getGroupMembers(groupId: string) {
    this.logger.debug(`Getting members for group: ${groupId}`)

    try {
      return await this.prisma.userGroup.findMany({
        where: { groupId },
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
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting group members: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Vérifier si un utilisateur est membre d'un groupe
   */
  async isUserInGroup(userId: string, groupId: string): Promise<boolean> {
    this.logger.debug(`Checking if user ${userId} is in group ${groupId}`)

    try {
      const membership = await this.prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
      })

      return membership !== null
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking group membership: ${err.message}`, err.stack)
      return false
    }
  }

  /**
   * Compter les membres d'un groupe
   */
  async countGroupMembers(groupId: string): Promise<number> {
    this.logger.debug(`Counting members for group: ${groupId}`)

    try {
      return await this.prisma.userGroup.count({
        where: { groupId },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting group members: ${err.message}`, err.stack)
      throw error
    }
  }
}
