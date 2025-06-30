import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { QualiteService } from './qualite.service';
import { ControleQualite } from './entities/qualite.entity';

@Controller('qualite')
export class QualiteController {
  constructor(private readonly qualiteService: QualiteService) {}

  @Get()
  findAll() {
    return this.qualiteService.findAll();
  }

  @Get('stats')
  getStatistics() {
    return this.qualiteService.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.qualiteService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<ControleQualite>) {
    return this.qualiteService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<ControleQualite>) {
    return this.qualiteService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.qualiteService.remove(id);
  }
}

