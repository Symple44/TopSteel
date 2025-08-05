/**
 * Service de calcul de prix pour articles métallurgie
 * TopSteel ERP - Clean Architecture
 */

import {
  PricingCalculator,
  CaracteristiquesTechniques,
  ArticleFamille,
  InjectionLogger,
} from '../types/article-injection.types'

interface MaterialPricing {
  basePrice: number // €/kg
  complexity: number // facteur de complexité
  availability: number // facteur de disponibilité
}

interface FamilyMargin {
  base: number
  min: number
  max: number
}

export class PricingCalculatorService implements PricingCalculator {
  private logger: InjectionLogger

  // Prix de base matériaux (€/kg)
  private readonly materialPrices: Record<string, MaterialPricing> = {
    // Aciers construction
    S235JR: { basePrice: 0.85, complexity: 1.0, availability: 1.0 },
    S275JR: { basePrice: 0.92, complexity: 1.1, availability: 1.0 },
    S355JR: { basePrice: 1.15, complexity: 1.2, availability: 0.95 },
    S460JR: { basePrice: 1.45, complexity: 1.4, availability: 0.9 },

    // Aciers pour profilés creux (JH = Hollow)
    S235JH: { basePrice: 0.88, complexity: 1.1, availability: 0.98 },
    S275JH: { basePrice: 0.95, complexity: 1.2, availability: 0.98 },
    S355JH: { basePrice: 1.18, complexity: 1.3, availability: 0.93 },

    // Inox
    '304': { basePrice: 4.2, complexity: 1.3, availability: 0.95 },
    '304L': { basePrice: 4.35, complexity: 1.3, availability: 0.95 },
    '316': { basePrice: 5.8, complexity: 1.4, availability: 0.9 },
    '316L': { basePrice: 6.1, complexity: 1.4, availability: 0.9 },
    '430': { basePrice: 3.5, complexity: 1.2, availability: 0.95 },

    // Aluminium
    '1050': { basePrice: 2.1, complexity: 1.1, availability: 1.0 },
    '5754': { basePrice: 2.35, complexity: 1.2, availability: 0.95 },
    '6060': { basePrice: 2.5, complexity: 1.3, availability: 0.95 },
    '6082': { basePrice: 2.7, complexity: 1.4, availability: 0.9 },
  }

  // Marges par famille de produits
  private readonly familyMargins: Record<ArticleFamille, FamilyMargin> = {
    [ArticleFamille.PROFILES_ACIER]: { base: 35, min: 25, max: 50 },
    [ArticleFamille.TUBES_PROFILES]: { base: 40, min: 30, max: 55 },
    [ArticleFamille.ACIERS_LONGS]: { base: 30, min: 20, max: 45 },
    [ArticleFamille.TOLES_PLAQUES]: { base: 25, min: 18, max: 40 },
    [ArticleFamille.COUVERTURE_BARDAGE]: { base: 45, min: 35, max: 65 },
  }

  constructor(logger: InjectionLogger) {
    this.logger = logger
  }

  calculateBasePrice(caracteristiques: CaracteristiquesTechniques, material: string): number {
    try {
      const materialInfo = this.materialPrices[material]
      if (!materialInfo) {
        this.logger.warn(`Matériau inconnu pour le pricing: ${material}, utilisation S235JR`)
        return this.materialPrices['S235JR'].basePrice * (caracteristiques.poids || 1)
      }

      // Prix de base = prix matériau × poids
      let basePrice = materialInfo.basePrice * (caracteristiques.poids || 1)

      // Facteur de complexité selon le type de produit
      basePrice *= this.getComplexityFactor(caracteristiques)

      // Facteur de disponibilité matériau
      basePrice *= materialInfo.availability

      // Facteur de dimensions (produits très petits ou très grands)
      basePrice *= this.getDimensionFactor(caracteristiques)

      // Facteur de finition/traitement
      basePrice *= this.getFinishFactor(caracteristiques)

      // Arrondir à 2 décimales
      return Math.round(basePrice * 100) / 100
    } catch (error) {
      this.logger.error(`Erreur calcul prix de base pour ${material}`, error as Error)
      return 1.0 // Prix de fallback
    }
  }

  calculateMargin(basePrice: number, famille: ArticleFamille): number {
    try {
      const margins = this.familyMargins[famille]
      if (!margins) {
        this.logger.warn(`Famille inconnue pour le calcul de marge: ${famille}`)
        return 35 // Marge par défaut
      }

      let margin = margins.base

      // Ajustement selon le prix de base
      if (basePrice < 5) {
        // Articles bon marché: marge plus élevée
        margin += 10
      } else if (basePrice > 50) {
        // Articles chers: marge réduite
        margin -= 5
      }

      // Borner la marge
      margin = Math.max(margins.min, Math.min(margins.max, margin))

      return Math.round(margin * 100) / 100
    } catch (error) {
      this.logger.error(`Erreur calcul marge pour famille ${famille}`, error as Error)
      return 35 // Marge par défaut
    }
  }

