// Types pour le système de permissions modulaire

export type AccessLevel = 'BLOCKED' | 'READ' | 'WRITE' | 'DELETE' | 'ADMIN'

export interface Module {
  id: string
  name: string
  description: string
  category: 'CORE' | 'BUSINESS' | 'ADMIN' | 'REPORTS'
  icon?: string
  parentModule?: string
  isActive: boolean
}

export interface Permission {
  id: string
  moduleId: string
  action: string
  name: string
  description: string
  level: AccessLevel
  isRequired: boolean
}

export interface Role {
  id: string
  name: string
  description: string
  isSystemRole: boolean
  isActive: boolean
  permissions: RolePermission[]
  createdAt: string
  updatedAt: string
}

export interface RolePermission {
  id: string
  roleId: string
  permissionId: string
  accessLevel: AccessLevel
  isGranted: boolean
  conditions?: Record<string, any>
}

export interface UserRole {
  id: string
  userId: string
  roleId: string
  assignedBy: string
  assignedAt: string
  expiresAt?: string
  isActive: boolean
}

// Modules système prédéfinis
export const SYSTEM_MODULES: Module[] = [
  // CORE - Modules essentiels
  {
    id: 'USER_MANAGEMENT',
    name: 'Gestion des utilisateurs',
    description: 'Création, modification et suppression des utilisateurs',
    category: 'CORE',
    icon: 'Users',
    isActive: true,
  },
  {
    id: 'ROLE_MANAGEMENT',
    name: 'Gestion des rôles',
    description: 'Configuration des rôles et permissions',
    category: 'CORE',
    icon: 'Shield',
    isActive: true,
  },
  {
    id: 'SYSTEM_SETTINGS',
    name: 'Paramètres système',
    description: 'Configuration générale du système',
    category: 'CORE',
    icon: 'Settings',
    isActive: true,
  },

  // BUSINESS - Modules métier
  {
    id: 'CLIENT_MANAGEMENT',
    name: 'Gestion des clients',
    description: 'Gestion des clients et prospects',
    category: 'BUSINESS',
    icon: 'Building',
    isActive: true,
  },
  {
    id: 'PROJECT_MANAGEMENT',
    name: 'Gestion des projets',
    description: 'Création et suivi des projets',
    category: 'BUSINESS',
    icon: 'FolderOpen',
    isActive: true,
  },
  {
    id: 'BILLING_MANAGEMENT',
    name: 'Gestion de la facturation',
    description: 'Devis, factures et paiements',
    category: 'BUSINESS',
    icon: 'CreditCard',
    isActive: true,
  },
  {
    id: 'PRODUCTION_MANAGEMENT',
    name: 'Gestion de la production',
    description: 'Planification et suivi de la production',
    category: 'BUSINESS',
    icon: 'Cog',
    isActive: true,
  },
  {
    id: 'STOCK_MANAGEMENT',
    name: 'Gestion des stocks',
    description: 'Inventaire et approvisionnement',
    category: 'BUSINESS',
    icon: 'Package',
    isActive: true,
  },

  // ADMIN - Modules d\'administration
  {
    id: 'NOTIFICATION_MANAGEMENT',
    name: 'Gestion des notifications',
    description: 'Configuration des notifications et règles',
    category: 'ADMIN',
    icon: 'Bell',
    isActive: true,
  },
  {
    id: 'AUDIT_LOGS',
    name: "Journaux d'audit",
    description: 'Consultation des logs système',
    category: 'ADMIN',
    icon: 'FileText',
    isActive: true,
  },
  {
    id: 'BACKUP_MANAGEMENT',
    name: 'Gestion des sauvegardes',
    description: 'Sauvegarde et restauration',
    category: 'ADMIN',
    icon: 'HardDrive',
    isActive: true,
  },

  // REPORTS - Modules de reporting
  {
    id: 'FINANCIAL_REPORTS',
    name: 'Rapports financiers',
    description: "Rapports de chiffre d'affaires et rentabilité",
    category: 'REPORTS',
    icon: 'TrendingUp',
    isActive: true,
  },
  {
    id: 'PRODUCTION_REPORTS',
    name: 'Rapports de production',
    description: 'Statistiques de production et performance',
    category: 'REPORTS',
    icon: 'BarChart3',
    isActive: true,
  },
  {
    id: 'CUSTOM_REPORTS',
    name: 'Rapports personnalisés',
    description: 'Création de rapports sur mesure',
    category: 'REPORTS',
    icon: 'PieChart',
    isActive: true,
  },
]

