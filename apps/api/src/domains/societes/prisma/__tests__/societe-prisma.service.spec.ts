/**
 * SocietePrismaService Unit Tests
 *
 * Tests critiques pour le service de gestion des sociétés Prisma (Multi-Tenant)
 *
 * Coverage:
 * - CRUD sociétés
 * - Recherche et filtrage
 * - Relations (license, users, sites)
 * - Soft/Hard delete
 * - Existence checks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SocietePrismaService } from '../societe-prisma.service'
import {
  createMockPrismaService,
  resetPrismaMocks,
  createMockSociete,
  createMockSocieteLicense,
  type MockPrismaService,
} from '../../../../__tests__/helpers/prisma-mock-factory'

describe('SocietePrismaService', () => {
  let service: SocietePrismaService
  let mockPrisma: MockPrismaService

  beforeEach(() => {
    mockPrisma = createMockPrismaService()
    service = new SocietePrismaService(mockPrisma as any)
    vi.clearAllMocks()
  })

  afterEach(() => {
    resetPrismaMocks(mockPrisma)
  })

  // ============================================
  // CREATE SOCIETE
  // ============================================

  describe('createSociete', () => {
    const createSocieteData = {
      code: 'SOC001',
      name: 'Test Company',
      legalName: 'Test Company Ltd',
      databaseName: 'topsteel_soc001',
      country: 'FR',
    }

    it('should create societe successfully', async () => {
      const mockCreatedSociete = createMockSociete(createSocieteData)
      mockPrisma.societe.create.mockResolvedValue(mockCreatedSociete)

      const result = await service.createSociete(createSocieteData)

      expect(mockPrisma.societe.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          code: createSocieteData.code,
          name: createSocieteData.name,
          legalName: createSocieteData.legalName,
          databaseName: createSocieteData.databaseName,
          country: createSocieteData.country,
        }),
      })
      expect(result).toEqual(mockCreatedSociete)
    })

    it('should prevent duplicate societe codes', async () => {
      mockPrisma.societe.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['code'] },
      })

      await expect(service.createSociete(createSocieteData)).rejects.toThrow()
    })

    it('should set isActive to true by default', async () => {
      const mockSociete = createMockSociete({ ...createSocieteData, isActive: true })
      mockPrisma.societe.create.mockResolvedValue(mockSociete)

      const result = await service.createSociete(createSocieteData)

      expect(result.isActive).toBe(true)
    })

    it('should handle optional fields', async () => {
      const dataWithOptionals = {
        ...createSocieteData,
        address: '123 Main St',
        city: 'Paris',
        postalCode: '75001',
        phone: '+33123456789',
        email: 'contact@testcompany.fr',
      }

      const mockSociete = createMockSociete(dataWithOptionals)
      mockPrisma.societe.create.mockResolvedValue(mockSociete)

      const result = await service.createSociete(dataWithOptionals)

      expect(result.address).toBe('123 Main St')
      expect(result.city).toBe('Paris')
      expect(result.email).toBe('contact@testcompany.fr')
    })
  })

  // ============================================
  // FIND SOCIETES
  // ============================================

  describe('getSocieteById', () => {
    it('should find societe by ID', async () => {
      const mockSociete = createMockSociete()
      mockPrisma.societe.findUnique.mockResolvedValue(mockSociete)

      const result = await service.getSocieteById('societe-123')

      expect(mockPrisma.societe.findUnique).toHaveBeenCalledWith({
        where: { id: 'societe-123' },
      })
      expect(result).toEqual(mockSociete)
    })

    it('should return null for non-existent societe', async () => {
      mockPrisma.societe.findUnique.mockResolvedValue(null)

      const result = await service.getSocieteById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('getSocieteByCode', () => {
    it('should find societe by code', async () => {
      const mockSociete = createMockSociete({ code: 'SOC001' })
      mockPrisma.societe.findUnique.mockResolvedValue(mockSociete)

      const result = await service.getSocieteByCode('SOC001')

      expect(mockPrisma.societe.findUnique).toHaveBeenCalledWith({
        where: { code: 'SOC001' },
      })
      expect(result).toEqual(mockSociete)
    })

    it('should return null for non-existent code', async () => {
      mockPrisma.societe.findUnique.mockResolvedValue(null)

      const result = await service.getSocieteByCode('NOTFOUND')

      expect(result).toBeNull()
    })
  })

  describe('getAllSocietes', () => {
    it('should return all active societes', async () => {
      const mockSocietes = [
        createMockSociete({ code: 'SOC001' }),
        createMockSociete({ code: 'SOC002' }),
      ]

      mockPrisma.societe.findMany.mockResolvedValue(mockSocietes)

      const result = await service.getAllSocietes()

      expect(mockPrisma.societe.findMany).toHaveBeenCalledWith({
        where: { isActive: true, deletedAt: null },
        orderBy: { name: 'asc' },
      })
      expect(result).toEqual(mockSocietes)
    })

    it('should include inactive societes when requested', async () => {
      const allSocietes = [
        createMockSociete({ code: 'SOC001', isActive: true }),
        createMockSociete({ code: 'SOC002', isActive: false }),
      ]

      mockPrisma.societe.findMany.mockResolvedValue(allSocietes)

      await service.getAllSocietes(true)

      expect(mockPrisma.societe.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
      })
    })
  })

  describe('getSocieteWithRelations', () => {
    it('should return societe with all relations', async () => {
      const mockLicense = createMockSocieteLicense()
      const mockSocieteWithRelations = {
        ...createMockSociete(),
        license: mockLicense,
        users: [],
        sites: [],
        roles: [],
      }

      mockPrisma.societe.findUnique.mockResolvedValue(mockSocieteWithRelations as any)

      const result = await service.getSocieteWithRelations('societe-123')

      expect(mockPrisma.societe.findUnique).toHaveBeenCalledWith({
        where: { id: 'societe-123' },
        include: {
          license: true,
          users: expect.any(Object),
          sites: expect.any(Object),
          roles: expect.any(Object),
        },
      })
      expect(result).toEqual(mockSocieteWithRelations)
    })

    it('should return null for non-existent societe', async () => {
      mockPrisma.societe.findUnique.mockResolvedValue(null)

      const result = await service.getSocieteWithRelations('nonexistent')

      expect(result).toBeNull()
    })
  })

  // ============================================
  // UPDATE SOCIETE
  // ============================================

  describe('updateSociete', () => {
    it('should update societe fields', async () => {
      const updateData = {
        name: 'Updated Company',
        address: 'New Address',
        city: 'Paris',
      }

      const mockUpdatedSociete = createMockSociete(updateData)
      mockPrisma.societe.update.mockResolvedValue(mockUpdatedSociete)

      const result = await service.updateSociete('societe-123', updateData)

      expect(mockPrisma.societe.update).toHaveBeenCalledWith({
        where: { id: 'societe-123' },
        data: expect.objectContaining(updateData),
      })
      expect(result).toEqual(mockUpdatedSociete)
    })

    it('should prevent code conflicts on update', async () => {
      mockPrisma.societe.update.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['code'] },
      })

      await expect(
        service.updateSociete('societe-123', { code: 'TAKEN_CODE' })
      ).rejects.toThrow()
    })
  })

  // ============================================
  // DELETE SOCIETE
  // ============================================

  describe('deactivateSociete', () => {
    it('should deactivate societe', async () => {
      const mockDeactivatedSociete = createMockSociete({ isActive: false })
      mockPrisma.societe.update.mockResolvedValue(mockDeactivatedSociete)

      const result = await service.deactivateSociete('societe-123')

      expect(mockPrisma.societe.update).toHaveBeenCalledWith({
        where: { id: 'societe-123' },
        data: { isActive: false },
      })
      expect(result.isActive).toBe(false)
    })
  })

  describe('deleteSociete', () => {
    it('should soft delete societe (set deletedAt)', async () => {
      const mockDeletedSociete = createMockSociete({ deletedAt: new Date() })
      mockPrisma.societe.update.mockResolvedValue(mockDeletedSociete)

      const result = await service.deleteSociete('societe-123')

      expect(mockPrisma.societe.update).toHaveBeenCalledWith({
        where: { id: 'societe-123' },
        data: {
          deletedAt: expect.any(Date),
          isActive: false,
        },
      })
      expect(result.deletedAt).toBeInstanceOf(Date)
    })
  })

  describe('hardDeleteSociete', () => {
    it('should permanently delete societe', async () => {
      mockPrisma.societe.delete.mockResolvedValue(createMockSociete() as any)

      await service.hardDeleteSociete('societe-123')

      expect(mockPrisma.societe.delete).toHaveBeenCalledWith({
        where: { id: 'societe-123' },
      })
    })

    it('should throw if societe not found', async () => {
      mockPrisma.societe.delete.mockRejectedValue({
        code: 'P2025',
        meta: { cause: 'Record not found' },
      })

      await expect(service.hardDeleteSociete('nonexistent')).rejects.toThrow()
    })
  })

  // ============================================
  // SEARCH & FILTER
  // ============================================

  describe('searchSocietes', () => {
    it('should search by name', async () => {
      const searchResults = [createMockSociete({ name: 'Test Company' })]
      mockPrisma.societe.findMany.mockResolvedValue(searchResults)

      const result = await service.searchSocietes({ name: 'Test' })

      expect(mockPrisma.societe.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          name: { contains: 'Test', mode: 'insensitive' },
        }),
      })
    })

    it('should search by code', async () => {
      const searchResults = [createMockSociete({ code: 'SOC001' })]
      mockPrisma.societe.findMany.mockResolvedValue(searchResults)

      await service.searchSocietes({ code: 'SOC' })

      expect(mockPrisma.societe.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          code: { contains: 'SOC', mode: 'insensitive' },
        }),
      })
    })

    it('should filter by country', async () => {
      const frenchSocietes = [createMockSociete({ country: 'FR' })]
      mockPrisma.societe.findMany.mockResolvedValue(frenchSocietes)

      await service.searchSocietes({ country: 'FR' })

      expect(mockPrisma.societe.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          country: 'FR',
        }),
      })
    })

    it('should exclude deleted societes', async () => {
      mockPrisma.societe.findMany.mockResolvedValue([])

      await service.searchSocietes({})

      expect(mockPrisma.societe.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          deletedAt: null,
        }),
      })
    })
  })

  // ============================================
  // UTILITIES
  // ============================================

  describe('countSocietes', () => {
    it('should count active societes', async () => {
      mockPrisma.societe.count.mockResolvedValue(42)

      const result = await service.countSocietes()

      expect(mockPrisma.societe.count).toHaveBeenCalledWith({
        where: { isActive: true, deletedAt: null },
      })
      expect(result).toBe(42)
    })

    it('should include inactive when requested', async () => {
      mockPrisma.societe.count.mockResolvedValue(50)

      await service.countSocietes(true)

      expect(mockPrisma.societe.count).toHaveBeenCalledWith({
        where: { deletedAt: null },
      })
    })
  })

  describe('societeExists', () => {
    it('should return true if societe exists', async () => {
      mockPrisma.societe.findUnique.mockResolvedValue(createMockSociete())

      const result = await service.societeExists('SOC001')

      expect(mockPrisma.societe.findUnique).toHaveBeenCalledWith({
        where: { code: 'SOC001' },
      })
      expect(result).toBe(true)
    })

    it('should return false if societe does not exist', async () => {
      mockPrisma.societe.findUnique.mockResolvedValue(null)

      const result = await service.societeExists('NOTFOUND')

      expect(result).toBe(false)
    })
  })
})
