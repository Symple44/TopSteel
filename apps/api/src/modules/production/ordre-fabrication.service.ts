import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PaginationResultDto } from "../../common/dto/base.dto";
import { CreateOrdreFabricationDto } from "./dto/create-ordre-fabrication.dto";
import { OrdreFabricationQueryDto } from "./dto/ordre-fabrication-query.dto";
import { UpdateOrdreFabricationDto } from "./dto/update-ordre-fabrication.dto";
import { OrdreFabrication, OrdreFabricationStatut } from "./entities/ordre-fabrication.entity";

@Injectable()
export class OrdreFabricationService {
  constructor(
    @InjectRepository(OrdreFabrication)
    private readonly repository: Repository<OrdreFabrication>,
  ) {}

  async create(createDto: CreateOrdreFabricationDto): Promise<OrdreFabrication> {
    // ✅ Transformation correcte des types
    const entityData = {
      numero: createDto.numero,
      statut: createDto.statut || OrdreFabricationStatut .EN_ATTENTE,
      projet: createDto.projet,
      description: createDto.description,
      priorite: createDto.priorite,
      dateDebutPrevue: createDto.dateDebutPrevue ? new Date(createDto.dateDebutPrevue) : undefined,
      dateFinPrevue: createDto.dateFinPrevue ? new Date(createDto.dateFinPrevue) : undefined,
      avancement: createDto.avancement || 0,
      responsableId: createDto.responsableId,
      notes: createDto.notes,
    };

    const entity = this.repository.create(entityData);
    return this.repository.save(entity);
  }

  async findAll(
    query: OrdreFabricationQueryDto,
  ): Promise<PaginationResultDto<OrdreFabrication>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder("entity");

    // ✅ Relations ajoutées
    queryBuilder.leftJoinAndSelect("entity.operations", "operations");
    queryBuilder.leftJoinAndSelect("entity.projetEntity", "projetEntity");

    if (search) {
      queryBuilder.andWhere("(entity.numero ILIKE :search)", {
        search: `%${search}%`,
      });
    }

    if (query.statut) {
      queryBuilder.andWhere("entity.statut = :statut", {
        statut: query.statut,
      });
    }

    if (query.projet) {
      queryBuilder.andWhere("entity.projet = :projet", {
        projet: query.projet,
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

  // ✅ Correction type ID de string vers number
  async findOne(id: number): Promise<OrdreFabrication> {
    const entity = await this.repository.findOne({ 
      where: { id },
      relations: ['operations', 'projetEntity'],
    });
    if (!entity) {
      throw new NotFoundException(
        `Ordre de fabrication avec l'ID ${id} non trouvé`,
      );
    }
    return entity;
  }

  async update(
    id: number,
    updateDto: UpdateOrdreFabricationDto,
  ): Promise<OrdreFabrication> {
    // ✅ Transformation correcte des dates
    const updateData: any = {
      ...updateDto,
    };

    if (updateDto.dateDebutPrevue) {
      updateData.dateDebutPrevue = new Date(updateDto.dateDebutPrevue);
    }
    
    if (updateDto.dateFinPrevue) {
      updateData.dateFinPrevue = new Date(updateDto.dateFinPrevue);
    }
    
    if (updateDto.dateDebutReelle) {
      updateData.dateDebutReelle = new Date(updateDto.dateDebutReelle);
    }
    
    if (updateDto.dateFinReelle) {
      updateData.dateFinReelle = new Date(updateDto.dateFinReelle);
    }

    await this.repository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.repository.remove(entity);
  }

  async changeStatut(id: number, statut: string): Promise<OrdreFabrication> {
    await this.repository.update(id, { statut: statut as OrdreFabricationStatut  });
    return this.findOne(id);
  }

  async getStats(): Promise<{
    total: number;
    enCours: number;
    termine: number;
    enAttente: number;
  }> {
    const total = await this.repository.count();

    const enCours = await this.repository.countBy({
      statut: OrdreFabricationStatut .EN_COURS,
    });

    const termine = await this.repository.countBy({
      statut: OrdreFabricationStatut .TERMINE,
    });

    const enAttente = await this.repository.countBy({
      statut: OrdreFabricationStatut .EN_ATTENTE,
    });

    return {
      total,
      enCours,
      termine,
      enAttente,
    };
  }

  // ✅ Correction findByProjet pour utiliser 'projet' au lieu de 'projetId'
  async findByProjet(projetId: number): Promise<OrdreFabrication[]> {
    return this.repository.find({
      where: { projet: projetId },
      relations: ['operations', 'projetEntity'],
      order: { createdAt: 'DESC' },
    });
  }
}
