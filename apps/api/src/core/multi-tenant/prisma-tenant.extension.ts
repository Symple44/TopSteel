import { Prisma, PrismaClient } from '@prisma/client'
import { TenantContextService } from './tenant-context.service'
import { Logger } from '@nestjs/common'

const logger = new Logger('PrismaTenantExtension')

/**
 * Liste des modèles Prisma qui ont un champ societeId
 * et doivent être filtrés automatiquement par tenant
 */
export const TENANT_MODELS = [
  'role',
  'permission',
  'userSocieteRole',
  'auditLog',
  'societeLicense',
  'societeUser',
  'site',
  'systemSetting',
  'systemParameter',
  'menuConfiguration',
  'userMenuPreferences',
  'menuConfigurationSimple',
  'userMenuPreference',
  'parameterSystem',
  'parameterApplication',
  'parameterClient',
  'notification',
  'notificationTemplate',
  'notificationSettings',
  'notificationRule',
  'queryBuilder',
] as const

type TenantModel = (typeof TENANT_MODELS)[number]

/**
 * Vérifie si un modèle doit être filtré par tenant
 */
function isTenantModel(model: string): model is TenantModel {
  return TENANT_MODELS.includes(model as TenantModel)
}

/**
 * Crée un client Prisma étendu avec filtrage automatique par societeId
 *
 * Fonctionnalités:
 * - Intercepte toutes les opérations de lecture (findMany, findFirst, findUnique, count, aggregate)
 * - Ajoute automatiquement WHERE societeId = ? pour les modèles concernés
 * - Intercepte les opérations d'écriture pour injecter societeId
 * - Bypass pour les super admins
 * - Logging en mode debug
 *
 * @param prisma - Instance PrismaClient de base
 * @param tenantContext - Service de contexte tenant
 * @returns PrismaClient étendu avec filtrage multi-tenant
 */
export function createTenantExtension(
  prisma: PrismaClient,
  tenantContext: TenantContextService
) {
  return prisma.$extends({
    name: 'tenant-isolation',

    query: {
      $allModels: {
        // ==================== READ OPERATIONS ====================

        async findMany({ model, args, query }) {
          const modifiedArgs = addTenantFilter(model, args, tenantContext, 'findMany')
          return query(modifiedArgs)
        },

        async findFirst({ model, args, query }) {
          const modifiedArgs = addTenantFilter(model, args, tenantContext, 'findFirst')
          return query(modifiedArgs)
        },

        async findUnique({ model, args, query }) {
          // findUnique ne peut pas avoir de filtre WHERE additionnel facilement
          // On laisse passer mais on vérifie après si nécessaire
          const result = await query(args)

          if (result && isTenantModel(model)) {
            const ctx = tenantContext.getTenantOrNull()
            if (ctx && !ctx.isSuperAdmin) {
              const record = result as Record<string, unknown>
              if (record.societeId && record.societeId !== ctx.societeId) {
                logger.warn(
                  `[${ctx.requestId}] Tenant isolation violation on ${model}.findUnique: ` +
                  `requested ${record.societeId}, user belongs to ${ctx.societeId}`
                )
                return null // Masquer le résultat
              }
            }
          }

          return result
        },

        async findFirstOrThrow({ model, args, query }) {
          const modifiedArgs = addTenantFilter(model, args, tenantContext, 'findFirstOrThrow')
          return query(modifiedArgs)
        },

        async count({ model, args, query }) {
          const modifiedArgs = addTenantFilter(model, args, tenantContext, 'count')
          return query(modifiedArgs)
        },

        async aggregate({ model, args, query }) {
          const modifiedArgs = addTenantFilter(model, args, tenantContext, 'aggregate')
          return query(modifiedArgs)
        },

        async groupBy({ model, args, query }) {
          const modifiedArgs = addTenantFilter(model, args, tenantContext, 'groupBy')
          return query(modifiedArgs)
        },

        // ==================== WRITE OPERATIONS ====================

        async create({ model, args, query }) {
          const modifiedArgs = injectTenantOnCreate(model, args, tenantContext, 'create')
          return query(modifiedArgs)
        },

        async createMany({ model, args, query }) {
          const modifiedArgs = injectTenantOnCreateMany(model, args, tenantContext)
          return query(modifiedArgs)
        },

        async update({ model, args, query }) {
          const modifiedArgs = addTenantFilter(model, args, tenantContext, 'update')
          return query(modifiedArgs)
        },

        async updateMany({ model, args, query }) {
          const modifiedArgs = addTenantFilter(model, args, tenantContext, 'updateMany')
          return query(modifiedArgs)
        },

        async delete({ model, args, query }) {
          const modifiedArgs = addTenantFilter(model, args, tenantContext, 'delete')
          return query(modifiedArgs)
        },

        async deleteMany({ model, args, query }) {
          const modifiedArgs = addTenantFilter(model, args, tenantContext, 'deleteMany')
          return query(modifiedArgs)
        },

        async upsert({ model, args, query }) {
          if (!isTenantModel(model)) {
            return query(args)
          }

          const ctx = tenantContext.getTenantOrNull()
          if (!ctx || ctx.isSuperAdmin) {
            return query(args)
          }

          // Pour upsert, injecter societeId dans create si non défini
          // On modifie directement args.create pour éviter les problèmes de typage
          const createData = args.create as Record<string, unknown>
          if (!createData.societeId) {
            createData.societeId = ctx.societeId
          }

          logger.debug(`[${ctx.requestId}] ${model}.upsert with societeId=${ctx.societeId}`)
          return query(args)
        },
      },
    },
  })
}

