import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationResultDto } from '../../common/dto/base.dto';
import { CreateFournisseursDto } from './dto/create-fournisseurs.dto';
import { FournisseursQueryDto } from './dto/fournisseurs-query.dto';
import { UpdateFournisseursDto } from './dto/update-fournisseurs.dto';
import { Fournisseur } from './entities/fournisseur.entity';

@Injectable()
export class FournisseursService {
  constructor(
    @InjectRepository(Fournisseur)
    private readonly repository: Repository<Fournisseur>,
  ) {}

  async create(createDto: CreateFournisseursDto): Promise<Fournisseur> {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  async findAll(query: FournisseursQueryDto): Promise<PaginationResultDto<Fournisseur>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('entity');
    
    if (search) {
      queryBuilder.andWhere(
        '(entity.nom ILIKE :search OR entity.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (query.actif !== undefined) {
      queryBuilder.andWhere('entity.actif = :actif', { actif: query.actif });
    }

    const [data, total] = await queryBuilder
      .orderBy(`entity.${sortBy}`, sortOrder as 'ASC' | 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  async findOne(id: string): Promise<Fournisseur> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Fournisseurs with ID ${id} not found`);
    }
    return entity;
  }

  async update(id: string, updateDto: UpdateFournisseursDto): Promise<Fournisseur> {
    await this.repository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async getStats(): Promise<unknown> {
    const total = await this.repository.count();
    const active = await this.repository.count({ where: { actif: true } });
    
    return {
      total,
      active,
      inactive: total - active
    };
  }
}
