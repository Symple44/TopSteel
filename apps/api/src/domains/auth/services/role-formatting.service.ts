import { Injectable } from '@nestjs/common'
import {
  GLOBAL_ROLE_DESCRIPTIONS,
  GLOBAL_ROLE_HIERARCHY,
  GlobalUserRole,
  getEffectiveSocieteRole,
  SOCIETE_ROLE_DESCRIPTIONS,
  SOCIETE_ROLE_HIERARCHY,
  SocieteRoleType,
} from '../core/constants/roles.constants'

export interface FormattedRole {
  id: string
  name: string
  displayName: string
  description: string
  type: 'global' | 'societe'
  hierarchy: number
  color: string
  icon: string
  isSystemRole?: boolean
}

export interface FormattedUserRole {
  userId: string
  email: string
  globalRole: FormattedRole
  societeRoles: Array<{
    societeId: string
    societeName: string
    role: FormattedRole
    effectiveRole: FormattedRole
    isDefault: boolean
    isActive: boolean
    grantedAt: string
    expiresAt?: string
  }>
}

@Injectable()
export class RoleFormattingService {
  /**
   * Formate un rôle global pour l'affichage
   */
  formatGlobalRole(role: GlobalUserRole): FormattedRole {
    return {
      id: role,
      name: role,
      displayName: this.getGlobalRoleDisplayName(role),
      description: GLOBAL_ROLE_DESCRIPTIONS[role],
      type: 'global',
      hierarchy: GLOBAL_ROLE_HIERARCHY[role],
      color: this.getGlobalRoleColor(role),
      icon: this.getGlobalRoleIcon(role),
      isSystemRole: [GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN].includes(role),
    }
  }

  /**
   * Formate un rôle société pour l'affichage
   */
  formatSocieteRole(role: SocieteRoleType): FormattedRole {
    return {
      id: role,
      name: role,
      displayName: this.getSocieteRoleDisplayName(role),
      description: SOCIETE_ROLE_DESCRIPTIONS[role],
      type: 'societe',
      hierarchy: SOCIETE_ROLE_HIERARCHY[role],
      color: this.getSocieteRoleColor(role),
      icon: this.getSocieteRoleIcon(role),
      isSystemRole: [SocieteRoleType.OWNER, SocieteRoleType.ADMIN].includes(role),
    }
  }

  /**
   * Formate tous les rôles globaux disponibles
   */
  getAllFormattedGlobalRoles(): FormattedRole[] {
    return Object.values(GlobalUserRole)
      .map((role) => this.formatGlobalRole(role))
      .sort((a, b) => b.hierarchy - a.hierarchy) // Trier par hiérarchie décroissante
  }

  /**
   * Formate tous les rôles société disponibles
   */
  getAllFormattedSocieteRoles(): FormattedRole[] {
    return Object.values(SocieteRoleType)
      .map((role) => this.formatSocieteRole(role))
      .sort((a, b) => b.hierarchy - a.hierarchy) // Trier par hiérarchie décroissante
  }

  /**
   * Obtient le nom d'affichage pour un rôle global
   */
  private getGlobalRoleDisplayName(role: GlobalUserRole): string {
    const displayNames: Record<GlobalUserRole, string> = {
      [GlobalUserRole.SUPER_ADMIN]: 'Super Administrateur',
      [GlobalUserRole.ADMIN]: 'Administrateur',
      [GlobalUserRole.MANAGER]: 'Gestionnaire',
      [GlobalUserRole.COMMERCIAL]: 'Commercial',
      [GlobalUserRole.COMPTABLE]: 'Comptable',
      [GlobalUserRole.TECHNICIEN]: 'Technicien',
      [GlobalUserRole.OPERATEUR]: 'Opérateur',
      [GlobalUserRole.USER]: 'Utilisateur',
      [GlobalUserRole.VIEWER]: 'Observateur',
    }
    return displayNames[role]
  }

  /**
   * Obtient le nom d'affichage pour un rôle société
   */
  private getSocieteRoleDisplayName(role: SocieteRoleType): string {
    const displayNames: Record<SocieteRoleType, string> = {
      [SocieteRoleType.OWNER]: 'Propriétaire',
      [SocieteRoleType.ADMIN]: 'Administrateur',
      [SocieteRoleType.MANAGER]: 'Gestionnaire',
      [SocieteRoleType.COMMERCIAL]: 'Commercial',
      [SocieteRoleType.COMPTABLE]: 'Comptable',
      [SocieteRoleType.TECHNICIEN]: 'Technicien',
      [SocieteRoleType.OPERATEUR]: 'Opérateur',
      [SocieteRoleType.USER]: 'Utilisateur',
      [SocieteRoleType.GUEST]: 'Invité',
      [SocieteRoleType.VIEWER]: 'Observateur',
    }
    return displayNames[role]
  }

