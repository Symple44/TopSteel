// apps/api/src/modules/fournisseurs/fournisseurs.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { UpdateFournisseurDto } from './dto/update-fournisseur.dto';
import { Fournisseur } from './entities/fournisseur.entity';

@Injectable()
export class FournisseursService {
  constructor(
    @InjectRepository(Fournisseur)
    private fournisseurRepository: Repository<Fournisseur>,
  ) {}

  async create(createFournisseurDto: CreateFournisseurDto) {
    // Vérifier l'unicité du SIRET
    const existing = await this.fournisseurRepository.findOne({
      where: { siret: createFournisseurDto.siret },
    });

    if (existing) {
      throw new ConflictException('Un fournisseur avec ce SIRET existe déjà');
    }

    const fournisseur = this.fournisseurRepository.create(createFournisseurDto);
    return this.fournisseurRepository.save(fournisseur);
  }

  async findAll(filters: { search?: string; categorie?: string; actif?: boolean }) {
    const queryBuilder = this.fournisseurRepository.createQueryBuilder('fournisseur');

    if (filters.search) {
      queryBuilder.andWhere(
        '(fournisseur.nom ILIKE :search OR fournisseur.siret ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.categorie) {
      queryBuilder.andWhere(':categorie = ANY(fournisseur.categories)', {
        categorie: filters.categorie,
      });
    }

    if (filters.actif !== undefined) {
      queryBuilder.andWhere('fournisseur.actif = :actif', { actif: filters.actif });
    }

    return queryBuilder.orderBy('fournisseur.nom', 'ASC').getMany();
  }

  async findOne(id: string) {
    const fournisseur = await this.fournisseurRepository.findOne({
      where: { id },
      relations: ['produits', 'commandes'],
    });

    if (!fournisseur) {
      throw new NotFoundException(`Fournisseur ${id} non trouvé`);
    }

    return fournisseur;
  }

  async update(id: string, updateFournisseurDto: UpdateFournisseurDto) {
    const fournisseur = await this.findOne(id);

    // Si le SIRET change, vérifier l'unicité
    if (updateFournisseurDto.siret && updateFournisseurDto.siret !== fournisseur.siret) {
      const existing = await this.fournisseurRepository.findOne({
        where: { siret: updateFournisseurDto.siret },
      });

      if (existing) {
        throw new ConflictException('Un fournisseur avec ce SIRET existe déjà');
      }
    }

    Object.assign(fournisseur, updateFournisseurDto);
    return this.fournisseurRepository.save(fournisseur);
  }

  async toggleActif(id: string) {
    const fournisseur = await this.findOne(id);
    fournisseur.actif = !fournisseur.actif;
    return this.fournisseurRepository.save(fournisseur);
  }

  async remove(id: string) {
    const fournisseur = await this.findOne(id);
    
    // Vérifier s'il y a des commandes en cours
    const commandesEnCours = await this.fournisseurRepository
      .createQueryBuilder('fournisseur')
      .leftJoin('fournisseur.commandes', 'commande')
      .where('fournisseur.id = :id', { id })
      .andWhere('commande.statut IN (:...statuts)', {
        statuts: ['EN_COURS', 'CONFIRMEE'],
      })
      .getCount();

    if (commandesEnCours > 0) {
      throw new ConflictException(
        'Impossible de supprimer ce fournisseur, des commandes sont en cours',
      );
    }

    // Soft delete en désactivant le fournisseur
    fournisseur.actif = false;
    await this.fournisseurRepository.save(fournisseur);

    return { message: 'Fournisseur désactivé avec succès' };
  }

  async getProduits(id: string) {
    const fournisseur = await this.fournisseurRepository.findOne({
      where: { id },
      relations: ['produits'],
    });

    if (!fournisseur) {
      throw new NotFoundException(`Fournisseur ${id} non trouvé`);
    }

    return fournisseur.produits;
  }

  async getCommandes(id: string) {
    const fournisseur = await this.fournisseurRepository.findOne({
      where: { id },
      relations: ['commandes', 'commandes.lignes'],
    });

    if (!fournisseur) {
      throw new NotFoundException(`Fournisseur ${id} non trouvé`);
    }

    return fournisseur.commandes;
  }

  async getStats() {
    const totalFournisseurs = await this.fournisseurRepository.count();
    const fournisseursActifs = await this.fournisseurRepository.count({
      where: { actif: true },
    });

    const categoriesStats = await this.fournisseurRepository
      .createQueryBuilder('fournisseur')
      .select('categorie')
      .addSelect('COUNT(*)', 'count')
      .from(subQuery => {
        return subQuery
          .select('unnest(fournisseur.categories)', 'categorie')
          .from('fournisseurs', 'fournisseur');
      }, 'categories')
      .groupBy('categorie')
      .getRawMany();

    return {
      total: totalFournisseurs,
      actifs: fournisseursActifs,
      inactifs: totalFournisseurs - fournisseursActifs,
      parCategorie: categoriesStats,
    };
  }
}