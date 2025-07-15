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
import type { CreateUserDto } from './dto/create-user.dto'
import type { UpdateUserDto } from './dto/update-user.dto'
import type { UserQueryDto } from './dto/user-query.dto'
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { UserRole } from './entities/user.entity'
import type { UsersService } from './users.service'

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
}
