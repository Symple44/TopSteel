import { DataSource } from 'typeorm'
import { ParameterSystem, ParameterType, ParameterScope } from '../modules/parameters/entities/parameter-system.entity'
import { ParameterApplication, ApplicationParameterType, ApplicationParameterScope } from '../modules/parameters/entities/parameter-application.entity'

/**
 * Script d'initialisation des données de paramètres
 * Insère les rôles utilisateurs et autres constantes système
 */
export async function initParametersData(dataSource: DataSource) {
  const systemRepo = dataSource.getRepository(ParameterSystem)
  const appRepo = dataSource.getRepository(ParameterApplication)

  console.log('🔧 Initialisation des paramètres système...')

  // Paramètres système - Rôles utilisateurs
  const userRoles = [
    {
      group: 'user_roles',
      key: 'SUPER_ADMIN',
      value: 'Super Administrateur',
      type: ParameterType.ENUM,
      scope: ParameterScope.AUTH,
      description: 'Accès complet à tous les modules et fonctionnalités du système',
      metadata: {
        icon: '👑',
        color: 'destructive',
        order: 1,
        permissions: ['*'],
        category: 'administration'
      },
      translationKey: 'roles.super_admin'
    },
    {
      group: 'user_roles',
      key: 'ADMIN',
      value: 'Administrateur',
      type: ParameterType.ENUM,
      scope: ParameterScope.AUTH,
      description: 'Accès administratif aux modules business et gestion des utilisateurs',
      metadata: {
        icon: '🔧',
        color: 'orange',
        order: 2,
        permissions: ['admin.*', 'users.*', 'business.*'],
        category: 'administration'
      },
      translationKey: 'roles.admin'
    },
    {
      group: 'user_roles',
      key: 'MANAGER',
      value: 'Manager',
      type: ParameterType.ENUM,
      scope: ParameterScope.AUTH,
      description: 'Accès complet aux modules business avec restrictions administratives',
      metadata: {
        icon: '📋',
        color: 'purple',
        order: 3,
        permissions: ['business.*', 'reports.*'],
        category: 'management'
      },
      translationKey: 'roles.manager'
    },
    {
      group: 'user_roles',
      key: 'COMMERCIAL',
      value: 'Commercial',
      type: ParameterType.ENUM,
      scope: ParameterScope.AUTH,
      description: 'Accès aux clients, projets, devis et facturation',
      metadata: {
        icon: '💼',
        color: 'green',
        order: 4,
        permissions: ['clients.*', 'projects.*', 'billing.*'],
        category: 'business'
      },
      translationKey: 'roles.commercial'
    },
    {
      group: 'user_roles',
      key: 'TECHNICIEN',
      value: 'Technicien',
      type: ParameterType.ENUM,
      scope: ParameterScope.AUTH,
      description: 'Accès à la production, machines et stocks',
      metadata: {
        icon: '🔨',
        color: 'yellow',
        order: 5,
        permissions: ['production.*', 'machines.*', 'stocks.*'],
        category: 'production'
      },
      translationKey: 'roles.technician'
    },
    {
      group: 'user_roles',
      key: 'COMPTABLE',
      value: 'Comptable',
      type: ParameterType.ENUM,
      scope: ParameterScope.AUTH,
      description: 'Accès à la facturation, comptabilité et rapports financiers',
      metadata: {
        icon: '💰',
        color: 'cyan',
        order: 6,
        permissions: ['billing.*', 'accounting.*', 'financial_reports.*'],
        category: 'finance'
      },
      translationKey: 'roles.accountant'
    },
    {
      group: 'user_roles',
      key: 'OPERATEUR',
      value: 'Opérateur',
      type: ParameterType.ENUM,
      scope: ParameterScope.AUTH,
      description: 'Accès en lecture/écriture aux informations de production',
      metadata: {
        icon: '⚙️',
        color: 'blue',
        order: 7,
        permissions: ['production.read', 'production.write', 'machines.read'],
        category: 'production'
      },
      translationKey: 'roles.operator'
    },
    {
      group: 'user_roles',
      key: 'USER',
      value: 'Utilisateur',
      type: ParameterType.ENUM,
      scope: ParameterScope.AUTH,
      description: 'Accès utilisateur standard aux modules autorisés',
      metadata: {
        icon: '👤',
        color: 'blue',
        order: 8,
        permissions: ['basic.*'],
        category: 'user'
      },
      translationKey: 'roles.user'
    },
    {
      group: 'user_roles',
      key: 'VIEWER',
      value: 'Observateur',
      type: ParameterType.ENUM,
      scope: ParameterScope.AUTH,
      description: 'Accès en lecture seule aux informations autorisées',
      metadata: {
        icon: '👁️',
        color: 'gray',
        order: 9,
        permissions: ['*.read'],
        category: 'viewer'
      },
      translationKey: 'roles.viewer'
    }
  ]

  // Insérer les rôles utilisateurs
  for (const role of userRoles) {
    const existing = await systemRepo.findOne({
      where: { group: role.group, key: role.key }
    })

    if (!existing) {
      await systemRepo.save(systemRepo.create(role))
      console.log(`✅ Rôle ${role.key} créé`)
    } else {
      console.log(`⚠️ Rôle ${role.key} existe déjà`)
    }
  }

  // Paramètres système - Statuts génériques
  const systemStatuses = [
    {
      group: 'system_statuses',
      key: 'ACTIVE',
      value: 'Actif',
      type: ParameterType.ENUM,
      scope: ParameterScope.SYSTEM,
      description: 'État actif',
      metadata: { icon: '✅', color: 'green' },
      translationKey: 'status.active'
    },
    {
      group: 'system_statuses',
      key: 'INACTIVE',
      value: 'Inactif',
      type: ParameterType.ENUM,
      scope: ParameterScope.SYSTEM,
      description: 'État inactif',
      metadata: { icon: '❌', color: 'red' },
      translationKey: 'status.inactive'
    },
    {
      group: 'system_statuses',
      key: 'PENDING',
      value: 'En attente',
      type: ParameterType.ENUM,
      scope: ParameterScope.SYSTEM,
      description: 'État en attente',
      metadata: { icon: '⏳', color: 'yellow' },
      translationKey: 'status.pending'
    }
  ]

  // Exemple de paramètre système avec TABLEAU - Modules système disponibles
  const systemModules = {
    group: 'system_modules',
    key: 'AVAILABLE_MODULES',
    value: 'Modules système disponibles',
    type: ParameterType.ARRAY,
    scope: ParameterScope.CORE,
    description: 'Liste des modules disponibles dans le système',
    arrayValues: [
      'users', 'auth', 'roles', 'projects', 'clients', 
      'billing', 'production', 'stocks', 'machines',
      'maintenance', 'reports', 'notifications'
    ],
    metadata: {
      category: 'system',
      order: 1,
      editable: false
    },
    translationKey: 'system.modules.available'
  }

  // Exemple de paramètre système avec OBJET - Configuration des permissions
  const permissionConfig = {
    group: 'system_permissions',
    key: 'DEFAULT_PERMISSIONS',
    value: 'Permissions par défaut',
    type: ParameterType.OBJECT,
    scope: ParameterScope.AUTH,
    description: 'Configuration des permissions par défaut par rôle',
    objectValues: {
      SUPER_ADMIN: ['*'],
      ADMIN: ['admin.*', 'users.*', 'business.*'],
      MANAGER: ['business.*', 'reports.*'],
      COMMERCIAL: ['clients.*', 'projects.*', 'billing.*'],
      TECHNICIEN: ['production.*', 'machines.*', 'stocks.*'],
      COMPTABLE: ['billing.*', 'accounting.*', 'financial_reports.*'],
      OPERATEUR: ['production.read', 'production.write', 'machines.read'],
      USER: ['basic.*'],
      VIEWER: ['*.read']
    },
    metadata: {
      category: 'security',
      editable: true,
      version: '1.0'
    },
    translationKey: 'system.permissions.default'
  }

  for (const status of systemStatuses) {
    const existing = await systemRepo.findOne({
      where: { group: status.group, key: status.key }
    })

    if (!existing) {
      await systemRepo.save(systemRepo.create(status))
      console.log(`✅ Statut ${status.key} créé`)
    }
  }

  // Insérer les paramètres système avec tableaux et objets
  const systemArrayParams = [systemModules, permissionConfig]
  for (const param of systemArrayParams) {
    const existing = await systemRepo.findOne({
      where: { group: param.group, key: param.key }
    })

    if (!existing) {
      await systemRepo.save(systemRepo.create(param))
      console.log(`✅ Paramètre système ${param.key} créé`)
    }
  }

  // Paramètres applicatifs - Types de projets
  const projectTypes = [
    {
      group: 'project_types',
      key: 'STEEL_STRUCTURE',
      value: 'Structure métallique',
      type: ApplicationParameterType.ENUM,
      scope: ApplicationParameterScope.BUSINESS,
      description: 'Projet de construction de structure métallique',
      metadata: { icon: '🏗️', color: 'blue', category: 'construction' },
      translationKey: 'projects.types.steel_structure'
    },
    {
      group: 'project_types',
      key: 'MAINTENANCE',
      value: 'Maintenance',
      type: ApplicationParameterType.ENUM,
      scope: ApplicationParameterScope.BUSINESS,
      description: 'Projet de maintenance et réparation',
      metadata: { icon: '🔧', color: 'orange', category: 'maintenance' },
      translationKey: 'projects.types.maintenance'
    },
    {
      group: 'project_types',
      key: 'CUSTOM_FABRICATION',
      value: 'Fabrication sur mesure',
      type: ApplicationParameterType.ENUM,
      scope: ApplicationParameterScope.BUSINESS,
      description: 'Projet de fabrication personnalisée',
      metadata: { icon: '⚒️', color: 'purple', category: 'fabrication' },
      translationKey: 'projects.types.custom_fabrication'
    }
  ]

  for (const projectType of projectTypes) {
    const existing = await appRepo.findOne({
      where: { group: projectType.group, key: projectType.key }
    })

    if (!existing) {
      await appRepo.save(appRepo.create(projectType))
      console.log(`✅ Type de projet ${projectType.key} créé`)
    }
  }

  // Exemple de paramètre applicatif avec TABLEAU - Étapes de workflow
  const workflowSteps = {
    group: 'project_workflow',
    key: 'DEFAULT_STEPS',
    value: 'Étapes par défaut des projets',
    type: ApplicationParameterType.ARRAY,
    scope: ApplicationParameterScope.WORKFLOW,
    description: 'Étapes standard du workflow de projet',
    arrayValues: [
      'Demande initiale',
      'Étude de faisabilité',
      'Devis',
      'Validation client',
      'Planification',
      'Production',
      'Contrôle qualité',
      'Livraison',
      'Facturation',
      'Clôture'
    ],
    metadata: {
      category: 'workflow',
      editable: true,
      order: 1
    },
    businessRules: {
      validation: {
        minSteps: 3,
        maxSteps: 15,
        requiredSteps: ['Devis', 'Production', 'Livraison']
      },
      automation: {
        autoProgress: true,
        notifyOnStepChange: true
      }
    },
    translationKey: 'projects.workflow.default_steps'
  }

  // Exemple de paramètre applicatif avec OBJET - Configuration des matériaux
  const materialConfig = {
    group: 'materials_config',
    key: 'STEEL_GRADES',
    value: 'Grades d\'acier disponibles',
    type: ApplicationParameterType.OBJECT,
    scope: ApplicationParameterScope.BUSINESS,
    description: 'Configuration des grades d\'acier et leurs propriétés',
    objectValues: {
      'S235': {
        name: 'Acier de construction S235',
        density: 7850, // kg/m³
        yieldStrength: 235, // MPa
        tensileStrength: 360, // MPa
        applications: ['Structure générale', 'Charpente'],
        price: { base: 0.85, unit: 'kg' }
      },
      'S355': {
        name: 'Acier haute résistance S355',
        density: 7850,
        yieldStrength: 355,
        tensileStrength: 510,
        applications: ['Structure lourde', 'Pont'],
        price: { base: 1.20, unit: 'kg' }
      },
      'S460': {
        name: 'Acier très haute résistance S460',
        density: 7850,
        yieldStrength: 460,
        tensileStrength: 540,
        applications: ['Structure spéciale', 'Offshore'],
        price: { base: 1.85, unit: 'kg' }
      }
    },
    metadata: {
      category: 'materials',
      department: 'technical',
      version: '2.1',
      lastUpdated: new Date().toISOString()
    },
    translationKey: 'materials.steel_grades'
  }

  // Insérer les paramètres applicatifs avec tableaux et objets
  const appArrayParams = [workflowSteps, materialConfig]
  for (const param of appArrayParams) {
    const existing = await appRepo.findOne({
      where: { group: param.group, key: param.key }
    })

    if (!existing) {
      await appRepo.save(appRepo.create(param))
      console.log(`✅ Paramètre applicatif ${param.key} créé`)
    }
  }

  console.log('✅ Initialisation des paramètres terminée')
}

// Exécution directe si appelé en tant de script
if (require.main === module) {
  import('../database/data-source-auth').then(async (module) => {
    const dataSource = module.default
    try {
      await dataSource.initialize()
      await initParametersData(dataSource)
      await dataSource.destroy()
      console.log('✅ Script terminé avec succès')
      process.exit(0)
    } catch (error) {
      console.error('❌ Erreur:', error)
      process.exit(1)
    }
  })
}