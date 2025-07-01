import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Projets } from './entities/projets.entity';
import { CreateProjetsDto } from './dto/create-projets.dto';
import { UpdateProjetsDto } from './dto/update-projets.dto';
import { ProjetsQueryDto } from './dto/projets-query.dto';
import { PaginationResultDto } from '../../common/dto/base.dto';

@Injectable()
export class ProjetsService {
  constructor(
    @InjectRepository(Projets)
    private readonly repository: Repository<Projets>,
  ) {}

  async create(createDto: CreateProjetsDto): Promise<Projets> {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  async findAll(query: ProjetsQueryDto): Promise<PaginationResultDto<Projets>> {
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

  async findOne(id: string): Promise<Projets> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Projets with ID ${id} not found`);
    }
    return entity;
  }

  async update(id: string, updateDto: UpdateProjetsDto): Promise<Projets> {
    await this.repository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async getStats(): Promise<any> {
    const total = await this.repository.count();
    const active = await this.repository.count({ where: { actif: true } });
    
    return {
      total,
      active,
      inactive: total - active
    };
  }
}
