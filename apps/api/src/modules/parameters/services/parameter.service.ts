import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ParameterSystem, ParameterType, ParameterScope } from '../entities/parameter-system.entity'
import { ParameterApplication } from '../entities/parameter-application.entity'
import { ParameterClient } from '../entities/parameter-client.entity'

@Injectable()
export class ParameterService {
  private readonly logger = new Logger(ParameterService.name)
  private rolesCache: any[] | null = null
  private cacheExpiry: number = 0
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  constructor(
    @InjectRepository(ParameterSystem, 'auth')
    private readonly systemRepo: Repository<ParameterSystem>,
    @InjectRepository(ParameterApplication, 'auth')
    private readonly appRepo: Repository<ParameterApplication>,
    @InjectRepository(ParameterClient, 'auth')
    private readonly clientRepo: Repository<ParameterClient>,
  ) {}

  /**
   * Récupère les rôles utilisateurs avec traductions et cache backend
   * SUPER_ADMIN est non-modifiable (réservé à l'équipe TOPSTEEL)
   */
  async getUserRoles(language: string = 'fr') {
    // Vérifier le cache d'abord
    const now = Date.now()
    if (this.rolesCache && now < this.cacheExpiry) {
      this.logger.debug('Retour des rôles depuis le cache backend')
      return this.mapRolesForLanguage(this.rolesCache, language)
    }

    try {
      // Vérifier si les rôles existent en base, sinon les créer
      const existingRoles = await this.systemRepo.find({
        where: { group: 'user_roles', isActive: true },
        order: { key: 'ASC' }
      })

      // Si pas de rôles en base, créer les rôles par défaut
      if (existingRoles.length === 0) {
        this.logger.warn('Aucun rôle trouvé en base, création des rôles par défaut')
        await this.createDefaultUserRoles()
        // Récupérer les rôles nouvellement créés
        return this.getUserRoles(language)
      }

      // Mettre en cache
      this.rolesCache = existingRoles
      this.cacheExpiry = now + this.CACHE_TTL
      this.logger.debug(`Rôles mis en cache backend pour ${this.CACHE_TTL / 1000 / 60} minutes`)

      return this.mapRolesForLanguage(existingRoles, language)

    } catch (error) {
      this.logger.error('Erreur lors de la récupération des rôles:', error)
      
      // Fallback sur le cache même expiré si disponible
      if (this.rolesCache) {
        this.logger.warn('Utilisation du cache expiré comme fallback')
        return this.mapRolesForLanguage(this.rolesCache, language)
      }

      // Dernier fallback: rôles hardcodés
      this.logger.warn('Utilisation des rôles hardcodés comme fallback ultime')
      return this.getFallbackRoles(language)
    }
  }

  /**
   * Mappe les rôles pour une langue donnée
   */
  private mapRolesForLanguage(roles: any[], language: string) {
    return roles.map(role => ({
      key: role.key,
      value: role.customTranslations?.[language] || role.value,
      icon: role.metadata?.icon || '👤',
      color: role.metadata?.color || 'blue',
      order: role.metadata?.order || 999,
      permissions: role.metadata?.permissions || [],
      category: role.metadata?.category || 'standard',
      translationKey: role.translationKey,
      description: role.description || '',
      isReadonly: role.isReadonly || role.key === 'SUPER_ADMIN'
    })).sort((a, b) => (a.order || 999) - (b.order || 999))
  }

  /**
   * Rôles de fallback hardcodés en cas de problème DB
   */
  private getFallbackRoles(language: string = 'fr') {
    return [
      {
        key: 'SUPER_ADMIN',
        value: 'Super Administrateur',
        icon: '👑',
        color: 'destructive',
        order: 1,
        permissions: ['*'],
        category: 'administration',
        translationKey: 'roles.super_admin',
        description: 'Accès complet au système',
        isReadonly: true
      },
      {
        key: 'ADMIN',
        value: 'Administrateur',
        icon: '🔧',
        color: 'orange',
        order: 2,
        permissions: ['admin.*'],
        category: 'administration',
        translationKey: 'roles.admin',
        description: 'Gestion des utilisateurs et paramètres',
        isReadonly: false
      },
      {
        key: 'USER',
        value: 'Utilisateur',
        icon: '👤',
        color: 'blue',
        order: 8,
        permissions: ['basic.*'],
        category: 'user',
        translationKey: 'roles.user',
        description: 'Accès utilisateur standard',
        isReadonly: false
      }
    ]
  }

  /**
   * Invalide le cache des rôles (utile lors des mises à jour)
   */
  public invalidateRolesCache() {
    this.logger.debug('Invalidation du cache des rôles')
    this.rolesCache = null
    this.cacheExpiry = 0
  }

