import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facturation } from './entities/facturation.entity';

@Injectable()
export class FacturationService {
  constructor(
    @InjectRepository(Facturation)
    private facturationRepository: Repository<Facturation>,
  ) {}

  async findAll(): Promise<Facturation[]> {
    return this.facturationRepository.find();
  }

  async findOne(id: string): Promise<Facturation> {
    return this.facturationRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Facturation>): Promise<Facturation> {
    const entity = this.facturationRepository.create(data);
    return this.facturationRepository.save(entity);
  }

  async update(id: string, data: Partial<Facturation>): Promise<Facturation> {
    await this.facturationRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.facturationRepository.delete(id);
  }
}
