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
import { CreateQualiteDto } from './dto/create-qualite.dto'
import { QualiteQueryDto } from './dto/qualite-query.dto'
import { UpdateQualiteDto } from './dto/update-qualite.dto'
import { QualiteService } from './qualite.service'

@Controller('qualite')
@ApiTags('✅ Qualité')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class QualiteController {
  constructor(private readonly qualiteService: QualiteService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Créer un nouveau qualite' })
  @ApiResponse({ status: 201, description: 'Qualite créé avec succès' })
  async create(@Body() createDto: CreateQualiteDto) {
    return this.qualiteService.create(createDto)
  }

  @Get()
  @ApiOperation({ summary: 'Lister les qualite avec pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Query() query: QualiteQueryDto) {
    return this.qualiteService.findAll(query)
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Statistiques des qualite' })
  async getStats() {
    return this.qualiteService.getStats()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un qualite par ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.qualiteService.findOne(id)
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Mettre à jour un qualite' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: UpdateQualiteDto) {
    return this.qualiteService.update(id, updateDto)
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un qualite' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.qualiteService.remove(id)
  }
}
