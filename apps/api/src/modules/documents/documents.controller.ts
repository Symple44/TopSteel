import {
  Body,
  Controller,
  Delete,
  Get,
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
import { DocumentsService } from './documents.service'
import { CreateDocumentsDto } from './dto/create-documents.dto'
import { DocumentsQueryDto } from './dto/documents-query.dto'
import { UpdateDocumentsDto } from './dto/update-documents.dto'

@Controller('documents')
@ApiTags('📄 Documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Créer un nouveau documents' })
  @ApiResponse({ status: 201, description: 'Documents créé avec succès' })
  async create(@Body() createDto: CreateDocumentsDto) {
    return this.documentsService.create(createDto)
  }

  @Get()
  @ApiOperation({ summary: 'Lister les documents avec pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Query() query: DocumentsQueryDto) {
    return this.documentsService.findAll(query)
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Statistiques des documents' })
  async getStats() {
    return this.documentsService.getStats()
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.findOne(id)
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateDocumentsDto) {
    return this.documentsService.update(id, updateDto)
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.remove(id)
  }
}
