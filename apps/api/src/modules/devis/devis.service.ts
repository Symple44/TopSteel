import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Devis } from "./entities/devis.entity";
import { CreateDevisDto } from "./dto/create-devis.dto";
import { UpdateDevisDto } from "./dto/update-devis.dto";
import { DevisQueryDto } from "./dto/devis-query.dto";
import { PaginationResultDto } from "../../common/dto/base.dto";

@Injectable()
export class DevisService {
  constructor(
    @InjectRepository(Devis)
    private readonly repository: Repository<Devis>,
  ) {}

  async create(createDto: CreateDevisDto): Promise<Devis> {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  async findAll(query: DevisQueryDto): Promise<PaginationResultDto<Devis>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder("entity");

    if (search) {
      queryBuilder.andWhere(
        "(entity.nom ILIKE :search OR entity.description ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    if (query.actif !== undefined) {
      queryBuilder.andWhere("entity.actif = :actif", { actif: query.actif });
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

  async findOne(id: string): Promise<Devis> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Devis with ID ${id} not found`);
    }
    return entity;
  }

  async update(id: string, updateDto: UpdateDevisDto): Promise<Devis> {
    await this.repository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async getStats(): Promise<unknown> {
    const total = await this.repository.count();
    const active = await this.repository.count({ where: { actif: true } });

    return {
      total,
      active,
      inactive: total - active,
    };
  }
}
