import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import type { CreateUserDto } from './dto/create-user.dto'
import { GetUserSettingsResponseDto } from './dto/get-user-settings.dto'
import type { UpdateUserDto } from './dto/update-user.dto'
import type { UpdateUserSettingsDto } from './dto/update-user-settings.dto'
import type { UserQueryDto } from './dto/user-query.dto'
import { User, UserRole } from './entities/user.entity'
import { UserSettings } from './entities/user-settings.entity'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User, 'auth')
    private readonly _repository: Repository<User>,
    @InjectRepository(UserSettings, 'auth')
    private readonly _userSettingsRepository: Repository<UserSettings>
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email)
    if (existingUser) {
      throw new ConflictException('Email already exists')
    }

    const user = this._repository.create(createUserDto)
    const savedUser = await this._repository.save(user)

    // Créer les paramètres par défaut pour l'utilisateur
    await this.createDefaultUserSettings(savedUser.id)

    return savedUser
  }

  async findAll(query?: UserQueryDto): Promise<User[]> {
    const queryBuilder = this._repository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.nom',
        'user.prenom',
        'user.role',
        'user.actif',
        'user.createdAt',
        'user.dernier_login',
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
    const user = await this._repository.findOne({
      where: { id },
      select: ['id', 'email', 'nom', 'prenom', 'role', 'actif', 'createdAt'],
    })

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    return user
  }

  async findById(id: string): Promise<User | null> {
    return this._repository.findOne({ where: { id } })
  }

  async findByEmail(email: string): Promise<User | null> {
    return this._repository.findOne({ where: { email } })
  }

  async findByEmailOrAcronym(identifier: string): Promise<User | null> {
    return this._repository.findOne({
      where: [{ email: identifier }, { acronyme: identifier }],
    })
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
    return this._repository.save(user)
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id)
    await this._repository.remove(user)
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await this._repository.update(userId, {
      refreshToken: refreshToken || undefined,
    } as Parameters<typeof this._repository.update>[1])
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this._repository.update(userId, {
      dernier_login: new Date(),
    } as Parameters<typeof this._repository.update>[1])
  }

  async activate(id: string): Promise<User> {
    return this.update(id, { actif: true })
  }

  async deactivate(id: string): Promise<User> {
    return this.update(id, { actif: false })
  }

  async getStats() {
    const [total, active, inactive, admins, managers, operators] = await Promise.all([
      this._repository.count(),
      this._repository.count({ where: { actif: true } }),
      this._repository.count({ where: { actif: false } }),
      this._repository.count({ where: { role: UserRole.ADMIN } }),
      this._repository.count({ where: { role: UserRole.MANAGER } }),
      this._repository.count({ where: { role: UserRole.OPERATEUR } }),
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
    const settings = await this._userSettingsRepository.findOne({
      where: { userId },
    })

    if (!settings) {
      // Créer les paramètres par défaut si ils n'existent pas
      const defaultSettings = await this.createDefaultUserSettings(userId)
      return GetUserSettingsResponseDto.fromEntity(defaultSettings)
    }

    return GetUserSettingsResponseDto.fromEntity(settings)
  }

  async updateUserSettings(
    userId: string,
    updateDto: UpdateUserSettingsDto
  ): Promise<GetUserSettingsResponseDto> {
    let settings = await this._userSettingsRepository.findOne({
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
        ),
      }
    }

    if (updateDto.company) {
      settings.company = {
        ...settings.company,
        ...Object.fromEntries(
          Object.entries(updateDto.company).filter(([_, value]) => value !== undefined)
        ),
      }
    }

    if (updateDto.preferences) {
      // Update top-level preferences
      if (updateDto.preferences.language !== undefined) {
        settings.preferences.language = updateDto.preferences.language
      }
      if (updateDto.preferences.timezone !== undefined) {
        settings.preferences.timezone = updateDto.preferences.timezone
      }
      if (updateDto.preferences.theme !== undefined) {
        settings.preferences.theme = updateDto.preferences.theme
      }

      // Update notifications if provided
      if (updateDto.preferences.notifications) {
        const newNotifications = updateDto.preferences.notifications

        // Update top-level notification settings
        if (newNotifications.email !== undefined) {
          settings.preferences.notifications.email = newNotifications.email
        }
        if (newNotifications.push !== undefined) {
          settings.preferences.notifications.push = newNotifications.push
        }
        if (newNotifications.sms !== undefined) {
          settings.preferences.notifications.sms = newNotifications.sms
        }

        // Update emailTypes
        if (newNotifications.emailTypes && settings.preferences.notifications.emailTypes) {
          const emailTypes = newNotifications.emailTypes
          if (emailTypes.newMessages !== undefined) {
            settings.preferences.notifications.emailTypes.newMessages = emailTypes.newMessages
          }
          if (emailTypes.systemAlerts !== undefined) {
            settings.preferences.notifications.emailTypes.systemAlerts = emailTypes.systemAlerts
          }
          if (emailTypes.taskReminders !== undefined) {
            settings.preferences.notifications.emailTypes.taskReminders = emailTypes.taskReminders
          }
          if (emailTypes.weeklyReports !== undefined) {
            settings.preferences.notifications.emailTypes.weeklyReports = emailTypes.weeklyReports
          }
          if (emailTypes.securityAlerts !== undefined) {
            settings.preferences.notifications.emailTypes.securityAlerts = emailTypes.securityAlerts
          }
          if (emailTypes.maintenanceNotice !== undefined) {
            settings.preferences.notifications.emailTypes.maintenanceNotice =
              emailTypes.maintenanceNotice
          }
        }

        // Update pushTypes
        if (newNotifications.pushTypes && settings.preferences.notifications.pushTypes) {
          const pushTypes = newNotifications.pushTypes
          if (pushTypes.enabled !== undefined) {
            settings.preferences.notifications.pushTypes.enabled = pushTypes.enabled
          }
          if (pushTypes.sound !== undefined) {
            settings.preferences.notifications.pushTypes.sound = pushTypes.sound
          }
          if (pushTypes.urgent !== undefined) {
            settings.preferences.notifications.pushTypes.urgent = pushTypes.urgent
          }
          if (pushTypes.normal !== undefined) {
            settings.preferences.notifications.pushTypes.normal = pushTypes.normal
          }
          if (pushTypes.quiet !== undefined) {
            settings.preferences.notifications.pushTypes.quiet = pushTypes.quiet
          }
        }

        // Update quietHours
        if (newNotifications.quietHours && settings.preferences.notifications.quietHours) {
          const quietHours = newNotifications.quietHours
          if (quietHours.enabled !== undefined) {
            settings.preferences.notifications.quietHours.enabled = quietHours.enabled
          }
          if (quietHours.start !== undefined) {
            settings.preferences.notifications.quietHours.start = quietHours.start
          }
          if (quietHours.end !== undefined) {
            settings.preferences.notifications.quietHours.end = quietHours.end
          }
        }
      }

      // Update appearance settings if provided
      if (updateDto.preferences.appearance && settings.preferences.appearance) {
        const appearance = updateDto.preferences.appearance
        if (appearance.theme !== undefined) {
          settings.preferences.appearance.theme = appearance.theme
        }
        if (appearance.language !== undefined) {
          settings.preferences.appearance.language = appearance.language
        }
        if (appearance.fontSize !== undefined) {
          settings.preferences.appearance.fontSize = appearance.fontSize
        }
        if (appearance.sidebarWidth !== undefined) {
          settings.preferences.appearance.sidebarWidth = appearance.sidebarWidth
        }
        if (appearance.density !== undefined) {
          settings.preferences.appearance.density = appearance.density
        }
        if (appearance.accentColor !== undefined) {
          settings.preferences.appearance.accentColor = appearance.accentColor
        }
        if (appearance.contentWidth !== undefined) {
          settings.preferences.appearance.contentWidth = appearance.contentWidth
        }
      }
    }

    if (updateDto.metadata) {
      settings.metadata = { ...settings.metadata, ...updateDto.metadata }
    }

    const updatedSettings = await this._userSettingsRepository.save(settings)
    return GetUserSettingsResponseDto.fromEntity(updatedSettings)
  }

  private async createDefaultUserSettings(userId: string): Promise<UserSettings> {
    const user = await this.findOne(userId)

    const defaultSettings = this._userSettingsRepository.create({
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
        theme: 'vibrant',
        notifications: {
          email: true,
          push: true,
          sms: false,
          emailTypes: {
            newMessages: true,
            systemAlerts: true,
            taskReminders: false,
            weeklyReports: true,
            securityAlerts: true,
            maintenanceNotice: false,
          },
          pushTypes: {
            enabled: true,
            sound: true,
            urgent: true,
            normal: false,
            quiet: true,
          },
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '07:00',
          },
        },
        appearance: {
          theme: 'vibrant',
          language: 'fr',
          fontSize: 'medium',
          sidebarWidth: 'normal',
          density: 'comfortable',
          accentColor: 'blue',
          contentWidth: 'compact',
        },
      },
    })

    return this._userSettingsRepository.save(defaultSettings)
  }
}