/**
 * Ajoute le filtre societeId aux arguments de requête
 */
function addTenantFilter<T extends { where?: Record<string, unknown> }>(
  model: string,
  args: T,
  tenantContext: TenantContextService,
  operation: string
): T {
  // Vérifier si le modèle doit être filtré
  if (!isTenantModel(model)) {
    return args
  }

  // Récupérer le contexte tenant
  const ctx = tenantContext.getTenantOrNull()

  // Pas de contexte ou super admin = pas de filtrage
  if (!ctx) {
    logger.debug(`No tenant context for ${model}.${operation} - skipping filter`)
    return args
  }

  if (ctx.isSuperAdmin) {
    logger.debug(`[${ctx.requestId}] Super admin bypass for ${model}.${operation}`)
    return args
  }

  // Ajouter le filtre societeId
  const modifiedArgs = {
    ...args,
    where: {
      ...args.where,
      societeId: ctx.societeId,
    },
  } as T

  logger.debug(
    `[${ctx.requestId}] ${model}.${operation} filtered by societeId=${ctx.societeId}`
  )

  return modifiedArgs
}

/**
 * Injecte societeId lors de la création
 */
function injectTenantOnCreate<T extends { data?: Record<string, unknown> }>(
  model: string,
  args: T,
  tenantContext: TenantContextService,
  operation: string
): T {
  if (!isTenantModel(model)) {
    return args
  }

  const ctx = tenantContext.getTenantOrNull()

  if (!ctx) {
    return args
  }

  // Ne pas écraser si déjà défini (ex: super admin créant pour une autre société)
  if (args.data?.societeId) {
    if (!ctx.isSuperAdmin && args.data.societeId !== ctx.societeId) {
      logger.warn(
        `[${ctx.requestId}] Attempted to create ${model} for different societe: ` +
        `requested ${args.data.societeId}, user belongs to ${ctx.societeId}`
      )
      // Forcer le societeId de l'utilisateur
      args.data.societeId = ctx.societeId
    }
    return args
  }

  // Injecter societeId
  const modifiedArgs = {
    ...args,
    data: {
      ...args.data,
      societeId: ctx.societeId,
    },
  } as T

  logger.debug(
    `[${ctx.requestId}] ${model}.${operation} injected societeId=${ctx.societeId}`
  )

  return modifiedArgs
}

/**
 * Injecte societeId lors de createMany
 */
function injectTenantOnCreateMany<T extends { data?: Record<string, unknown>[] | Record<string, unknown> }>(
  model: string,
  args: T,
  tenantContext: TenantContextService
): T {
  if (!isTenantModel(model)) {
    return args
  }

  const ctx = tenantContext.getTenantOrNull()

  if (!ctx) {
    return args
  }

  if (!args.data) {
    return args
  }

  // Gérer le cas où data est un tableau
  if (Array.isArray(args.data)) {
    const modifiedData = args.data.map((item) => ({
      ...item,
      societeId: item.societeId || ctx.societeId,
    }))

    logger.debug(
      `[${ctx.requestId}] ${model}.createMany injected societeId=${ctx.societeId} for ${modifiedData.length} records`
    )

    return {
      ...args,
      data: modifiedData,
    } as T
  }

  return args
}

/**
 * Type du client Prisma étendu avec multi-tenant
 */
export type TenantPrismaClient = ReturnType<typeof createTenantExtension>
