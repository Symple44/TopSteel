import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OperationService } from './operation.service';
import { CreateOperationDto } from './dto/create-operation.dto';
import { UpdateOperationDto } from './dto/update-operation.dto';
import { OperationStatut } from './entities/operation.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('operations')
@ApiTags('🔧 Opérations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class OperationController {
  constructor(private readonly operationService: OperationService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIEN)
  @ApiOperation({ summary: 'Créer une nouvelle opération' })
  @ApiResponse({ status: 201, description: 'Opération créée avec succès' })
  create(@Body() createOperationDto: CreateOperationDto) {
    return this.operationService.create(createOperationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les opérations' })
  findAll() {
    return this.operationService.findAll();
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Statistiques des opérations' })
  getStats() {
    return this.operationService.getStats();
  }

  @Get('ordre/:ordreFabricationId')
  @ApiOperation({ summary: 'Lister les opérations d\'un ordre de fabrication' })
  findByOrdre(@Param('ordreFabricationId', ParseIntPipe) ordreFabricationId: number) {
    return this.operationService.findByOrdre(ordreFabricationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une opération par ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.operationService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIEN)
  @ApiOperation({ summary: 'Mettre à jour une opération' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOperationDto: UpdateOperationDto,
  ) {
    return this.operationService.update(id, updateOperationDto);
  }

  @Patch(':id/statut')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIEN)
  @ApiOperation({ summary: 'Changer le statut d\'une opération' })
  changeStatut(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { statut: OperationStatut },
  ) {
    return this.operationService.changeStatut(id, body.statut);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Supprimer une opération' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.operationService.remove(id);
  }
}
