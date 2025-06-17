// apps/api/src/modules/projets/projets.service.ts
import { InjectQueue } from "@nestjs/bull";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Queue } from "bull";
import { Repository } from "typeorm";
import { ClientsService } from "../clients/clients.service";
import { CreateProjetDto } from "./dto/create-projet.dto";
import { ProjetQueryDto } from "./dto/projet-query.dto";
import { UpdateProjetDto } from "./dto/update-projet.dto";
import { Projet, ProjetStatut } from "./entities/projet.entity";

@Injectable()
export class ProjetsService {
  constructor(
    @InjectRepository(Projet)
    private projetRepository: Repository<Projet>,
    private clientsService: ClientsService,
    @InjectQueue("projets")
    private projetsQueue: Queue
  ) {}

  async create(createProjetDto: CreateProjetDto, userId: string) {
    // Vérifier que le client existe
    await this.clientsService.findOne(createProjetDto.clientId);

    // Générer la référence
    const reference = await this.generateReference();

    const projet = this.projetRepository.create({
      ...createProjetDto,
      reference,
      responsableId: userId,
    });

    const savedProjet = await this.projetRepository.save(projet);

    // Ajouter une tâche de notification
    await this.projetsQueue.add("projet-created", {
      projetId: savedProjet.id,
      userId,
    });

    return this.findOne(savedProjet.id);
  }

  async findAll(query: ProjetQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      statut,
      clientId,
      dateDebut,
      dateFin,
      montantMin,
      montantMax,
    } = query;

    const queryBuilder = this.projetRepository
      .createQueryBuilder("projet")
      .leftJoinAndSelect("projet.client", "client")
      .leftJoinAndSelect("projet.responsable", "responsable");

    if (search) {
      queryBuilder.andWhere(
        "(projet.reference ILIKE :search OR projet.description ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (statut) {
      queryBuilder.andWhere("projet.statut = :statut", { statut });
    }

    if (clientId) {
      queryBuilder.andWhere("projet.clientId = :clientId", { clientId });
    }

    if (dateDebut && dateFin) {
      queryBuilder.andWhere(
        "projet.dateDebut BETWEEN :dateDebut AND :dateFin",
        {
          dateDebut,
          dateFin,
        }
      );
    }

    if (montantMin !== undefined) {
      queryBuilder.andWhere("projet.montantHT >= :montantMin", { montantMin });
    }

    if (montantMax !== undefined) {
      queryBuilder.andWhere("projet.montantHT <= :montantMax", { montantMax });
    }

    queryBuilder
      .orderBy("projet.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const projet = await this.projetRepository.findOne({
      where: { id },
      relations: ["client", "responsable", "devis", "documents"],
    });

    if (!projet) {
      throw new NotFoundException(`Projet ${id} non trouvé`);
    }

    return projet;
  }

  async update(id: string, updateProjetDto: UpdateProjetDto, userId: string) {
    const projet = await this.findOne(id);

    Object.assign(projet, updateProjetDto);

    const updatedProjet = await this.projetRepository.save(projet);

    // Notification de mise à jour
    await this.projetsQueue.add("projet-updated", {
      projetId: id,
      userId,
      changes: updateProjetDto,
    });

    return updatedProjet;
  }

  async updateStatut(id: string, statut: ProjetStatut, userId: string) {
    const projet = await this.findOne(id);

    // Vérifier la transition de statut
    if (!this.isValidStatusTransition(projet.statut, statut)) {
      throw new BadRequestException("Transition de statut invalide");
    }

    projet.statut = statut;

    const updatedProjet = await this.projetRepository.save(projet);

    // Notification de changement de statut
    await this.projetsQueue.add("status-changed", {
      projetId: id,
      oldStatus: projet.statut,
      newStatus: statut,
      userId,
    });

    return updatedProjet;
  }

  async updateAvancement(id: string, avancement: number) {
    if (avancement < 0 || avancement > 100) {
      throw new BadRequestException("L'avancement doit être entre 0 et 100");
    }

    const projet = await this.findOne(id);
    projet.avancement = avancement;

    // Mettre à jour le statut si nécessaire
    if (avancement === 100 && projet.statut === ProjetStatut.EN_COURS) {
      projet.statut = ProjetStatut.TERMINE;
    }

    return this.projetRepository.save(projet);
  }

  async remove(id: string) {
    const projet = await this.findOne(id);

    // Soft delete plutôt que hard delete
    projet.statut = ProjetStatut.ANNULE;
    await this.projetRepository.save(projet);
  }

  async getStats(user: any) {
    const stats = await this.projetRepository
      .createQueryBuilder("projet")
      .select("projet.statut", "statut")
      .addSelect("COUNT(*)", "count")
      .addSelect("SUM(projet.montantHT)", "montantTotal")
      .groupBy("projet.statut")
      .getRawMany();

    const totalProjets = await this.projetRepository.count();
    const projetsEnCours = await this.projetRepository.count({
      where: { statut: ProjetStatut.EN_COURS },
    });

    return {
      totalProjets,
      projetsEnCours,
      parStatut: stats,
      montantTotalHT: stats.reduce(
        (acc, s) => acc + parseFloat(s.montantTotal || 0),
        0
      ),
    };
  }

  private async generateReference(): Promise<string> {
    const year = new Date().getFullYear();
    const lastProjet = await this.projetRepository
      .createQueryBuilder("projet")
      .where("projet.reference LIKE :pattern", { pattern: `PRJ-${year}-%` })
      .orderBy("projet.reference", "DESC")
      .getOne();

    let nextNumber = 1;
    if (lastProjet) {
      const lastNumber = parseInt(lastProjet.reference.split("-")[2]);
      nextNumber = lastNumber + 1;
    }

    return `PRJ-${year}-${nextNumber.toString().padStart(4, "0")}`;
  }

  private isValidStatusTransition(
    currentStatus: ProjetStatut,
    newStatus: ProjetStatut
  ): boolean {
    const transitions = {
      [ProjetStatut.BROUILLON]: [ProjetStatut.DEVIS, ProjetStatut.ANNULE],
      [ProjetStatut.DEVIS]: [ProjetStatut.ACCEPTE, ProjetStatut.ANNULE],
      [ProjetStatut.ACCEPTE]: [ProjetStatut.EN_COURS, ProjetStatut.ANNULE],
      [ProjetStatut.EN_COURS]: [ProjetStatut.TERMINE, ProjetStatut.ANNULE],
      [ProjetStatut.TERMINE]: [],
      [ProjetStatut.ANNULE]: [],
    };

    return transitions[currentStatus]?.includes(newStatus) || false;
  }
}
