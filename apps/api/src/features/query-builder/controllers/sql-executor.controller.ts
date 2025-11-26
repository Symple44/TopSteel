import { Body, Controller, Logger, Post, Request, UseGuards } from '@nestjs/common'
import type { Request as ExpressRequest } from 'express'
import { Public } from '../../../core/multi-tenant'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import type { ExecuteRawSqlDto } from '../dto/execute-query.dto'
import {
  QueryBuilderAdminAccess,
  QueryBuilderSecurityGuard,
} from '../security/query-builder-security.guard'
import { QueryBuilderExecutorService } from '../services/query-builder-executor.service'

@Controller('query-builder/execute-sql')
@Public() // Bypass global TenantGuard - JwtAuthGuard handles JWT auth
@UseGuards(JwtAuthGuard, QueryBuilderSecurityGuard)
export class SqlExecutorController {
  private readonly logger = new Logger(SqlExecutorController.name)

  constructor(private readonly executorService: QueryBuilderExecutorService) {}

  @Post()
  @QueryBuilderAdminAccess() // Require admin access for raw SQL
  async executeSql(
    @Body() dto: ExecuteRawSqlDto,
    @Request() req: ExpressRequest & { user: { id: string } }
  ) {
    const { sql, limit = 100, companyId } = dto

    this.logger.log('Raw SQL execution requested', {
      userId: req.user.id,
      sqlPreview: sql.substring(0, 100),
      limit,
      companyId,
    })

    try {
      // Use the secured executor service which handles all validation
      const result = await this.executorService.executeRawSql(sql, limit, req.user.id, companyId)

      return {
        data: result,
        count: result.length,
        executedAt: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error('Raw SQL execution failed', {
        userId: req.user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        sqlPreview: sql.substring(0, 100),
      })

      // Re-throw the error as it's already properly formatted
      throw error
    }
  }

  /**
   * Get security statistics for monitoring
   */
  @Post('security-stats')
  @QueryBuilderAdminAccess()
  async getSecurityStats(@Request() req: ExpressRequest & { user: { id: string } }) {
    this.logger.log('Security statistics requested', {
      userId: req.user.id,
    })

    // This would return security-related statistics
    // Implementation depends on your monitoring needs
    return {
      allowedTables: [], // List of allowed tables
      recentQueries: [], // Recent query executions
      securityEvents: [], // Security-related events
      generatedAt: new Date().toISOString(),
    }
  }
}
