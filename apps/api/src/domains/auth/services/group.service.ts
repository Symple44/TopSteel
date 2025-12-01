/**
 * Service migré de TypeORM vers Prisma
 * Migration complète vers Prisma Client - Schema simplifié
 */

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { Group, UserGroup } from '@prisma/client'

export interface CreateGroupDto {
  name: string
  description: string
}

export interface UpdateGroupDto {
  name?: string
  description?: string
  isActive?: boolean
}

export interface GroupWithStats {
  id: string
  name: string
  description: string
  isActive: boolean
  userCount: number
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class GroupService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== GESTION DES GROUPES =====

  async findAllGroups(options?: {
    page?: number
    limit?: number
  }): Promise<{ groups: GroupWithStats[]; total: number }> {
    const page = options?.page || 1
    const limit = options?.limit || 20
    const skip = (page - 1) * limit

    // Get total count
    const total = await this.prisma.group.count()

    // Get paginated groups
    const groups = await this.prisma.group.findMany({
      skip,
      take: limit,
      orderBy: [{ name: 'asc' }],
    })

    // Calculer les statistiques pour chaque groupe
    const groupsWithStats = await Promise.all(
      groups.map(async (group) => {
        const userCount = await this.prisma.userGroup.count({
          where: { groupId: group.id },
        })

        return {
          id: group.id,
          name: group.name,
          description: group.description || '',
          isActive: group.isActive,
          userCount,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt,
        }
      })
    )

    return { groups: groupsWithStats, total }
  }

  async findGroupById(id: string, includeUsers: boolean = false): Promise<Group> {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: includeUsers
        ? {
            users: {
              include: { user: true },
            },
          }
        : undefined,
    })

    if (!group) {
      throw new NotFoundException(`Groupe avec l'ID ${id} non trouvé`)
    }

    return group
  }

  async createGroup(createGroupDto: CreateGroupDto, _createdBy: string): Promise<Group> {
    // Vérifier l'unicité du nom
    const existingGroup = await this.prisma.group.findFirst({
      where: { name: createGroupDto.name },
    })

    if (existingGroup) {
      throw new ConflictException(`Un groupe avec le nom "${createGroupDto.name}" existe déjà`)
    }

    // Créer le groupe
    const savedGroup = await this.prisma.group.create({
      data: {
        name: createGroupDto.name,
        label: createGroupDto.name,
        description: createGroupDto.description,
        isActive: true,
      },
    })

    return savedGroup
  }

  async updateGroup(id: string, updateGroupDto: UpdateGroupDto, _updatedBy: string): Promise<Group> {
    const group = await this.findGroupById(id)

    // Vérifier l'unicité du nom si modifié
    if (updateGroupDto.name && updateGroupDto.name !== group.name) {
      const existingGroup = await this.prisma.group.findFirst({
        where: { name: updateGroupDto.name },
      })

      if (existingGroup) {
        throw new ConflictException(`Un groupe avec le nom "${updateGroupDto.name}" existe déjà`)
      }
    }

    // Mettre à jour
    return await this.prisma.group.update({
      where: { id },
      data: {
        name: updateGroupDto.name,
        label: updateGroupDto.name || group.label,
        description: updateGroupDto.description,
        isActive: updateGroupDto.isActive,
      },
    })
  }

  async deleteGroup(id: string): Promise<void> {
    const group = await this.findGroupById(id)

    // Vérifier s'il y a des utilisateurs assignés
    const userCount = await this.prisma.userGroup.count({
      where: { groupId: id },
    })

    if (userCount > 0) {
      throw new ForbiddenException(
        `Impossible de supprimer le groupe "${group.name}" car il contient ${userCount} utilisateur(s)`
      )
    }

    // Supprimer le groupe
    await this.prisma.group.delete({
      where: { id },
    })
  }

  // ===== GESTION DES MEMBRES =====

  async addUserToGroup(
    userId: string,
    groupId: string,
    _assignedBy: string
  ): Promise<UserGroup> {
    await this.findGroupById(groupId)

    // Vérifier s'il n'y a pas déjà une assignation
    const existingUserGroup = await this.prisma.userGroup.findFirst({
      where: { userId, groupId },
    })

    if (existingUserGroup) {
      throw new ConflictException("L'utilisateur fait déjà partie de ce groupe")
    }

    // Créer l'assignation
    return await this.prisma.userGroup.create({
      data: {
        userId,
        groupId,
      },
    })
  }

  async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    const userGroup = await this.prisma.userGroup.findFirst({
      where: { userId, groupId },
    })

    if (!userGroup) {
      throw new NotFoundException('Utilisateur non trouvé dans ce groupe')
    }

    // Supprimer l'assignation
    await this.prisma.userGroup.delete({
      where: { id: userGroup.id },
    })
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const userGroups = await this.prisma.userGroup.findMany({
      where: { userId },
      include: { group: true },
    })

    return userGroups.map((ug) => ug.group).filter((group): group is Group => group !== null)
  }

  async getGroupUsers(groupId: string): Promise<UserGroup[]> {
    const userGroups = await this.prisma.userGroup.findMany({
      where: { groupId },
      include: { user: true },
    })

    return userGroups
  }
}
