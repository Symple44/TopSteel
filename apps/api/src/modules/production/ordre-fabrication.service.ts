import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationResultDto } from '../../common/dto/base.dto';
import { CreateOrdreFabricationDto } from './dto/create-ordre-fabrication.dto';
import { OrdreFabricationQueryDto } from './dto/ordre-fabrication-query.dto';
import { UpdateOrdreFabricationDto } from './dto/update-ordre-fabrication.dto';
import { OrdreFabrication } from './entities/ordre-fabrication.entity';

@Injectable()
export class OrdreFabricationService {
  constructor(
    @InjectRepository(OrdreFabrication)
    private readonly repository: Repository<OrdreFabrication>,
  ) {}

  async create(createDto: CreateOrdreFabricationDto): Promise<OrdreFabrication> {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  async findAll(query: OrdreFabricationQueryDto): Promise<PaginationResultDto<OrdreFabrication>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('entity');
    
    if (search) {
      queryBuilder.andWhere(
        '(entity.numero ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (query.statut) {
      queryBuilder.andWhere('entity.statut = :statut', { statut: query.statut });
    }

    if (query.projet) {
      queryBuilder.andWhere('entity.projet = :projet', { projet: query.projet });
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

  async findOne(id: number): Promise<OrdreFabrication> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Ordre de fabrication avec l'ID ${id} non trouvé`);
    }
    return entity;
  }

  async update(id: number, updateDto: UpdateOrdreFabricationDto): Promise<OrdreFabrication> {
    await this.repository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Ordre de fabrication avec l'ID ${id} non trouvé`);
    }
  }

  async changeStatut(id: number, statut: string): Promise<OrdreFabrication> {
    await this.repository.update(id, { statut });
    return this.findOne(id);
  }

  async getStats(): Promise<unknown> {
    const total = await this.repository.count();
    
    const byStatut = await this.repository
      .createQueryBuilder('of')
      .select('of.statut, COUNT(*) as count')
      .groupBy('of.statut')
      .getRawMany();

    const enCours = await this.repository.count({ 
      where: { statut: 'EN_COURS' } 
    });

    const termine = await this.repository.count({ 
      where: { statut: 'TERMINE' } 
    });
    
    return {
      total,
      enCours,
      termine,
      byStatut
    };
  }

  async findByProjet(projetId: number): Promise<OrdreFabrication[]> {
    return this.repository.find({
      where: { projet: projetId },
      order: { createdAt: 'DESC' }
    });
  }
}