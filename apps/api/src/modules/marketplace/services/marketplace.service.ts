import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { MarketplaceModule as MarketplaceModuleEntity, MarketplaceCategory, ModuleStatus } from '../entities/marketplace-module.entity'
import { ModuleInstallation, InstallationStatus } from '../entities/module-installation.entity'
import { ModuleRating } from '../entities/module-rating.entity'
import { MenuRawService } from '../../admin/services/menu-raw.service'

export interface CreateModuleDto {
  moduleKey: string
  displayName: string
  description: string
  shortDescription?: string
  category: MarketplaceCategory
  publisher: string
  pricing: any
  dependencies?: string[]
  menuConfiguration?: any[]
  permissions?: any[]
  apiRoutes?: any[]
  icon?: string
  metadata?: any
}

export interface UpdateModuleDto {
  displayName?: string
  description?: string
  shortDescription?: string
  category?: MarketplaceCategory
  pricing?: any
  dependencies?: string[]
  menuConfiguration?: any[]
  permissions?: any[]
  apiRoutes?: any[]
  icon?: string
  metadata?: any
  status?: ModuleStatus
}

export interface InstallModuleDto {
  tenantId: string
  moduleId: string
  configuration?: any
}

export interface ModuleSearchFilters {
  category?: MarketplaceCategory
  status?: ModuleStatus
  publisher?: string
  minRating?: number
  priceRange?: { min?: number, max?: number }
  isFree?: boolean
  query?: string
}

