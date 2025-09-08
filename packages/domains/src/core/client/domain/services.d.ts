/**
 * 🔧 SERVICES MÉTIER - DOMAINE CLIENT
 * Logique métier pure sans dépendances externes
 */
import type { Client } from './entities'
export declare class ClientBusinessService {
  /**
   * Calcule le score de priorité d'un client
   */
  static calculateClientScore(client: Client): number
  /**
   * Détermine si un client est éligible pour une remise
   */
  static isEligibleForDiscount(client: Client): boolean
  /**
   * Calcule le pourcentage de remise autorisé
   */
  static calculateDiscountPercentage(client: Client): number
  /**
   * Détermine le délai de paiement recommandé
   */
  static getRecommendedPaymentTerms(client: Client): number
}
//# sourceMappingURL=services.d.ts.map
