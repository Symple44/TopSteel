// API calls pour RBAC - Interface avec le backend
import { callClientApi } from '../../utils/backend-api'
import type { AuditLog, Permission, Role, UserSocieteRole } from './rbac-types'

/**
 * Service API pour les fonctionnalités RBAC
 */
export class RBACApi {
  /**
   * Récupère les permissions effectives d'un utilisateur pour une société
   */
  static async getUserEffectivePermissions(
    userId: string,
    societeId: string
  ): Promise<Permission[]> {
    try {
      const response = await callClientApi(`users/${userId}/permissions/${societeId}`, {
        method: 'GET',
      })

      if (!response?.ok) {
        throw new Error('Failed to fetch user permissions')
      }

      const data = await response?.json()
      return data?.data ?? []
    } catch (_error) {
      return []
    }
  }

  /**
   * Récupère tous les rôles disponibles
   */
  static async getAllRoles(): Promise<Role[]> {
    try {
      const response = await callClientApi('admin/roles?includePermissions=true', {
        method: 'GET',
      })

      if (!response?.ok) {
        throw new Error('Failed to fetch roles')
      }

      const data = await response?.json()
      return data?.data ?? []
    } catch (_error) {
      return []
    }
  }

  /**
   * Récupère toutes les permissions disponibles
   */
  static async getAllPermissions(): Promise<Permission[]> {
    try {
      const response = await callClientApi('admin/permissions', {
        method: 'GET',
      })

      if (!response?.ok) {
        throw new Error('Failed to fetch permissions')
      }

      const data = await response?.json()
      return data?.data ?? []
    } catch (_error) {
      return []
    }
  }

  /**
   * Récupère les rôles d'un utilisateur par société
   */
  static async getUserSocieteRoles(userId: string): Promise<UserSocieteRole[]> {
    try {
      const response = await callClientApi(`users/${userId}/companies`, {
        method: 'GET',
      })

      if (!response?.ok) {
        throw new Error('Failed to fetch user societe roles')
      }

      const data = await response?.json()
      return data?.data ?? []
    } catch (_error) {
      return []
    }
  }

