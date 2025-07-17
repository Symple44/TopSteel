import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Group } from '../entities/group.entity'
import { UserGroup } from '../entities/user-group.entity'
import { Role } from '../entities/role.entity'

export interface CreateGroupDto {
  name: string
  description: string
  type: 'DEPARTMENT' | 'TEAM' | 'PROJECT' | 'CUSTOM'
  roleIds?: string[]
}

export interface UpdateGroupDto {
  name?: string
  description?: string
  type?: 'DEPARTMENT' | 'TEAM' | 'PROJECT' | 'CUSTOM'
  isActive?: boolean
}

export interface GroupWithStats {
  id: string
  name: string
  description: string
  type: string
  isActive: boolean
  userCount: number
  roleCount: number
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(UserGroup)
    private readonly userGroupRepository: Repository<UserGroup>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  // ===== GESTION DES GROUPES =====

  async findAllGroups(): Promise<GroupWithStats[]> {
    const groups = await this.groupRepository.find({
      relations: ['roles'],
      order: { type: 'ASC', name: 'ASC' }
    })

    // Calculer les statistiques pour chaque groupe
    const groupsWithStats = await Promise.all(
      groups.map(async (group) => {
        const userCount = await this.userGroupRepository.count({ 
          where: { groupId: group.id, isActive: true } 
        })

        return {
          id: group.id,
          name: group.name,
          description: group.description,
          type: group.type || 'CUSTOM',
          isActive: group.isActive,
          userCount,
          roleCount: group.roles?.length || 0,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt
        }
      })
    )

    return groupsWithStats
  }

  async findGroupById(id: string, includeUsers: boolean = false): Promise<Group> {
    const queryBuilder = this.groupRepository.createQueryBuilder('group')
      .leftJoinAndSelect('group.roles', 'roles')
      .where('group.id = :id', { id })
    
    if (includeUsers) {
      queryBuilder.leftJoinAndSelect('group.userGroups', 'userGroups')
    }

    const group = await queryBuilder.getOne()
    
    if (!group) {
      throw new NotFoundException(`Groupe avec l'ID ${id} non trouvé`)
    }

    return group
  }

  async createGroup(createGroupDto: CreateGroupDto, createdBy: string): Promise<Group> {
    // Vérifier l'unicité du nom
    const existingGroup = await this.groupRepository.findOne({
      where: { name: createGroupDto.name }
    })

    if (existingGroup) {
      throw new ConflictException(`Un groupe avec le nom "${createGroupDto.name}" existe déjà`)
    }

    // Créer le groupe
    const group = Group.create(
      createGroupDto.name,
      createGroupDto.description,
      createGroupDto.type,
      createdBy
    )

    const savedGroup = await this.groupRepository.save(group)

    // Associer les rôles si spécifiés
    if (createGroupDto.roleIds && createGroupDto.roleIds.length > 0) {
      const roles = await this.roleRepository.findByIds(createGroupDto.roleIds)
      savedGroup.roles = roles
      await this.groupRepository.save(savedGroup)
    }

    return savedGroup
  }

  async updateGroup(id: string, updateGroupDto: UpdateGroupDto, updatedBy: string): Promise<Group> {
    const group = await this.findGroupById(id)

    // Vérifier l'unicité du nom si modifié
    if (updateGroupDto.name && updateGroupDto.name !== group.name) {
      const existingGroup = await this.groupRepository.findOne({
        where: { name: updateGroupDto.name }
      })

      if (existingGroup) {
        throw new ConflictException(`Un groupe avec le nom "${updateGroupDto.name}" existe déjà`)
      }
    }

    // Mettre à jour
    Object.assign(group, updateGroupDto)
    group.updatedBy = updatedBy
    group.updatedAt = new Date()

    return await this.groupRepository.save(group)
  }

  async deleteGroup(id: string): Promise<void> {
    const group = await this.findGroupById(id)

    // Vérifier s'il y a des utilisateurs assignés
    const userCount = await this.userGroupRepository.count({
      where: { groupId: id, isActive: true }
    })

    if (userCount > 0) {
      throw new ForbiddenException(
        `Impossible de supprimer le groupe "${group.name}" car il contient ${userCount} utilisateur(s)`
      )
    }

    await this.groupRepository.delete(id)
  }

  // ===== GESTION DES MEMBRES =====

  async addUserToGroup(
    userId: string,
    groupId: string,
    assignedBy: string,
    expiresAt?: Date
  ): Promise<UserGroup> {
    const group = await this.findGroupById(groupId)

    // Vérifier s'il n'y a pas déjà une assignation active
    const existingUserGroup = await this.userGroupRepository.findOne({
      where: { userId, groupId, isActive: true }
    })

    if (existingUserGroup) {
      throw new ConflictException('L\'utilisateur fait déjà partie de ce groupe')
    }

    const userGroup = UserGroup.assign(userId, groupId, assignedBy, expiresAt)
    return await this.userGroupRepository.save(userGroup)
  }

  async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    const userGroup = await this.userGroupRepository.findOne({
      where: { userId, groupId, isActive: true }
    })

    if (!userGroup) {
      throw new NotFoundException('Utilisateur non trouvé dans ce groupe')
    }

    userGroup.isActive = false
    await this.userGroupRepository.save(userGroup)
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const userGroups = await this.userGroupRepository.find({
      where: { userId, isActive: true },
      relations: ['group', 'group.roles']
    })

    return userGroups
      .filter(ug => ug.isValid())
      .map(ug => ug.group)
  }

  async getGroupUsers(groupId: string): Promise<any[]> {
    const userGroups = await this.userGroupRepository.find({
      where: { groupId, isActive: true }
    })

    return userGroups.filter(ug => ug.isValid())
  }

  // ===== GESTION DES RÔLES DE GROUPE =====

  async updateGroupRoles(groupId: string, roleIds: string[]): Promise<void> {
    const group = await this.findGroupById(groupId)
    
    const roles = await this.roleRepository.findByIds(roleIds)
    group.roles = roles
    
    await this.groupRepository.save(group)
  }

  async getGroupRoles(groupId: string): Promise<Role[]> {
    const group = await this.findGroupById(groupId)
    return group.roles || []
  }

  // ===== PERMISSIONS HÉRITÉES =====

  async getUserPermissionsFromGroups(userId: string): Promise<any[]> {
    const userGroups = await this.getUserGroups(userId)
    
    // Collecter tous les rôles des groupes de l'utilisateur
    const allRoles = new Map<string, Role>()
    
    for (const group of userGroups) {
      if (group.roles) {
        for (const role of group.roles) {
          allRoles.set(role.id, role)
        }
      }
    }
    
    return Array.from(allRoles.values())
  }
}