import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { User } from '../../users/entities/user.entity'
import { SessionInvalidationService } from './session-invalidation.service'

describe('SessionInvalidationService', () => {
  let service: SessionInvalidationService
  let userRepository: Repository<User>

  const mockRepository = {
    update: vi.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionInvalidationService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile()

    service = module.get<SessionInvalidationService>(SessionInvalidationService)
    userRepository = module.get<Repository<User>>(getRepositoryToken(User))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('invalidateAllSessions', () => {
    it('should invalidate all sessions successfully', async () => {
      mockRepository.update.mockResolvedValue({ affected: 5 })

      await service.invalidateAllSessions()

      expect(mockRepository.update).toHaveBeenCalledWith(
        { refreshToken: expect.any(Object) },
        { refreshToken: undefined }
      )
      expect(mockRepository.update).toHaveBeenCalledTimes(1)
    })

    it('should handle errors gracefully', async () => {
      mockRepository.update.mockRejectedValue(new Error('Database error'))

      await expect(service.invalidateAllSessions()).resolves.not.toThrow()
      expect(mockRepository.update).toHaveBeenCalledTimes(1)
    })
  })

  describe('invalidateUserSession', () => {
    it('should invalidate a specific user session', async () => {
      const userId = 'user-123'
      mockRepository.update.mockResolvedValue({ affected: 1 })

      await service.invalidateUserSession(userId)

      expect(mockRepository.update).toHaveBeenCalledWith(userId, { refreshToken: undefined })
      expect(mockRepository.update).toHaveBeenCalledTimes(1)
    })
  })

  describe('forceInvalidateAllSessions', () => {
    it('should return number of affected users', async () => {
      mockRepository.update.mockResolvedValue({ affected: 3 })

      const result = await service.forceInvalidateAllSessions()

      expect(result).toBe(3)
      expect(mockRepository.update).toHaveBeenCalledWith(
        { refreshToken: expect.any(Object) },
        { refreshToken: undefined }
      )
    })

    it('should handle undefined affected count', async () => {
      mockRepository.update.mockResolvedValue({ affected: undefined })

      const result = await service.forceInvalidateAllSessions()

      expect(result).toBe(0)
    })

    it('should throw error when database fails', async () => {
      mockRepository.update.mockRejectedValue(new Error('Database error'))

      await expect(service.forceInvalidateAllSessions()).rejects.toThrow('Database error')
    })
  })
})