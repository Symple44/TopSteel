import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { PaginationResultDto } from '../../common/dto/base.dto';
import { CommandesQueryDto } from './dto/commandes-query.dto';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { UpdateCommandeDto } from './dto/update-commande.dto';
import { Commande } from './entities/commande.entity';

@Injectable()
export class CommandesService {
  constructor(
    @InjectRepository(Commande)
    private readonly repository: Repository<Commande>,
  ) {}

  async create(createDto: CreateCommandeDto): Promise<Commande> {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  async findAll(query: CommandesQueryDto): Promise<PaginationResultDto<Commande>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('entity');
    
    if (search) {
      queryBuilder.andWhere(
        '(entity.numero ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (query.fournisseur) {
      queryBuilder.andWhere('entity.fournisseur = :fournisseur', { fournisseur: query.fournisseur });
    }

    if (query.montantMin !== undefined || query.montantMax !== undefined) {
      const min = query.montantMin || 0;
      const max = query.montantMax || Number.MAX_VALUE;
      queryBuilder.andWhere('entity.montant BETWEEN :min AND :max', { min, max });
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

  async findOne(id: number): Promise<Commande> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Commande avec l'ID ${id} non trouvée`);
    }
    return entity;
  }

  async update(id: number, updateDto: UpdateCommandeDto): Promise<Commande> {
    await this.repository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Commande avec l'ID ${id} non trouvée`);
    }
  }

  async findByFournisseur(fournisseurId: number): Promise<Commande[]> {
    return this.repository.find({
      where: { fournisseur: fournisseurId },
      order: { createdAt: 'DESC' }
    });
  }

  async getStats(): Promise<any> {
    const total = await this.repository.count();
    
    const montantTotal = await this.repository
      .createQueryBuilder('commande')
      .select('SUM(commande.montant)', 'sum')
      .getRawOne()
      .then(result => parseFloat(result.sum) || 0);

    const montantMoyen = total > 0 ? montantTotal / total : 0;

    const parFournisseur = await this.repository
      .createQueryBuilder('commande')
      .select('commande.fournisseur, COUNT(*) as count, SUM(commande.montant) as total')
      .groupBy('commande.fournisseur')
      .getRawMany();

    // Commandes récentes (30 derniers jours)
    const dateRecente = new Date();
    dateRecente.setDate(dateRecente.getDate() - 30);
    
    const commandesRecentes = await this.repository.count({
      where: {
        createdAt: Between(dateRecente, new Date())
      }
    });
    
    return {
      total,
      montantTotal,
      montantMoyen: Math.round(montantMoyen * 100) / 100,
      parFournisseur,
      commandesRecentes
    };
  }

  async generateNumero(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.repository
      .createQueryBuilder('commande')
      .where('EXTRACT(YEAR FROM commande.createdAt) = :year', { year })
      .getCount();
    
    return `CMD-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}