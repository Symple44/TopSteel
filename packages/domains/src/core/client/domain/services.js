/**
 * 🔧 SERVICES MÉTIER - DOMAINE CLIENT
 * Logique métier pure sans dépendances externes
 */
import { ClientPriorite, ClientType } from './entities'
// ===== SERVICES MÉTIER =====
export class ClientBusinessService {
  /**
   * Calcule le score de priorité d'un client
   */
  static calculateClientScore(client) {
    let score = 0
    // Score basé sur le type
    switch (client.type) {
      case ClientType.PROFESSIONNEL:
        score += 30
        break
      case ClientType.COLLECTIVITE:
        score += 40
        break
      case ClientType.PARTICULIER:
        score += 20
        break
    }
    // Score basé sur la priorité
    switch (client.priorite) {
      case ClientPriorite.VIP:
        score += 50
        break
      case ClientPriorite.HAUTE:
        score += 30
        break
      case ClientPriorite.NORMALE:
        score += 10
        break
      case ClientPriorite.BASSE:
        score += 0
        break
    }
    // Score basé sur le chiffre d'affaire
    if (client.chiffreAffaire) {
      if (client.chiffreAffaire > 100000) score += 30
      else if (client.chiffreAffaire > 50000) score += 20
      else if (client.chiffreAffaire > 10000) score += 10
    }
    // Score basé sur l'activité récente
    if (client.dateDernierProjet) {
      const daysSinceLastProject = Math.floor(
        (Date.now() - client.dateDernierProjet.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceLastProject < 30) score += 20
      else if (daysSinceLastProject < 90) score += 10
      else if (daysSinceLastProject < 365) score += 5
    }
    return Math.min(score, 100) // Cap à 100
  }
  /**
   * Détermine si un client est éligible pour une remise
   */
  static isEligibleForDiscount(client) {
    return (
      client.priorite === ClientPriorite.VIP ||
      (client.chiffreAffaire !== undefined && client.chiffreAffaire > 50000) ||
      (client.nombreProjets !== undefined && client.nombreProjets > 5)
    )
  }
  /**
   * Calcule le pourcentage de remise autorisé
   */
  static calculateDiscountPercentage(client) {
    if (!ClientBusinessService.isEligibleForDiscount(client)) return 0
    let discount = 0
    if (client.priorite === ClientPriorite.VIP) discount += 15
    if (client.chiffreAffaire !== undefined && client.chiffreAffaire > 100000) discount += 10
    if (client.nombreProjets !== undefined && client.nombreProjets > 10) discount += 5
    return Math.min(discount, 25) // Cap à 25%
  }
  /**
   * Détermine le délai de paiement recommandé
   */
  static getRecommendedPaymentTerms(client) {
    switch (client.priorite) {
      case ClientPriorite.VIP:
        return 45 // 45 jours
      case ClientPriorite.HAUTE:
        return 30 // 30 jours
      case ClientPriorite.NORMALE:
        return 15 // 15 jours
      case ClientPriorite.BASSE:
        return 7 // 7 jours
      default:
        return 15
    }
  }
}
//# sourceMappingURL=services.js.map
