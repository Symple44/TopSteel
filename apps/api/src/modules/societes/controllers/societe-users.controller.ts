import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { SocieteUsersService } from '../services/societe-users.service'
import { SocieteUser } from '../entities/societe-user.entity'
import { CommonDatabase } from '../../../common/decorators/tenant.decorator'

@ApiTags('Société Users')
@Controller('societe-users')
@CommonDatabase()
export class SocieteUsersController {
  constructor(private readonly societeUsersService: SocieteUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les associations utilisateur-société' })
  async findAll(): Promise<SocieteUser[]> {
    return this.societeUsersService.findAll()
  }

  @Get('by-user/:userId')
  @ApiOperation({ summary: 'Récupérer les sociétés d\'un utilisateur' })
  async findByUser(@Param('userId') userId: string): Promise<SocieteUser[]> {
    return this.societeUsersService.findByUser(userId)
  }

  @Get('by-societe/:societeId')
  @ApiOperation({ summary: 'Récupérer les utilisateurs d\'une société' })
  async findBySociete(@Param('societeId') societeId: string): Promise<SocieteUser[]> {
    return this.societeUsersService.findBySociete(societeId)
  }

  @Get('default/:userId')
  @ApiOperation({ summary: 'Récupérer la société par défaut d\'un utilisateur' })
  async findDefaultSociete(@Param('userId') userId: string): Promise<SocieteUser | null> {
    return this.societeUsersService.findDefaultSociete(userId)
  }

  @Get(':userId/:societeId')
  @ApiOperation({ summary: 'Récupérer une association utilisateur-société spécifique' })
  async findUserSociete(
    @Param('userId') userId: string,
    @Param('societeId') societeId: string
  ): Promise<SocieteUser | null> {
    return this.societeUsersService.findUserSociete(userId, societeId)
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle association utilisateur-société' })
  async create(@Body() associationData: Partial<SocieteUser>): Promise<SocieteUser> {
    return this.societeUsersService.create(associationData)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une association utilisateur-société' })
  async update(
    @Param('id') id: string,
    @Body() associationData: Partial<SocieteUser>
  ): Promise<SocieteUser> {
    return this.societeUsersService.update(id, associationData)
  }

  @Put('set-default/:userId/:societeId')
  @ApiOperation({ summary: 'Définir la société par défaut d\'un utilisateur' })
  async setDefault(
    @Param('userId') userId: string,
    @Param('societeId') societeId: string
  ): Promise<SocieteUser> {
    return this.societeUsersService.setDefault(userId, societeId)
  }

  @Put(':id/activate')
  @ApiOperation({ summary: 'Activer une association utilisateur-société' })
  async activate(@Param('id') id: string): Promise<SocieteUser> {
    return this.societeUsersService.activate(id)
  }

  @Put(':id/deactivate')
  @ApiOperation({ summary: 'Désactiver une association utilisateur-société' })
  async deactivate(@Param('id') id: string): Promise<SocieteUser> {
    return this.societeUsersService.deactivate(id)
  }

  @Put(':id/grant-permissions')
  @ApiOperation({ summary: 'Accorder des permissions à une association' })
  async grantPermissions(
    @Param('id') id: string,
    @Body('permissions') permissions: string[]
  ): Promise<SocieteUser> {
    return this.societeUsersService.grantPermissions(id, permissions)
  }

  @Put(':id/revoke-permissions')
  @ApiOperation({ summary: 'Révoquer des permissions d\'une association' })
  async revokePermissions(
    @Param('id') id: string,
    @Body('permissions') permissions: string[]
  ): Promise<SocieteUser> {
    return this.societeUsersService.revokePermissions(id, permissions)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une association utilisateur-société' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.societeUsersService.delete(id)
  }
}