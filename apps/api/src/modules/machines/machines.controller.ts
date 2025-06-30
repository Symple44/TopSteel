import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { MachinesService } from './machines.service';
import { Machine } from './entities/machine.entity';

@Controller('machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Get()
  findAll() {
    return this.machinesService.findAll();
  }

  @Get('stats')
  getStatistics() {
    return this.machinesService.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.machinesService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Machine>) {
    return this.machinesService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<Machine>) {
    return this.machinesService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.machinesService.remove(id);
  }
}

