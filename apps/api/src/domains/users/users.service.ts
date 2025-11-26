import { Injectable } from '@nestjs/common'

/**
 * UsersService - Stub/Interface for dependency injection
 *
 * This class is aliased to UsersPrismaService in users.module.ts
 * The actual implementation is in users-prisma.service.ts
 *
 * This stub defines the interface that other services expect
 */
@Injectable()
export class UsersService {
  // All methods are implemented by UsersPrismaService via DI aliasing
  create: any
  findAll: any
  findOne: any
  findById: any
  findByEmail: any
  findByEmailOrAcronym: any
  update: any
  remove: any
  updateRefreshToken: any
  updateLastLogin: any
  activate: any
  deactivate: any
  getStats: any
  getUserSettings: any
  updateUserSettings: any
}
