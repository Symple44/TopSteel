import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'

interface ExecuteSqlDto {
  sql: string
  limit?: number
  companyId?: string
}

@Controller('query-builder/execute-sql')
@UseGuards(JwtAuthGuard)
export class SqlExecutorController {
  constructor(
    @InjectDataSource('tenant')
    private _tenantDataSource: DataSource,
    @InjectDataSource('auth')
    private _authDataSource: DataSource,
  ) {}

  @Post()
  async executeSql(@Body() dto: ExecuteSqlDto, @Request() req) {
    const { sql, limit = 100, companyId } = dto

    if (!sql) {
      throw new BadRequestException('SQL query is required')
    }

    // 🔐 Récupérer la société actuelle de l'utilisateur depuis la base auth
    let userCompanyId: string | null = null
    try {
      const userCompanyResult = await this._authDataSource.query(
        `SELECT su.societeId as company_id 
         FROM users u 
         JOIN societe_users su ON u.id = su.userId 
         WHERE u.id = $1 AND su.isDefault = true AND su.actif = true
         LIMIT 1`,
        [req.user.id]
      )

      if (userCompanyResult && userCompanyResult.length > 0) {
        userCompanyId = userCompanyResult[0].company_id
      } else {
      }
    } catch (_error) {
      // En développement, on continue sans company_id
      if (process.env.NODE_ENV === 'production') {
        throw new ForbiddenException('Unable to verify user company access')
      }
    }

    // 🔒 Vérifier que le companyId fourni correspond à celui de l'utilisateur
    if (companyId && companyId !== userCompanyId) {
      throw new ForbiddenException('Access denied to this company data')
    }

    // 🛡️ Validation SQL pour éviter les opérations dangereuses
    const sqlLower = sql.toLowerCase().trim()

    // Vérifier que c'est une requête SELECT
    if (!sqlLower.startsWith('select')) {
      throw new BadRequestException('Only SELECT queries are allowed')
    }

    // Vérifier les patterns interdits
    const forbiddenPatterns = [
      /\btopsteel_auth\./i,
      /\buser_societes\b/i,
      /\bsocietes\b/i,
      /\busers\b/i,
      /\binformation_schema\b/i,
      /\bpg_/i,
      /\bdrop\b/i,
      /\bdelete\b/i,
      /\bupdate\b/i,
      /\binsert\b/i,
      /\balter\b/i,
      /\bcreate\b/i,
      /\btruncate\b/i,
      /\bgrant\b/i,
      /\brevoke\b/i,
    ]

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(sql)) {
        throw new BadRequestException('Query contains forbidden operations or system tables')
      }
    }

    try {
      // 🏢 Construire la requête sécurisée avec isolation tenant
      let securedSql = sql

      // Parser les tables de la requête (simpliste, à améliorer avec un vrai parser SQL)
      const tableMatches = sql.match(/\bFROM\s+(\w+)|\bJOIN\s+(\w+)/gi) || []
      const tables = tableMatches
        .map((match) => match.replace(/FROM|JOIN/gi, '').trim())
        .filter(Boolean)

      // Pour chaque table trouvée, vérifier si elle a une colonne company_id
      const tenantTables = ['clients', 'fournisseurs', 'materiaux', 'stocks', 'commandes']
      let needsWhereClause = false

      for (const table of tables) {
        if (tenantTables.includes(table.toLowerCase())) {
          needsWhereClause = true
          break
        }
      }

      // Ajouter automatiquement le filtre company_id si nécessaire ET si on a un company_id
      if (needsWhereClause && userCompanyId) {
        if (sqlLower.includes('where')) {
          // Injecter le company_id dans la clause WHERE existante
          securedSql = sql.replace(/WHERE/i, `WHERE company_id = ${userCompanyId} AND`)
        } else {
          // Ajouter une clause WHERE
          const orderByIndex = securedSql.toLowerCase().indexOf('order by')
          const limitIndex = securedSql.toLowerCase().indexOf('limit')

          let insertIndex = securedSql.length
          if (orderByIndex > -1) insertIndex = orderByIndex
          else if (limitIndex > -1) insertIndex = limitIndex

          securedSql =
            securedSql.slice(0, insertIndex) +
            ` WHERE company_id = ${userCompanyId} ` +
            securedSql.slice(insertIndex)
        }
      } else if (needsWhereClause && !userCompanyId) {
        // En développement, on peut continuer sans filtre
        // En production, on devrait bloquer
        if (process.env.NODE_ENV === 'production') {
          throw new ForbiddenException('Cannot query tenant tables without company context')
        }
      }

      // Limiter les résultats
      if (!sqlLower.includes('limit')) {
        securedSql += ` LIMIT ${Math.min(limit, 1000)}`
      }

      // 📊 Exécuter la requête sécurisée
      const result = await this._tenantDataSource.query(securedSql)

      return result
    } catch (error) {
      // Type guard pour les erreurs PostgreSQL
      const pgError = error as any

      if (pgError.code === '42P01') {
        throw new BadRequestException('Table not found')
      } else if (pgError.code === '42703') {
        throw new BadRequestException('Column not found')
      } else if (pgError.code === '42601') {
        throw new BadRequestException('SQL syntax error')
      }

      throw new BadRequestException(`Query execution failed: ${pgError.message || 'Unknown error'}`)
    }
  }
}
