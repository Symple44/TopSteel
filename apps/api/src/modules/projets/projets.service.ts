import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjetDto } from './dto/create-projet.dto';
import { ProjetQueryDto } from './dto/projet-query.dto';
import { UpdateProjetDto } from './dto/update-projet.dto';
import { Projet, ProjetStatut } from './entities/projet.entity';

@Injectable()
export class ProjetsService {
  constructor(
    @InjectRepository(Projet)
    private readonly projetsRepository: Repository<Projet>,
  ) {}

  async create(createProjetDto: CreateProjetDto): Promise<Projet> {
    const projet = this.projetsRepository.create(createProjetDto);
    return this.projetsRepository.save(projet);
  }

  async findAll(queryDto: ProjetQueryDto = {}): Promise<Projet[]> {
    const {
      page = 1,
      limit = 10,
      statut,
      search,
      clientId,
      dateDebut: _dateDebut,
      dateFin: _dateFin,
      montantMin: _montantMin,
      montantMax: _montantMax ,
    } = queryDto;

    const query = this.projetsRepository.createQueryBuilder('projet');

    if (statut) {
      query.andWhere('projet.statut = :statut', { statut });
    }

    if (search) {
      query.andWhere('(projet.nom ILIKE :search OR projet.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (clientId) {
      query.andWhere('projet.clientId = :clientId', { clientId });
    }

    query.skip((page - 1) * limit).take(limit);

    return query.getMany();
  }

  async findOne(id: string | number): Promise<Projet> {
    const projetId = typeof id === 'string' ? parseInt(id, 10) : id;
    const projet = await this.projetsRepository.findOne({ where: { id: projetId } });
    if (!projet) {
      throw new NotFoundException(`Projet avec l'ID ${projetId} introuvable`);
    }
    return projet;
  }

  async update(id: string | number, updateProjetDto: UpdateProjetDto): Promise<Projet> {
    const projetId = typeof id === 'string' ? parseInt(id, 10) : id;
    await this.projetsRepository.update(projetId, updateProjetDto);
    return this.findOne(projetId);
  }

  async remove(id: string | number): Promise<void> {
    const projetId = typeof id === 'string' ? parseInt(id, 10) : id;
    const result = await this.projetsRepository.delete(projetId);
    if (result.affected === 0) {
      throw new NotFoundException(`Projet avec l'ID ${projetId} introuvable`);
    }
  }

  async updateStatut(id: string | number, statut: ProjetStatut | string): Promise<Projet> {
    const projetId = typeof id === 'string' ? parseInt(id, 10) : id;
    await this.projetsRepository.update(projetId, { statut: statut as ProjetStatut });
    return this.findOne(projetId);
  }

  async addDocument(
    id: string | number,
    _documentData: unknown
  ): Promise<{ message: string; projetId: number }> {
    const projetId = typeof id === 'string' ? parseInt(id, 10) : id;
    return { message: 'Fonctionnalité documents en cours de développement', projetId };
  }

  async getTimeline(id: string | number): Promise<{ message: string; projetId: number }> {
    const projetId = typeof id === 'string' ? parseInt(id, 10) : id;
    return { message: 'Timeline en cours de développement', projetId };
  }

  async getStats(_user: unknown): Promise<{ total: number; enCours: number; termines: number; brouillons: number }> {
    const totalProjets = await this.projetsRepository.count();
    const projetsEnCours = await this.projetsRepository.count({ 
      where: { statut: ProjetStatut.EN_COURS } 
    });
    const projetsTermines = await this.projetsRepository.count({ 
      where: { statut: ProjetStatut.TERMINE } 
    });

    return {
      total: totalProjets,
      enCours: projetsEnCours,
      termines: projetsTermines,
      brouillons: totalProjets - projetsEnCours - projetsTermines
    };
  }

  async updateAvancement(
    id: string | number,
    avancement: number
  ): Promise<{ message: string; projetId: number; avancement: number }> {
    const projetId = typeof id === 'string' ? parseInt(id, 10) : id;
    return { message: 'Avancement mis à jour', projetId, avancement };
  }
}

