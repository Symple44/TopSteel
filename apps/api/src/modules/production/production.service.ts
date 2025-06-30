import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Production } from './entities/production.entity';

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(Production)
    private productionRepository: Repository<Production>,
  ) {}

  async findAll(): Promise<Production[]> {
    return this.productionRepository.find();
  }

  async findOne(id: string): Promise<Production | null> {
    return this.productionRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Production>): Promise<Production> {
    const entity = this.productionRepository.create(data);
    return this.productionRepository.save(entity);
  }

  async update(id: string, data: Partial<Production>): Promise<Production | null> {
    await this.productionRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.productionRepository.delete(id);
  }
}
