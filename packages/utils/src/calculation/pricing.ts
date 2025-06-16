// packages/utils/src/calculation/pricing.ts
export function calculateTTC(
  ht: number, 
  tauxTVA: number = 20
): number {
  return ht * (1 + tauxTVA / 100)
}

export function calculateHT(
  ttc: number, 
  tauxTVA: number = 20
): number {
  return ttc / (1 + tauxTVA / 100)
}

export function calculateTVA(
  ht: number, 
  tauxTVA: number = 20
): number {
  return ht * (tauxTVA / 100)
}

export function calculateMarge(
  prixVente: number, 
  coutProduction: number
): number {
  if (prixVente === 0) return 0
  return ((prixVente - coutProduction) / prixVente) * 100
}

export function calculateMargeAbsolue(
  prixVente: number, 
  coutProduction: number
): number {
  return prixVente - coutProduction
}

export function calculateRemise(
  prixInitial: number, 
  prixFinal: number
): number {
  if (prixInitial === 0) return 0
  return ((prixInitial - prixFinal) / prixInitial) * 100
}

export function applyRemise(
  prix: number, 
  pourcentageRemise: number
): number {
  return prix * (1 - pourcentageRemise / 100)
}