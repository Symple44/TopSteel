/**
 * Service de conversion d'unités pour le système de pricing
 * Gère les conversions entre différentes unités de mesure
 */

export enum UnitType {
  WEIGHT = 'WEIGHT',
  LENGTH = 'LENGTH',
  SURFACE = 'SURFACE',
  VOLUME = 'VOLUME',
  PIECE = 'PIECE',
}

// Définition des unités avec leurs conversions vers l'unité de base
const UNIT_CONVERSIONS = {
  // POIDS - Unité de base: kilogramme (KG)
  WEIGHT: {
    G: 0.001, // gramme
    KG: 1, // kilogramme (base)
    T: 1000, // tonne
    LB: 0.453592, // livre
  },

  // LONGUEUR - Unité de base: mètre (M)
  LENGTH: {
    MM: 0.001, // millimètre
    CM: 0.01, // centimètre
    M: 1, // mètre (base)
    ML: 1, // mètre linéaire (équivalent au mètre)
    KM: 1000, // kilomètre
  },

  // SURFACE - Unité de base: mètre carré (M2)
  SURFACE: {
    MM2: 0.000001, // millimètre carré
    CM2: 0.0001, // centimètre carré
    M2: 1, // mètre carré (base)
    HA: 10000, // hectare
  },

  // VOLUME - Unité de base: mètre cube (M3)
  VOLUME: {
    MM3: 0.000000001, // millimètre cube
    CM3: 0.000001, // centimètre cube
    ML: 0.000001, // millilitre (= cm3)
    L: 0.001, // litre
    M3: 1, // mètre cube (base)
  },

  // PIÈCE - Pas de conversion
  PIECE: {
    PCS: 1, // pièce
    UNIT: 1, // unité
  },
}

export namespace UnitConversionService {
  /**
   * Détermine le type d'unité
   */
  export function getUnitType(unit: string): UnitType | null {
    const upperUnit = unit.toUpperCase()

    for (const [type, units] of Object.entries(UNIT_CONVERSIONS)) {
      if (upperUnit in units) {
        return type as UnitType
      }
    }

    return null
  }

  /**
   * Convertit une valeur d'une unité à une autre
   * @param value La valeur à convertir
   * @param fromUnit L'unité source
   * @param toUnit L'unité cible
   * @returns La valeur convertie ou null si conversion impossible
   */
  export function convert(value: number, fromUnit: string, toUnit: string): number | null {
    const fromUpper = fromUnit.toUpperCase()
    const toUpper = toUnit.toUpperCase()

    // Si les unités sont identiques
    if (fromUpper === toUpper) return value

    // Déterminer le type d'unité
    const fromType = getUnitType(fromUpper)
    const toType = getUnitType(toUpper)

    // Vérifier que les types correspondent
    if (!fromType || !toType || fromType !== toType) {
      return null
    }

    // Récupérer les facteurs de conversion
    const conversions = UNIT_CONVERSIONS[fromType] as Record<string, number>
    const fromFactor = conversions[fromUpper]
    const toFactor = conversions[toUpper]

    if (!fromFactor || !toFactor) {
      return null
    }

    // Convertir via l'unité de base
    const baseValue = value * fromFactor
    return baseValue / toFactor
  }

  /**
   * Convertit un prix d'une unité à une autre
   * @param pricePerUnit Le prix par unité source
   * @param fromUnit L'unité source du prix
   * @param toUnit L'unité cible du prix
   * @returns Le prix converti ou null si conversion impossible
   */
  export function convertPrice(
    pricePerUnit: number,
    fromUnit: string,
    toUnit: string
  ): number | null {
    const fromUpper = fromUnit.toUpperCase()
    const toUpper = toUnit.toUpperCase()

    // Si les unités sont identiques
    if (fromUpper === toUpper) return pricePerUnit

    // Pour les prix, la conversion est inversée
    // Ex: 1000€/tonne = 1€/kg (prix divisé par 1000)
    const conversionFactor = convert(1, fromUnit, toUnit)

    if (conversionFactor === null) return null

    // Le prix est inversement proportionnel au facteur de conversion
    return pricePerUnit / conversionFactor
  }

