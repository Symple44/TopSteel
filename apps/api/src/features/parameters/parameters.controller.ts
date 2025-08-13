import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../domains/auth/security/guards/jwt-auth.guard'
import type { ParameterService } from './services/parameter.service'

@Controller('parameters')
@ApiTags('🔧 Parameters')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ParametersController {
  constructor(private readonly parameterService: ParameterService) {}

  @Get('system/user_roles')
  @ApiOperation({ summary: 'Récupérer les rôles utilisateur depuis la base de données' })
  @ApiResponse({ status: 200, description: 'Rôles utilisateur récupérés avec succès' })
  async getUserRoles(@Query('language') language = 'fr') {
    const roles = await this.parameterService.getUserRoles(language)
    return {
      data: roles,
      statusCode: 200,
      message: 'Success',
      timestamp: new Date().toISOString(),
    }
  }

  @Get('system/user_roles/cache/invalidate')
  @ApiOperation({ summary: 'Invalider le cache des rôles utilisateur' })
  @ApiResponse({ status: 200, description: 'Cache invalidé avec succès' })
  async invalidateUserRolesCache() {
    this.parameterService.invalidateRolesCache()
    return {
      statusCode: 200,
      message: 'Cache des rôles invalidé avec succès',
      timestamp: new Date().toISOString(),
    }
  }
}
