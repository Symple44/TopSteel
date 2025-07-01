import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PaginationResultDto } from "../../common/dto/base.dto";
import { CreateProjetsDto } from "./dto/create-projets.dto";
import { ProjetsQueryDto } from "./dto/projets-query.dto";
import { UpdateProjetsDto } from "./dto/update-projets.dto";
import { Projet, ProjetStatut } from "./entities/projet.entity";

@Injectable()
export class ProjetsService {
  constructor(
    @InjectRepository(Projet)
    private readonly repository: Repository<Projet>,
  ) {}

  async create(createDto: CreateProjetsDto): Promise<Projet> {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  async findAll(query: ProjetsQueryDto): Promise<PaginationResultDto<Projet>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository
      .createQueryBuilder("entity")
      .leftJoinAndSelect("entity.client", "client")
      .leftJoinAndSelect("entity.responsable", "responsable");

    if (search) {
      queryBuilder.andWhere(
        "(entity.nom ILIKE :search OR entity.description ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    // Supprimé: entity.actif n'existe pas dans Projet
    // Ajout: filter par statut si nécessaire
    if (query.statut) {
      queryBuilder.andWhere("entity.statut = :statut", {
        statut: query.statut,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy(`entity.${sortBy}`, sortOrder as "ASC" | "DESC")
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
        hasPrev: page > 1,
      },
    };
  }

  // Changé: id de string vers number
  async findOne(id: number): Promise<Projet> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ["client", "responsable"],
    });
    if (!entity) {
      throw new NotFoundException(`Projet with ID ${id} not found`);
    }
    return entity;
  }

  // Changé: id de string vers number
  async update(id: number, updateDto: UpdateProjetsDto): Promise<Projet> {
    await this.repository.update(id, updateDto);
    return this.findOne(id);
  }

  // Changé: id de string vers number + supprimé softDelete
  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async getStats(): Promise<unknown> {
    const total = await this.repository.count();

    // Stats basées sur les vraies propriétés de Projet
    const byStatut = await this.repository
      .createQueryBuilder("projet")
      .select("projet.statut, COUNT(*) as count")
      .groupBy("projet.statut")
      .getRawMany();

    const enCours = await this.repository.count({
      where: { statut: ProjetStatut.EN_COURS },
    });

    return {
      total,
      enCours,
      byStatut,
      montantTotalEstime: await this.repository
        .createQueryBuilder("projet")
        .select("SUM(projet.montantTotal)", "sum")
        .getRawOne()
        .then((result) => result.sum || 0),
    };
  }
}
