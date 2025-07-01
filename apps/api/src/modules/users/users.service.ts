import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationResultDto } from '../../common/dto/base.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async create(createDto: CreateUserDto): Promise<User> {
    // Vérifier l'unicité de l'email
    const existingUser = await this.findByEmail(createDto.email);
    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  async findAll(query: UserQueryDto): Promise<PaginationResultDto<User>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('entity');
    
    if (search) {
      queryBuilder.andWhere(
        '(entity.nom ILIKE :search OR entity.prenom ILIKE :search OR entity.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (query.actif !== undefined) {
      queryBuilder.andWhere('entity.actif = :actif', { actif: query.actif });
    }

    if (query.role) {
      queryBuilder.andWhere('entity.role = :role', { role: query.role });
    }

    const [data, total] = await queryBuilder
      .orderBy(`entity.${sortBy}`, sortOrder as 'ASC' | 'DESC')
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
        hasPrev: page > 1
      }
    };
  }

  async findOne(id: string): Promise<User> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return entity;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async update(id: string, updateDto: UpdateUserDto): Promise<User> {
    await this.repository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await this.repository.update(userId, { refreshToken: refreshToken || undefined });
  }

  async getStats(): Promise<any> {
    const total = await this.repository.count();
    const active = await this.repository.count({ where: { actif: true } });
    
    return {
      total,
      active,
      inactive: total - active
    };
  }
}
