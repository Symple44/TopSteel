// apps/api/src/modules/production/production.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductionDto } from './dto/create-production.dto';
import { UpdateProductionDto } from './dto/update-production.dto';
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

  async create(createProductionDto: CreateProductionDto): Promise<Production> {
    // Transformation DTO -> Entity
    const productionData: Partial<Production> = {
      ...createProductionDto,
      dateDebut: createProductionDto.dateDebut ? new Date(createProductionDto.dateDebut) : undefined,
      dateFin: createProductionDto.dateFin ? new Date(createProductionDto.dateFin) : undefined,
    };

    const entity = this.productionRepository.create(productionData);
    return this.productionRepository.save(entity);
  }

  async update(id: string, updateProductionDto: UpdateProductionDto): Promise<Production | null> {
    // Transformation DTO -> Entity
    const updateData: Partial<Production> = {
      ...updateProductionDto,
      dateDebut: updateProductionDto.dateDebut ? new Date(updateProductionDto.dateDebut) : undefined,
      dateFin: updateProductionDto.dateFin ? new Date(updateProductionDto.dateFin) : undefined,
    };

    await this.productionRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.productionRepository.delete(id);
  }
}