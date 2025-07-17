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
import { CreateProductionDto } from './dto/create-production.dto'
import { ProductionQueryDto } from './dto/production-query.dto'
import { UpdateProductionDto } from './dto/update-production.dto'
import { ProductionService } from './production.service'

@Controller('production')
@ApiTags('🏭 Production')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Créer un nouveau production' })
  @ApiResponse({ status: 201, description: 'Production créé avec succès' })
  async create(@Body() createDto: CreateProductionDto) {
    return this.productionService.create(createDto)
  }

  @Get()
  @ApiOperation({ summary: 'Lister les production avec pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Query() query: ProductionQueryDto) {
    return this.productionService.findAll(query)
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Statistiques des production' })
  async getStats() {
    return this.productionService.getStats()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un production par ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productionService.findOne(id)
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Mettre à jour un production' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: UpdateProductionDto) {
    return this.productionService.update(id, updateDto)
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un production' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productionService.remove(id)
  }
}
