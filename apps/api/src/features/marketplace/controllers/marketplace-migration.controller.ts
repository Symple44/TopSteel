import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CurrentTenant } from '../../../core/common/decorators/current-tenant.decorator'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import type {
  MarketplaceToERPMigrationService,
  MigrationPlan,
  MigrationProgress,
  MigrationResult,
} from '../migration/marketplace-to-erp-migration.service'

@ApiTags('Marketplace Migration')
@Controller('marketplace/migration')
@UseGuards(JwtAuthGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
export class MarketplaceMigrationController {
  private readonly logger = new Logger(MarketplaceMigrationController.name)

  constructor(private readonly migrationService: MarketplaceToERPMigrationService) {}

  @Get('plan')
  @ApiOperation({ summary: 'Create migration plan from marketplace to ERP integration' })
  @ApiResponse({ status: 200, description: 'Migration plan created successfully' })
  async createMigrationPlan(@CurrentTenant() tenantId: string): Promise<MigrationPlan> {
    this.logger.log(`Creating migration plan for tenant ${tenantId}`)
    return this.migrationService.createMigrationPlan(tenantId)
  }

  @Post('execute')
  @ApiOperation({ summary: 'Execute marketplace to ERP migration' })
  @ApiResponse({ status: 200, description: 'Migration executed successfully' })
  @ApiResponse({ status: 400, description: 'Migration already in progress or validation failed' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions for migration' })
  async executeMigration(@CurrentTenant() tenantId: string): Promise<MigrationResult> {
    if (this.migrationService.isMigrationInProgress()) {
      throw new BadRequestException('Migration is already in progress')
    }

    // Log de sécurité pour audit
    this.logger.warn(`SECURITY: Migration requested for tenant ${tenantId}`)

    return this.migrationService.executeMigration(tenantId)
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get current migration progress' })
  @ApiResponse({ status: 200, description: 'Migration progress retrieved successfully' })
  async getMigrationProgress(): Promise<MigrationProgress | null> {
    return this.migrationService.getMigrationProgress()
  }

  @Get('status')
  @ApiOperation({ summary: 'Check if migration is in progress' })
  @ApiResponse({ status: 200, description: 'Migration status retrieved successfully' })
  async getMigrationStatus(): Promise<{ inProgress: boolean; progress?: MigrationProgress }> {
    const inProgress = this.migrationService.isMigrationInProgress()
    const progress = inProgress ? this.migrationService.getMigrationProgress() : undefined

    return {
      inProgress,
      progress,
    }
  }
}
