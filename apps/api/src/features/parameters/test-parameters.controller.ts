import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ParameterService } from './services/parameter.service'

@Controller('test-parameters')
@ApiTags('🧪 Test Parameters')
export class TestParametersController {
  constructor(private readonly parameterService: ParameterService) {}

  @Get('user_roles')
  @ApiOperation({ summary: 'Test des rôles utilisateur sans authentification' })
  @ApiResponse({ status: 200, description: 'Test réussi' })
  async testGetUserRoles(@Query('language') language = 'fr') {
    return this.parameterService.getUserRoles(language)
  }

  @Get('health')
  @ApiOperation({ summary: 'Test de santé du service parameters' })
  @ApiResponse({ status: 200, description: 'Service OK' })
  async health() {
    return {
      status: 'OK',
      service: 'ParameterService',
      timestamp: new Date().toISOString(),
    }
  }
}
