import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { DevisService } from './devis.service';
import { CreateDevisDto } from './dto/create-devis.dto';
import { UpdateDevisDto } from './dto/update-devis.dto';

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
create(@Body() data: CreateDevisDto) {
    return this.devisService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateDevisDto) {
    return this.devisService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.devisService.remove(id);
  }
}



