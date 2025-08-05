import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { Role } from '../core/entities/role.entity'
import { RolePermission } from '../core/entities/role-permission.entity'
import { UserRole } from '../core/entities/user-role.entity'
// Types déjà définis dans le service

export interface CreateRoleDto {
  name: string
  description: string
  isActive?: boolean
  permissions?: {
    permissionId: string
  }[]
}

export interface UpdateRoleDto {
  name?: string
  description?: string
  isActive?: boolean
}

export interface RoleWithStats {
  id: string
  name: string
  description: string
  isSystemRole: boolean
  isActive: boolean
  userCount: number
  moduleCount: number
  permissionCount: number
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role, 'auth')
    private readonly _roleRepository: Repository<Role>,
    @InjectRepository(RolePermission, 'auth')
    private readonly _rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(UserRole, 'auth')
    private readonly _userRoleRepository: Repository<UserRole>
  ) {}

  // ===== GESTION DES RÔLES =====

  async findAllRoles(includePermissions: boolean = false): Promise<RoleWithStats[]> {
    const queryBuilder = this._roleRepository.createQueryBuilder('role')

    if (includePermissions) {
      queryBuilder.leftJoinAndSelect('role.permissions', 'permissions')
    }

    const roles = await queryBuilder.getMany()

    // Calculer les statistiques pour chaque rôle
    const rolesWithStats = await Promise.all(
      roles.map(async (role) => {
        const [userCount, permissionCount] = await Promise.all([
          this._userRoleRepository.count({ where: { roleId: (role as any).id } }),
          this._rolePermissionRepository.count({ where: { roleId: (role as any).id } }),
        ])
        const moduleCount = 0 // Modules table doesn't exist in auth DB

        return {
          id: (role as any).id,
          name: role.name,
          description: role.description || '',
          isSystemRole: role.isSystemRole,
          isActive: role.isActive,
          userCount,
          moduleCount,
          permissionCount,
          createdAt: (role as any).createdAt,
          updatedAt: (role as any).updatedAt,
        }
      })
    )

    return rolesWithStats
  }

  async findRoleById(id: string, includePermissions: boolean = false): Promise<Role> {
    const queryBuilder = this._roleRepository.createQueryBuilder('role')

    // Vérifier si id est un UUID ou un nom
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)

    if (isUuid) {
      queryBuilder.where('role.id = :id', { id })
    } else {
      // Chercher par nom si ce n'est pas un UUID
      queryBuilder.where('role.name = :name', { name: id })
    }

    if (includePermissions) {
      queryBuilder
        .leftJoinAndSelect('role.permissions', 'permissions')
        .leftJoinAndSelect('permissions.permission', 'permission')
    }

    const role = await queryBuilder.getOne()

    if (!role) {
      throw new NotFoundException(`Rôle avec l'ID/nom ${id} non trouvé`)
    }

    return role
  }

  async createRole(createRoleDto: CreateRoleDto, createdBy: string): Promise<Role> {
    // Vérifier l'unicité du nom
    const existingRole = await this._roleRepository.findOne({
      where: { name: createRoleDto.name },
    })

    if (existingRole) {
      throw new ConflictException(`Un rôle avec le nom "${createRoleDto.name}" existe déjà`)
    }

    // Créer le rôle
    const role = Role.createCustomRole(createRoleDto.name, createRoleDto.description)

    if (createRoleDto.isActive !== undefined) {
      role.isActive = createRoleDto.isActive
    }

    const savedRole = await this._roleRepository.save(role)

    // Ajouter les permissions si spécifiées
    if (createRoleDto.permissions && createRoleDto.permissions.length > 0) {
      await this.updateRolePermissions((savedRole as any).id, createRoleDto.permissions, createdBy)
    }

    return savedRole
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleDto, _updatedBy: string): Promise<Role> {
    const role = await this.findRoleById(id)

    if (role.isSystemRole) {
      throw new ForbiddenException('Impossible de modifier un rôle système')
    }

    // Vérifier l'unicité du nom si modifié
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this._roleRepository.findOne({
        where: { name: updateRoleDto.name },
      })

      if (existingRole) {
        throw new ConflictException(`Un rôle avec le nom "${updateRoleDto.name}" existe déjà`)
      }
    }

    // Mettre à jour
    Object.assign(role, updateRoleDto)

    return await this._roleRepository.save(role)
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.findRoleById(id)

    if (role.isSystemRole) {
      throw new ForbiddenException('Impossible de supprimer un rôle système')
    }

    // Vérifier s'il y a des utilisateurs assignés
    const userCount = await this._userRoleRepository.count({
      where: { roleId: id },
    })

    if (userCount > 0) {
      throw new ForbiddenException(
        `Impossible de supprimer le rôle "${role.name}" car il est assigné à ${userCount} utilisateur(s)`
      )
    }

    // Supprimer les permissions du rôle
    await this._rolePermissionRepository.delete({ roleId: id })

    // Supprimer le rôle
    await this._roleRepository.delete(id)
  }

  // ===== GESTION DES PERMISSIONS =====

  async getRolePermissions(roleId: string): Promise<{
    roleId: string
    modules: any[]
    rolePermissions: RolePermission[]
  }> {
    const role = await this.findRoleById(roleId)

    // Modules table doesn't exist in auth DB
    const modules: any[] = []

    // Récupérer les permissions actuelles du rôle - utiliser l'ID réel du rôle trouvé
    const rolePermissions = await this._rolePermissionRepository.find({
      where: { roleId: (role as any).id },
      relations: ['permission'],
    })

    return {
      roleId: (role as any).id,
      modules,
      rolePermissions,
    }
  }

  async updateRolePermissions(
    roleId: string,
    permissions: {
      permissionId: string
    }[],
    _updatedBy: string
  ): Promise<void> {
    const role = await this.findRoleById(roleId)

    // Supprimer les permissions existantes - utiliser l'ID réel du rôle
    await this._rolePermissionRepository.delete({ roleId: (role as any).id })

    // Ajouter les nouvelles permissions - utiliser l'ID réel du rôle
    const rolePermissions = permissions.map((p) =>
      RolePermission.create((role as any).id, p.permissionId)
    )

    await this._rolePermissionRepository.save(rolePermissions)
  }

  // ===== GESTION DES UTILISATEURS =====

  async assignUserToRole(
    userId: string,
    roleId: string,
    _assignedBy: string,
    _expiresAt?: Date
  ): Promise<UserRole> {
    const role = await this.findRoleById(roleId)

    // Vérifier s'il n'y a pas déjà une assignation active - utiliser l'ID réel du rôle
    const existingUserRole = await this._userRoleRepository.findOne({
      where: { userId, roleId: (role as any).id },
    })

    if (existingUserRole) {
      throw new ConflictException("L'utilisateur a déjà ce rôle")
    }

    const userRole = UserRole.assign(userId, (role as any).id)
    return await this._userRoleRepository.save(userRole)
  }

  async removeUserFromRole(userId: string, roleId: string): Promise<void> {
    const role = await this.findRoleById(roleId)

    const userRole = await this._userRoleRepository.findOne({
      where: { userId, roleId: (role as any).id },
    })

    if (!userRole) {
      throw new NotFoundException('Assignation de rôle non trouvée')
    }

    await this._userRoleRepository.delete(userRole.id)
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const userRoles = await this._userRoleRepository.find({
      where: { userId },
      relations: ['role'],
    })

    return userRoles.map((ur) => ur.role)
  }

  async getUserPermissions(userId: string): Promise<RolePermission[]> {
    const userRoles = await this.getUserRoles(userId)
    const roleIds = userRoles.map((role) => (role as any).id)

    if (roleIds.length === 0) {
      return []
    }

    return await this._rolePermissionRepository.find({
      where: { roleId: roleIds[0] }, // Simplification: prendre le premier rôle
      relations: ['permission'],
    })
  }

  // ===== MÉTHODES UTILITAIRES =====

  async initializeSystemRoles(): Promise<void> {
    // Cette méthode peut être appelée au démarrage pour s'assurer que les rôles système existent
    const systemRoles = [
      { name: 'SUPER_ADMIN', description: 'Super Administrateur - Accès complet' },
      { name: 'ADMIN', description: 'Administrateur - Accès administratif' },
      { name: 'MANAGER', description: 'Manager - Accès business complet' },
      { name: 'COMMERCIAL', description: 'Commercial - Clients et facturation' },
      { name: 'TECHNICIEN', description: 'Technicien - Production et stocks' },
      { name: 'OPERATEUR', description: 'Opérateur - Lecture seule production' },
    ]

    for (const roleData of systemRoles) {
      const existingRole = await this._roleRepository.findOne({
        where: { name: roleData.name },
      })

      if (!existingRole) {
        const role = Role.createSystemRole(roleData.name, roleData.description)
        await this._roleRepository.save(role)
      }
    }
  }
}
