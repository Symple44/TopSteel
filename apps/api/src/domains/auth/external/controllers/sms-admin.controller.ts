import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../decorators/roles.decorator'
import { JwtAuthGuard } from '../../security/guards/jwt-auth.guard'
import { RolesGuard } from '../../security/guards/roles.guard'
import { SMSService } from '../../services/sms.service'

/**
 * DTO pour tester l'envoi SMS
 */
class TestSMSDto {
  phoneNumber!: string
  message!: string
}

/**
 * DTO pour les statistiques SMS
 */
class SMSStatisticsQueryDto {
  startDate?: string
  endDate?: string
}

/**
 * Contrôleur d'administration SMS
 * Accessible uniquement aux super admins
 */
@ApiTags('SMS Administration')
@Controller('auth/sms/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SMSAdminController {
  constructor(private readonly smsService: SMSService) {}

  /**
   * Obtenir les statistiques SMS
   */
  @Get('statistics')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Obtenir les statistiques SMS' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques SMS récupérées avec succès',
  })
  async getStatistics(@Query() query: SMSStatisticsQueryDto) {
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours par défaut

    const endDate = query.endDate ? new Date(query.endDate) : new Date()

    return await this.smsService.getSMSStatistics(startDate, endDate)
  }

  /**
   * Valider la configuration SMS
   */
  @Get('validate-config')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Valider la configuration SMS' })
  @ApiResponse({
    status: 200,
    description: 'Configuration validée',
  })
  async validateConfiguration() {
    return await this.smsService.validateConfiguration()
  }

  /**
   * Tester la connectivité SMS
   */
  @Get('test-connectivity')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Tester la connectivité avec le fournisseur SMS' })
  @ApiResponse({
    status: 200,
    description: 'Test de connectivité effectué',
  })
  async testConnectivity() {
    return await this.smsService.testConnectivity()
  }

  /**
   * Envoyer un SMS de test
   */
  @Post('test-send')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envoyer un SMS de test' })
  @ApiResponse({
    status: 200,
    description: 'SMS de test envoyé',
  })
  async sendTestSMS(@Body() dto: TestSMSDto) {
    return await this.smsService.sendSMS({
      phoneNumber: dto.phoneNumber,
      message: dto.message,
      messageType: 'info',
    })
  }
}