  applyVolumeDiscount(price: number, dimensions: CaracteristiquesTechniques): number {
    try {
      // Remise volume basée sur le poids ou la surface
      let discount = 0

      const weight = dimensions.poids || 0
      const surface = dimensions.surface || 0

      // Remise selon le poids
      if (weight > 100) {
        discount += 5 // 5% pour > 100kg/ml
      } else if (weight > 50) {
        discount += 3 // 3% pour > 50kg/ml
      } else if (weight > 20) {
        discount += 1 // 1% pour > 20kg/ml
      }

      // Remise selon la surface (pour tôles)
      if (surface && surface > 10) {
        discount += 2 // 2% pour > 10m²
      }

      // Appliquer la remise
      const discountedPrice = price * (1 - discount / 100)

      return Math.round(discountedPrice * 100) / 100
    } catch (error) {
      this.logger.error('Erreur application remise volume', error as Error)
      return price
    }
  }

  private getComplexityFactor(caracteristiques: CaracteristiquesTechniques): number {
    let factor = 1.0

    // Facteur selon le type de produit
    const specs = caracteristiques.specifications || {}

    if (specs.typeProfile === 'IPE' || specs.typeProfile === 'HEA' || specs.typeProfile === 'HEB') {
      factor = 1.2 // Profilés laminés plus complexes
    } else if (specs.typeTube === 'CARRE' || specs.typeTube === 'RECTANGULAIRE') {
      factor = 1.3 // Tubes formés plus complexes
    } else if (specs.typeTole === 'LARMEE' || specs.typeTole === 'GAUFFREE') {
      factor = 1.4 // Tôles façonnées plus complexes
    } else if (specs.typeTole === 'PERFOREE') {
      factor = 1.6 // Perforation = usinage supplémentaire
    }

    // Facteur selon les traitements
    if (caracteristiques.revetement && caracteristiques.revetement !== 'Brut') {
      factor *= 1.2
    }

    if (caracteristiques.traitement && caracteristiques.traitement !== 'Laminé à chaud') {
      factor *= 1.15
    }

    return factor
  }

  private getDimensionFactor(caracteristiques: CaracteristiquesTechniques): number {
    let factor = 1.0

    // Facteur selon la taille
    const maxDim = Math.max(
      caracteristiques.hauteur || 0,
      caracteristiques.largeur || 0,
      caracteristiques.diametre || 0,
      caracteristiques.longueur || 0
    )

    if (maxDim < 20) {
      factor = 1.3 // Petites dimensions = plus cher
    } else if (maxDim > 500) {
      factor = 1.2 // Grandes dimensions = plus cher
    }

    // Facteur selon l'épaisseur
    if (caracteristiques.epaisseur) {
      if (caracteristiques.epaisseur < 1) {
        factor *= 1.25 // Épaisseurs très fines
      } else if (caracteristiques.epaisseur > 50) {
        factor *= 1.15 // Épaisseurs très fortes
      }
    }

    return factor
  }

  private getFinishFactor(caracteristiques: CaracteristiquesTechniques): number {
    let factor = 1.0

    // Facteur selon le revêtement
    if (caracteristiques.revetement) {
      const revetementFactors: Record<string, number> = {
        Brut: 1.0,
        Galvanisé: 1.3,
        Thermolaqué: 1.5,
        Anodisé: 1.4,
        Passivé: 1.1,
        Peinture: 1.2,
      }
      factor *= revetementFactors[caracteristiques.revetement] || 1.0
    }

    // Facteur selon la finition de surface
    if (caracteristiques.specifications?.etatSurface) {
      const surfaceFactors: Record<string, number> = {
        Brute: 1.0,
        '2B': 1.1, // Inox
        BA: 1.3, // Inox poli
        'Larmée quinze': 1.2,
        Gaufrée: 1.15,
        Polie: 1.4,
        Brossée: 1.2,
      }
      factor *= surfaceFactors[caracteristiques.specifications.etatSurface] || 1.0
    }

    return factor
  }

  // Méthodes utilitaires pour l'analyse de prix

  getPriceRange(
    famille: ArticleFamille,
    material: string
  ): { min: number; max: number; average: number } {
    const materialInfo = this.materialPrices[material] || this.materialPrices['S235JR']
    const margins = this.familyMargins[famille]

    const baseMin = materialInfo.basePrice * 0.5 // Poids minimum 0.5kg/ml
    const baseMax = materialInfo.basePrice * 200 // Poids maximum 200kg/ml

    const min = baseMin * (1 + margins.min / 100)
    const max = baseMax * (1 + margins.max / 100)
    const average = (min + max) / 2

    return { min, max, average }
  }

  getMaterialCost(material: string): number {
    return this.materialPrices[material]?.basePrice || 0.85
  }

  getFamilyMargin(famille: ArticleFamille): number {
    return this.familyMargins[famille]?.base || 35
  }
}
