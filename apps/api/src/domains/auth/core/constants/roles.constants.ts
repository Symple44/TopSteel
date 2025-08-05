/**
 * Constantes et énumérations unifiées pour le système de rôles
 */

// ===== RÔLES GLOBAUX =====

/**
 * Rôles globaux de l'utilisateur (niveau système)
 */
export enum GlobalUserRole {
  SUPER_ADMIN = 'SUPER_ADMIN', // Accès complet à tout le système
  ADMIN = 'ADMIN', // Administration système
  MANAGER = 'MANAGER', // Gestion multi-sociétés
  COMMERCIAL = 'COMMERCIAL', // Commercial multi-sociétés
  TECHNICIEN = 'TECHNICIEN', // Technicien multi-sociétés
  COMPTABLE = 'COMPTABLE', // Comptable multi-sociétés
  OPERATEUR = 'OPERATEUR', // Opérateur multi-sociétés
  USER = 'USER', // Utilisateur standard
  VIEWER = 'VIEWER', // Consultation seule
}

// ===== RÔLES SOCIÉTÉ =====

/**
 * Types de rôles au niveau société
 */
export enum SocieteRoleType {
  OWNER = 'OWNER', // Propriétaire de la société
  ADMIN = 'ADMIN', // Administrateur société
  MANAGER = 'MANAGER', // Manager/Responsable
  COMMERCIAL = 'COMMERCIAL', // Commercial société
  TECHNICIEN = 'TECHNICIEN', // Technicien société
  COMPTABLE = 'COMPTABLE', // Comptable société
  OPERATEUR = 'OPERATEUR', // Opérateur société
  USER = 'USER', // Utilisateur standard
  VIEWER = 'VIEWER', // Lecture seule
  GUEST = 'GUEST', // Invité temporaire
}

// ===== HIÉRARCHIE DES RÔLES =====

/**
 * Hiérarchie des rôles globaux (du plus élevé au plus bas)
 */
export const GLOBAL_ROLE_HIERARCHY: Record<GlobalUserRole, number> = {
  [GlobalUserRole.SUPER_ADMIN]: 100,
  [GlobalUserRole.ADMIN]: 90,
  [GlobalUserRole.MANAGER]: 80,
  [GlobalUserRole.COMMERCIAL]: 70,
  [GlobalUserRole.COMPTABLE]: 60,
  [GlobalUserRole.TECHNICIEN]: 50,
  [GlobalUserRole.OPERATEUR]: 40,
  [GlobalUserRole.USER]: 30,
  [GlobalUserRole.VIEWER]: 10,
}

/**
 * Hiérarchie des rôles société (du plus élevé au plus bas)
 */
export const SOCIETE_ROLE_HIERARCHY: Record<SocieteRoleType, number> = {
  [SocieteRoleType.OWNER]: 100,
  [SocieteRoleType.ADMIN]: 90,
  [SocieteRoleType.MANAGER]: 80,
  [SocieteRoleType.COMMERCIAL]: 70,
  [SocieteRoleType.COMPTABLE]: 60,
  [SocieteRoleType.TECHNICIEN]: 50,
  [SocieteRoleType.OPERATEUR]: 40,
  [SocieteRoleType.USER]: 30,
  [SocieteRoleType.GUEST]: 20,
  [SocieteRoleType.VIEWER]: 10,
}

// ===== MAPPINGS ET CONVERSIONS =====

/**
 * Mapping entre rôles globaux et rôles société équivalents
 */
export const GLOBAL_TO_SOCIETE_ROLE_MAPPING: Record<GlobalUserRole, SocieteRoleType> = {
  [GlobalUserRole.SUPER_ADMIN]: SocieteRoleType.OWNER,
  [GlobalUserRole.ADMIN]: SocieteRoleType.ADMIN,
  [GlobalUserRole.MANAGER]: SocieteRoleType.MANAGER,
  [GlobalUserRole.COMMERCIAL]: SocieteRoleType.COMMERCIAL,
  [GlobalUserRole.COMPTABLE]: SocieteRoleType.COMPTABLE,
  [GlobalUserRole.TECHNICIEN]: SocieteRoleType.TECHNICIEN,
  [GlobalUserRole.OPERATEUR]: SocieteRoleType.OPERATEUR,
  [GlobalUserRole.USER]: SocieteRoleType.USER,
  [GlobalUserRole.VIEWER]: SocieteRoleType.VIEWER,
}

/**
 * Rôles qui donnent accès à l'administration système
 */
export const SYSTEM_ADMIN_ROLES: GlobalUserRole[] = [
  GlobalUserRole.SUPER_ADMIN,
  GlobalUserRole.ADMIN,
]

/**
 * Rôles qui donnent accès à l'administration d'une société
 */
export const SOCIETE_ADMIN_ROLES: SocieteRoleType[] = [SocieteRoleType.OWNER, SocieteRoleType.ADMIN]

/**
 * Rôles qui peuvent gérer d'autres utilisateurs
 */
export const USER_MANAGEMENT_ROLES: SocieteRoleType[] = [
  SocieteRoleType.OWNER,
  SocieteRoleType.ADMIN,
  SocieteRoleType.MANAGER,
]

/**
 * Rôles avec accès en lecture seule
 */
export const READ_ONLY_ROLES: SocieteRoleType[] = [SocieteRoleType.VIEWER, SocieteRoleType.GUEST]

// ===== FONCTIONS UTILITAIRES =====

