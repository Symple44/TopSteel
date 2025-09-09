// Adaptateur pour faire le pont entre l'existant et la nouvelle architecture RBAC
import type {
  AuthTokens as ExistingAuthTokens,
  Company as ExistingCompany,
  MFAState as ExistingMFAState,
  User as ExistingUser,
} from '@/types/auth'
import type { MFAState as AuthMFAState, AuthTokens, User } from './auth-types'
import type { Company, ExtendedUser, Permission, UserSocieteRole } from './rbac-types'

interface UserSocieteRoleInput {
  id?: string
  societeId?: string
  roleId?: string
  roleType?: string
}

/**
 * Adaptateur pour convertir les types existants vers les nouveaux types RBAC
 */
export class AuthAdapter {
  /**
   * Convertit un User existant vers ExtendedUser
   */
  static toExtendedUser(
    existingUser: ExistingUser,
    userSocieteRoles: UserSocieteRoleInput[] = []
  ): ExtendedUser {
    // Convertir le rôle simple en UserSocieteRole
    const convertedRoles: UserSocieteRole[] = userSocieteRoles?.map((usr) => ({
      id: usr.id || `${existingUser.id}-${usr.societeId || 'default'}`,
      userId: existingUser.id,
      societeId: usr.societeId || (existingUser as unknown).societeId || '',
      roleId: usr.roleId || `role-${(usr as unknown).roleType || existingUser.role}`,
      role: {
        id: usr.roleId || `role-${(usr as unknown).roleType || existingUser.role}`,
        code: ((usr as unknown).roleType || existingUser.role || 'USER').toUpperCase(),
        name: AuthAdapter?.getRoleDisplayName(
          (usr as unknown).roleType || existingUser.role || 'user'
        ),
        description: `Rôle ${(usr as unknown).roleType || existingUser.role}`,
        level: AuthAdapter?.getRoleLevel((usr as unknown).roleType || existingUser.role || 'user'),
        permissions: AuthAdapter?.convertPermissionsFromStrings(existingUser.permissions || []),
        isSystemRole: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isDefault: (usr as unknown).isDefaultSociete || true,
      isActive: (usr as unknown).isActive !== false,
      additionalPermissions: (usr as unknown).additionalPermissions || [],
      deniedPermissions: (usr as unknown).restrictedPermissions || [],
      validFrom: (usr as unknown).grantedAt,
      validTo: (usr as unknown).expiresAt,
      createdAt: (usr as unknown).createdAt || new Date().toISOString(),
      updatedAt: (usr as unknown).updatedAt || new Date().toISOString(),
    }))

    // Si pas de rôles société, créer un rôle par défaut basé sur le rôle global
    if (convertedRoles.length === 0) {
      // Utiliser le rôle global de l'utilisateur
      const globalRole = existingUser.role || 'USER'
      convertedRoles?.push({
        id: `${existingUser.id}-default`,
        userId: existingUser.id,
        societeId: (existingUser as unknown).societeId || 'default',
        roleId: `role-${globalRole}`,
        role: {
          id: `role-${globalRole}`,
          code: globalRole.toUpperCase(),
          name: AuthAdapter?.getRoleDisplayName(globalRole),
          description: `Rôle ${globalRole}`,
          level: AuthAdapter?.getRoleLevel(globalRole),
          permissions: AuthAdapter?.convertPermissionsFromStrings(existingUser.permissions || []),
          isSystemRole: true,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        isDefault: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    return {
      id: existingUser.id,
      email: existingUser.email,
      firstName: existingUser.prenom || '',
      lastName: existingUser.nom || '',
      isActive: existingUser.isActive,
      defaultRoleId: `role-${existingUser.role}`,
      defaultRole: convertedRoles[0]?.role,
      societeRoles: convertedRoles,
      effectivePermissions: AuthAdapter?.convertPermissionsFromStrings(
        existingUser.permissions || []
      ),
      mfaSettings: {
        enabled: false,
        methods: [],
        backupCodes: 0,
        mandatory: false,
      },
      createdAt: existingUser.createdAt || new Date().toISOString(),
      updatedAt: existingUser.updatedAt || new Date().toISOString(),
    }
  }

  /**
   * Convertit une Company existante vers la nouvelle structure
   */
  static toNewCompany(existingCompany: ExistingCompany): Company {
    return {
      id: existingCompany.id,
      nom: existingCompany.nom,
      name: existingCompany.nom,
      code: existingCompany.code,
      status: existingCompany.status || 'active',
      plan: existingCompany.plan || 'standard',
      isActive: existingCompany.status === 'active',
    }
  }

  /**
   * Convertit les AuthTokens existants
   */
  static toNewAuthTokens(existingTokens: ExistingAuthTokens): AuthTokens {
    return {
      accessToken: existingTokens.accessToken,
      refreshToken: existingTokens.refreshToken,
      expiresAt: existingTokens.expiresIn
        ? Date.now() + existingTokens.expiresIn * 1000
        : Date.now() + 60 * 60 * 1000, // 1 heure par défaut
    }
  }

  /**
   * Convertit MFAState existant
   */
  static toNewMFAState(existingMFA: ExistingMFAState): AuthMFAState {
    const result: AuthMFAState = {
      required: existingMFA.required,
      userId: existingMFA.userId,
      email: existingMFA.email,
      availableMethods: existingMFA.availableMethods,
      sessionToken: existingMFA.sessionToken,
    }

    // Ajouter les propriétés optionnelles seulement si elles existent sur le type
    if ('methods' in existingMFA && existingMFA.methods) {
      ;(result as unknown).methods = existingMFA.methods
    }
    if ('backupCodes' in existingMFA && existingMFA.backupCodes !== undefined) {
      ;(result as unknown).backupCodes = existingMFA.backupCodes
    }

    return result
  }

  /**
   * Convertit des permissions string[] vers Permission[]
   */
  static convertPermissionsFromStrings(permissionStrings: string[]): Permission[] {
    return (permissionStrings || []).map((permString) => {
      const [module, action] = (permString || '').toLowerCase().split('_')
      const validActions = ['create', 'read', 'update', 'delete', 'execute'] as const
      const permissionAction = validActions.includes(action as unknown)
        ? (action as unknown)
        : 'read'

      return {
        id: `perm-${permString}`,
        code: (permString || '').toUpperCase(),
        module: module || 'general',
        action: permissionAction,
        description: `Permission ${permString}`,
        resource: undefined,
      }
    })
  }

  /**
   * Convertit vers l'ancien format pour compatibilité API
   */
  static toExistingUser(extendedUser: ExtendedUser): ExistingUser {
    const primaryRole =
      extendedUser?.societeRoles?.find((r) => r.isDefault) || extendedUser.societeRoles?.[0]
    const primarySociete = primaryRole?.societeId

    return {
      id: extendedUser.id,
      nom: extendedUser.lastName || extendedUser.firstName,
      prenom: extendedUser.firstName,
      email: extendedUser.email,
      role: primaryRole?.role.code || 'USER',
      permissions: extendedUser.effectivePermissions?.map((p) => p.code) || [],
      societeId: primarySociete,
      societeCode: undefined, // À récupérer depuis les données société
      societeName: undefined, // À récupérer depuis les données société
      isActive: extendedUser.isActive,
      createdAt: extendedUser.createdAt,
      updatedAt: extendedUser.updatedAt,
      firstName: extendedUser.firstName,
      lastName: extendedUser.lastName,
    }
  }

  /**
   * Convertit ExtendedUser vers User (auth-types.ts) avec propriétés requises
   */
  static toAuthUser(extendedUser: ExtendedUser): User {
    const primaryRole =
      extendedUser?.societeRoles?.find((r) => r.isDefault) || extendedUser.societeRoles?.[0]

    return {
      id: extendedUser.id,
      nom: extendedUser.lastName || extendedUser.firstName,
      prenom: extendedUser.firstName,
      email: extendedUser.email,
      role: primaryRole?.role.code || 'USER',
      permissions: extendedUser.effectivePermissions?.map((p) => p.code) || [],
      isActive: extendedUser.isActive,
      createdAt: extendedUser.createdAt,
      updatedAt: extendedUser.updatedAt,
      firstName: extendedUser.firstName,
      lastName: extendedUser.lastName,
    }
  }

  /**
   * Convertit vers l'ancien format Company
   */
  static toExistingCompany(company: Company): ExistingCompany {
    return {
      id: company.id,
      nom: company.name,
      code: company.code,
      status: company.isActive ? 'active' : 'inactive',
      plan: 'standard', // Valeur par défaut
    }
  }

  /**
   * Convertit vers l'ancien format AuthTokens
   */
  static toExistingAuthTokens(tokens: AuthTokens): ExistingAuthTokens {
    const expiresAtTime = tokens.expiresAt || Date.now() + 3600 * 1000 // 1 heure par défaut

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: expiresAtTime,
      expiresIn: Math.floor((expiresAtTime - Date.now()) / 1000),
      tokenType: 'Bearer',
    }
  }

  /**
   * Utilitaires privés
   */
  private static getRoleLevel(role: string): number {
    const roleLevels: Record<string, number> = {
      super_admin: 1,
      admin: 2,
      manager: 3,
      user: 4,
      viewer: 5,
    }
    return roleLevels[role?.toLowerCase()] || 4
  }

  private static getRoleDisplayName(role: string): string {
    const displayNames: Record<string, string> = {
      super_admin: 'Super Administrateur',
      admin: 'Administrateur',
      manager: 'Gestionnaire',
      user: 'Utilisateur',
      viewer: 'Lecteur',
    }
    return displayNames[role?.toLowerCase()] || role
  }

  /**
   * Récupère les permissions effectives selon la nouvelle structure BDD
   */
  static async getEffectivePermissionsFromDB(
    _userId: string,
    _societeId: string
  ): Promise<Permission[]> {
    // Cette méthode devra appeler l'API pour récupérer les permissions
    // depuis la structure BDD existante
    try {
      // Appel API pour récupérer les permissions effectives
      // const response = await fetch(`/api/users/${userId}/permissions/${societeId}`)
      // const data = await response?.json()

      // Pour l'instant, retourner un tableau vide
      // Cette méthode sera implémentée avec l'API
      return []
    } catch (_error) {
      return []
    }
  }

  /**
   * Valide la cohérence entre ancien et nouveau système
   */
  static validateUserData(existingUser: ExistingUser, extendedUser: ExtendedUser): string[] {
    const errors: string[] = []

    if (existingUser.id !== extendedUser.id) {
      errors?.push('User ID mismatch')
    }

    if (existingUser.email !== extendedUser.email) {
      errors?.push('Email mismatch')
    }

    if (extendedUser?.societeRoles?.length === 0) {
      errors?.push('No societe roles found for user')
    }

    return errors
  }

  /**
   * Debug helper pour comparer les structures
   */
  static debugComparison(_existingUser: ExistingUser, _extendedUser: ExtendedUser): void {}
}
