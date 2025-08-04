import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ParameterService } from '../../../features/parameters/services/parameter.service'
import { Permission } from '../core/entities/permission.entity'
import { Role } from '../core/entities/role.entity'
import { RolePermission } from '../core/entities/role-permission.entity'
import { UserSocieteRole } from '../core/entities/user-societe-role.entity'

export interface UserSocieteRoleWithPermissions {
  userId: string
  societeId: string
  societe: {
    id: string
    nom: string
    code: string
  }
  roleType: string
  role?: {
    id: string
    name: string
    parentRoleType?: string
    priority: number
  }
  permissions: Array<{
    id: string
    name: string
    resource: string
    action: string
    accessLevel: 'BLOCKED' | 'READ' | 'WRITE' | 'DELETE' | 'ADMIN'
    isGranted: boolean
  }>
  additionalPermissions: string[]
  restrictedPermissions: string[]
  isDefault: boolean
  isActive: boolean
}

@Injectable()
export class UserSocieteRolesService {
  constructor(
    @InjectRepository(UserSocieteRole, 'auth')
    private _userSocieteRoleRepository: Repository<UserSocieteRole>,
    @InjectRepository(Role, 'auth')
    private _roleRepository: Repository<Role>,
    @InjectRepository(Permission, 'auth')
    private _permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission, 'auth')
    private _rolePermissionRepository: Repository<RolePermission>,
    private parameterService: ParameterService,
  ) {}

  /**
   * Récupère les rôles et permissions d'un utilisateur dans toutes ses sociétés
   */
  async findUserRolesInSocietes(userId: string): Promise<UserSocieteRoleWithPermissions[]> {
    const userRoles = await this._userSocieteRoleRepository.find({
      where: {
        userId,
        isActive: true,
      },
      relations: ['user', 'societe'],
    })

    const result: UserSocieteRoleWithPermissions[] = []

    for (const userRole of userRoles) {
      // Utiliser le roleType de l'entité UserSocieteRole comme rôle effectif
      let effectiveRoleType = userRole.roleType

      // Si pas de rôle spécifique assigné, utiliser le rôle global de l'utilisateur
      if (!effectiveRoleType && userRole.user) {
        effectiveRoleType = userRole.user.role // Rôle global
      }

      // Récupérer les permissions du rôle (pour l'instant vide, à implémenter avec la nouvelle structure)
      const permissions: Array<{
        id: string
        name: string
        resource: string
        action: string
        accessLevel: 'BLOCKED' | 'READ' | 'WRITE' | 'DELETE' | 'ADMIN'
        isGranted: boolean
      }> = []

      // TODO: Implémenter la récupération des permissions avec la nouvelle structure
      // if (userRole.role?.permissions) {
      //   permissions = userRole.role.permissions
      //     .filter(rp => rp.isActive)
      //     .map(rp => ({
      //       id: rp.permission.id,
      //       name: rp.permission.name,
      //       resource: rp.permission.resource,
      //       action: rp.permission.action,
      //       accessLevel: rp.accessLevel,
      //       isGranted: rp.isGranted
      //     }))
      // }

      result.push({
        userId: userRole.userId,
        societeId: userRole.societeId,
        societe: userRole.societe || {
          id: userRole.societeId,
          nom: 'Société inconnue',
          code: 'UNKNOWN',
        },
        roleType: effectiveRoleType,
        role: undefined, // Plus besoin de charger l'entité Role complète
        permissions,
        isDefault: userRole.isDefaultSociete,
        isActive: userRole.isActive,
        // Ajout des propriétés supplémentaires
        additionalPermissions: userRole.additionalPermissions || [],
        restrictedPermissions: userRole.restrictedPermissions || [],
      } as any)
    }

    return result
  }

  /**
   * Récupère le rôle effectif d'un utilisateur dans une société
   * (combinaison du rôle global et du rôle spécifique société)
   */
  async getEffectiveUserRole(userId: string, societeId: string): Promise<string> {
    const userRole = await this._userSocieteRoleRepository.findOne({
      where: { userId, societeId, isActive: true },
      relations: ['user', 'role'],
    })

    if (!userRole) {
      throw new NotFoundException(`User role not found for user ${userId} in societe ${societeId}`)
    }

    // Priorité : rôle spécifique société > rôle global utilisateur
    if (userRole.role?.parentRoleType) {
      return userRole.role.parentRoleType
    }

    if (userRole.user?.role) {
      return userRole.user.role
    }

    return 'USER' // Fallback par défaut
  }

  /**
   * Vérifie si un utilisateur a une permission spécifique dans une société
   */
  async hasPermission(
    userId: string,
    societeId: string,
    _resource: string,
    _action: string,
    _requiredLevel: 'READ' | 'WRITE' | 'DELETE' | 'ADMIN' = 'READ'
  ): Promise<boolean> {
    const userRole = await this._userSocieteRoleRepository.findOne({
      where: { userId, societeId, isActive: true },
      relations: ['role', 'role.rolePermissions', 'role.rolePermissions.permission'],
    })

    if (!userRole?.role) {
      return false
    }

    // Vérifier les permissions du rôle
    // TODO: Implémenter avec la nouvelle structure de permissions
    // const rolePermission = userRole.role.permissions.find(rp =>
    //   rp.permission.resource === resource &&
    //   rp.permission.action === action &&
    //   rp.isActive &&
    //   rp.isGranted
    // )
    const rolePermission = null // Temporaire

    if (!rolePermission) {
      return false
    }

    // Vérifier le niveau d'accès (temporairement désactivé car rolePermission est null)
    // const levels = ['BLOCKED', 'READ', 'WRITE', 'DELETE', 'ADMIN']
    // const userLevel = levels.indexOf(rolePermission.accessLevel)
    // const requiredLevelIndex = levels.indexOf(requiredLevel)
    // return userLevel >= requiredLevelIndex && userLevel > 0 // BLOCKED = 0

    return false // Temporaire - à implémenter avec la nouvelle structure
  }

  /**
   * Assigne un rôle à un utilisateur dans une société
   */
  async assignRole(
    userId: string,
    societeId: string,
    roleId: string,
    grantedById: string
  ): Promise<UserSocieteRole> {
    // Vérifier si l'assignation existe déjà
    let userRole = await this._userSocieteRoleRepository.findOne({
      where: { userId, societeId },
    })

    if (userRole) {
      // Mettre à jour le rôle existant
      userRole.roleId = roleId
      userRole.grantedById = grantedById
      userRole.grantedAt = new Date()
      userRole.isActive = true
    } else {
      // Créer une nouvelle assignation
      userRole = this._userSocieteRoleRepository.create({
        userId,
        societeId,
        roleId,
        roleType: 'USER', // Valeur par défaut temporaire
        grantedById,
        grantedAt: new Date(),
        isActive: true,
        isDefaultSociete: false,
        additionalPermissions: [],
        restrictedPermissions: [],
        metadata: {},
      })
    }

    return this._userSocieteRoleRepository.save(userRole)
  }

  /**
   * Révoque un rôle d'un utilisateur dans une société
   */
  async revokeRole(userId: string, societeId: string): Promise<void> {
    await this._userSocieteRoleRepository.update(
      { userId, societeId },
      { isActive: false, roleId: undefined }
    )
  }
}
