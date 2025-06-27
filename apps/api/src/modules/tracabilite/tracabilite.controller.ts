import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TracabiliteService } from './tracabilite.service';
import { Tracabilite } from './entities/tracabilite.entity';

@Controller('tracabilite')
export class TracabiliteController {
  constructor(private readonly tracabiliteService: TracabiliteService) {}

  @Get()
  findAll() {
    return this.tracabiliteService.findAll();
  }

  @Get('stats')
  getStatistics() {
    return this.tracabiliteService.getStatistics();
  }

  @Get('id')
  findOne(@Param('id') id: string) {
    return this.tracabiliteService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Tracabilite>) {
    return this.tracabiliteService.create(data);
  }

  @Put('id')
  update(@Param('id') id: string, @Body() data: Partial<Tracabilite>) {
    return this.tracabiliteService.update(id, data);
  }

  @Delete('id')
  remove(@Param('id') id: string) {
    return this.tracabiliteService.remove(id);
  }
}