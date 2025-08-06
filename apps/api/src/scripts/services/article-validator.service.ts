/**
 * Service de validation pour articles métallurgie
 * TopSteel ERP - Clean Architecture
 */

import {
  ArticleFamille,
  type ArticleMetallurgie,
  type ArticleValidator,
  type CaracteristiquesTechniques,
  type InjectionLogger,
} from '../types/article-injection.types'

export class ArticleValidatorService implements ArticleValidator {
  private logger: InjectionLogger

  constructor(logger: InjectionLogger) {
    this.logger = logger
  }

  validateReference(reference: string): boolean {
    // Référence ne peut pas être vide
    if (!reference || reference.trim().length === 0) {
      this.logger.warn('Référence vide ou nulle')
      return false
    }

    // Longueur maximale
    if (reference.length > 50) {
      this.logger.warn(`Référence trop longue: ${reference}`)
      return false
    }

    // Caractères autorisés: lettres, chiffres, tirets, underscores, points, x (pour dimensions), Ø (pour diamètres)
    const validPattern = /^[A-Z0-9_.xØ-]+$/
    if (!validPattern.test(reference)) {
      this.logger.warn(`Référence contient des caractères invalides: ${reference}`)
      return false
    }

    // Vérifier format cohérent (commence par type de produit)
    const validPrefixes = [
      'IPE',
      'HEA',
      'HEB',
      'UPN',
      'IPN',
      'TUBE',
      'TOLE',
      'FER',
      'BAC',
      'L',
      'T',
      'F',
      'SHS',
      'RHS',
      'Z',
    ]
    const hasValidPrefix = validPrefixes.some((prefix) => reference.startsWith(prefix))

    if (!hasValidPrefix) {
      this.logger.warn(`Référence sans préfixe valide: ${reference}`)
      return false
    }

    return true
  }

  validateDimensions(caracteristiques: CaracteristiquesTechniques): boolean {
    // Au moins une dimension doit être présente
    const hasDimension = !!(
      caracteristiques.hauteur ||
      caracteristiques.largeur ||
      caracteristiques.longueur ||
      caracteristiques.diametre ||
      caracteristiques.epaisseur
    )

    if (!hasDimension) {
      this.logger.warn('Aucune dimension spécifiée')
      return false
    }

    // Valeurs positives uniquement
    const dimensions = [
      caracteristiques.hauteur,
      caracteristiques.largeur,
      caracteristiques.longueur,
      caracteristiques.diametre,
      caracteristiques.epaisseur,
    ].filter((d) => d !== undefined) as number[]

    for (const dimension of dimensions) {
      if (dimension <= 0) {
        this.logger.warn(`Dimension négative ou nulle: ${dimension}`)
        return false
      }

      // Valeurs raisonnables (max 10m = 10000mm)
      if (dimension > 10000) {
        this.logger.warn(`Dimension excessive: ${dimension}mm`)
        return false
      }
    }

    // Cohérence des dimensions pour profilés
    if (caracteristiques.hauteur && caracteristiques.largeur) {
      // Hauteur généralement >= largeur pour profilés
      if (caracteristiques.hauteur < caracteristiques.largeur / 3) {
        this.logger.warn(
          `Rapport hauteur/largeur incohérent: ${caracteristiques.hauteur}/${caracteristiques.largeur}`
        )
        return false
      }
    }

    // Épaisseur cohérente avec les autres dimensions
    if (caracteristiques.epaisseur) {
      const maxDimension = Math.max(
        caracteristiques.hauteur || 0,
        caracteristiques.largeur || 0,
        caracteristiques.diametre || 0
      )

      if (maxDimension > 0 && caracteristiques.epaisseur > maxDimension / 2) {
        this.logger.warn(
          `Épaisseur excessive par rapport aux dimensions: ${caracteristiques.epaisseur}`
        )
        return false
      }
    }

    return true
  }