  /**
   * Obtient la couleur associée à un rôle global
   */
  private getGlobalRoleColor(role: GlobalUserRole): string {
    const colors: Record<GlobalUserRole, string> = {
      [GlobalUserRole.SUPER_ADMIN]: '#e74c3c', // Rouge
      [GlobalUserRole.ADMIN]: '#e67e22', // Orange
      [GlobalUserRole.MANAGER]: '#9b59b6', // Violet
      [GlobalUserRole.COMMERCIAL]: '#3498db', // Bleu
      [GlobalUserRole.COMPTABLE]: '#1abc9c', // Turquoise
      [GlobalUserRole.TECHNICIEN]: '#f39c12', // Jaune/Orange
      [GlobalUserRole.OPERATEUR]: '#2ecc71', // Vert
      [GlobalUserRole.USER]: '#95a5a6', // Gris
      [GlobalUserRole.VIEWER]: '#bdc3c7', // Gris clair
    }
    return colors[role]
  }

  /**
   * Obtient la couleur associée à un rôle société
   */
  private getSocieteRoleColor(role: SocieteRoleType): string {
    const colors: Record<SocieteRoleType, string> = {
      [SocieteRoleType.OWNER]: '#8e44ad', // Violet foncé
      [SocieteRoleType.ADMIN]: '#e67e22', // Orange
      [SocieteRoleType.MANAGER]: '#9b59b6', // Violet
      [SocieteRoleType.COMMERCIAL]: '#3498db', // Bleu
      [SocieteRoleType.COMPTABLE]: '#1abc9c', // Turquoise
      [SocieteRoleType.TECHNICIEN]: '#f39c12', // Jaune/Orange
      [SocieteRoleType.OPERATEUR]: '#2ecc71', // Vert
      [SocieteRoleType.USER]: '#95a5a6', // Gris
      [SocieteRoleType.GUEST]: '#ecf0f1', // Gris très clair
      [SocieteRoleType.VIEWER]: '#bdc3c7', // Gris clair
    }
    return colors[role]
  }

  /**
   * Obtient l'icône associée à un rôle global
   */
  private getGlobalRoleIcon(role: GlobalUserRole): string {
    const icons: Record<GlobalUserRole, string> = {
      [GlobalUserRole.SUPER_ADMIN]: '👑',
      [GlobalUserRole.ADMIN]: '🛡️',
      [GlobalUserRole.MANAGER]: '📊',
      [GlobalUserRole.COMMERCIAL]: '💼',
      [GlobalUserRole.COMPTABLE]: '💰',
      [GlobalUserRole.TECHNICIEN]: '🔧',
      [GlobalUserRole.OPERATEUR]: '⚙️',
      [GlobalUserRole.USER]: '👤',
      [GlobalUserRole.VIEWER]: '👁️',
    }
    return icons[role]
  }

  /**
   * Obtient l'icône associée à un rôle société
   */
  private getSocieteRoleIcon(role: SocieteRoleType): string {
    const icons: Record<SocieteRoleType, string> = {
      [SocieteRoleType.OWNER]: '🏢',
      [SocieteRoleType.ADMIN]: '🛡️',
      [SocieteRoleType.MANAGER]: '📊',
      [SocieteRoleType.COMMERCIAL]: '💼',
      [SocieteRoleType.COMPTABLE]: '💰',
      [SocieteRoleType.TECHNICIEN]: '🔧',
      [SocieteRoleType.OPERATEUR]: '⚙️',
      [SocieteRoleType.USER]: '👤',
      [SocieteRoleType.GUEST]: '🚪',
      [SocieteRoleType.VIEWER]: '👁️',
    }
    return icons[role]
  }

  /**
   * Formate les informations complètes d'un utilisateur avec ses rôles
   */
  formatUserWithRoles(user: any, userSocieteRoles: any[] = []): FormattedUserRole {
    const globalRole = this.formatGlobalRole(user.role as GlobalUserRole)

    const societeRoles = userSocieteRoles.map((usr) => {
      const societeRole = this.formatSocieteRole(usr.roleType as SocieteRoleType)
      const effectiveRole = this.formatSocieteRole(
        getEffectiveSocieteRole(user.role as GlobalUserRole, usr.roleType as SocieteRoleType)
      )

      return {
        societeId: usr.societeId,
        societeName: usr.societe?.nom || 'Société inconnue',
        role: societeRole,
        effectiveRole,
        isDefault: usr.isDefaultSociete || false,
        isActive: usr.isActive || false,
        grantedAt: usr.grantedAt || usr.createdAt,
        expiresAt: usr.expiresAt,
      }
    })

    return {
      userId: user.id,
      email: user.email,
      globalRole,
      societeRoles,
    }
  }

  /**
   * Génère une représentation textuelle d'un rôle pour les logs
   */
  roleToString(role: FormattedRole): string {
    return `${role.icon} ${role.displayName} (${role.name})`
  }

  /**
   * Génère un badge HTML pour un rôle
   */
  generateRoleBadge(role: FormattedRole): string {
    return `<span class="role-badge" style="background-color: ${role.color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
      ${role.icon} ${role.displayName}
    </span>`
  }

  /**
   * Obtient le CSS pour les badges de rôles
   */
  getRoleBadgeCSS(): string {
    return `
      .role-badge {
        display: inline-block;
        background-color: var(--role-color);
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        margin: 2px;
        white-space: nowrap;
      }
      
      .role-badge.system {
        border: 2px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .role-badge.expired {
        opacity: 0.6;
        text-decoration: line-through;
      }
      
      .role-hierarchy-indicator {
        font-size: 10px;
        opacity: 0.8;
        margin-left: 4px;
      }
    `
  }
}
