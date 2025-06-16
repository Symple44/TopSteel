// packages/utils/src/calculation/materials.ts
export interface MaterialCalculation {
  longueur?: number
  largeur?: number
  hauteur?: number
  epaisseur?: number
  diametre?: number
  poids?: number
  surface?: number
  volume?: number
}

export function calculateSurface(
  longueur: number, 
  largeur: number
): number {
  return longueur * largeur
}

export function calculateVolume(
  longueur: number, 
  largeur: number, 
  hauteur: number
): number {
  return longueur * largeur * hauteur
}

export function calculatePoidsAcier(
  longueur: number, // en mètres
  section: number, // en cm²
  densite: number = 7.85 // densité acier kg/dm³
): number {
  // Conversion: section cm² -> dm², longueur m -> dm
  const sectionDm2 = section / 100
  const longueurDm = longueur * 10
  return sectionDm2 * longueurDm * densite
}

export function calculateChutesOptimisation(
  longueurBarres: number,
  longueursPieces: number[]
): {
  barresUtilisees: number
  chutes: number[]
  optimisation: number
} {
  const barresUtilisees = Math.ceil(
    longueursPieces.reduce((total, piece) => total + piece, 0) / longueurBarres
  )
  
  const totalUtilise = longueursPieces.reduce((total, piece) => total + piece, 0)
  const totalAchete = barresUtilisees * longueurBarres
  const chutesTotales = totalAchete - totalUtilise
  
  const optimisation = (totalUtilise / totalAchete) * 100
  
  return {
    barresUtilisees,
    chutes: [chutesTotales],
    optimisation
  }
}