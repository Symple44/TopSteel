// apps/api/src/modules/facturation/facturation.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFacturationDto } from './dto/create-facturation.dto';
import { UpdateFacturationDto } from './dto/update-facturation.dto';
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

  async findOne(id: string): Promise<Facturation | null> {
    return this.facturationRepository.findOne({ where: { id } });
  }

  async create(createFacturationDto: CreateFacturationDto): Promise<Facturation> {
    // Transformation DTO -> Entity
    const facturationData: Partial<Facturation> = {
      ...createFacturationDto,
      dateFacturation: createFacturationDto.dateFacturation ? new Date(createFacturationDto.dateFacturation) : undefined,
    };

    const entity = this.facturationRepository.create(facturationData);
    return this.facturationRepository.save(entity);
  }

  async update(id: string, updateFacturationDto: UpdateFacturationDto): Promise<Facturation | null> {
    // Transformation DTO -> Entity
    const updateData: Partial<Facturation> = {
      ...updateFacturationDto,
      dateFacturation: updateFacturationDto.dateFacturation ? new Date(updateFacturationDto.dateFacturation) : undefined,
    };

    await this.facturationRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.facturationRepository.delete(id);
  }
}