import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FacturationService } from './facturation.service';

@Controller('facturation')
export class FacturationController {
  constructor(private readonly facturationService: FacturationService) {}

  @Get()
  findAll() {
    return this.facturationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.facturationService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.facturationService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.facturationService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.facturationService.remove(id);
  }
}
