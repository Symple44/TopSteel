import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Devis } from './entities/devis.entity';

@Injectable()
export class DevisService {
  constructor(
    @InjectRepository(Devis)
    private devisRepository: Repository<Devis>,
  ) {}

  async findAll(): Promise<Devis[]> {
    return this.devisRepository.find();
  }

  async findOne(id: string): Promise<Devis | null> {
    return this.devisRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Devis>): Promise<Devis> {
    const entity = this.devisRepository.create(data);
    return this.devisRepository.save(entity);
  }

  async update(id: string, data: Partial<Devis>): Promise<Devis | null> {
    await this.devisRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.devisRepository.delete(id);
  }
}
