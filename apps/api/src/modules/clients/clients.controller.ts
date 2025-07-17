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
import { Roles } from '../../common/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { UserRole } from '../users/entities/user.entity'
import { ClientsService } from './clients.service'
import { ClientsQueryDto } from './dto/clients-query.dto'
import { CreateClientsDto } from './dto/create-clients.dto'
import { UpdateClientsDto } from './dto/update-clients.dto'

@Controller('clients')
@ApiTags('🏢 Clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.COMMERCIAL)
  @ApiOperation({ summary: 'Créer un nouveau client' })
  @ApiResponse({ status: 201, description: 'Client créé avec succès' })
  async create(@Body() createDto: CreateClientsDto) {
    return this.clientsService.create(createDto)
  }

  @Get()
  @ApiOperation({ summary: 'Lister les clients avec pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Query() query: ClientsQueryDto) {
    return this.clientsService.findAll(query)
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Statistiques des clients' })
  async getStats() {
    return this.clientsService.getStats()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un client par ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.findOne(id)
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.COMMERCIAL)
  @ApiOperation({ summary: 'Mettre à jour un client' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: UpdateClientsDto) {
    return this.clientsService.update(id, updateDto)
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un client' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.remove(id)
  }
}
