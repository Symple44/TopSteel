import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { UserSocieteRole } from '../core/entities/user-societe-role.entity'
import { PermissionCalculatorService } from './permission-calculator.service'

export interface UserSocieteRoleWithPermissions {
  userId: string
  societeId: string
  societe: {
    id: string
    nom: string
    code: string
  }
  roleType: string
  isDefaultSociete: boolean
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
    private permissionCalculator: PermissionCalculatorService
  ) {}

  /**
   * Récupère les rôles et permissions d'un utilisateur dans toutes ses sociétés
   */
  async findUserRolesInSocietes(userId: string): Promise<UserSocieteRoleWithPermissions[]> {
    // Test avec une requête SQL directe pour debug
    const rawQuery = `
      SELECT 
        usr.id, usr."userId", usr."societeId", usr."roleType", usr."isDefaultSociete", usr."isActive",
        s.id as societe_id, s.nom as societe_nom, s.code as societe_code
      FROM user_societe_roles usr
      LEFT JOIN societes s ON s.id = usr."societeId"
      WHERE usr."userId" = $1 AND usr."isActive" = true
    `

    const rawResult = await this._userSocieteRoleRepository.query(rawQuery, [userId])

    const userRoles = await this._userSocieteRoleRepository
      .createQueryBuilder('usr')
      .leftJoinAndSelect('usr.societe', 'societe')
      .select([
        'usr.id',
        'usr.userId',
        'usr.societeId',
        'usr.roleType',
        'usr.isDefaultSociete',
        'usr.isActive',
        'usr.additionalPermissions',
        'usr.restrictedPermissions',
        'societe.id',
        'societe.nom',
        'societe.code',
      ])
      .where('usr.userId = :userId', { userId })
      .andWhere('usr.isActive = :isActive', { isActive: true })
      .getMany()

    // Si la relation TypeORM ne fonctionne pas, utilisons la requête SQL directe
    if (rawResult && rawResult.length > 0 && userRoles.length === 0) {
      const result: UserSocieteRoleWithPermissions[] = rawResult.map(
        (row: Record<string, unknown>) => ({
          userId: row.userId,
          societeId: row.societeId,
          societe: {
            id: row.societe_id || row.societeId,
            nom: row.societe_nom || `Société ${(row as any).societeId.substring(0, 8)}...`,
            code: row.societe_code || 'N/A',
          },
          roleType: row.roleType || 'USER',
          isDefaultSociete: row.isDefaultSociete || false,
          role: undefined,
          permissions: [],
          additionalPermissions: [],
          restrictedPermissions: [],
          isActive: row.isActive,
        })
      )

      return result
    }

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
        isDefaultSociete: userRole.isDefaultSociete,
        role: undefined, // Plus besoin de charger l'entité Role complète
        permissions,
        isActive: userRole.isActive,
        // Ajout des propriétés supplémentaires
        additionalPermissions: userRole.additionalPermissions || [],
        restrictedPermissions: userRole.restrictedPermissions || [],
      } as UserSocieteRoleWithPermissions)
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

    const saved = await this._userSocieteRoleRepository.save(userRole)

    // Invalider le cache des permissions
    await this.permissionCalculator.invalidateUserPermissions(userId, societeId)

    return saved
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

  /**
   * Définir une société par défaut pour un utilisateur
   */
  async setDefaultSociete(userId: string, societeId: string): Promise<void> {
    // D'abord, enlever le statut par défaut de toutes les sociétés de l'utilisateur
    await this._userSocieteRoleRepository.update({ userId }, { isDefaultSociete: false })

    // Ensuite, définir la société spécifiée comme par défaut
    const result = await this._userSocieteRoleRepository.update(
      { userId, societeId, isActive: true },
      { isDefaultSociete: true }
    )

    if (result.affected === 0) {
      throw new Error(`No active access found for user ${userId} to company ${societeId}`)
    }

    // Invalider le cache des permissions
    await this.permissionCalculator.invalidateUserPermissions(userId, societeId)
  }

  /**
   * Ajouter une permission additionnelle à un utilisateur
   */
  async addAdditionalPermission(
    userId: string,
    societeId: string,
    permission: string
  ): Promise<UserSocieteRole> {
    const userRole = await this._userSocieteRoleRepository.findOne({
      where: { userId, societeId, isActive: true }
    })

    if (!userRole) {
      throw new NotFoundException(`User role not found for user ${userId} in societe ${societeId}`)
    }

    userRole.addAdditionalPermission(permission)
    const saved = await this._userSocieteRoleRepository.save(userRole)

    // Invalider le cache des permissions
    await this.permissionCalculator.invalidateUserPermissions(userId, societeId)

    return saved
  }

  /**
   * Retirer une permission additionnelle d'un utilisateur
   */
  async removeAdditionalPermission(
    userId: string,
    societeId: string,
    permission: string
  ): Promise<UserSocieteRole> {
    const userRole = await this._userSocieteRoleRepository.findOne({
      where: { userId, societeId, isActive: true }
    })

    if (!userRole) {
      throw new NotFoundException(`User role not found for user ${userId} in societe ${societeId}`)
    }

    userRole.removeAdditionalPermission(permission)
    const saved = await this._userSocieteRoleRepository.save(userRole)

    // Invalider le cache des permissions
    await this.permissionCalculator.invalidateUserPermissions(userId, societeId)

    return saved
  }

  /**
   * Ajouter une restriction de permission à un utilisateur
   */
  async addRestrictedPermission(
    userId: string,
    societeId: string,
    permission: string
  ): Promise<UserSocieteRole> {
    const userRole = await this._userSocieteRoleRepository.findOne({
      where: { userId, societeId, isActive: true }
    })

    if (!userRole) {
      throw new NotFoundException(`User role not found for user ${userId} in societe ${societeId}`)
    }

    userRole.addRestrictedPermission(permission)
    const saved = await this._userSocieteRoleRepository.save(userRole)

    // Invalider le cache des permissions
    await this.permissionCalculator.invalidateUserPermissions(userId, societeId)

    return saved
  }

  /**
   * Retirer une restriction de permission d'un utilisateur
   */
  async removeRestrictedPermission(
    userId: string,
    societeId: string,
    permission: string
  ): Promise<UserSocieteRole> {
    const userRole = await this._userSocieteRoleRepository.findOne({
      where: { userId, societeId, isActive: true }
    })

    if (!userRole) {
      throw new NotFoundException(`User role not found for user ${userId} in societe ${societeId}`)
    }

    userRole.removeRestrictedPermission(permission)
    const saved = await this._userSocieteRoleRepository.save(userRole)

    // Invalider le cache des permissions
    await this.permissionCalculator.invalidateUserPermissions(userId, societeId)

    return saved
  }

  /**
   * Obtenir un résumé des permissions d'un utilisateur
   */
  async getUserPermissionsSummary(userId: string, societeId: string) {
    return await this.permissionCalculator.getPermissionsSummary(userId, societeId)
  }

  /**
   * Obtenir les permissions effectives d'un utilisateur
   */
  async getUserEffectivePermissions(userId: string, societeId: string, siteId?: string) {
    return await this.permissionCalculator.calculateUserPermissions(userId, societeId, siteId)
  }
}
