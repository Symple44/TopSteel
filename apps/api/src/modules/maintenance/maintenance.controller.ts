import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { Maintenance } from './entities/maintenance.entity';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  findAll() {
    return this.maintenanceService.findAll();
  }

  @Get('stats')
  getStatistics() {
    return this.maintenanceService.getStatistics();
  }

  @Get('id')
  findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Maintenance>) {
    return this.maintenanceService.create(data);
  }

  @Put('id')
  update(@Param('id') id: string, @Body() data: Partial<Maintenance>) {
    return this.maintenanceService.update(id, data);
  }

  @Delete('id')
  remove(@Param('id') id: string) {
    return this.maintenanceService.remove(id);
  }
}