export interface InstallationResult {
  success: boolean
  installationId?: string
  moduleId: string
  message: string
  errors?: string[]
}

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(MarketplaceModuleEntity, 'auth')
    private readonly moduleRepository: Repository<MarketplaceModuleEntity>,
    @InjectRepository(ModuleInstallation, 'tenant')
    private readonly installationRepository: Repository<ModuleInstallation>,
    @InjectRepository(ModuleRating, 'tenant')
    private readonly ratingRepository: Repository<ModuleRating>,
    private readonly menuRawService: MenuRawService
  ) {}

  // ===== GESTION DES MODULES =====

  async findAllModules(filters?: ModuleSearchFilters): Promise<MarketplaceModuleEntity[]> {
    const queryBuilder = this.moduleRepository.createQueryBuilder('module')
      .leftJoinAndSelect('module.installations', 'installations')
      .orderBy('module.downloadCount', 'DESC')
      .addOrderBy('module.ratingAverage', 'DESC')

    if (filters) {
      if (filters.category) {
        queryBuilder.andWhere('module.category = :category', { category: filters.category })
      }

      if (filters.status) {
        queryBuilder.andWhere('module.status = :status', { status: filters.status })
      } else {
        // Par défaut, ne montrer que les modules publiés
        queryBuilder.andWhere('module.status = :status', { status: ModuleStatus.PUBLISHED })
      }

      if (filters.publisher) {
        queryBuilder.andWhere('module.publisher = :publisher', { publisher: filters.publisher })
      }

      if (filters.minRating) {
        queryBuilder.andWhere('module.ratingAverage >= :minRating', { minRating: filters.minRating })
      }

      if (filters.isFree) {
        queryBuilder.andWhere("module.pricing->>'type' = 'FREE'")
      }

      if (filters.priceRange) {
        if (filters.priceRange.min !== undefined) {
          queryBuilder.andWhere("CAST(module.pricing->>'amount' AS DECIMAL) >= :minPrice", { minPrice: filters.priceRange.min })
        }
        if (filters.priceRange.max !== undefined) {
          queryBuilder.andWhere("CAST(module.pricing->>'amount' AS DECIMAL) <= :maxPrice", { maxPrice: filters.priceRange.max })
        }
      }

      if (filters.query) {
        queryBuilder.andWhere(
          '(module.displayName ILIKE :query OR module.description ILIKE :query OR module.shortDescription ILIKE :query)',
          { query: `%${filters.query}%` }
        )
      }
    } else {
      queryBuilder.andWhere('module.status = :status', { status: ModuleStatus.PUBLISHED })
    }

    return await queryBuilder.getMany()
  }

  async findModuleById(id: string): Promise<MarketplaceModuleEntity> {
    const module = await this.moduleRepository.findOne({
      where: { id },
      relations: ['installations']
    })

    if (!module) {
      throw new NotFoundException(`Module avec l'ID ${id} non trouvé`)
    }

    return module
  }

  async findModuleByKey(moduleKey: string): Promise<MarketplaceModuleEntity> {
    const module = await this.moduleRepository.findOne({
      where: { moduleKey },
      relations: ['installations']
    })

    if (!module) {
      throw new NotFoundException(`Module avec la clé ${moduleKey} non trouvé`)
    }

    return module
  }

  async createModule(createDto: CreateModuleDto, createdBy: string): Promise<MarketplaceModuleEntity> {
    // Vérifier l'unicité de la clé du module
    const existingModule = await this.moduleRepository.findOne({
      where: { moduleKey: createDto.moduleKey }
    })

    if (existingModule) {
      throw new ConflictException(`Un module avec la clé "${createDto.moduleKey}" existe déjà`)
    }

    const module = MarketplaceModuleEntity.create(
      createDto.moduleKey,
      createDto.displayName,
      createDto.description,
      createDto.category,
      createDto.publisher,
      createDto.pricing,
      createdBy
    )

    Object.assign(module, {
      shortDescription: createDto.shortDescription,
      dependencies: createDto.dependencies,
      menuConfiguration: createDto.menuConfiguration,
      permissions: createDto.permissions,
      apiRoutes: createDto.apiRoutes,
      icon: createDto.icon,
      metadata: createDto.metadata
    })

    return await this.moduleRepository.save(module)
  }

  async updateModule(id: string, updateDto: UpdateModuleDto, updatedBy: string): Promise<MarketplaceModuleEntity> {
    const module = await this.findModuleById(id)

    Object.assign(module, updateDto)
    module.updatedBy = updatedBy

    return await this.moduleRepository.save(module)
  }

  async deleteModule(id: string): Promise<void> {
    const module = await this.findModuleById(id)

    // Vérifier qu'aucune installation active n'existe
    const activeInstallations = await this.installationRepository.count({
      where: { 
        moduleId: id, 
        status: In([InstallationStatus.INSTALLED, InstallationStatus.INSTALLING]) 
      }
    })

    if (activeInstallations > 0) {
      throw new ForbiddenException('Impossible de supprimer un module qui a des installations actives')
    }

    await this.moduleRepository.delete(id)
  }

  async publishModule(id: string): Promise<MarketplaceModuleEntity> {
    const module = await this.findModuleById(id)
    
    if (module.status !== ModuleStatus.DRAFT) {
      throw new BadRequestException('Seuls les modules en brouillon peuvent être publiés')
    }

    module.status = ModuleStatus.PUBLISHED
    return await this.moduleRepository.save(module)
  }

  async unpublishModule(id: string): Promise<MarketplaceModuleEntity> {
    const module = await this.findModuleById(id)
    
    module.status = ModuleStatus.DISABLED
    return await this.moduleRepository.save(module)
  }

  // ===== GESTION DES INSTALLATIONS =====

  async getInstalledModules(tenantId: string): Promise<ModuleInstallation[]> {
    return await this.installationRepository.find({
      where: { 
        tenantId, 
        status: InstallationStatus.INSTALLED,
        isActive: true 
      },
      order: { installedAt: 'DESC' }
    })
  }

  async getInstalledModulesWithDetails(tenantId: string): Promise<Array<ModuleInstallation & { module: MarketplaceModuleEntity }>> {
    const installations = await this.getInstalledModules(tenantId)
    const moduleIds = installations.map(inst => inst.moduleId)
    
    if (moduleIds.length === 0) {
      return []
    }

    const modules = await this.moduleRepository.find({
      where: { id: In(moduleIds) }
    })
    
    const moduleMap = new Map(modules.map(m => [m.id, m]))
    
    return installations
      .filter(inst => moduleMap.has(inst.moduleId))
      .map(inst => {
        (inst as any).module = moduleMap.get(inst.moduleId)!
        return inst as ModuleInstallation & { module: MarketplaceModuleEntity }
      })
  }

  async getModuleInstallation(tenantId: string, moduleId: string): Promise<ModuleInstallation | null> {
    return await this.installationRepository.findOne({
      where: { tenantId, moduleId },
      relations: ['module']
    })
  }

  async isModuleInstalled(tenantId: string, moduleId: string): Promise<boolean> {
    const installation = await this.getModuleInstallation(tenantId, moduleId)
    return installation?.isInstalled() || false
  }

  async installModule(installDto: InstallModuleDto, installedBy: string): Promise<InstallationResult> {
    const { tenantId, moduleId, configuration } = installDto

    try {
      // Vérifier que le module existe et peut être installé
      const module = await this.findModuleById(moduleId)
      
      if (!module.canBeInstalled()) {
        return {
          success: false,
          moduleId,
          message: 'Le module ne peut pas être installé (non publié ou inactif)',
          errors: ['Module non disponible']
        }
      }

      // Vérifier qu'il n'y a pas déjà une installation active
      const existingInstallation = await this.getModuleInstallation(tenantId, moduleId)
      
      if (existingInstallation?.isInstalled()) {
        return {
          success: false,
          moduleId,
          message: 'Le module est déjà installé',
          errors: ['Module déjà installé']
        }
      }

      // Vérifier les dépendances
      const dependencyCheck = await this.checkDependencies(tenantId, module.dependencies || [])
      if (!dependencyCheck.success) {
        return {
          success: false,
          moduleId,
          message: 'Dépendances non satisfaites',
          errors: dependencyCheck.missingDependencies
        }
      }

      // Créer ou réutiliser l'installation
      let installation: ModuleInstallation
      
      if (existingInstallation && existingInstallation.canBeReinstalled()) {
        installation = existingInstallation
        installation.status = InstallationStatus.PENDING
        installation.configuration = configuration
        installation.installedBy = installedBy
        installation.failureReason = undefined
      } else {
        installation = ModuleInstallation.create(
          tenantId,
          moduleId,
          module.version,
          installedBy,
          configuration
        )
      }

      // Marquer comme en cours d'installation
      installation.markAsInstalling()
      await this.installationRepository.save(installation)

      // Effectuer l'installation
      const installationSuccess = await this.performInstallation(installation, module)

      if (installationSuccess.success) {
        installation.markAsInstalled()
        module.incrementDownloadCount()
        await this.moduleRepository.save(module)
      } else {
        installation.markAsFailed(installationSuccess.error || 'Erreur inconnue')
      }

      await this.installationRepository.save(installation)

      return {
        success: installationSuccess.success,
        installationId: installation.id,
        moduleId,
        message: installationSuccess.success ? 'Installation réussie' : installationSuccess.error || 'Échec de l\'installation',
        errors: installationSuccess.success ? undefined : [installationSuccess.error || 'Erreur inconnue']
      }

    } catch (error) {
      return {
        success: false,
        moduleId,
        message: 'Erreur lors de l\'installation',
        errors: [error instanceof Error ? error.message : 'Erreur inconnue']
      }
    }
  }

  async uninstallModule(tenantId: string, moduleId: string, uninstalledBy: string): Promise<InstallationResult> {
    try {
      const installation = await this.getModuleInstallation(tenantId, moduleId)
      
      if (!installation) {
        return {
          success: false,
          moduleId,
          message: 'Module non installé'
        }
      }

      if (!installation.canBeUninstalled()) {
        return {
          success: false,
          moduleId,
          message: 'Le module ne peut pas être désinstallé'
        }
      }

      // Marquer comme en cours de désinstallation
      installation.markAsUninstalling(uninstalledBy)
      await this.installationRepository.save(installation)

      // Effectuer la désinstallation
      const uninstallSuccess = await this.performUninstallation(installation)

      if (uninstallSuccess.success) {
        installation.markAsUninstalled()
      } else {
        installation.markAsFailed(uninstallSuccess.error || 'Erreur de désinstallation')
      }

      await this.installationRepository.save(installation)

      return {
        success: uninstallSuccess.success,
        installationId: installation.id,
        moduleId,
        message: uninstallSuccess.success ? 'Désinstallation réussie' : uninstallSuccess.error || 'Échec de la désinstallation'
      }

    } catch (error) {
      return {
        success: false,
        moduleId,
        message: 'Erreur lors de la désinstallation',
        errors: [error instanceof Error ? error.message : 'Erreur inconnue']
      }
    }
  }

  // ===== GESTION DES ÉVALUATIONS =====

  async rateModule(moduleId: string, userId: string, rating: number, comment?: string): Promise<ModuleRating> {
    const module = await this.findModuleById(moduleId)

    // Vérifier si l'utilisateur a déjà évalué ce module
    let existingRating = await this.ratingRepository.findOne({
      where: { moduleId, userId }
    })

    if (existingRating) {
      // Mettre à jour l'évaluation existante
      const oldRating = existingRating.rating
      existingRating.rating = rating
      existingRating.comment = comment
      existingRating.version = module.version
      
      await this.ratingRepository.save(existingRating)
      
      // Recalculer la moyenne des évaluations
      await this.recalculateModuleRating(moduleId, oldRating, rating)
      
      return existingRating
    } else {
      // Créer une nouvelle évaluation
      const newRating = ModuleRating.create(moduleId, userId, rating, comment, module.version)
      await this.ratingRepository.save(newRating)
      
      // Mettre à jour la moyenne du module
      module.updateRating(rating)
      await this.moduleRepository.save(module)
      
      return newRating
    }
  }

  async getModuleRatings(moduleId: string, limit: number = 10): Promise<ModuleRating[]> {
    return await this.ratingRepository.find({
      where: { moduleId, isVisible: true },
      order: { createdAt: 'DESC' },
      take: limit
    })
  }

  // ===== MÉTHODES PRIVÉES =====

  private async checkDependencies(tenantId: string, dependencies: string[]): Promise<{success: boolean, missingDependencies: string[]}> {
    if (!dependencies || dependencies.length === 0) {
      return { success: true, missingDependencies: [] }
    }

    const installedModulesWithDetails = await this.getInstalledModulesWithDetails(tenantId)
    const installedKeys = installedModulesWithDetails.map(inst => inst.module.moduleKey)
    
    const missingDependencies = dependencies.filter(dep => !installedKeys.includes(dep))
    
    return {
      success: missingDependencies.length === 0,
      missingDependencies
    }
  }

  private async performInstallation(installation: ModuleInstallation, module: MarketplaceModuleEntity): Promise<{success: boolean, error?: string}> {
    try {
      // 1. Créer les permissions si définies
      if (module.permissions && module.permissions.length > 0) {
        installation.addLog('INFO', 'Création des permissions du module')
        // TODO: Implémenter la création des permissions
      }

      // 2. Intégrer la configuration de menu si définie
      if (module.menuConfiguration && module.menuConfiguration.length > 0) {
        installation.addLog('INFO', 'Intégration de la configuration de menu')
        await this.integrateMenuConfiguration(module.menuConfiguration, installation.tenantId)
      }

      // 3. Enregistrer les routes API si définies
      if (module.apiRoutes && module.apiRoutes.length > 0) {
        installation.addLog('INFO', 'Enregistrement des routes API')
        // TODO: Implémenter l'enregistrement des routes API
      }

      installation.addLog('INFO', 'Installation terminée avec succès')
      return { success: true }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      installation.addLog('ERROR', `Erreur d'installation: ${errorMessage}`)
      return { success: false, error: errorMessage }
    }
  }

  private async performUninstallation(installation: ModuleInstallation): Promise<{success: boolean, error?: string}> {
    try {
      // 1. Supprimer la configuration de menu
      installation.addLog('INFO', 'Suppression de la configuration de menu')
      // TODO: Implémenter la suppression de la configuration de menu

      // 2. Nettoyer les routes API
      installation.addLog('INFO', 'Nettoyage des routes API')
      // TODO: Implémenter le nettoyage des routes API

      // 3. Supprimer les permissions (si pas utilisées par d'autres modules)
      installation.addLog('INFO', 'Nettoyage des permissions')
      // TODO: Implémenter le nettoyage des permissions

      installation.addLog('INFO', 'Désinstallation terminée avec succès')
      return { success: true }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      installation.addLog('ERROR', `Erreur de désinstallation: ${errorMessage}`)
      return { success: false, error: errorMessage }
    }
  }

  private async integrateMenuConfiguration(menuConfig: any[], tenantId: string): Promise<void> {
    // Pour l'instant, log simplement l'intégration
    // TODO: Implémenter l'intégration avec MenuRawService une fois que les entités de menu seront stabilisées
    console.log(`Integration des menus pour le tenant ${tenantId}:`, menuConfig)
  }

  private async recalculateModuleRating(moduleId: string, oldRating: number, newRating: number): Promise<void> {
    const module = await this.findModuleById(moduleId)
    
    // Recalculer la moyenne
    const totalScore = module.ratingAverage * module.ratingCount - oldRating + newRating
    module.ratingAverage = Number((totalScore / module.ratingCount).toFixed(2))
    
    await this.moduleRepository.save(module)
  }
}