// Permissions système par module
export const SYSTEM_PERMISSIONS: Record<string, Permission[]> = {
  USER_MANAGEMENT: [
    {
      id: 'USER_VIEW',
      moduleId: 'USER_MANAGEMENT',
      action: 'view',
      name: 'Voir les utilisateurs',
      description: 'Consulter la liste des utilisateurs',
      level: 'READ',
      isRequired: true,
    },
    {
      id: 'USER_CREATE',
      moduleId: 'USER_MANAGEMENT',
      action: 'create',
      name: 'Créer un utilisateur',
      description: 'Ajouter de nouveaux utilisateurs',
      level: 'WRITE',
      isRequired: false,
    },
    {
      id: 'USER_UPDATE',
      moduleId: 'USER_MANAGEMENT',
      action: 'update',
      name: 'Modifier un utilisateur',
      description: 'Modifier les informations utilisateur',
      level: 'WRITE',
      isRequired: false,
    },
    {
      id: 'USER_DELETE',
      moduleId: 'USER_MANAGEMENT',
      action: 'delete',
      name: 'Supprimer un utilisateur',
      description: 'Supprimer des utilisateurs',
      level: 'DELETE',
      isRequired: false,
    },
    {
      id: 'USER_ASSIGN_ROLES',
      moduleId: 'USER_MANAGEMENT',
      action: 'assign_roles',
      name: 'Assigner des rôles',
      description: 'Attribuer des rôles aux utilisateurs',
      level: 'ADMIN',
      isRequired: false,
    },
  ],

  CLIENT_MANAGEMENT: [
    {
      id: 'CLIENT_VIEW',
      moduleId: 'CLIENT_MANAGEMENT',
      action: 'view',
      name: 'Voir les clients',
      description: 'Consulter la liste des clients',
      level: 'READ',
      isRequired: true,
    },
    {
      id: 'CLIENT_CREATE',
      moduleId: 'CLIENT_MANAGEMENT',
      action: 'create',
      name: 'Créer un client',
      description: 'Ajouter de nouveaux clients',
      level: 'WRITE',
      isRequired: false,
    },
    {
      id: 'CLIENT_UPDATE',
      moduleId: 'CLIENT_MANAGEMENT',
      action: 'update',
      name: 'Modifier un client',
      description: 'Modifier les informations client',
      level: 'WRITE',
      isRequired: false,
    },
    {
      id: 'CLIENT_DELETE',
      moduleId: 'CLIENT_MANAGEMENT',
      action: 'delete',
      name: 'Supprimer un client',
      description: 'Supprimer des clients',
      level: 'DELETE',
      isRequired: false,
    },
    {
      id: 'CLIENT_EXPORT',
      moduleId: 'CLIENT_MANAGEMENT',
      action: 'export',
      name: 'Exporter les clients',
      description: 'Exporter la liste des clients',
      level: 'READ',
      isRequired: false,
    },
  ],

  PROJECT_MANAGEMENT: [
    {
      id: 'PROJECT_VIEW',
      moduleId: 'PROJECT_MANAGEMENT',
      action: 'view',
      name: 'Voir les projets',
      description: 'Consulter la liste des projets',
      level: 'READ',
      isRequired: true,
    },
    {
      id: 'PROJECT_CREATE',
      moduleId: 'PROJECT_MANAGEMENT',
      action: 'create',
      name: 'Créer un projet',
      description: 'Créer de nouveaux projets',
      level: 'WRITE',
      isRequired: false,
    },
    {
      id: 'PROJECT_UPDATE',
      moduleId: 'PROJECT_MANAGEMENT',
      action: 'update',
      name: 'Modifier un projet',
      description: 'Modifier les informations projet',
      level: 'WRITE',
      isRequired: false,
    },
    {
      id: 'PROJECT_DELETE',
      moduleId: 'PROJECT_MANAGEMENT',
      action: 'delete',
      name: 'Supprimer un projet',
      description: 'Supprimer des projets',
      level: 'DELETE',
      isRequired: false,
    },
    {
      id: 'PROJECT_ASSIGN',
      moduleId: 'PROJECT_MANAGEMENT',
      action: 'assign',
      name: 'Assigner des projets',
      description: 'Attribuer des projets aux utilisateurs',
      level: 'WRITE',
      isRequired: false,
    },
  ],

  BILLING_MANAGEMENT: [
    {
      id: 'BILLING_VIEW',
      moduleId: 'BILLING_MANAGEMENT',
      action: 'view',
      name: 'Voir la facturation',
      description: 'Consulter devis et factures',
      level: 'READ',
      isRequired: true,
    },
    {
      id: 'BILLING_CREATE',
      moduleId: 'BILLING_MANAGEMENT',
      action: 'create',
      name: 'Créer des devis',
      description: 'Créer des devis et factures',
      level: 'WRITE',
      isRequired: false,
    },
    {
      id: 'BILLING_UPDATE',
      moduleId: 'BILLING_MANAGEMENT',
      action: 'update',
      name: 'Modifier la facturation',
      description: 'Modifier devis et factures',
      level: 'WRITE',
      isRequired: false,
    },
    {
      id: 'BILLING_DELETE',
      moduleId: 'BILLING_MANAGEMENT',
      action: 'delete',
      name: 'Supprimer des factures',
      description: 'Supprimer devis et factures',
      level: 'DELETE',
      isRequired: false,
    },
    {
      id: 'BILLING_VALIDATE',
      moduleId: 'BILLING_MANAGEMENT',
      action: 'validate',
      name: 'Valider la facturation',
      description: 'Valider et finaliser les factures',
      level: 'ADMIN',
      isRequired: false,
    },
  ],

  PRODUCTION_MANAGEMENT: [
    {
      id: 'PRODUCTION_VIEW',
      moduleId: 'PRODUCTION_MANAGEMENT',
      action: 'view',
      name: 'Voir la production',
      description: 'Consulter le planning de production',
      level: 'READ',
      isRequired: true,
    },
    {
      id: 'PRODUCTION_CREATE',
      moduleId: 'PRODUCTION_MANAGEMENT',
      action: 'create',
      name: 'Planifier la production',
      description: 'Créer des ordres de production',
      level: 'WRITE',
      isRequired: false,
    },
    {
      id: 'PRODUCTION_UPDATE',
      moduleId: 'PRODUCTION_MANAGEMENT',
      action: 'update',
      name: 'Modifier la production',
      description: 'Modifier le planning de production',
      level: 'WRITE',
      isRequired: false,
    },
    {
      id: 'PRODUCTION_DELETE',
      moduleId: 'PRODUCTION_MANAGEMENT',
      action: 'delete',
      name: 'Supprimer des ordres',
      description: 'Supprimer des ordres de production',
      level: 'DELETE',
      isRequired: false,
    },
  ],

  STOCK_MANAGEMENT: [
    {
      id: 'STOCK_VIEW',
      moduleId: 'STOCK_MANAGEMENT',
      action: 'view',
      name: 'Voir les stocks',
      description: "Consulter l'inventaire",
      level: 'READ',
      isRequired: true,
    },
    {
      id: 'STOCK_CREATE',
      moduleId: 'STOCK_MANAGEMENT',
      action: 'create',
      name: 'Ajouter du stock',
      description: 'Ajouter des articles au stock',
      level: 'WRITE',
      isRequired: false,
    },
    {
      id: 'STOCK_UPDATE',
      moduleId: 'STOCK_MANAGEMENT',
      action: 'update',
      name: 'Modifier les stocks',
      description: 'Modifier les quantités en stock',
      level: 'WRITE',
      isRequired: false,
    },
    {
      id: 'STOCK_DELETE',
      moduleId: 'STOCK_MANAGEMENT',
      action: 'delete',
      name: 'Supprimer du stock',
      description: 'Retirer des articles du stock',
      level: 'DELETE',
      isRequired: false,
    },
  ],

  NOTIFICATION_MANAGEMENT: [
    {
      id: 'NOTIFICATION_VIEW',
      moduleId: 'NOTIFICATION_MANAGEMENT',
      action: 'view',
      name: 'Voir les notifications',
      description: 'Consulter les notifications',
      level: 'READ',
      isRequired: true,
    },
    {
      id: 'NOTIFICATION_RULES',
      moduleId: 'NOTIFICATION_MANAGEMENT',
      action: 'rules',
      name: 'Gérer les règles',
      description: 'Créer et modifier les règles de notification',
      level: 'WRITE',
      isRequired: false,
    },
    {
      id: 'NOTIFICATION_ADMIN',
      moduleId: 'NOTIFICATION_MANAGEMENT',
      action: 'admin',
      name: 'Administration',
      description: 'Configuration avancée des notifications',
      level: 'ADMIN',
      isRequired: false,
    },
  ],

  ROLE_MANAGEMENT: [
    {
      id: 'ROLE_VIEW',
      moduleId: 'ROLE_MANAGEMENT',
      action: 'view',
      name: 'Voir les rôles',
      description: 'Consulter les rôles existants',
      level: 'READ',
      isRequired: true,
    },
    {
      id: 'ROLE_CREATE',
      moduleId: 'ROLE_MANAGEMENT',
      action: 'create',
      name: 'Créer des rôles',
      description: 'Créer de nouveaux rôles',
      level: 'WRITE',
      isRequired: false,
    },
    {
      id: 'ROLE_UPDATE',
      moduleId: 'ROLE_MANAGEMENT',
      action: 'update',
      name: 'Modifier des rôles',
      description: 'Modifier les rôles existants',
      level: 'WRITE',
      isRequired: false,
    },
    {
      id: 'ROLE_DELETE',
      moduleId: 'ROLE_MANAGEMENT',
      action: 'delete',
      name: 'Supprimer des rôles',
      description: 'Supprimer des rôles',
      level: 'DELETE',
      isRequired: false,
    },
    {
      id: 'ROLE_ASSIGN_PERMISSIONS',
      moduleId: 'ROLE_MANAGEMENT',
      action: 'assign_permissions',
      name: 'Assigner des permissions',
      description: 'Configurer les permissions des rôles',
      level: 'ADMIN',
      isRequired: false,
    },
  ],

  SYSTEM_SETTINGS: [
    {
      id: 'SYSTEM_VIEW',
      moduleId: 'SYSTEM_SETTINGS',
      action: 'view',
      name: 'Voir les paramètres',
      description: 'Consulter la configuration système',
      level: 'READ',
      isRequired: true,
    },
    {
      id: 'SYSTEM_UPDATE',
      moduleId: 'SYSTEM_SETTINGS',
      action: 'update',
      name: 'Modifier les paramètres',
      description: 'Modifier la configuration système',
      level: 'ADMIN',
      isRequired: false,
    },
  ],
}

