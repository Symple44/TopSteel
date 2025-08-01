import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import { CreateQueryBuilderDto } from '../dto/create-query-builder.dto'
import { ExecuteQueryDto } from '../dto/execute-query.dto'
import { UpdateQueryBuilderDto } from '../dto/update-query-builder.dto'
import { QueryBuilderService } from '../services/query-builder.service'
import { QueryBuilderExecutorService } from '../services/query-builder-executor.service'
import { SchemaIntrospectionService } from '../services/schema-introspection.service'

@Controller('query-builder')
@UseGuards(JwtAuthGuard)
export class QueryBuilderController {
  constructor(
    private readonly queryBuilderService: QueryBuilderService,
    private readonly executorService: QueryBuilderExecutorService,
    private readonly schemaService: SchemaIntrospectionService
  ) {}

  @Post()
  create(@Body() createDto: CreateQueryBuilderDto, @Request() req) {
    return this.queryBuilderService.create(createDto, req.user.id)
  }

  @Get()
  findAll(@Request() req) {
    return this.queryBuilderService.findAll(req.user.id)
  }

  @Get('schema/tables')
  getTables(@Query('schema') schema: string = 'public') {
    return this.schemaService.getTables(schema)
  }

  @Get('schema/tables/:table/columns')
  getTableColumns(@Param('table') table: string, @Query('schema') schema: string = 'public') {
    return this.schemaService.getColumns(table, schema)
  }

  @Get('schema/tables/:table/relations')
  getTableRelations(@Param('table') table: string, @Query('schema') schema: string = 'public') {
    return this.schemaService.getRelations(table, schema)
  }

  @Get('schema/databases')
  getDatabases() {
    return this.schemaService.getDatabases()
  }

  @Get('schema/schemas')
  getSchemas() {
    return this.schemaService.getSchemas()
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.queryBuilderService.findOne(id, req.user.id)
  }

  @Post(':id/execute')
  async execute(@Param('id') id: string, @Body() executeDto: ExecuteQueryDto, @Request() req) {
    const queryBuilder = await this.queryBuilderService.findOne(id, req.user.id)
    return this.executorService.executeQuery(queryBuilder, executeDto, req.user.id)
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string, @Request() req) {
    return this.queryBuilderService.duplicate(id, req.user.id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateQueryBuilderDto, @Request() req) {
    return this.queryBuilderService.update(id, updateDto, req.user.id)
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.queryBuilderService.remove(id, req.user.id)
  }

  @Post(':id/add-to-menu')
  async addToMenu(
    @Param('id') id: string,
    @Body() body: { title?: string; icon?: string },
    @Request() req
  ) {
    const queryBuilder = await this.queryBuilderService.findOne(id, req.user.id)

    // Retourner les informations nécessaires pour ajouter au menu
    return {
      queryBuilderId: id,
      title: body.title || queryBuilder.name,
      icon: body.icon || 'BarChart3',
      type: 'D',
      description: `Vue Data: ${queryBuilder.description || queryBuilder.name}`,
    }
  }
}