  validatePricing(article: ArticleMetallurgie): boolean {
    // Prix de vente requis et positif
    if (!article.prixVenteHt || article.prixVenteHt <= 0) {
      this.logger.warn(`Prix de vente invalide: ${article.prixVenteHt} pour ${article.reference}`)
      return false
    }

    // Prix raisonnable (max 10000€/unité)
    if (article.prixVenteHt > 10000) {
      this.logger.warn(`Prix de vente excessif: ${article.prixVenteHt}€ pour ${article.reference}`)
      return false
    }

    // Taux de marge cohérent
    if (article.tauxMarge !== undefined) {
      if (article.tauxMarge < 0 || article.tauxMarge > 500) {
        this.logger.warn(
          `Taux de marge incohérent: ${article.tauxMarge}% pour ${article.reference}`
        )
        return false
      }
    }

    // Prix d'achat cohérent avec prix de vente
    if (article.prixAchatStandard && article.prixVenteHt) {
      if (article.prixAchatStandard >= article.prixVenteHt) {
        this.logger.warn(`Prix d'achat >= prix de vente pour ${article.reference}`)
        return false
      }
    }

    // Coefficients dans des fourchettes raisonnables
    if (
      article.coefficientAchat &&
      (article.coefficientAchat < 0.1 || article.coefficientAchat > 10)
    ) {
      this.logger.warn(
        `Coefficient d'achat incohérent: ${article.coefficientAchat} pour ${article.reference}`
      )
      return false
    }

    if (
      article.coefficientVente &&
      (article.coefficientVente < 0.1 || article.coefficientVente > 10)
    ) {
      this.logger.warn(
        `Coefficient de vente incohérent: ${article.coefficientVente} pour ${article.reference}`
      )
      return false
    }

    return true
  }

  validateTechnicalSpecs(
    caracteristiques: CaracteristiquesTechniques,
    famille: ArticleFamille
  ): boolean {
    // Validation spécifique par famille
    switch (famille) {
      case ArticleFamille.PROFILES_ACIER:
        return this.validateProfileSpecs(caracteristiques)

      case ArticleFamille.TUBES_PROFILES:
        return this.validateTubeSpecs(caracteristiques)

      case ArticleFamille.TOLES_PLAQUES:
        return this.validateSheetSpecs(caracteristiques)

      case ArticleFamille.ACIERS_LONGS:
        return this.validateBarSpecs(caracteristiques)

      case ArticleFamille.COUVERTURE_BARDAGE:
        return this.validateRoofingSpecs(caracteristiques)

      default:
        return this.validateGenericSpecs(caracteristiques)
    }
  }

  private validateProfileSpecs(caracteristiques: CaracteristiquesTechniques): boolean {
    // Profilés doivent avoir hauteur et largeur
    if (!caracteristiques.hauteur || !caracteristiques.largeur) {
      this.logger.warn('Profilé sans hauteur ou largeur')
      return false
    }

    // Pour cornières (angles), l'épaisseur suffit
    // Pour poutres (IPE, HEA), épaisseur d'âme et d'aile requises
    const isAngle = caracteristiques.specifications?.typeProfile === 'ANGLE'
    if (isAngle) {
      // Pour les cornières, vérifier l'épaisseur générale
      if (!caracteristiques.epaisseur) {
        this.logger.warn('Cornière sans épaisseur')
        return false
      }
    } else {
      if (!caracteristiques.epaisseurAme || !caracteristiques.epaisseurAile) {
        this.logger.warn("Profilé sans épaisseur d'âme ou d'aile")
        return false
      }
    }

    // Moment d'inertie et module de résistance optionnels pour cornières
    if (!isAngle && (!caracteristiques.momentInertieX || !caracteristiques.moduleResistanceX)) {
      this.logger.warn('Profilé sans caractéristiques mécaniques')
      return false
    }

    // Section cohérente avec dimensions (pour poutres uniquement)
    if (
      !isAngle &&
      caracteristiques.section &&
      caracteristiques.epaisseurAme &&
      caracteristiques.epaisseurAile
    ) {
      const sectionApprox =
        2 * caracteristiques.largeur * caracteristiques.epaisseurAile +
        (caracteristiques.hauteur - 2 * caracteristiques.epaisseurAile) *
          caracteristiques.epaisseurAme

      if (
        Math.abs(caracteristiques.section - sectionApprox / 100) >
        caracteristiques.section * 0.3
      ) {
        this.logger.warn(`Section incohérente avec dimensions calculées pour profilé`)
        return false
      }
    }

    return true
  }