// Rôles système prédéfinis
export const SYSTEM_ROLES: Omit<Role, 'permissions'>[] = [
  {
    id: 'SUPER_ADMIN',
    name: 'Super Administrateur',
    description: 'Accès complet à tous les modules et fonctionnalités',
    isSystemRole: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ADMIN',
    name: 'Administrateur',
    description: 'Accès administratif aux modules business et utilisateurs',
    isSystemRole: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'MANAGER',
    name: 'Manager',
    description: 'Accès complet aux modules business avec restrictions admin',
    isSystemRole: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'COMMERCIAL',
    name: 'Commercial',
    description: 'Accès aux clients, projets et facturation',
    isSystemRole: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'TECHNICIEN',
    name: 'Technicien',
    description: 'Accès à la production et aux stocks',
    isSystemRole: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'OPERATEUR',
    name: 'Opérateur',
    description: 'Accès en lecture seule aux informations de production',
    isSystemRole: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'DEVISEUR',
    name: 'Deviseur',
    description: 'Spécialisé dans la création et gestion des devis',
    isSystemRole: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// Utilitaires pour les permissions
export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  BLOCKED: 'Bloqué',
  READ: 'Lecture seule',
  WRITE: 'Lecture/Écriture',
  DELETE: 'Suppression',
  ADMIN: 'Administration',
}

export const ACCESS_LEVEL_COLORS: Record<AccessLevel, string> = {
  BLOCKED: 'bg-red-100 text-red-800',
  READ: 'bg-blue-100 text-blue-800',
  WRITE: 'bg-green-100 text-green-800',
  DELETE: 'bg-orange-100 text-orange-800',
  ADMIN: 'bg-purple-100 text-purple-800',
}

export const MODULE_CATEGORY_LABELS: Record<Module['category'], string> = {
  CORE: 'Système',
  BUSINESS: 'Métier',
  ADMIN: 'Administration',
  REPORTS: 'Rapports',
}

export const MODULE_CATEGORY_COLORS: Record<Module['category'], string> = {
  CORE: 'bg-gray-100 text-gray-800',
  BUSINESS: 'bg-blue-100 text-blue-800',
  ADMIN: 'bg-purple-100 text-purple-800',
  REPORTS: 'bg-green-100 text-green-800',
}
