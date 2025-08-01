import { Inject, Injectable } from '@nestjs/common'
import { BusinessService } from '../../core/base/business-service'
import { BusinessOperation, type BusinessContext, type ValidationResult } from '../../core/interfaces/business-service.interface'
import { Material, MaterialStatus, MaterialType, MaterialShape, StorageMethod } from '../entities/material.entity'
import { IMaterialRepository } from '../repositories/material.repository'
import type { MaterialStockAlert, MaterialCompatibilityAnalysis } from '../repositories/material.repository'

/**
 * Service métier pour la gestion des matériaux industriels
 */
@Injectable()
export class MaterialService extends BusinessService<Material> {
  constructor(
    @Inject('IMaterialRepository')
    private readonly materialRepository: IMaterialRepository
  ) {
    super(materialRepository, 'MaterialService')
  }

  /**
   * Valider les règles métier spécifiques aux matériaux
   */
  async validateBusinessRules(entity: Material, operation: BusinessOperation): Promise<ValidationResult> {
    const errors: Array<{field: string, message: string, code: string}> = []
    const warnings: Array<{field: string, message: string, code: string}> = []

    // 1. Validation de base de l'entité
    const entityErrors = entity.validate()
    errors.push(...entityErrors.map(msg => ({ field: 'general', message: msg, code: 'VALIDATION_ERROR' })))

    // 2. Règles métier spécifiques selon l'opération
    switch (operation) {
      case BusinessOperation.CREATE:
        await this.validateCreationRules(entity, errors, warnings)
        break
      case BusinessOperation.UPDATE:
        await this.validateUpdateRules(entity, errors, warnings)
        break
      case BusinessOperation.DELETE:
        await this.validateDeletionRules(entity, errors, warnings)
        break
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Construire une entité Material
   */
  protected async buildEntity(data: Partial<Material>): Promise<Material> {
    const material = new Material()
    
    // Générer une référence automatique si non fournie
    if (!data.reference) {
      material.reference = await this.generateReference(data.type!, data.forme!)
    } else {
      material.reference = data.reference
    }

    // Informations de base obligatoires
    material.nom = data.nom || ''
    material.type = data.type!
    material.forme = data.forme!
    material.status = data.status || MaterialStatus.ACTIF
    material.description = data.description

    // Caractéristiques du matériau
    material.nuance = data.nuance
    material.qualite = data.qualite
    material.marque = data.marque
    material.modele = data.modele

    // Dimensions et propriétés physiques
    material.dimensions = data.dimensions || {}
    material.poidsUnitaire = data.poidsUnitaire
    material.densite = data.densite
    material.unite = data.unite!

    // Informations économiques
    material.prixUnitaire = data.prixUnitaire
    material.devise = data.devise || 'EUR'

    // Gestion des stocks
    material.stockMini = data.stockMini || 0
    material.stockMaxi = data.stockMaxi || 0
    material.stockPhysique = data.stockPhysique || 0
    material.stockReserve = data.stockReserve || 0
    material.emplacement = data.emplacement
    material.methodeStockage = data.methodeStockage || StorageMethod.STANDARD

    // Propriétés techniques
    material.proprietesMecaniques = data.proprietesMecaniques || {}
    material.proprietesPhysiques = data.proprietesPhysiques || {}
    material.proprietesChimiques = data.proprietesChimiques || {}
    material.certifications = data.certifications || {}

    // Informations d'approvisionnement et production
    material.informationsApprovisionnement = data.informationsApprovisionnement || {}
    material.informationsProduction = data.informationsProduction || {}

    // Sécurité
    material.dangereux = data.dangereux || false
    material.classeDanger = data.classeDanger
    material.precautionsManipulation = data.precautionsManipulation

    // État et traçabilité
    material.obsolete = data.obsolete || false
    material.remplacePar = data.remplacePar
    material.notes = data.notes
    material.sharedMaterialId = data.sharedMaterialId

    // Métadonnées
    material.metadonnees = data.metadonnees || {}

    // Dates
    material.dateCreationFiche = new Date()

    return material
  }

  /**
   * Appliquer les mises à jour
   */
  protected async applyUpdates(existing: Material, updates: Partial<Material>): Promise<Material> {
    // Conserver l'ancienne valeur pour l'historique
    const oldValues = { ...existing }

    // Appliquer les mises à jour (sauf référence qui ne peut pas changer)
    Object.keys(updates).forEach(key => {
      if (key !== 'reference' && updates[key] !== undefined) {
        const oldValue = existing[key]
        existing[key] = updates[key]
        
        // Ajouter à l'historique si la valeur a changé
        if (oldValue !== updates[key]) {
          existing.ajouterModificationHistorique(key, oldValue, updates[key], 'SYSTEM')
        }
      }
    })

    existing.markAsModified()
    return existing
  }

  protected getEntityName(): string {
    return 'Material'
  }

  /**
   * Méthodes métier spécifiques
   */

  /**
   * Rechercher des matériaux par critères
   */
  async searchMaterials(criteria: MaterialSearchCriteria): Promise<Material[]> {
    this.logger.log('Recherche de matériaux avec critères', criteria)
    return await this.materialRepository.searchByCriteria(criteria)
  }

  /**
   * Obtenir les matériaux en rupture
   */
  async getMaterialsEnRupture(): Promise<Material[]> {
    return await this.materialRepository.findByStockCondition('rupture')
  }

  /**
   * Obtenir les matériaux sous stock minimum
   */
  async getMaterialsSousStockMini(): Promise<Material[]> {
    return await this.materialRepository.findByStockCondition('sous_mini')
  }

  /**
   * Obtenir les matériaux à réapprovisionner
   */
  async getMaterialsAReapprovisionner(): Promise<Array<Material & { quantiteACommander: number }>> {
    const materials = await this.getMaterialsSousStockMini()
    
    return materials.map(material => Object.assign(material, {
      quantiteACommander: material.calculerQuantiteACommander()
    })).filter(item => item.quantiteACommander > 0)
  }

  /**
   * Obtenir les matériaux dangereux
   */
  async getMaterialsDangereux(): Promise<Material[]> {
    return await this.materialRepository.findHazardousMaterials()
  }

  /**
   * Obtenir les matériaux nécessitant un stockage spécial
   */
  async getMaterialsStockageSpecial(): Promise<Material[]> {
    return await this.materialRepository.findRequiringSpecialStorage()
  }

  /**
   * Obtenir les matériaux obsolètes
   */
  async getMaterialsObsoletes(): Promise<Material[]> {
    return await this.materialRepository.findObsoleteMaterials()
  }

  /**
   * Créer automatiquement une commande de réapprovisionnement
   */
  async creerCommandeReapprovisionnement(
    fournisseurId: string,
    context?: BusinessContext
  ): Promise<{ materials: Material[], quantitesTotales: number }> {
    const materialsAReapprovisionner = await this.getMaterialsAReapprovisionner()
    
    // Filtrer par fournisseur
    const materialsFournisseur = materialsAReapprovisionner.filter(
      item => item.informationsApprovisionnement?.fournisseurPrincipalId === fournisseurId
    )

    if (materialsFournisseur.length === 0) {
      throw new Error('Aucun matériau à réapprovisionner pour ce fournisseur')
    }

    const quantitesTotales = materialsFournisseur.reduce(
      (sum, item) => sum + item.quantiteACommander, 0
    )

    this.logger.log(`Commande de réapprovisionnement créée: ${materialsFournisseur.length} matériaux, ${quantitesTotales} unités`)

    return {
      materials: materialsFournisseur,
      quantitesTotales
    }
  }

  /**
   * Effectuer un inventaire sur un matériau
   */
  async effectuerInventaire(
    materialId: string,
    stockPhysiqueReel: number,
    commentaire?: string,
    context?: BusinessContext
  ): Promise<Material> {
    const material = await this.findById(materialId, context)
    if (!material) {
      throw new Error('Matériau introuvable')
    }

    const ancienStock = material.stockPhysique || 0
    const ecart = stockPhysiqueReel - ancienStock

    // Mettre à jour le stock
    material.stockPhysique = stockPhysiqueReel
    material.dateDernierInventaire = new Date()

    // Ajouter à l'historique
    material.ajouterModificationHistorique(
      'inventaire',
      ancienStock,
      stockPhysiqueReel,
      context?.userId || 'SYSTEM'
    )

    if (commentaire) {
      if (!material.metadonnees) material.metadonnees = {}
      material.metadonnees.notes = commentaire
    }

    const updatedMaterial = await this.repository.save(material)

    this.logger.log(`Inventaire effectué sur ${material.reference}: ${ancienStock} → ${stockPhysiqueReel} (écart: ${ecart})`)

    return updatedMaterial
  }

  /**
   * Analyser la compatibilité entre matériaux
   */
  async analyserCompatibilite(materialId: string): Promise<MaterialCompatibilityAnalysis> {
    const material = await this.findById(materialId)
    if (!material) {
      throw new Error('Matériau introuvable')
    }

    const allMaterials = await this.materialRepository.findByStatus(MaterialStatus.ACTIF)
    const compatibleMaterials: Array<{materialId: string, reference: string, nom: string, scoreCompatibilite: number, raisons: string[]}> = []
    const incompatibleMaterials: Array<{materialId: string, reference: string, nom: string, raisons: string[]}> = []

    for (const otherMaterial of allMaterials) {
      if (otherMaterial.id === materialId) continue

      if (material.estCompatibleAvec(otherMaterial)) {
        let score = 50 // Score de base

        // Augmenter le score selon les critères
        if (material.type === otherMaterial.type) score += 20
        if (material.forme === otherMaterial.forme) score += 15
        if (material.methodeStockage === otherMaterial.methodeStockage) score += 10
        if (material.dangereux === otherMaterial.dangereux) score += 5

        compatibleMaterials.push({
          materialId: otherMaterial.id,
          reference: otherMaterial.reference,
          nom: otherMaterial.nom,
          scoreCompatibilite: Math.min(100, score),
          raisons: this.getCompatibilityReasons(material, otherMaterial)
        })
      } else {
        incompatibleMaterials.push({
          materialId: otherMaterial.id,
          reference: otherMaterial.reference,
          nom: otherMaterial.nom,
          raisons: this.getIncompatibilityReasons(material, otherMaterial)
        })
      }
    }

    return {
      materialId,
      compatibleMaterials: compatibleMaterials.sort((a, b) => b.scoreCompatibilite - a.scoreCompatibilite),
      incompatibleMaterials
    }
  }

  /**
   * Calculer la valorisation totale du stock
   */
  async calculerValorisationStock(type?: MaterialType): Promise<MaterialStockValorisation> {
    let materials: Material[]
    
    if (type) {
      materials = await this.materialRepository.findByType(type)
    } else {
      materials = await this.materialRepository.findByStatus(MaterialStatus.ACTIF)
    }

    const valorisation: MaterialStockValorisation = {
      nombreMateriaux: materials.length,
      valeurTotale: 0,
      valeurParType: {} as Record<MaterialType, number>,
      valeurParForme: {} as Record<MaterialShape, number>,
      materialsSansStock: 0,
      materialsEnRupture: 0,
      materialsSousStockMini: 0,
      materialsStockageSpecial: 0,
      materialsDangereux: 0
    }

    materials.forEach(material => {
      const valeurMaterial = material.getValeurStock()
      valorisation.valeurTotale += valeurMaterial

      // Par type
      const type = material.type
      if (!valorisation.valeurParType[type]) {
        valorisation.valeurParType[type] = 0
      }
      valorisation.valeurParType[type] += valeurMaterial

      // Par forme
      const forme = material.forme
      if (!valorisation.valeurParForme[forme]) {
        valorisation.valeurParForme[forme] = 0
      }
      valorisation.valeurParForme[forme] += valeurMaterial

      // Statistiques de stock
      if ((material.stockPhysique || 0) === 0) {
        valorisation.materialsSansStock++
      }
      if (material.estEnRupture()) {
        valorisation.materialsEnRupture++
      }
      if (material.estSousStockMini()) {
        valorisation.materialsSousStockMini++
      }
      if (material.necessiteStockageSpecial()) {
        valorisation.materialsStockageSpecial++
      }
      if (material.dangereux) {
        valorisation.materialsDangereux++
      }
    })

    return valorisation
  }

  /**
   * Obtenir les statistiques des matériaux
   */
  async getStatistiques(): Promise<MaterialStatistics> {
    return await this.materialRepository.getMaterialStats()
  }

  /**
   * Dupliquer un matériau (pour créer une variante)
   */
  async dupliquerMaterial(
    materialId: string,
    nouvelleReference: string,
    modifications: Partial<Material> = {},
    context?: BusinessContext
  ): Promise<Material> {
    const materialOriginal = await this.findById(materialId, context)
    if (!materialOriginal) {
      throw new Error('Matériau original introuvable')
    }

    // Créer une copie
    const materialCopie = { ...materialOriginal }
    delete (materialCopie as any).id
    delete (materialCopie as any).createdAt
    delete (materialCopie as any).updatedAt

    // Appliquer les modifications
    materialCopie.reference = nouvelleReference
    Object.assign(materialCopie, modifications)

    // Réinitialiser les stocks
    materialCopie.stockPhysique = 0
    materialCopie.stockReserve = 0

    // Ajouter une note sur l'origine
    if (!materialCopie.metadonnees) materialCopie.metadonnees = {}
    materialCopie.metadonnees.notes = `Créé par duplication de ${materialOriginal.reference}`

    return await this.create(materialCopie, context)
  }

  /**
   * Marquer un matériau comme obsolète
   */
  async marquerObsolete(
    materialId: string,
    remplacePar?: string,
    raison?: string,
    context?: BusinessContext
  ): Promise<Material> {
    const material = await this.findById(materialId, context)
    if (!material) {
      throw new Error('Matériau introuvable')
    }

    material.marquerObsolete(remplacePar, raison)
    
    const updatedMaterial = await this.repository.save(material)

    this.logger.log(`Matériau ${material.reference} marqué comme obsolète${remplacePar ? `, remplacé par ${remplacePar}` : ''}`)

    return updatedMaterial
  }

  /**
   * Obtenir les alertes de stock
   */
  async getAlertes(): Promise<MaterialStockAlert[]> {
    const alertes: MaterialStockAlert[] = []

    // Matériaux en rupture
    const enRupture = await this.getMaterialsEnRupture()
    for (const material of enRupture) {
      alertes.push({
        materialId: material.id,
        reference: material.reference,
        nom: material.nom,
        type: 'RUPTURE',
        niveau: 'CRITICAL',
        message: 'Stock épuisé',
        stockActuel: material.calculerStockDisponible(),
        stockMini: material.stockMini,
        quantiteACommander: material.calculerQuantiteACommander(),
        emplacement: material.emplacement,
        methodeStockage: material.methodeStockage,
        dangereux: material.dangereux,
        dateAlerte: new Date()
      })
    }

    // Matériaux sous stock minimum
    const sousStockMini = await this.getMaterialsSousStockMini()
    for (const material of sousStockMini) {
      if (!material.estEnRupture()) { // Éviter les doublons
        alertes.push({
          materialId: material.id,
          reference: material.reference,
          nom: material.nom,
          type: 'SOUS_STOCK_MINI',
          niveau: 'WARNING',
          message: 'Stock sous le seuil minimum',
          stockActuel: material.calculerStockDisponible(),
          stockMini: material.stockMini,
          quantiteACommander: material.calculerQuantiteACommander(),
          emplacement: material.emplacement,
          methodeStockage: material.methodeStockage,
          dangereux: material.dangereux,
          dateAlerte: new Date()
        })
      }
    }

    return alertes.sort((a, b) => {
      const niveauOrder = { 'CRITICAL': 3, 'WARNING': 2, 'INFO': 1 }
      return niveauOrder[b.niveau] - niveauOrder[a.niveau]
    })
  }

  /**
   * Méthodes privées
   */

  private async validateCreationRules(entity: Material, errors: Array<{field: string, message: string, code: string}>, warnings: Array<{field: string, message: string, code: string}>): Promise<void> {
    // Vérifier l'unicité de la référence
    const existingByRef = await this.materialRepository.findByReference(entity.reference)
    if (existingByRef) {
      errors.push({ field: 'reference', message: 'Cette référence existe déjà', code: 'REFERENCE_DUPLICATE' })
    }

    // Vérifier que le fournisseur existe si spécifié
    if (entity.informationsApprovisionnement?.fournisseurPrincipalId) {
      // Ici vous pourriez vérifier que le fournisseur existe
      // const fournisseur = await this.partnerService.findById(entity.informationsApprovisionnement.fournisseurPrincipalId)
      // if (!fournisseur || !fournisseur.isFournisseur()) {
      //   errors.push({ field: 'fournisseurPrincipalId', message: 'Fournisseur invalide', code: 'INVALID_SUPPLIER' })
      // }
    }

    // Vérifier la cohérence des dimensions selon la forme
    this.validateDimensionsConsistency(entity, warnings)
  }

  private async validateUpdateRules(entity: Material, errors: Array<{field: string, message: string, code: string}>, warnings: Array<{field: string, message: string, code: string}>): Promise<void> {
    // Un matériau avec des mouvements de stock ne peut pas changer d'unité
    const hasStockMovements = await this.materialRepository.hasStockMovements(entity.id)
    if (hasStockMovements) {
      warnings.push({ field: 'unite', message: 'Ce matériau a des mouvements de stock', code: 'HAS_MOVEMENTS' })
    }

    // Vérifier la cohérence des dimensions
    this.validateDimensionsConsistency(entity, warnings)
  }

  private async validateDeletionRules(entity: Material, errors: Array<{field: string, message: string, code: string}>, warnings: Array<{field: string, message: string, code: string}>): Promise<void> {
    // Interdire la suppression si le matériau a du stock
    if ((entity.stockPhysique || 0) > 0) {
      errors.push({ field: 'general', message: 'Impossible de supprimer un matériau avec du stock', code: 'HAS_STOCK' })
    }

    // Interdire la suppression si le matériau a des mouvements
    const hasMovements = await this.materialRepository.hasStockMovements(entity.id)
    if (hasMovements) {
      errors.push({ field: 'general', message: 'Impossible de supprimer un matériau avec des mouvements', code: 'HAS_MOVEMENTS' })
    }
  }

  private validateDimensionsConsistency(entity: Material, warnings: any[]): void {
    const dim = entity.dimensions
    if (!dim) return

    // Validation selon la forme
    switch (entity.forme) {
      case MaterialShape.TUBE:
        if (!dim.diametre && !dim.diametreExterieur) {
          warnings.push({ field: 'dimensions', message: 'Un tube devrait avoir un diamètre défini', code: 'MISSING_DIAMETER' })
        }
        break
      
      case MaterialShape.PLAQUE:
        if (!dim.longueur || !dim.largeur || !dim.epaisseur) {
          warnings.push({ field: 'dimensions', message: 'Une plaque devrait avoir longueur, largeur et épaisseur', code: 'MISSING_DIMENSIONS' })
        }
        break
      
      case MaterialShape.BARRE:
        if (!dim.longueur) {
          warnings.push({ field: 'dimensions', message: 'Une barre devrait avoir une longueur définie', code: 'MISSING_LENGTH' })
        }
        break
    }

    // Validation de cohérence poids/dimensions/densité
    if (entity.densite && dim.longueur && dim.largeur && dim.epaisseur && entity.poidsUnitaire) {
      const volumeCalcule = (dim.longueur / 1000) * (dim.largeur / 1000) * (dim.epaisseur / 1000) // m³
      const poidsCalcule = volumeCalcule * entity.densite * 1000 // kg
      const ecartPourcentage = Math.abs(poidsCalcule - entity.poidsUnitaire) / entity.poidsUnitaire * 100
      
      if (ecartPourcentage > 10) {
        warnings.push({ 
          field: 'poidsUnitaire', 
          message: `Incohérence entre poids déclaré (${entity.poidsUnitaire}kg) et poids calculé (${poidsCalcule.toFixed(2)}kg)`, 
          code: 'WEIGHT_INCONSISTENCY' 
        })
      }
    }
  }

  private async generateReference(type: MaterialType, forme: MaterialShape): Promise<string> {
    const typePrefixes = {
      [MaterialType.ACIER]: 'AC',
      [MaterialType.INOX]: 'IN',
      [MaterialType.ALUMINIUM]: 'AL',
      [MaterialType.CUIVRE]: 'CU',
      [MaterialType.FONTE]: 'FO',
      [MaterialType.BRONZE]: 'BR',
      [MaterialType.LAITON]: 'LA',
      [MaterialType.PLASTIQUE]: 'PL',
      [MaterialType.COMPOSITE]: 'CO',
      [MaterialType.AUTRE]: 'AU'
    }

    const formePrefixes = {
      [MaterialShape.PLAQUE]: 'PL',
      [MaterialShape.TUBE]: 'TB',
      [MaterialShape.BARRE]: 'BR',
      [MaterialShape.PROFILE]: 'PR',
      [MaterialShape.TOLE]: 'TL',
      [MaterialShape.FIL]: 'FI',
      [MaterialShape.ROND]: 'RD',
      [MaterialShape.CARRE]: 'CA',
      [MaterialShape.RECTANGLE]: 'RE',
      [MaterialShape.CORNIERE]: 'CN',
      [MaterialShape.U]: 'U',
      [MaterialShape.T]: 'T',
      [MaterialShape.AUTRE]: 'AU'
    }

    const typePrefix = typePrefixes[type] || 'MT'
    const formePrefix = formePrefixes[forme] || 'XX'
    const count = await this.materialRepository.countByType(type)
    
    return `${typePrefix}-${formePrefix}-${(count + 1).toString().padStart(6, '0')}`
  }

  private getCompatibilityReasons(material1: Material, material2: Material): string[] {
    const reasons: string[] = []
    
    if (material1.type === material2.type) {
      reasons.push('Même type de matériau')
    }
    
    if (material1.forme === material2.forme) {
      reasons.push('Même forme')
    }
    
    if (material1.methodeStockage === material2.methodeStockage) {
      reasons.push('Même méthode de stockage')
    }
    
    if (material1.dangereux === material2.dangereux) {
      reasons.push('Même niveau de dangerosité')
    }

    return reasons
  }

  private getIncompatibilityReasons(material1: Material, material2: Material): string[] {
    const reasons: string[] = []
    
    if (material1.dangereux !== material2.dangereux) {
      reasons.push('Niveaux de dangerosité différents')
    }
    
    if (material1.methodeStockage !== material2.methodeStockage) {
      reasons.push('Méthodes de stockage incompatibles')
    }

    // Vérifier les incompatibilités chimiques
    if (material1.proprietesChimiques?.compatibiliteChimique) {
      if (!material1.proprietesChimiques.compatibiliteChimique.includes(material2.type)) {
        reasons.push('Incompatibilité chimique')
      }
    }

    return reasons
  }
}

/**
 * Interfaces pour les critères de recherche et statistiques
 */
export interface MaterialSearchCriteria {
  type?: MaterialType[]
  forme?: MaterialShape[]
  status?: MaterialStatus[]
  nuance?: string[]
  nom?: string
  reference?: string
  marque?: string
  fournisseurId?: string
  stockCondition?: 'rupture' | 'sous_mini' | 'normal' | 'surstock'
  dangereux?: boolean
  obsolete?: boolean
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface MaterialStockValorisation {
  nombreMateriaux: number
  valeurTotale: number
  valeurParType: Record<MaterialType, number>
  valeurParForme: Record<MaterialShape, number>
  materialsSansStock: number
  materialsEnRupture: number
  materialsSousStockMini: number
  materialsStockageSpecial: number
  materialsDangereux: number
}

export interface MaterialStatistics {
  totalMateriaux: number
  repartitionParType: Record<MaterialType, number>
  repartitionParForme: Record<MaterialShape, number>
  repartitionParStatus: Record<MaterialStatus, number>
  repartitionParStockage: Record<StorageMethod, number>
  valeurTotaleStock: number
  materialsEnRupture: number
  materialsSousStockMini: number
  materialsObsoletes: number
  materialsDangereux: number
  materialsStockageSpecial: number
}