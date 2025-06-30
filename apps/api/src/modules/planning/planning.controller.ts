import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { PlanningService } from './planning.service';
import { Planning } from './entities/planning.entity';

@Controller('planning')
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Get()
  findAll() {
    return this.planningService.findAll();
  }

  @Get('stats')
  getStatistics() {
    return this.planningService.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.planningService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Planning>) {
    return this.planningService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<Planning>) {
    return this.planningService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.planningService.remove(id);
  }
}