  /**
   * Crée les rôles utilisateur par défaut avec le nouveau système de traductions
   */
  private async createDefaultUserRoles() {
    const defaultRoles = [
      {
        group: 'user_roles',
        key: 'SUPER_ADMIN',
        value: 'Super Administrateur',
        type: ParameterType.ENUM,
        scope: ParameterScope.AUTH,
        description: 'Accès complet au système - Réservé équipe TOPSTEEL',
        translationKey: 'roles.super_admin',
        isReadonly: true,
        metadata: {
          icon: '👑',
          color: 'destructive',
          order: 1,
          category: 'administration',
          permissions: ['*']
        }
      },
      {
        group: 'user_roles',
        key: 'ADMIN',
        value: 'Administrateur',
        type: ParameterType.ENUM,
        scope: ParameterScope.AUTH,
        description: 'Gestion des utilisateurs et paramètres système',
        translationKey: 'roles.admin',
        metadata: {
          icon: '🔧',
          color: 'orange',
          order: 2,
          category: 'administration',
          permissions: ['admin.*', 'users.*', 'settings.*']
        }
      },
      {
        group: 'user_roles',
        key: 'MANAGER',
        value: 'Manager',
        type: ParameterType.ENUM,
        scope: ParameterScope.AUTH,
        description: 'Gestion des projets, équipes et processus métier',
        translationKey: 'roles.manager',
        metadata: {
          icon: '📋',
          color: 'purple',
          order: 3,
          category: 'management',
          permissions: ['projects.*', 'teams.*', 'reports.*']
        }
      },
      {
        group: 'user_roles',
        key: 'COMMERCIAL',
        value: 'Commercial',
        type: ParameterType.ENUM,
        scope: ParameterScope.AUTH,
        description: 'Accès aux clients, projets, devis et facturation',
        translationKey: 'roles.commercial',
        metadata: {
          icon: '💼',
          color: 'green',
          order: 4,
          category: 'business',
          permissions: ['clients.*', 'projects.*', 'billing.*']
        }
      },
      {
        group: 'user_roles',
        key: 'TECHNICIEN',
        value: 'Technicien',
        type: ParameterType.ENUM,
        scope: ParameterScope.AUTH,
        description: 'Accès à la production, machines et stocks',
        translationKey: 'roles.technician',
        metadata: {
          icon: '🔨',
          color: 'yellow',
          order: 5,
          category: 'production',
          permissions: ['production.*', 'machines.*', 'stocks.*']
        }
      },
      {
        group: 'user_roles',
        key: 'COMPTABLE',
        value: 'Comptable',
        type: ParameterType.ENUM,
        scope: ParameterScope.AUTH,
        description: 'Accès à la facturation, comptabilité et rapports financiers',
        translationKey: 'roles.accountant',
        metadata: {
          icon: '💰',
          color: 'cyan',
          order: 6,
          category: 'finance',
          permissions: ['billing.*', 'accounting.*', 'financial_reports.*']
        }
      },
      {
        group: 'user_roles',
        key: 'OPERATEUR',
        value: 'Opérateur',
        type: ParameterType.ENUM,
        scope: ParameterScope.AUTH,
        description: 'Accès en lecture/écriture aux informations de production',
        translationKey: 'roles.operator',
        metadata: {
          icon: '⚙️',
          color: 'blue',
          order: 7,
          category: 'production',
          permissions: ['production.read', 'production.write', 'machines.read']
        }
      },
      {
        group: 'user_roles',
        key: 'USER',
        value: 'Utilisateur',
        type: ParameterType.ENUM,
        scope: ParameterScope.AUTH,
        description: 'Accès utilisateur standard aux modules autorisés',
        translationKey: 'roles.user',
        metadata: {
          icon: '👤',
          color: 'blue',
          order: 8,
          category: 'user',
          permissions: ['basic.*']
        }
      },
      {
        group: 'user_roles',
        key: 'VIEWER',
        value: 'Observateur',
        type: ParameterType.ENUM,
        scope: ParameterScope.AUTH,
        description: 'Accès en lecture seule aux informations autorisées',
        translationKey: 'roles.viewer',
        metadata: {
          icon: '👁️',
          color: 'gray',
          order: 9,
          category: 'viewer',
          permissions: ['*.read']
        }
      }
    ]

    // Créer les rôles en base
    for (const roleData of defaultRoles) {
      const role = this.systemRepo.create(roleData)
      await this.systemRepo.save(role)
    }
    
    // Invalider le cache après création
    this.invalidateRolesCache()
  }

  /**
   * Récupère un paramètre système avec ses valeurs tableau/objet
   */
  async getSystemParameter(group: string, key: string, language: string = 'fr') {
    const param = await this.systemRepo.findOne({
      where: { group, key, isActive: true }
    })

    if (!param) return null

    return {
      key: param.key,
      value: param.customTranslations?.[language] || param.value,
      type: param.type,
      arrayValues: param.arrayValues,
      objectValues: param.objectValues,
      metadata: param.metadata
    }
  }

  /**
   * Récupère tous les paramètres d'un groupe avec traductions
   */
  async getParameterGroup(group: string, language: string = 'fr', scope: 'system' | 'application' | 'client' = 'system') {
    let repository
    switch (scope) {
      case 'system':
        repository = this.systemRepo
        break
      case 'application':
        repository = this.appRepo
        break
      case 'client':
        repository = this.clientRepo
        break
    }

    const params = await repository.find({
      where: { group, isActive: true },
      order: { key: 'ASC' }
    })

    return params.map(param => ({
      key: param.key,
      value: param.customTranslations?.[language] || param.value,
      type: param.type,
      arrayValues: param.arrayValues,
      objectValues: param.objectValues,
      metadata: param.metadata,
      description: param.description
    }))
  }

