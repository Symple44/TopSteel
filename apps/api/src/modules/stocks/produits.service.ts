import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { PaginationResultDto } from '../../common/dto/base.dto';
import { CreateProduitDto } from './dto/create-produit.dto';
import { ProduitsQueryDto } from './dto/produits-query.dto';
import { UpdateProduitDto } from './dto/update-produit.dto';
import { Produit } from './entities/produit.entity';

@Injectable()
export class ProduitsService {
  constructor(
    @InjectRepository(Produit)
    private readonly repository: Repository<Produit>,
  ) {}

  async create(createDto: CreateProduitDto): Promise<Produit> {
    // Vérifier l'unicité de la référence
    const existingProduit = await this.repository.findOne({
      where: { reference: createDto.reference }
    });
    
    if (existingProduit) {
      throw new ConflictException(`Un produit avec la référence ${createDto.reference} existe déjà`);
    }

    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  async findAll(query: ProduitsQueryDto): Promise<PaginationResultDto<Produit>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('entity');
    
    if (search) {
      queryBuilder.andWhere(
        '(entity.nom ILIKE :search OR entity.reference ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (query.fournisseurPrincipal) {
      queryBuilder.andWhere('entity.fournisseurPrincipal = :fournisseur', { 
        fournisseur: query.fournisseurPrincipal 
      });
    }

    if (query.prixMin !== undefined || query.prixMax !== undefined) {
      const min = query.prixMin || 0;
      const max = query.prixMax || Number.MAX_VALUE;
      queryBuilder.andWhere('entity.prix BETWEEN :min AND :max', { min, max });
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

  async findOne(id: number): Promise<Produit> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }
    return entity;
  }

  async findByReference(reference: string): Promise<Produit> {
    const entity = await this.repository.findOne({ where: { reference } });
    if (!entity) {
      throw new NotFoundException(`Produit avec la référence ${reference} non trouvé`);
    }
    return entity;
  }

  async searchByReference(searchTerm: string): Promise<Produit[]> {
    return this.repository.find({
      where: { reference: Like(`%${searchTerm}%`) },
      take: 10,
      order: { reference: 'ASC' }
    });
  }

  async findByFournisseur(fournisseurId: number): Promise<Produit[]> {
    return this.repository.find({
      where: { fournisseurPrincipal: fournisseurId },
      order: { nom: 'ASC' }
    });
  }

  async update(id: number, updateDto: UpdateProduitDto): Promise<Produit> {
    // Si la référence est modifiée, vérifier l'unicité
    if (updateDto.reference) {
      const existingProduit = await this.repository.findOne({
        where: { reference: updateDto.reference }
      });
      
      if (existingProduit && existingProduit.id !== id) {
        throw new ConflictException(`Un produit avec la référence ${updateDto.reference} existe déjà`);
      }
    }

    await this.repository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }
  }

  async getStats(): Promise<unknown> {
    const total = await this.repository.count();
    
    const prixMoyen = await this.repository
      .createQueryBuilder('produit')
      .select('AVG(produit.prix)', 'moyenne')
      .getRawOne()
      .then(result => parseFloat(result.moyenne) || 0);

    const prixMax = await this.repository
      .createQueryBuilder('produit')
      .select('MAX(produit.prix)', 'max')
      .getRawOne()
      .then(result => parseFloat(result.max) || 0);

    const prixMin = await this.repository
      .createQueryBuilder('produit')
      .select('MIN(produit.prix)', 'min')
      .getRawOne()
      .then(result => parseFloat(result.min) || 0);

    const parFournisseur = await this.repository
      .createQueryBuilder('produit')
      .select('produit.fournisseurPrincipal, COUNT(*) as count')
      .groupBy('produit.fournisseurPrincipal')
      .getRawMany();

    const sansReference = await this.repository.count({
      where: { reference: '' }
    });
    
    return {
      total,
      prixMoyen: Math.round(prixMoyen * 100) / 100,
      prixMax,
      prixMin,
      parFournisseur,
      sansReference
    };
  }

  async checkReferenceExists(reference: string): Promise<boolean> {
    const count = await this.repository.count({ where: { reference } });
    return count > 0;
  }
}