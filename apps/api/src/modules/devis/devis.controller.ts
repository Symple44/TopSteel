import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DevisService } from './devis.service';

@Controller('devis')
export class DevisController {
  constructor(private readonly devisService: DevisService) {}

  @Get()
  findAll() {
    return this.devisService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.devisService.findOne(id);
  }

  @Post()
  create(@Body() data: unknown) {
    return this.devisService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: unknown) {
    return this.devisService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.devisService.remove(id);
  }
}

