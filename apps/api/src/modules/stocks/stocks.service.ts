import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stocks } from './entities/stocks.entity';

@Injectable()
export class StocksService {
  constructor(
    @InjectRepository(Stocks)
    private stocksRepository: Repository<Stocks>,
  ) {}

  async findAll(): Promise<Stocks[]> {
    return this.stocksRepository.find();
  }

  async findOne(id: string): Promise<Stocks> {
    return this.stocksRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Stocks>): Promise<Stocks> {
    const entity = this.stocksRepository.create(data);
    return this.stocksRepository.save(entity);
  }

  async update(id: string, data: Partial<Stocks>): Promise<Stocks> {
    await this.stocksRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.stocksRepository.delete(id);
  }
}
