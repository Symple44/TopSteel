import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { StocksService } from './stocks.service';

@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get()
  findAll() {
    return this.stocksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stocksService.findOne(id);
  }

  @Post()
  create(@Body() data: CreateStockDto) {
    return this.stocksService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateStockDto) {
    return this.stocksService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stocksService.remove(id);
  }
}



