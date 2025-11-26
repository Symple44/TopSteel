import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { TenantContextService } from './tenant-context.service'
import { PrismaService } from '../database/prisma/prisma.service'

/**
 * TenantRLSInterceptor
 *
 * Intercepteur HTTP pour configurer les variables de session PostgreSQL
 * utilisées par Row-Level Security (RLS).
 *
 * Fonctionnalités:
 * 1. Configure app.current_societe_id pour le filtrage RLS
 * 2. Configure app.is_super_admin pour le bypass admin
 * 3. S'exécute AVANT toutes les requêtes Prisma
 * 4. Nettoie les variables à la fin de la requête
 *
 * Ordre d'exécution:
 *   TenantGuard → TenantRLSInterceptor → PrismaTenantMiddleware → Controller
 *
 * Usage:
 *   // Global (app.module.ts)
 *   APP_INTERCEPTOR: TenantRLSInterceptor
 *
 *   // Ou par controller
 *   @UseInterceptors(TenantRLSInterceptor)
 */
@Injectable()
export class TenantRLSInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantRLSInterceptor.name)

  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly prisma: PrismaService
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    // Récupérer le contexte tenant (peut être null pour routes publiques)
    const tenantCtx = this.tenantContext.getTenantOrNull()

    if (!tenantCtx) {
      // Pas de contexte tenant - route publique ou système
      this.logger.debug('No tenant context - skipping RLS setup')
      return next.handle()
    }

    const { societeId, isSuperAdmin, requestId } = tenantCtx

    // Configurer les variables de session PostgreSQL pour RLS
    try {
      this.logger.debug(
        `[${requestId}] Setting RLS session: societeId=${societeId}, isSuperAdmin=${isSuperAdmin}`
      )

      // Exécuter la fonction PostgreSQL pour définir le contexte
      await this.prisma.$queryRaw`
        SELECT set_societe_context(
          ${societeId}::uuid,
          ${isSuperAdmin}::boolean
        )
      `

      this.logger.debug(`[${requestId}] RLS session configured ✅`)
    } catch (error) {
      this.logger.error(
        `[${requestId}] Failed to set RLS session variables`,
        error
      )
      // On continue même en cas d'erreur RLS - le middleware Prisma fournira une couche de sécurité
    }

    // Exécuter la requête et nettoyer après
    return next.handle().pipe(
      tap({
        finalize: async () => {
          // Nettoyer les variables de session (optionnel - fait automatiquement par PG)
          try {
            this.logger.debug(`[${requestId}] Cleaning RLS session`)
            await this.prisma.$queryRaw`SELECT clear_societe_context()`
          } catch (error) {
            // Ignorer les erreurs de nettoyage
            this.logger.warn(
              `[${requestId}] Failed to clear RLS session`,
              error
            )
          }
        },
      })
    )
  }
}