  /**
   * Récupère les modules système disponibles (exemple d'utilisation de tableau)
   */
  async getAvailableModules() {
    const param = await this.systemRepo.findOne({
      where: { group: 'system_modules', key: 'AVAILABLE_MODULES' }
    })

    return param?.arrayValues || []
  }

  /**
   * Récupère les permissions par défaut (exemple d'utilisation d'objet)
   */
  async getDefaultPermissions() {
    const param = await this.systemRepo.findOne({
      where: { group: 'system_permissions', key: 'DEFAULT_PERMISSIONS' }
    })

    return param?.objectValues || {}
  }

  /**
   * Récupère les étapes de workflow (exemple de tableau applicatif)
   */
  async getWorkflowSteps(language: string = 'fr') {
    const param = await this.appRepo.findOne({
      where: { group: 'project_workflow', key: 'DEFAULT_STEPS' }
    })

    if (!param) return []

    return {
      steps: param.arrayValues || [],
      title: param.customTranslations?.[language] || param.value,
      businessRules: param.businessRules,
      metadata: param.metadata
    }
  }

  /**
   * Récupère la configuration des matériaux (exemple d'objet applicatif)
   */
  async getMaterialsConfig(language: string = 'fr') {
    const param = await this.appRepo.findOne({
      where: { group: 'materials_config', key: 'STEEL_GRADES' }
    })

    if (!param) return {}

    return {
      grades: param.objectValues || {},
      title: param.customTranslations?.[language] || param.value,
      metadata: param.metadata
    }
  }

  /**
   * Récupère les préférences client avec tableaux (dashboard widgets, actions rapides, etc.)
   */
  async getClientPreferences(tenantId: string, userId?: string, language: string = 'fr') {
    const whereClause: any = { tenantId, isActive: true }
    if (userId) whereClause.userId = userId

    const preferences = await this.clientRepo.find({
      where: whereClause,
      order: { group: 'ASC', key: 'ASC' }
    })

    const result: Record<string, any> = {}

    preferences.forEach(pref => {
      if (!result[pref.group]) result[pref.group] = {}
      
      result[pref.group][pref.key] = {
        value: pref.value,
        type: pref.type,
        arrayValues: pref.arrayValues,
        objectValues: pref.objectValues,
        metadata: pref.metadata,
        translations: pref.customTranslations
      }
    })

    return result
  }

  /**
   * Met à jour un paramètre avec gestion des tableaux et objets
   */
  async updateParameter(
    group: string, 
    key: string, 
    updates: {
      value?: string
      arrayValues?: string[]
      objectValues?: Record<string, any>
      translations?: Record<string, string>
      metadata?: Record<string, any>
    },
    scope: 'system' | 'application' | 'client' = 'system',
    tenantId?: string
  ) {
    let repository
    let whereClause: any = { group, key }

    switch (scope) {
      case 'system':
        repository = this.systemRepo
        break
      case 'application':
        repository = this.appRepo
        break
      case 'client':
        repository = this.clientRepo
        if (tenantId) whereClause.tenantId = tenantId
        break
    }

    const param = await repository.findOne({ where: whereClause })
    if (!param) throw new Error(`Parameter ${group}.${key} not found`)

    // Mise à jour des champs
    if (updates.value !== undefined) param.value = updates.value
    if (updates.arrayValues !== undefined) param.arrayValues = updates.arrayValues
    if (updates.objectValues !== undefined) param.objectValues = updates.objectValues
    if (updates.translations !== undefined) {
      param.customTranslations = { ...param.customTranslations, ...updates.translations }
    }
    if (updates.metadata !== undefined) {
      param.metadata = { ...param.metadata, ...updates.metadata }
    }

    const result = await repository.save(param)
    
    // Invalider le cache si c'est un paramètre de rôles
    if (group === 'user_roles') {
      this.invalidateRolesCache()
    }
    
    return result
  }

  /**
   * Crée un nouveau paramètre avec support des tableaux et objets
   */
  async createParameter(
    data: {
      group: string
      key: string
      value: string
      type: string
      arrayValues?: string[]
      objectValues?: Record<string, any>
      translations?: Record<string, string>
      metadata?: Record<string, any>
      [key: string]: any
    },
    scope: 'system' | 'application' | 'client' = 'system'
  ) {
    let repository
    switch (scope) {
      case 'system':
        repository = this.systemRepo
        break
      case 'application':
        repository = this.appRepo
        break
      case 'client':
        repository = this.clientRepo
        break
    }

    const param = repository.create(data)
    const result = await repository.save(param)
    
    // Invalider le cache si c'est un paramètre de rôles
    if (data.group === 'user_roles') {
      this.invalidateRolesCache()
    }
    
    return result
  }
}