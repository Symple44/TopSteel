import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { UpdateFournisseurDto } from './dto/update-fournisseur.dto';
import { Fournisseur } from './entities/fournisseur.entity';

interface FindAllOptions {
  search?: string;
  categorie?: string;
  actif?: boolean;
}

@Injectable()
export class FournisseursService {
  constructor(
    @InjectRepository(Fournisseur)
    private readonly fournisseurRepository: Repository<Fournisseur>,
  ) {}

  async create(createFournisseurDto: CreateFournisseurDto): Promise<Fournisseur> {
    const fournisseur = this.fournisseurRepository.create({
      ...createFournisseurDto,
      actif: true,
    });
    return this.fournisseurRepository.save(fournisseur);
  }

  async findAll(options: FindAllOptions = {}): Promise<Fournisseur[]> {
    const queryBuilder = this.fournisseurRepository.createQueryBuilder('fournisseur');
    
    if (options.actif !== undefined) {
      queryBuilder.andWhere('fournisseur.actif = :actif', { actif: options.actif });
    }
    
    if (options.search) {
      queryBuilder.andWhere(
        '(fournisseur.nom ILIKE :search OR fournisseur.email ILIKE :search)',
        { search: '%' + options.search + '%' }
      );
    }
    
    return queryBuilder.orderBy('fournisseur.nom', 'ASC').getMany();
  }

  async getStats(): Promise<{ total: number; actifs: number; inactifs: number; nouveaux: number }> {
    const total = await this.fournisseurRepository.count();
    const actifs = await this.fournisseurRepository.count({ where: { actif: true } });
    
    return {
      total,
      actifs,
      inactifs: total - actifs,
      nouveaux: 0
    };
  }

  async findOne(id: number): Promise<Fournisseur> {
    const fournisseur = await this.fournisseurRepository.findOne({ where: { id: +id } });
    if (!fournisseur) {
      throw new NotFoundException('Fournisseur introuvable');
    }
    return fournisseur;
  }

  async update(id: number, updateFournisseurDto: UpdateFournisseurDto): Promise<Fournisseur> {
    await this.fournisseurRepository.update(id, updateFournisseurDto);
    return this.findOne(id);
  }

  async toggleActif(id: number): Promise<Fournisseur> {
    const fournisseur = await this.findOne(id);
    fournisseur.actif = !fournisseur.actif;
    return this.fournisseurRepository.save(fournisseur);
  }

  async remove(id: number): Promise<void> {
    const fournisseur = await this.findOne(id);
    fournisseur.actif = false;
    await this.fournisseurRepository.save(fournisseur);
  }

  async getProduits(id: number): Promise<[]> {
    await this.findOne(id);
    return [];
  }

  async getCommandes(id: number): Promise<unknown[]> {
    await this.findOne(id);
    return [];
  }
}

