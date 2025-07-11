import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import type { CreateOrdreFabricationDto } from './dto/create-ordre-fabrication.dto'
import type { OrdreFabricationQueryDto } from './dto/ordre-fabrication-query.dto'
import type { UpdateOrdreFabricationDto } from './dto/update-ordre-fabrication.dto'
import { OrdreFabrication, OrdreFabricationStatut } from './entities/ordre-fabrication.entity'

@Injectable()
export class OrdreFabricationService {
  constructor(
    @InjectRepository(OrdreFabrication)
    private readonly repository: Repository<OrdreFabrication>
  ) {}

  async create(createDto: CreateOrdreFabricationDto): Promise<OrdreFabrication> {
    const entity = this.repository.create({
      numero: createDto.numero,
      statut: createDto.statut,
      description: createDto.description,
      priorite: createDto.priorite,
      dateDebut: createDto.dateDebut,
      dateFin: createDto.dateFin,
      notes: createDto.notes,
      projet: createDto.projet,
    })

    return this.repository.save(entity)
  }

  async findAll(query?: OrdreFabricationQueryDto): Promise<OrdreFabrication[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('ordre')
      .orderBy('ordre.createdAt', 'DESC')

    if (query?.statut) {
      queryBuilder.andWhere('ordre.statut = :statut', { statut: query.statut })
    }

    if (query?.projet) {
      queryBuilder.andWhere('ordre.projet = :projet', { projet: query.projet })
    }

    if (query?.search) {
      queryBuilder.andWhere('(ordre.numero ILIKE :search OR ordre.description ILIKE :search)', {
        search: `%${query.search}%`,
      })
    }

    if (query?.page && query?.limit) {
      const skip = (query.page - 1) * query.limit
      queryBuilder.skip(skip).take(query.limit)
    }

    return queryBuilder.getMany()
  }

  async findOne(id: number): Promise<OrdreFabrication> {
    const entity = await this.repository.findOne({ where: { id } })

    if (!entity) {
      throw new NotFoundException(`Ordre de fabrication ${id} not found`)
    }

    return entity
  }

  async update(id: number, updateDto: UpdateOrdreFabricationDto): Promise<OrdreFabrication> {
    const entity = await this.findOne(id)

    Object.keys(updateDto).forEach((key) => {
      const value = updateDto[key as keyof UpdateOrdreFabricationDto]
      if (value !== undefined) {
        ;(entity as any)[key] = value
      }
    })

    return this.repository.save(entity)
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id)
    await this.repository.remove(entity)
  }

  async findByProjet(projetId: number): Promise<OrdreFabrication[]> {
    return this.repository.find({
      where: { projet: projetId },
      order: { createdAt: 'DESC' },
    })
  }

  async changeStatut(id: number, statut: OrdreFabricationStatut): Promise<OrdreFabrication> {
    const entity = await this.findOne(id)
    entity.statut = statut
    return this.repository.save(entity)
  }

  async getStats() {
    const [total, enAttente, enCours, termine, annule] = await Promise.all([
      this.repository.count(),
      this.repository.count({ where: { statut: OrdreFabricationStatut.EN_ATTENTE } }),
      this.repository.count({ where: { statut: OrdreFabricationStatut.EN_COURS } }),
      this.repository.count({ where: { statut: OrdreFabricationStatut.TERMINE } }),
      this.repository.count({ where: { statut: OrdreFabricationStatut.ANNULE } }),
    ])

    return {
      total,
      byStatut: {
        enAttente,
        enCours,
        termine,
        annule,
      },
    }
  }
}
