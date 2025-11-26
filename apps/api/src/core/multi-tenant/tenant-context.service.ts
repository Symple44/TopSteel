import { Injectable, Scope } from '@nestjs/common'
import { AsyncLocalStorage } from 'async_hooks'

/**
 * Interface pour le contexte tenant stocké par requête
 */
export interface TenantContext {
  /**
   * ID de la société (tenant)
   */
  societeId: string

  /**
   * ID de l'utilisateur courant
   */
  userId?: string

  /**
   * Si l'utilisateur est super admin (bypass RLS)
   */
  isSuperAdmin: boolean

  /**
   * Timestamp du début de la requête
   */
  requestStartTime: number

  /**
   * ID de requête pour traçabilité
   */
  requestId?: string
}

/**
 * TenantContextService
 *
 * Service pour gérer le contexte tenant par requête using AsyncLocalStorage.
 * Permet d'accéder au tenant context depuis n'importe où dans la requête
 * sans passer le context explicitement.
 *
 * Architecture:
 * - AsyncLocalStorage pour isolation par requête
 * - Thread-safe et async-safe
 * - Pas besoin de dependency injection dans chaque service
 *
 * Usage:
 *   // Dans un Guard ou Interceptor (début de requête)
 *   tenantContext.setTenant({
 *     societeId: 'uuid-123',
 *     userId: 'user-456',
 *     isSuperAdmin: false
 *   })
 *
 *   // Anywhere dans la chaîne de requête
 *   const context = tenantContext.getTenant()
 *   const societeId = context.societeId
 */
@Injectable({ scope: Scope.DEFAULT })
export class TenantContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<TenantContext>()

  /**
   * Définir le contexte tenant pour la requête courante
   * Doit être appelé au début de chaque requête (dans un Guard/Interceptor)
   */
  setTenant(context: Omit<TenantContext, 'requestStartTime'>): void {
    const fullContext: TenantContext = {
      ...context,
      requestStartTime: Date.now(),
    }

    this.asyncLocalStorage.enterWith(fullContext)
  }

  /**
   * Obtenir le contexte tenant de la requête courante
   * @throws Error si aucun contexte n'est défini
   */
  getTenant(): TenantContext {
    const context = this.asyncLocalStorage.getStore()

    if (!context) {
      throw new Error(
        'No tenant context found. Make sure TenantGuard or TenantInterceptor is applied to this route.'
      )
    }

    return context
  }

  /**
   * Obtenir le contexte tenant de manière sûre (retourne null si non défini)
   * Utile pour les routes publiques ou les background jobs
   */
  getTenantOrNull(): TenantContext | null {
    return this.asyncLocalStorage.getStore() ?? null
  }

  /**
   * Obtenir uniquement le societeId (helper)
   */
  getSocieteId(): string {
    return this.getTenant().societeId
  }

  /**
   * Obtenir uniquement le societeId de manière sûre
   */
  getSocieteIdOrNull(): string | null {
    const context = this.getTenantOrNull()
    return context?.societeId ?? null
  }

  /**
   * Vérifier si l'utilisateur courant est super admin
   */
  isSuperAdmin(): boolean {
    const context = this.getTenantOrNull()
    return context?.isSuperAdmin ?? false
  }

  /**
   * Vérifier si un contexte tenant existe
   */
  hasTenant(): boolean {
    return this.asyncLocalStorage.getStore() !== undefined
  }

  /**
   * Exécuter une fonction dans un contexte tenant spécifique
   * Utile pour les background jobs ou les opérations isolées
   */
  async runWithTenant<T>(
    context: Omit<TenantContext, 'requestStartTime'>,
    fn: () => Promise<T>
  ): Promise<T> {
    const fullContext: TenantContext = {
      ...context,
      requestStartTime: Date.now(),
    }

    return this.asyncLocalStorage.run(fullContext, fn)
  }

  /**
   * Nettoyer le contexte (normalement fait automatiquement)
   * Utile pour les tests
   */
  clear(): void {
    // Note: AsyncLocalStorage se nettoie automatiquement à la fin du contexte async
    // Cette méthode est principalement pour les tests
    this.asyncLocalStorage.disable()
  }

  /**
   * Obtenir des informations de debug sur le contexte
   */
  getDebugInfo(): {
    hasTenant: boolean
    context: TenantContext | null
    requestDuration?: number
  } {
    const context = this.getTenantOrNull()

    return {
      hasTenant: this.hasTenant(),
      context: context,
      requestDuration: context
        ? Date.now() - context.requestStartTime
        : undefined,
    }
  }
}
