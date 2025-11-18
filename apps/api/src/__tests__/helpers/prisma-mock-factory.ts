/**
 * Prisma Mock Factory
 *
 * Helper pour créer des mocks de PrismaService pour les tests unitaires
 *
 * Usage:
 * ```typescript
 * import { createMockPrismaService } from '@/__tests__/helpers/prisma-mock-factory'
 *
 * const mockPrisma = createMockPrismaService()
 * const service = new YourService(mockPrisma as any)
 *
 * // Dans le test
 * mockPrisma.user.findUnique.mockResolvedValue(mockUser)
 * ```
 */

import { vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'

/**
 * Type pour un mock Prisma complet avec toutes les méthodes vi.fn()
 */
export type MockPrismaService = {
  [K in keyof PrismaClient]: PrismaClient[K] extends { create: any }
    ? {
        create: ReturnType<typeof vi.fn>
        findUnique: ReturnType<typeof vi.fn>
        findFirst: ReturnType<typeof vi.fn>
        findMany: ReturnType<typeof vi.fn>
        update: ReturnType<typeof vi.fn>
        updateMany: ReturnType<typeof vi.fn>
        delete: ReturnType<typeof vi.fn>
        deleteMany: ReturnType<typeof vi.fn>
        count: ReturnType<typeof vi.fn>
        aggregate: ReturnType<typeof vi.fn>
        groupBy: ReturnType<typeof vi.fn>
        upsert: ReturnType<typeof vi.fn>
      }
    : PrismaClient[K]
}

/**
 * Créer un mock complet de PrismaService avec tous les modèles
 */
export function createMockPrismaService(): MockPrismaService {
  const createModelMock = () => ({
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
    upsert: vi.fn(),
  })

  return {
    // Auth models
    user: createModelMock(),
    role: createModelMock(),
    permission: createModelMock(),
    rolePermission: createModelMock(),
    module: createModelMock(),
    group: createModelMock(),
    userGroup: createModelMock(),
    userSession: createModelMock(),
    userRole: createModelMock(),
    userSettings: createModelMock(),

    // Societes models (Multi-Tenant Infrastructure)
    societe: createModelMock(),
    societeLicense: createModelMock(),
    societeUser: createModelMock(),
    userSocieteRole: createModelMock(),
    site: createModelMock(),

    // Admin models
    menuConfiguration: createModelMock(),
    menuItem: createModelMock(),
    systemParameter: createModelMock(),

    // Notifications
    notification: createModelMock(),

    // Prisma special methods
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    $executeRaw: vi.fn(),
    $executeRawUnsafe: vi.fn(),
    $queryRaw: vi.fn(),
    $queryRawUnsafe: vi.fn(),
    $transaction: vi.fn((callback) => {
      // Mock transaction: execute callback with same mock
      if (typeof callback === 'function') {
        return callback(this as any)
      }
      return Promise.resolve([])
    }),
    $on: vi.fn(),
    $use: vi.fn(),
    $extends: vi.fn(),
  } as any
}

/**
 * Reset all mocks in a PrismaService mock
 */
export function resetPrismaMocks(mockPrisma: MockPrismaService): void {
  Object.values(mockPrisma).forEach((model) => {
    if (model && typeof model === 'object') {
      Object.values(model).forEach((method) => {
        if (typeof method === 'function' && 'mockClear' in method) {
          method.mockClear()
        }
      })
    }
  })
}

/**
 * Helper pour créer des données de test User
 */
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  passwordHash: '$2b$10$hashedpassword',
  firstName: 'Test',
  lastName: 'User',
  isActive: true,
  emailVerified: false,
  acronyme: 'TU',
  version: 1,
  refreshToken: null,
  metadata: null,
  settings: null,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
})

/**
 * Helper pour créer des données de test Role
 */