  private validateTubeSpecs(caracteristiques: CaracteristiquesTechniques): boolean {
    // Tube rond: diamètre requis
    if (caracteristiques.specifications?.typeTube === 'ROND') {
      if (!caracteristiques.diametre) {
        this.logger.warn('Tube rond sans diamètre')
        return false
      }
    } else {
      // Tube carré/rectangulaire: hauteur et largeur requises
      if (!caracteristiques.hauteur || !caracteristiques.largeur) {
        this.logger.warn('Tube carré/rectangulaire sans dimensions')
        return false
      }
    }

    // Épaisseur requise
    if (!caracteristiques.epaisseur) {
      this.logger.warn('Tube sans épaisseur')
      return false
    }

    return true
  }

  private validateSheetSpecs(caracteristiques: CaracteristiquesTechniques): boolean {
    // Épaisseur requise
    if (!caracteristiques.epaisseur) {
      this.logger.warn('Tôle sans épaisseur')
      return false
    }

    // Dimensions requises (largeur et longueur)
    if (!caracteristiques.largeur || !caracteristiques.longueur) {
      this.logger.warn('Tôle sans dimensions de format')
      return false
    }

    // Poids au m² cohérent
    if (caracteristiques.poids && caracteristiques.specifications?.densité) {
      const poidsCalcule = caracteristiques.epaisseur * caracteristiques.specifications.densité
      if (Math.abs(caracteristiques.poids - poidsCalcule) > poidsCalcule * 0.2) {
        this.logger.warn(`Poids incohérent avec épaisseur et densité pour tôle`)
        return false
      }
    }

    return true
  }

  private validateBarSpecs(caracteristiques: CaracteristiquesTechniques): boolean {
    // Barres rondes: diamètre requis
    // Barres plates: largeur et épaisseur requises
    if (caracteristiques.specifications?.typeBarre === 'ROND') {
      if (!caracteristiques.diametre) {
        this.logger.warn('Barre ronde sans diamètre')
        return false
      }
    } else if (caracteristiques.specifications?.typeBarre === 'PLAT') {
      if (!caracteristiques.largeur || !caracteristiques.epaisseur) {
        this.logger.warn('Barre plate sans largeur ou épaisseur')
        return false
      }
    } else {
      // Validation générique si pas de type spécifié
      if (
        !caracteristiques.diametre &&
        (!caracteristiques.largeur || !caracteristiques.epaisseur)
      ) {
        this.logger.warn('Barre sans dimensions (diamètre ou largeur+épaisseur)')
        return false
      }
    }

    return true
  }

  private validateRoofingSpecs(caracteristiques: CaracteristiquesTechniques): boolean {
    // Largeur utile requise pour bacs
    if (!caracteristiques.largeurUtile) {
      this.logger.warn('Élément de couverture sans largeur utile')
      return false
    }

    // Épaisseur requise
    if (!caracteristiques.epaisseur) {
      this.logger.warn('Élément de couverture sans épaisseur')
      return false
    }

    return true
  }

  private validateGenericSpecs(caracteristiques: CaracteristiquesTechniques): boolean {
    // Validation basique: au moins une caractéristique technique
    const hasSpecs = !!(
      caracteristiques.nuance ||
      caracteristiques.norme ||
      caracteristiques.limiteElastique ||
      caracteristiques.resistanceTraction
    )

    if (!hasSpecs) {
      this.logger.warn('Aucune spécification technique')
      return false
    }

    // Nuance acier valide
    if (caracteristiques.nuance) {
      const validGrades = [
        'S235JR',
        'S275JR',
        'S355JR',
        'S460JR',
        '304',
        '304L',
        '316',
        '316L',
        '1050',
        '5754',
        '6060',
        '6082',
      ]
      if (!validGrades.includes(caracteristiques.nuance)) {
        this.logger.warn(`Nuance inconnue: ${caracteristiques.nuance}`)
        return false
      }
    }

    // Limite élastique cohérente
    if (caracteristiques.limiteElastique) {
      if (caracteristiques.limiteElastique < 50 || caracteristiques.limiteElastique > 1000) {
        this.logger.warn(`Limite élastique incohérente: ${caracteristiques.limiteElastique} MPa`)
        return false
      }
    }

    return true
  }
}