  /**
   * Met à jour le rôle d'un utilisateur pour une société
   */
  static async updateUserSocieteRole(
    userId: string,
    societeId: string,
    roleData: Partial<UserSocieteRole>
  ): Promise<UserSocieteRole> {
    const response = await callClientApi(`societes/${societeId}/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleData),
    })

    if (!response?.ok) {
      const errorData = await response?.json().catch(() => ({}))
      throw new Error(errorData?.message || 'Failed to update user role')
    }

    const data = await response?.json()
    return data?.data
  }

  /**
   * Ajoute un utilisateur à une société avec un rôle
   */
  static async addUserToSociete(
    userId: string,
    societeId: string,
    roleType: string,
    additionalData?: Partial<UserSocieteRole>
  ): Promise<UserSocieteRole> {
    const response = await callClientApi(`societes/${societeId}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        roleType,
        ...additionalData,
      }),
    })

    if (!response?.ok) {
      const errorData = await response?.json().catch(() => ({}))
      throw new Error(errorData?.message || 'Failed to add user to societe')
    }

    const data = await response?.json()
    return data?.data
  }

  /**
   * Retire un utilisateur d'une société
   */
  static async removeUserFromSociete(userId: string, societeId: string): Promise<void> {
    const response = await callClientApi(`societes/${societeId}/users/${userId}`, {
      method: 'DELETE',
    })

    if (!response?.ok) {
      const errorData = await response?.json().catch(() => ({}))
      throw new Error(errorData?.message || 'Failed to remove user from societe')
    }
  }

  /**
   * Créé un nouveau rôle
   */
  static async createRole(roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
    const response = await callClientApi('admin/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleData),
    })

    if (!response?.ok) {
      const errorData = await response?.json().catch(() => ({}))
      throw new Error(errorData?.message || 'Failed to create role')
    }

    const data = await response?.json()
    return data?.data
  }

  /**
   * Met à jour un rôle existant
   */
  static async updateRole(roleId: string, roleData: Partial<Role>): Promise<Role> {
    const response = await callClientApi(`admin/roles/${roleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleData),
    })

    if (!response?.ok) {
      const errorData = await response?.json().catch(() => ({}))
      throw new Error(errorData?.message || 'Failed to update role')
    }

    const data = await response?.json()
    return data?.data
  }

  /**
   * Supprime un rôle
   */
  static async deleteRole(roleId: string): Promise<void> {
    const response = await callClientApi(`admin/roles/${roleId}`, {
      method: 'DELETE',
    })

    if (!response?.ok) {
      const errorData = await response?.json().catch(() => ({}))
      throw new Error(errorData?.message || 'Failed to delete role')
    }
  }

  /**
   * Assigne des permissions à un rôle
   */
  static async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<void> {
    const response = await callClientApi(`admin/roles/${roleId}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissionIds }),
    })

    if (!response?.ok) {
      const errorData = await response?.json().catch(() => ({}))
      throw new Error(errorData?.message || 'Failed to assign permissions')
    }
  }

  /**
   * Retire des permissions d'un rôle
   */
  static async removePermissionsFromRole(roleId: string, permissionIds: string[]): Promise<void> {
    const response = await callClientApi(`admin/roles/${roleId}/permissions`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissionIds }),
    })

    if (!response?.ok) {
      const errorData = await response?.json().catch(() => ({}))
      throw new Error(errorData?.message || 'Failed to remove permissions')
    }
  }

  /**
   * Valide l'accès d'un utilisateur à une ressource
   */
  static async validateAccess(
    userId: string,
    societeId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    try {
      const response = await callClientApi('auth/validate-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          societeId,
          resource,
          action,
        }),
      })

      if (!response?.ok) {
        return false
      }

      const data = await response?.json()
      return data?.hasAccess === true
    } catch (_error) {
      return false
    }
  }

  /**
   * Récupère l'audit trail pour un utilisateur/société
   */
  static async getAuditLogs(
    userId?: string,
    societeId?: string,
    limit = 50,
    offset = 0
  ): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      const params = new URLSearchParams({
        limit: limit?.toString(),
        offset: offset?.toString(),
      })

      if (userId) params?.append('userId', userId)
      if (societeId) params?.append('societeId', societeId)

      const response = await callClientApi(`admin/audit-logs?${params}`, {
        method: 'GET',
      })

      if (!response?.ok) {
        throw new Error('Failed to fetch audit logs')
      }

      const data = await response?.json()
      return {
        logs: data?.data ?? [],
        total: data.meta?.total ?? 0,
      }
    } catch (_error) {
      return { logs: [], total: 0 }
    }
  }

  /**
   * Enregistre un événement d'audit
   */
  static async logAuditEvent(auditData: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const response = await callClientApi('admin/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...auditData,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response?.ok) {
      }
    } catch (_error) {}
  }

  /**
   * Récupère les sessions actives d'un utilisateur
   */
  static async getUserActiveSessions(userId: string): Promise<any[]> {
    try {
      const response = await callClientApi(`users/${userId}/sessions`, {
        method: 'GET',
      })

      if (!response?.ok) {
        throw new Error('Failed to fetch user sessions')
      }

      const data = await response?.json()
      return data?.data ?? []
    } catch (_error) {
      return []
    }
  }

  /**
   * Invalide une session spécifique
   */
  static async invalidateSession(sessionId: string): Promise<void> {
    const response = await callClientApi(`admin/sessions/${sessionId}/invalidate`, {
      method: 'POST',
    })

    if (!response?.ok) {
      const errorData = await response?.json().catch(() => ({}))
      throw new Error(errorData?.message || 'Failed to invalidate session')
    }
  }

  /**
   * Invalide toutes les sessions d'un utilisateur
   */
  static async invalidateAllUserSessions(userId: string): Promise<void> {
    const response = await callClientApi(`admin/users/${userId}/sessions/invalidate`, {
      method: 'POST',
    })

    if (!response?.ok) {
      const errorData = await response?.json().catch(() => ({}))
      throw new Error(errorData?.message || 'Failed to invalidate user sessions')
    }
  }
}