export const createMockRole = (overrides = {}) => ({
  id: 'role-123',
  name: 'USER',
  label: 'User',
  description: 'Standard user role',
  isActive: true,
  isSystem: false,
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

/**
 * Helper pour créer des données de test Permission
 */
export const createMockPermission = (overrides = {}) => ({
  id: 'perm-123',
  name: 'users.read',
  label: 'Read Users',
  description: 'Permission to read users',
  moduleId: 'module-123',
  isActive: true,
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

/**
 * Helper pour créer des données de test Module
 */
export const createMockModule = (overrides = {}) => ({
  id: 'module-123',
  name: 'users',
  label: 'Users',
  description: 'User management',
  icon: 'users',
  order: 1,
  isActive: true,
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

/**
 * Helper pour créer des données de test Group
 */
export const createMockGroup = (overrides = {}) => ({
  id: 'group-123',
  name: 'admins',
  label: 'Administrators',
  description: 'Admin group',
  isActive: true,
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

/**
 * Helper pour créer des données de test Societe
 */
export const createMockSociete = (overrides = {}) => ({
  id: 'societe-123',
  code: 'SOC001',
  name: 'Test Company',
  legalName: 'Test Company Ltd',
  databaseName: 'topsteel_soc001',
  isActive: true,
  address: null,
  city: null,
  postalCode: null,
  country: 'FR',
  phone: null,
  email: null,
  website: null,
  siret: null,
  vatNumber: null,
  configuration: null,
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
})

/**
 * Helper pour créer des données de test SocieteLicense
 */
export const createMockSocieteLicense = (overrides = {}) => ({
  id: 'license-123',
  societeId: 'societe-123',
  licenseType: 'PREMIUM',
  status: 'ACTIVE',
  startDate: new Date(),
  expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 an
  maxUsers: 100,
  maxSites: 10,
  features: { accounting: true, inventory: true },
  restrictions: null,
  billingEmail: 'billing@test.com',
  notes: null,
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

/**
 * Helper pour créer des données de test SocieteUser
 */
export const createMockSocieteUser = (overrides = {}) => ({
  id: 'societe-user-123',
  userId: 'user-123',
  societeId: 'societe-123',
  permissions: null,
  preferences: null,
  isActive: true,
  joinedAt: new Date(),
  leftAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

/**
 * Helper pour créer des données de test Site
 */
export const createMockSite = (overrides = {}) => ({
  id: 'site-123',
  societeId: 'societe-123',
  code: 'SITE001',
  name: 'Main Site',
  type: 'FACTORY',
  address: '123 Main St',
  city: 'Paris',
  postalCode: '75001',
  country: 'FR',
  phone: null,
  email: null,
  isActive: true,
  isHeadquarters: false,
  surface: null,
  capacity: null,
  configuration: null,
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
})

/**
 * Helper pour créer des données de test Session
 */
export const createMockSession = (overrides = {}) => ({
  id: 'session-123',
  userId: 'user-123',
  token: 'session-token-123',
  ipAddress: '127.0.0.1',
  userAgent: 'Test Browser',
  isActive: true,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24h
  lastActivityAt: new Date(),
  createdAt: new Date(),
  revokedAt: null,
  ...overrides,
})

/**
 * Helper pour créer des données de test MenuConfiguration
 */
export const createMockMenuConfiguration = (overrides = {}) => ({
  id: 'menu-config-123',
  name: 'default',
  label: 'Default Menu',
  description: 'Default menu configuration',
  isDefault: true,
  isActive: true,
  version: '1.0',
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

/**
 * Helper pour créer des données de test MenuItem
 */
export const createMockMenuItem = (overrides = {}) => ({
  id: 'menu-item-123',
  menuConfigId: 'menu-config-123',
  parentId: null,
  moduleId: 'module-123',
  label: 'Users',
  icon: 'users',
  route: '/users',
  order: 1,
  isVisible: true,
  requiredPermissions: ['users.read'],
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

/**
 * Helper pour créer des données de test Notification
 */
export const createMockNotification = (overrides = {}) => ({
  id: 'notif-123',
  userId: 'user-123',
  type: 'INFO',
  title: 'Test Notification',
  message: 'This is a test',
  isRead: false,
  readAt: null,
  link: null,
  metadata: null,
  createdAt: new Date(),
  expiresAt: null,
  ...overrides,
})
