// apps/api/src/modules/devis/devis.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDevisDto } from './dto/create-devis.dto';
import { UpdateDevisDto } from './dto/update-devis.dto';
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

  async create(createDevisDto: CreateDevisDto): Promise<Devis> {
    // Transformation DTO -> Entity
    const devisData: Partial<Devis> = {
      ...createDevisDto,
      dateValidite: createDevisDto.dateValidite ? new Date(createDevisDto.dateValidite) : undefined,
    };

    const entity = this.devisRepository.create(devisData);
    return this.devisRepository.save(entity);
  }

  async update(id: string, updateDevisDto: UpdateDevisDto): Promise<Devis | null> {
    // Transformation DTO -> Entity
    const updateData: Partial<Devis> = {
      ...updateDevisDto,
      dateValidite: updateDevisDto.dateValidite ? new Date(updateDevisDto.dateValidite) : undefined,
    };

    await this.devisRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.devisRepository.delete(id);
  }
}