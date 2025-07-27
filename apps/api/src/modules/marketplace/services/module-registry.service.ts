import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { MarketplaceModule as MarketplaceModuleEntity } from '../entities/marketplace-module.entity'
import { MarketplaceService } from './marketplace.service'

// Import des modules réels
import { HrAggregatorModule } from '../real-modules/hr-aggregator/hr-aggregator.module'
import { ProcurementPoolModule } from '../real-modules/procurement-pool/procurement-pool.module'

export interface ModuleRegistration {
  moduleClass: any
  moduleInfo: any
}

@Injectable()
export class ModuleRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ModuleRegistryService.name)
  private readonly registeredModules = new Map<string, ModuleRegistration>()

  constructor(
    @InjectRepository(MarketplaceModuleEntity, 'auth')
    private readonly moduleRepository: Repository<MarketplaceModuleEntity>,
    private readonly marketplaceService: MarketplaceService
  ) {}

  async onModuleInit() {
    this.logger.log('Initialisation du registre des modules...')
    try {
      await this.discoverAndRegisterModules()
    } catch (error) {
      this.logger.error('Erreur lors de l\'initialisation du registre des modules:', error)
      this.logger.warn('Le registre des modules sera initialisé plus tard quand les tables seront disponibles')
    }
  }

  /**
   * Découvre automatiquement et enregistre tous les modules disponibles
   */
  private async discoverAndRegisterModules(): Promise<void> {
    // Enregistrer les modules manuellement pour le moment
    // Dans une version future, on pourrait utiliser la réflexion pour découvrir automatiquement
    await this.registerModule(HrAggregatorModule)
    await this.registerModule(ProcurementPoolModule)

    this.logger.log(`${this.registeredModules.size} modules enregistrés dans le registre`)
  }

  /**
   * Vérifie si les tables marketplace existent
   */
  private async checkTablesExist(): Promise<boolean> {
    try {
      await this.moduleRepository.count()
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Enregistre un module dans le registre et la base de données
   */
  async registerModule(moduleClass: any): Promise<void> {
    try {
      // Vérifier que le module a une méthode getModuleInfo
      if (!moduleClass.getModuleInfo || typeof moduleClass.getModuleInfo !== 'function') {
        throw new Error(`Module ${moduleClass.name} ne possède pas la méthode getModuleInfo()`)
      }

      const moduleInfo = moduleClass.getModuleInfo()
      
      // Valider les informations du module
      this.validateModuleInfo(moduleInfo)

      // Enregistrer dans le registre en mémoire
      this.registeredModules.set(moduleInfo.moduleKey, {
        moduleClass,
        moduleInfo
      })

      // Vérifier si les tables marketplace existent
      const tablesExist = await this.checkTablesExist()
      
      if (tablesExist) {
        // Vérifier si le module existe déjà en base
        let existingModule = await this.moduleRepository.findOne({
          where: { moduleKey: moduleInfo.moduleKey }
        })

        if (existingModule) {
          // Mettre à jour les informations du module si nécessaire
          const needsUpdate = this.hasModuleChanged(existingModule, moduleInfo)
          
          if (needsUpdate) {
            await this.updateModuleInDatabase(existingModule, moduleInfo)
            this.logger.log(`Module ${moduleInfo.moduleKey} mis à jour`)
          }
        } else {
          // Créer un nouveau module en base
          await this.createModuleInDatabase(moduleInfo)
          this.logger.log(`Module ${moduleInfo.moduleKey} enregistré`)
        }
      } else {
        this.logger.warn(`Tables marketplace non disponibles - Module ${moduleInfo.moduleKey} enregistré en mémoire uniquement`)
      }

    } catch (error) {
      this.logger.error(`Erreur lors de l'enregistrement du module ${moduleClass.name}:`, error)
    }
  }

  /**
   * Valide les informations d'un module
   */
  private validateModuleInfo(moduleInfo: any): void {
    const requiredFields = [
      'moduleKey', 'displayName', 'description', 'category', 
      'version', 'publisher', 'pricing'
    ]

    for (const field of requiredFields) {
      if (!moduleInfo[field]) {
        throw new Error(`Champ requis manquant: ${field}`)
      }
    }

    // Valider la structure du pricing
    if (!moduleInfo.pricing.type) {
      throw new Error('Type de tarification requis')
    }

    // Valider la configuration du menu
    if (moduleInfo.menuConfiguration && !Array.isArray(moduleInfo.menuConfiguration)) {
      throw new Error('menuConfiguration doit être un tableau')
    }
  }

  /**
   * Vérifie si un module a changé depuis sa dernière version
   */
  private hasModuleChanged(existingModule: MarketplaceModuleEntity, newInfo: any): boolean {
    return (
      existingModule.version !== newInfo.version ||
      existingModule.displayName !== newInfo.displayName ||
      existingModule.description !== newInfo.description ||
      JSON.stringify(existingModule.pricing) !== JSON.stringify(newInfo.pricing)
    )
  }

  /**
   * Met à jour un module existant en base de données
   */
  private async updateModuleInDatabase(existingModule: MarketplaceModuleEntity, moduleInfo: any): Promise<void> {
    await this.marketplaceService.updateModule(existingModule.id, {
      displayName: moduleInfo.displayName,
      description: moduleInfo.description,
      shortDescription: moduleInfo.shortDescription,
      pricing: moduleInfo.pricing,
      dependencies: moduleInfo.dependencies,
      menuConfiguration: moduleInfo.menuConfiguration,
      permissions: moduleInfo.permissions,
      apiRoutes: moduleInfo.apiRoutes,
      icon: moduleInfo.icon,
      metadata: moduleInfo.metadata
    }, '00000000-0000-0000-0000-000000000000')
  }

  /**
   * Crée un nouveau module en base de données
   */
  private async createModuleInDatabase(moduleInfo: any): Promise<void> {
    await this.marketplaceService.createModule({
      moduleKey: moduleInfo.moduleKey,
      displayName: moduleInfo.displayName,
      description: moduleInfo.description,
      shortDescription: moduleInfo.shortDescription,
      category: moduleInfo.category,
      publisher: moduleInfo.publisher,
      pricing: moduleInfo.pricing,
      dependencies: moduleInfo.dependencies,
      menuConfiguration: moduleInfo.menuConfiguration,
      permissions: moduleInfo.permissions,
      apiRoutes: moduleInfo.apiRoutes,
      icon: moduleInfo.icon,
      metadata: moduleInfo.metadata
    }, '00000000-0000-0000-0000-000000000000')
  }

  /**
   * Récupère tous les modules enregistrés
   */
  getRegisteredModules(): Map<string, ModuleRegistration> {
    return this.registeredModules
  }

  /**
   * Récupère un module par sa clé
   */
  getModule(moduleKey: string): ModuleRegistration | undefined {
    return this.registeredModules.get(moduleKey)
  }

  /**
   * Vérifie si un module est enregistré
   */
  isModuleRegistered(moduleKey: string): boolean {
    return this.registeredModules.has(moduleKey)
  }

  /**
   * Récupère la liste des modules par catégorie
   */
  getModulesByCategory(category: string): ModuleRegistration[] {
    const modules: ModuleRegistration[] = []
    
    for (const registration of this.registeredModules.values()) {
      if (registration.moduleInfo.category === category) {
        modules.push(registration)
      }
    }
    
    return modules
  }

  /**
   * Vérifie que tous les modules sont correctement enregistrés
   */
  async verifyModuleRegistration(): Promise<void> {
    this.logger.log('Vérification de l\'enregistrement des modules...')

    for (const [moduleKey, registration] of this.registeredModules.entries()) {
      try {
        const existingModule = await this.moduleRepository.findOne({
          where: { moduleKey }
        })

        if (existingModule) {
          this.logger.log(`Module ${moduleKey} correctement enregistré`)
        } else {
          this.logger.warn(`Module ${moduleKey} non trouvé en base de données`)
        }
      } catch (error) {
        this.logger.error(`Erreur lors de la vérification du module ${moduleKey}:`, error instanceof Error ? error.message : String(error))
      }
    }

    this.logger.log('Vérification de l\'enregistrement terminée')
  }

  /**
   * Affiche les informations de configuration pour un module spécifique
   */
  private async showModuleConfigurationInfo(moduleKey: string, registration: ModuleRegistration): Promise<void> {
    const moduleInfo = registration.moduleInfo

    this.logger.log(`Configuration requise pour le module ${moduleKey}:`)
    this.logger.log(`  - Catégorie: ${moduleInfo.category}`)
    this.logger.log(`  - Tarification: ${moduleInfo.pricing.type}`)
    
    if (moduleInfo.dependencies && moduleInfo.dependencies.length > 0) {
      this.logger.log(`  - Dépendances: ${moduleInfo.dependencies.join(', ')}`)
    }

    if (moduleInfo.permissions && moduleInfo.permissions.length > 0) {
      this.logger.log(`  - Permissions requises: ${moduleInfo.permissions.join(', ')}`)
    }

    this.logger.log(`Module ${moduleKey} prêt pour installation réelle`)
  }

  /**
   * Récupère l'ID d'un module par sa clé
   */
  private async getModuleId(moduleKey: string): Promise<string> {
    const module = await this.moduleRepository.findOne({
      where: { moduleKey }
    })
    
    if (!module) {
      throw new Error(`Module ${moduleKey} non trouvé en base`)
    }
    
    return module.id
  }

  /**
   * Synchronise tous les modules avec leurs versions les plus récentes
   */
  async syncAllModules(): Promise<void> {
    this.logger.log('Synchronisation de tous les modules...')

    for (const [moduleKey, registration] of this.registeredModules.entries()) {
      try {
        // Re-récupérer les informations du module
        const latestModuleInfo = registration.moduleClass.getModuleInfo()
        
        // Mettre à jour si nécessaire
        const existingModule = await this.moduleRepository.findOne({
          where: { moduleKey }
        })

        if (existingModule && this.hasModuleChanged(existingModule, latestModuleInfo)) {
          await this.updateModuleInDatabase(existingModule, latestModuleInfo)
          this.logger.log(`Module ${moduleKey} synchronisé`)
        }
      } catch (error) {
        this.logger.error(`Erreur lors de la synchronisation du module ${moduleKey}:`, error)
      }
    }

    this.logger.log('Synchronisation terminée')
  }

  /**
   * Valide qu'un module peut être installé
   */
  async validateModuleInstallation(moduleKey: string, tenantId: string): Promise<{
    canInstall: boolean
    reasons: string[]
  }> {
    const reasons: string[] = []
    
    // Vérifier que le module est enregistré
    if (!this.isModuleRegistered(moduleKey)) {
      reasons.push('Module non enregistré dans le système')
      return { canInstall: false, reasons }
    }

    const registration = this.getModule(moduleKey)
    const moduleInfo = registration!.moduleInfo

    // Vérifier les dépendances
    if (moduleInfo.dependencies && moduleInfo.dependencies.length > 0) {
      for (const dependency of moduleInfo.dependencies) {
        const isInstalled = await this.marketplaceService.isModuleInstalled(tenantId, dependency)
        if (!isInstalled) {
          reasons.push(`Dépendance manquante: ${dependency}`)
        }
      }
    }

    // Vérifier si déjà installé
    const existingModule = await this.moduleRepository.findOne({
      where: { moduleKey }
    })

    if (existingModule) {
      const isInstalled = await this.marketplaceService.isModuleInstalled(tenantId, existingModule.id)
      if (isInstalled) {
        reasons.push('Module déjà installé')
      }
    }

    return {
      canInstall: reasons.length === 0,
      reasons
    }
  }

  /**
   * Récupère les statistiques du registre
   */
  getRegistryStats(): any {
    const modules = Array.from(this.registeredModules.values())
    
    const categoryCounts = modules.reduce((acc, module) => {
      const category = module.moduleInfo.category
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const pricingTypes = modules.reduce((acc, module) => {
      const pricingType = module.moduleInfo.pricing.type
      acc[pricingType] = (acc[pricingType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalModules: modules.length,
      categoryCounts,
      pricingTypes,
      publishers: [...new Set(modules.map(m => m.moduleInfo.publisher))]
    }
  }
}