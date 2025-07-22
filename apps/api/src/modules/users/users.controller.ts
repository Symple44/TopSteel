import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserQueryDto } from './dto/user-query.dto'
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto'
import { UpdateAppearanceSettingsDto, GetAppearanceSettingsResponseDto } from './dto/appearance-settings.dto'
import { UpdateNotificationSettingsDto, GetNotificationSettingsResponseDto } from './dto/notification-settings.dto'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { UserRole } from './entities/user.entity'
import { UsersService } from './users.service'

@Controller('users')
@ApiTags('👤 Users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer un nouvel utilisateur' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  async create(@Body() createDto: CreateUserDto) {
    return this.usersService.create(createDto)
  }

  @Get()
  @ApiOperation({ summary: 'Lister les utilisateurs avec pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query)
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Statistiques des utilisateurs' })
  async getStats() {
    return this.usersService.getStats()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id)
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Mettre à jour un utilisateur' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.usersService.update(id, updateDto)
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id)
  }

  // Endpoints pour les paramètres utilisateur
  @Get('settings/me')
  @ApiOperation({ summary: 'Récupérer mes paramètres utilisateur' })
  @ApiResponse({ status: 200, description: 'Paramètres utilisateur récupérés avec succès' })
  async getMySettings(@CurrentUser() user: any) {
    return this.usersService.getUserSettings(user.id)
  }

  @Patch('settings/me')
  @ApiOperation({ summary: 'Mettre à jour mes paramètres utilisateur' })
  @ApiResponse({ status: 200, description: 'Paramètres utilisateur mis à jour avec succès' })
  async updateMySettings(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateUserSettingsDto
  ) {
    return this.usersService.updateUserSettings(user.id, updateDto)
  }

  @Get(':id/settings')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Récupérer les paramètres d\'un utilisateur (Admin/Manager)' })
  @ApiResponse({ status: 200, description: 'Paramètres utilisateur récupérés avec succès' })
  async getUserSettings(@Param('id') id: string) {
    return this.usersService.getUserSettings(id)
  }

  @Patch(':id/settings')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Mettre à jour les paramètres d\'un utilisateur (Admin/Manager)' })
  @ApiResponse({ status: 200, description: 'Paramètres utilisateur mis à jour avec succès' })
  async updateUserSettings(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserSettingsDto
  ) {
    return this.usersService.updateUserSettings(id, updateDto)
  }

  // Endpoints spécialisés pour les préférences d'apparence
  @Get('appearance/me')
  @ApiOperation({ summary: 'Récupérer mes préférences d\'apparence' })
  @ApiResponse({ 
    status: 200, 
    description: 'Préférences d\'apparence récupérées avec succès',
    type: GetAppearanceSettingsResponseDto 
  })
  async getMyAppearanceSettings(@CurrentUser() user: any): Promise<GetAppearanceSettingsResponseDto> {
    const settings = await this.usersService.getUserSettings(user.id)
    return new GetAppearanceSettingsResponseDto(settings.preferences.appearance)
  }

  @Patch('appearance/me')
  @ApiOperation({ summary: 'Mettre à jour mes préférences d\'apparence' })
  @ApiResponse({ 
    status: 200, 
    description: 'Préférences d\'apparence mises à jour avec succès',
    type: GetAppearanceSettingsResponseDto 
  })
  async updateMyAppearanceSettings(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateAppearanceSettingsDto
  ): Promise<GetAppearanceSettingsResponseDto> {
    const updatedSettings = await this.usersService.updateUserSettings(user.id, {
      preferences: { appearance: updateDto }
    })
    return new GetAppearanceSettingsResponseDto(updatedSettings.preferences.appearance)
  }

  // Endpoints spécialisés pour les notifications
  @Get('notifications/me')
  @ApiOperation({ summary: 'Récupérer mes préférences de notification' })
  @ApiResponse({ 
    status: 200, 
    description: 'Préférences de notification récupérées avec succès',
    type: GetNotificationSettingsResponseDto 
  })
  async getMyNotificationSettings(@CurrentUser() user: any): Promise<GetNotificationSettingsResponseDto> {
    const settings = await this.usersService.getUserSettings(user.id)
    return new GetNotificationSettingsResponseDto(settings.preferences.notifications)
  }

  @Patch('notifications/me')
  @ApiOperation({ summary: 'Mettre à jour mes préférences de notification' })
  @ApiResponse({ 
    status: 200, 
    description: 'Préférences de notification mises à jour avec succès',
    type: GetNotificationSettingsResponseDto 
  })
  async updateMyNotificationSettings(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateNotificationSettingsDto
  ): Promise<GetNotificationSettingsResponseDto> {
    const updatedSettings = await this.usersService.updateUserSettings(user.id, {
      preferences: { notifications: updateDto }
    })
    return new GetNotificationSettingsResponseDto(updatedSettings.preferences.notifications)
  }
}
