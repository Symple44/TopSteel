import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Post, Query, UseGuards
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { DocumentsService } from './documents.service';
import { CreateDocumentsDto } from './dto/create-documents.dto';
import { UpdateDocumentsDto } from './dto/update-documents.dto';
import { DocumentsQueryDto } from './dto/documents-query.dto';

@Controller('documents')
@ApiTags('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Créer un nouveau documents' })
  @ApiResponse({ status: 201, description: 'Documents créé avec succès' })
  async create(@Body() createDto: CreateDocumentsDto) {
    return this.documentsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les documents avec pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Query() query: DocumentsQueryDto) {
    return this.documentsService.findAll(query);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Statistiques des documents' })
  async getStats() {
    return this.documentsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un documents par ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Mettre à jour un documents' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateDocumentsDto
  ) {
    return this.documentsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un documents' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.remove(id);
  }
}
