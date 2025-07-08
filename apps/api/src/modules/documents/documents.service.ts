import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import type { PaginationResultDto } from "../../common/dto/base.dto";
import type { CreateDocumentsDto } from "./dto/create-documents.dto";
import type { DocumentsQueryDto } from "./dto/documents-query.dto";
import type { UpdateDocumentsDto } from "./dto/update-documents.dto";
import { Document } from "./entities/document.entity";

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly repository: Repository<Document>,
  ) {}

  async create(createDto: CreateDocumentsDto): Promise<Document> {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  async findAll(
    query: DocumentsQueryDto,
  ): Promise<PaginationResultDto<Document>> {
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
        "(entity.nom ILIKE :search OR entity.type ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    // Supprimé: entity.actif n'existe pas dans Document
    // if (query.actif !== undefined) {
    //   queryBuilder.andWhere('entity.actif = :actif', { actif: query.actif });
    // }

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
  async findOne(id: number): Promise<Document> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return entity;
  }

  // Changé: id de string vers number
  async update(id: number, updateDto: UpdateDocumentsDto): Promise<Document> {
    await this.repository.update(id, updateDto);
    return this.findOne(id);
  }

  // Changé: id de string vers number + supprimé softDelete
  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async getStats(): Promise<unknown> {
    const total = await this.repository.count();
    // Supprimé: actif n'existe pas dans Document

    return {
      total,
      // Peut ajouter d'autres stats basées sur les vraies propriétés :
      byType: await this.repository
        .createQueryBuilder("doc")
        .select("doc.type, COUNT(*) as count")
        .groupBy("doc.type")
        .getRawMany(),
    };
  }
}