  /**
   * Calcule le prix pour un article basé sur son poids et un prix par unité de poids
   * @param articleWeight Le poids de l'article
   * @param articleWeightUnit L'unité du poids de l'article
   * @param pricePerUnit Le prix par unité
   * @param priceUnit L'unité du prix
   * @returns Le prix calculé ou null si conversion impossible
   */
  export function calculateWeightBasedPrice(
    articleWeight: number,
    articleWeightUnit: string,
    pricePerUnit: number,
    priceUnit: string
  ): number | null {
    // Convertir le poids de l'article vers l'unité du prix
    const weightInPriceUnit = convert(articleWeight, articleWeightUnit, priceUnit)

    if (weightInPriceUnit === null) return null

    return weightInPriceUnit * pricePerUnit
  }

  /**
   * Calcule le prix pour un article basé sur sa longueur
   */
  export function calculateLengthBasedPrice(
    articleLength: number,
    articleLengthUnit: string,
    pricePerUnit: number,
    priceUnit: string
  ): number | null {
    const lengthInPriceUnit = convert(articleLength, articleLengthUnit, priceUnit)

    if (lengthInPriceUnit === null) return null

    return lengthInPriceUnit * pricePerUnit
  }

  /**
   * Calcule le prix pour un article basé sur sa surface
   */
  export function calculateSurfaceBasedPrice(
    articleSurface: number,
    articleSurfaceUnit: string,
    pricePerUnit: number,
    priceUnit: string
  ): number | null {
    const surfaceInPriceUnit = convert(articleSurface, articleSurfaceUnit, priceUnit)

    if (surfaceInPriceUnit === null) return null

    return surfaceInPriceUnit * pricePerUnit
  }

  /**
   * Calcule le prix pour un article basé sur son volume
   */
  export function calculateVolumeBasedPrice(
    articleVolume: number,
    articleVolumeUnit: string,
    pricePerUnit: number,
    priceUnit: string
  ): number | null {
    const volumeInPriceUnit = convert(articleVolume, articleVolumeUnit, priceUnit)

    if (volumeInPriceUnit === null) return null

    return volumeInPriceUnit * pricePerUnit
  }

  /**
   * Calcule automatiquement la surface d'un article rectangulaire
   */
  export function calculateSurface(length: number, width: number, unit: string = 'M'): number {
    // Convertir en mètres si nécessaire
    const lengthInM = unit !== 'M' ? convert(length, unit, 'M') || length : length
    const widthInM = unit !== 'M' ? convert(width, unit, 'M') || width : width

    return lengthInM * widthInM // Résultat en m²
  }

  /**
   * Calcule automatiquement le volume d'un article
   */
  export function calculateVolume(
    length: number,
    width: number,
    height: number,
    unit: string = 'M'
  ): number {
    // Convertir en mètres si nécessaire
    const lengthInM = unit !== 'M' ? convert(length, unit, 'M') || length : length
    const widthInM = unit !== 'M' ? convert(width, unit, 'M') || width : width
    const heightInM = unit !== 'M' ? convert(height, unit, 'M') || height : height

    return lengthInM * widthInM * heightInM // Résultat en m³
  }

  /**
   * Formatte une valeur avec son unité
   */
  export function formatWithUnit(value: number, unit: string, decimals: number = 2): string {
    const formatted = value.toFixed(decimals)
    return `${formatted} ${unit}`
  }

  /**
   * Obtient toutes les unités disponibles pour un type
   */
  export function getAvailableUnits(type: UnitType): string[] {
    return Object.keys(UNIT_CONVERSIONS[type] || {})
  }

  /**
   * Valide si une unité existe
   */
  export function isValidUnit(unit: string): boolean {
    return getUnitType(unit) !== null
  }
}
