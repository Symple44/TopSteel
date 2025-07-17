import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserQueryDto } from './dto/user-query.dto'
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto'
import { GetUserSettingsResponseDto } from './dto/get-user-settings.dto'
import { User, UserRole } from './entities/user.entity'
import { UserSettings } from './entities/user-settings.entity'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(UserSettings)
    private readonly userSettingsRepository: Repository<UserSettings>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email)
    if (existingUser) {
      throw new ConflictException('Email already exists')
    }

    const user = this.repository.create(createUserDto)
    const savedUser = await this.repository.save(user)

    // Créer les paramètres par défaut pour l'utilisateur
    await this.createDefaultUserSettings(savedUser.id)

    return savedUser
  }

  async findAll(query?: UserQueryDto): Promise<User[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.nom',
        'user.prenom',
        'user.role',
        'user.actif',
        'user.createdAt',
      ])
      .orderBy('user.createdAt', 'DESC')

    if (query?.actif !== undefined) {
      queryBuilder.andWhere('user.actif = :actif', { actif: query.actif })
    }

    if (query?.role) {
      queryBuilder.andWhere('user.role = :role', { role: query.role })
    }

    if (query?.search) {
      queryBuilder.andWhere(
        '(user.nom ILIKE :search OR user.prenom ILIKE :search OR user.email ILIKE :search)',
        { search: `%${query.search}%` }
      )
    }

    if (query?.page && query?.limit) {
      const skip = (query.page - 1) * query.limit
      queryBuilder.skip(skip).take(query.limit)
    }

    return queryBuilder.getMany()
  }

  async findOne(id: string): Promise<User> {
    const user = await this.repository.findOne({
      where: { id },
      select: ['id', 'email', 'nom', 'prenom', 'role', 'actif', 'createdAt'],
    })

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    return user
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } })
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } })
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id)

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email)
      if (existingUser) {
        throw new ConflictException('Email already exists')
      }
    }

    Object.assign(user, updateUserDto)
    return this.repository.save(user)
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id)
    await this.repository.remove(user)
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await this.repository.update(userId, {
      refreshToken: refreshToken || undefined,
    })
  }

  async activate(id: string): Promise<User> {
    return this.update(id, { actif: true })
  }

  async deactivate(id: string): Promise<User> {
    return this.update(id, { actif: false })
  }

  async getStats() {
    const [total, active, inactive, admins, managers, operators] = await Promise.all([
      this.repository.count(),
      this.repository.count({ where: { actif: true } }),
      this.repository.count({ where: { actif: false } }),
      this.repository.count({ where: { role: UserRole.ADMIN } }),
      this.repository.count({ where: { role: UserRole.MANAGER } }),
      this.repository.count({ where: { role: UserRole.OPERATEUR } }),
    ])

    return {
      total,
      active,
      inactive,
      byRole: {
        admins,
        managers,
        operators,
      },
    }
  }

  // Méthodes pour les paramètres utilisateur
  async getUserSettings(userId: string): Promise<GetUserSettingsResponseDto> {
    const settings = await this.userSettingsRepository.findOne({
      where: { userId },
    })

    if (!settings) {
      // Créer les paramètres par défaut si ils n'existent pas
      const defaultSettings = await this.createDefaultUserSettings(userId)
      return GetUserSettingsResponseDto.fromEntity(defaultSettings)
    }

    return GetUserSettingsResponseDto.fromEntity(settings)
  }

  async updateUserSettings(userId: string, updateDto: UpdateUserSettingsDto): Promise<GetUserSettingsResponseDto> {
    let settings = await this.userSettingsRepository.findOne({
      where: { userId },
    })

    if (!settings) {
      // Créer les paramètres s'ils n'existent pas
      settings = await this.createDefaultUserSettings(userId)
    }

    // Fusionner les nouvelles données avec les existantes
    if (updateDto.profile) {
      settings.profile = { 
        ...settings.profile, 
        ...Object.fromEntries(
          Object.entries(updateDto.profile).filter(([_, value]) => value !== undefined)
        )
      }
    }

    if (updateDto.company) {
      settings.company = { 
        ...settings.company, 
        ...Object.fromEntries(
          Object.entries(updateDto.company).filter(([_, value]) => value !== undefined)
        )
      }
    }

    if (updateDto.preferences) {
      settings.preferences = { 
        ...settings.preferences, 
        ...updateDto.preferences,
        notifications: {
          ...settings.preferences.notifications,
          ...updateDto.preferences.notifications
        }
      }
    }

    if (updateDto.metadata) {
      settings.metadata = { ...settings.metadata, ...updateDto.metadata }
    }

    const updatedSettings = await this.userSettingsRepository.save(settings)
    return GetUserSettingsResponseDto.fromEntity(updatedSettings)
  }

  private async createDefaultUserSettings(userId: string): Promise<UserSettings> {
    const user = await this.findOne(userId)
    
    const defaultSettings = this.userSettingsRepository.create({
      userId,
      profile: {
        firstName: user.prenom,
        lastName: user.nom,
        email: user.email,
      },
      company: {
        name: 'TopSteel Métallerie',
        address: "123 Rue de l'Industrie",
        city: 'Lyon',
        postalCode: '69001',
        country: 'France',
      },
      preferences: {
        language: 'fr',
        timezone: 'Europe/Paris',
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      },
    })

    return this.userSettingsRepository.save(defaultSettings)
  }
}