/**
 * Vérifie si un rôle global a une priorité supérieure ou égale à un autre
 */
export function isGlobalRoleHigherOrEqual(roleA: GlobalUserRole, roleB: GlobalUserRole): boolean {
  return GLOBAL_ROLE_HIERARCHY[roleA] >= GLOBAL_ROLE_HIERARCHY[roleB]
}

/**
 * Vérifie si un rôle société a une priorité supérieure ou égale à un autre
 */
export function isSocieteRoleHigherOrEqual(
  roleA: SocieteRoleType,
  roleB: SocieteRoleType
): boolean {
  return SOCIETE_ROLE_HIERARCHY[roleA] >= SOCIETE_ROLE_HIERARCHY[roleB]
}

/**
 * Détermine le rôle effectif dans une société pour un utilisateur
 * Prend en compte le rôle global ET le rôle spécifique à la société
 */
export function getEffectiveSocieteRole(
  globalRole: GlobalUserRole,
  societeRole?: SocieteRoleType
): SocieteRoleType {
  // SUPER_ADMIN a toujours le rôle OWNER
  if (globalRole === GlobalUserRole.SUPER_ADMIN) {
    return SocieteRoleType.OWNER
  }

  // Si un rôle société spécifique est défini, utiliser le plus élevé
  if (societeRole) {
    const globalEquivalent = GLOBAL_TO_SOCIETE_ROLE_MAPPING[globalRole]
    return isSocieteRoleHigherOrEqual(societeRole, globalEquivalent)
      ? societeRole
      : globalEquivalent
  }

  // Sinon, utiliser le mapping par défaut
  return GLOBAL_TO_SOCIETE_ROLE_MAPPING[globalRole]
}

/**
 * Vérifie si un utilisateur peut effectuer une action sur un autre utilisateur
 */
export function canManageUser(
  managerGlobalRole: GlobalUserRole,
  managerSocieteRole: SocieteRoleType,
  targetGlobalRole: GlobalUserRole,
  targetSocieteRole: SocieteRoleType
): boolean {
  // SUPER_ADMIN peut tout faire
  if (managerGlobalRole === GlobalUserRole.SUPER_ADMIN) {
    return true
  }

  // Ne peut pas gérer un utilisateur avec un rôle global supérieur
  if (!isGlobalRoleHigherOrEqual(managerGlobalRole, targetGlobalRole)) {
    return false
  }

  // Dans la même société, doit avoir un rôle société supérieur
  if (!isSocieteRoleHigherOrEqual(managerSocieteRole, targetSocieteRole)) {
    return false
  }

  return true
}

/**
 * Retourne tous les rôles disponibles pour un niveau donné
 */
export function getAvailableRoles(level: 'global' | 'societe'): string[] {
  if (level === 'global') {
    return Object.values(GlobalUserRole)
  }
  return Object.values(SocieteRoleType)
}

/**
 * Valide qu'un rôle existe
 */
export function isValidGlobalRole(role: string): role is GlobalUserRole {
  return Object.values(GlobalUserRole).includes(role as GlobalUserRole)
}

/**
 * Valide qu'un rôle société existe
 */
export function isValidSocieteRole(role: string): role is SocieteRoleType {
  return Object.values(SocieteRoleType).includes(role as SocieteRoleType)
}

/**
 * Obtient la description d'un rôle global
 */
export const GLOBAL_ROLE_DESCRIPTIONS: Record<GlobalUserRole, string> = {
  [GlobalUserRole.SUPER_ADMIN]: 'Administrateur système avec accès complet',
  [GlobalUserRole.ADMIN]: 'Administrateur avec accès à la gestion système',
  [GlobalUserRole.MANAGER]: 'Gestionnaire avec accès multi-société',
  [GlobalUserRole.COMMERCIAL]: 'Commercial avec accès multi-société',
  [GlobalUserRole.COMPTABLE]: 'Comptable avec accès multi-société',
  [GlobalUserRole.TECHNICIEN]: 'Technicien avec accès multi-société',
  [GlobalUserRole.OPERATEUR]: 'Opérateur avec accès multi-société',
  [GlobalUserRole.USER]: 'Utilisateur standard',
  [GlobalUserRole.VIEWER]: 'Accès en lecture seule',
}

/**
 * Obtient la description d'un rôle société
 */
export const SOCIETE_ROLE_DESCRIPTIONS: Record<SocieteRoleType, string> = {
  [SocieteRoleType.OWNER]: 'Propriétaire de la société',
  [SocieteRoleType.ADMIN]: 'Administrateur de la société',
  [SocieteRoleType.MANAGER]: 'Manager/Responsable de la société',
  [SocieteRoleType.COMMERCIAL]: 'Commercial de la société',
  [SocieteRoleType.COMPTABLE]: 'Comptable de la société',
  [SocieteRoleType.TECHNICIEN]: 'Technicien de la société',
  [SocieteRoleType.OPERATEUR]: 'Opérateur de la société',
  [SocieteRoleType.USER]: 'Utilisateur standard de la société',
  [SocieteRoleType.GUEST]: 'Invité temporaire',
  [SocieteRoleType.VIEWER]: 'Accès en lecture seule',
}

// ===== ALIASES POUR COMPATIBILITÉ =====

/**
 * @deprecated Utiliser GlobalUserRole à la place
 */
export const UserRole = GlobalUserRole

/**
 * @deprecated Utiliser SocieteRoleType à la place
 */
export const UserSocieteRole = SocieteRoleType
