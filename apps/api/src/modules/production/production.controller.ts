import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductionService } from './production.service';

@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get()
  findAll() {
    return this.productionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productionService.findOne(id);
  }

  @Post()
  create(@Body() data: unknown) {
    return this.productionService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: unknown) {
    return this.productionService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productionService.remove(id);
  }
}

