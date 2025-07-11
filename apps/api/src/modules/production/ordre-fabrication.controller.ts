import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
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
import type { CreateOrdreFabricationDto } from './dto/create-ordre-fabrication.dto'
import type { OrdreFabricationQueryDto } from './dto/ordre-fabrication-query.dto'
import type { UpdateOrdreFabricationDto } from './dto/update-ordre-fabrication.dto'
import type { OrdreFabricationStatut } from './entities/ordre-fabrication.entity'
import type { OrdreFabricationService } from './ordre-fabrication.service'

@Controller('ordre-fabrication')
@ApiTags('🏭 Ordre de fabrication')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class OrdreFabricationController {
  constructor(private readonly ordreFabricationService: OrdreFabricationService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIEN)
  @ApiOperation({ summary: 'Créer un nouvel ordre de fabrication' })
  @ApiResponse({
    status: 201,
    description: 'Ordre de fabrication créé avec succès',
  })
  async create(@Body() createDto: CreateOrdreFabricationDto) {
    return this.ordreFabricationService.create(createDto)
  }

  @Get()
  @ApiOperation({ summary: 'Lister les ordres de fabrication avec pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'statut', required: false, type: String })
  @ApiQuery({ name: 'projet', required: false, type: Number })
  async findAll(@Query() query: OrdreFabricationQueryDto) {
    return this.ordreFabricationService.findAll(query)
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Statistiques des ordres de fabrication' })
  async getStats() {
    return this.ordreFabricationService.getStats()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un ordre de fabrication par ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordreFabricationService.findOne(id)
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIEN)
  @ApiOperation({ summary: 'Mettre à jour un ordre de fabrication' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateOrdreFabricationDto
  ) {
    return this.ordreFabricationService.update(id, updateDto)
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un ordre de fabrication' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.ordreFabricationService.remove(id)
  }

  @Patch(':id/statut')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIEN)
  @ApiOperation({ summary: "Changer le statut d'un ordre de fabrication" })
  async changeStatut(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { statut: OrdreFabricationStatut }
  ) {
    return this.ordreFabricationService.changeStatut(id, body.statut)
  }
}
