import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common'
import type { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Repository } from 'typeorm'

interface TenantContext {
  societeId: string | number
  siteId?: string | number
}

function isValidTenantContext(context: unknown): context is TenantContext {
  return (
    typeof context === 'object' &&
    context !== null &&
    'societeId' in context &&
    (typeof (context as { societeId: unknown }).societeId === 'string' ||
      typeof (context as { societeId: unknown }).societeId === 'number')
  )
}

/**
 * Intercepteur pour injecter automatiquement societeId et siteId dans les opérations
 */
@Injectable()
export class TenantInjectionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest()
    const tenantContext = request.tenantContext

    if (!tenantContext) {
      return next.handle()
    }

    // Injecter le contexte dans le body pour les POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      if (request.body && typeof request.body === 'object') {
        // Ajouter societeId si pas présent
        if (!request.body.societeId) {
          request.body.societeId = tenantContext.societeId
        }

        // Ajouter siteId si contexte site et pas présent
        if (tenantContext.siteId && !request.body.siteId) {
          request.body.siteId = tenantContext.siteId
        }
      }
    }

    // Intercepter la réponse pour filtrer par société si nécessaire
    return next.handle().pipe(
      map((data) => {
        // Si c'est un repository query, appliquer le filtre société
        if (data && typeof data === 'object') {
          // Logique de filtrage personnalisée si nécessaire
        }
        return data
      })
    )
  }
}

/**
 * Décorateur pour les repositories tenant-aware
 */
export function InjectTenantContext() {
  return (_target: unknown, _propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      // Récupérer le contexte depuis le premier argument si c'est un objet
      const firstArg = args[0] as Record<string, unknown> | undefined
      const context = firstArg?.tenantContext

      if (context && this instanceof Repository && isValidTenantContext(context)) {
        // Créer un query builder avec les filtres société
        const qb = this.createQueryBuilder()

        // Ajouter automatiquement le filtre société
        qb.andWhere(`${qb.alias}.societeId = :societeId`, {
          societeId: context.societeId,
        })

        // Ajouter le filtre site si présent
        if (context.siteId) {
          qb.andWhere(`${qb.alias}.siteId = :siteId`, {
            siteId: context.siteId,
          })
        }

        // Remplacer la méthode standard par notre query builder
        if (method.name === 'find' || method.name === 'findOne') {
          return qb.getMany()
        }
      }

      return method.apply(this, args)
    }

    return descriptor
  }
}
