import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateFacturationDto } from './dto/create-facturation.dto';
import { UpdateFacturationDto } from './dto/update-facturation.dto';
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
  create(@Body() data: CreateFacturationDto) {
    return this.facturationService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateFacturationDto) {
    return this.facturationService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.facturationService.remove(id);
  }
}



