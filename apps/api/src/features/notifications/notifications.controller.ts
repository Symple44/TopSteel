import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../core/common/decorators/roles.decorator'
import { JwtAuthGuard } from '../../domains/auth/security/guards/jwt-auth.guard'
import { RolesGuard } from '../../domains/auth/security/guards/roles.guard'
import { UserRole } from '../../domains/users/entities/user.entity'
import { CreateNotificationsDto } from './dto/create-notifications.dto'
import { NotificationsQueryDto } from './dto/notifications-query.dto'
import { UpdateNotificationsDto } from './dto/update-notifications.dto'
import { NotificationsService } from './notifications.service'

@Controller('notifications')
@ApiTags('🔔 Notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Créer une nouvelle notification' })
  @ApiResponse({ status: 201, description: 'Notification créée avec succès' })
  async create(@Body() createDto: CreateNotificationsDto) {
    return this.notificationsService.create(createDto)
  }

  @Get()
  @ApiOperation({ summary: 'Lister les notifications avec pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Query() query: NotificationsQueryDto) {
    return this.notificationsService.findAll(query)
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Statistiques des notifications' })
  async getStats() {
    return this.notificationsService.getStats()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une notification par ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.findOne(id)
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Mettre à jour une notification' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: UpdateNotificationsDto) {
    return this.notificationsService.update(id, updateDto)
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une notification' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.remove(id)
  }
}
