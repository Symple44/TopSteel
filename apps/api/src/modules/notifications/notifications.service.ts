import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import type { PaginationResultDto } from '../../common/dto/base.dto'
import type { CreateNotificationsDto } from './dto/create-notifications.dto'
import type { NotificationsQueryDto } from './dto/notifications-query.dto'
import type { UpdateNotificationsDto } from './dto/update-notifications.dto'
import { Notifications } from './entities/notifications.entity'

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notifications)
    private readonly repository: Repository<Notifications>
  ) {}

  async create(createDto: CreateNotificationsDto): Promise<Notifications> {
    const entity = this.repository.create(createDto)
    return this.repository.save(entity)
  }

  async findAll(query: NotificationsQueryDto): Promise<PaginationResultDto<Notifications>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'DESC' } = query
    const skip = (page - 1) * limit

    const queryBuilder = this.repository.createQueryBuilder('entity')

    if (search) {
      queryBuilder.andWhere('(entity.nom ILIKE :search OR entity.description ILIKE :search)', {
        search: `%${search}%`,
      })
    }

    if (query.actif !== undefined) {
      queryBuilder.andWhere('entity.actif = :actif', { actif: query.actif })
    }

    if (query.type) {
      queryBuilder.andWhere('entity.type = :type', { type: query.type })
    }

    const [data, total] = await queryBuilder
      .orderBy(`entity.${sortBy}`, sortOrder as 'ASC' | 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount()

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
    }
  }

  async findOne(id: string): Promise<Notifications> {
    const entity = await this.repository.findOne({ where: { id } })
    if (!entity) {
      throw new NotFoundException(`Notifications with ID ${id} not found`)
    }
    return entity
  }

  async update(id: string, updateDto: UpdateNotificationsDto): Promise<Notifications> {
    await this.repository.update(id, updateDto)
    return this.findOne(id)
  }

  async remove(id: string): Promise<void> {
    await this.repository.softDelete(id)
  }

  async getStats(): Promise<unknown> {
    const total = await this.repository.count()
    const active = await this.repository.count({ where: { actif: true } })

    return {
      total,
      active,
      inactive: total - active,
    }
  }
}
