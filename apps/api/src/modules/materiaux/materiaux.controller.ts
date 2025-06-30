import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MateriauxService } from './materiaux.service';
import { Materiau } from './entities/materiaux.entity';

@Controller('materiaux')
export class MateriauxController {
  constructor(private readonly materiauxService: MateriauxService) {}

  @Get()
  findAll() {
    return this.materiauxService.findAll();
  }

  @Get('stats')
  getStatistics() {
    return this.materiauxService.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.materiauxService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Materiau>) {
    return this.materiauxService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<Materiau>) {
    return this.materiauxService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.materiauxService.remove(id);
  }
}
