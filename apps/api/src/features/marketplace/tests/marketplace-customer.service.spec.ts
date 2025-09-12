import 'reflect-metadata'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Test, type TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { vi } from 'vitest'
import { User } from '../../../domains/users/entities/user.entity'
import type { CreateCustomerDto, UpdateCustomerDto } from '../dto/customer.dto'
import { MarketplaceCustomer } from '../entities/marketplace-customer.entity'
import { MarketplaceCustomerAddress } from '../entities/marketplace-customer-address.entity'
import { MarketplaceCustomerService } from '../services/marketplace-customer.service'

describe('MarketplaceCustomerService', () => {
  let service: MarketplaceCustomerService
  let _customerRepository: Repository<MarketplaceCustomer>
  let _addressRepository: Repository<MarketplaceCustomerAddress>
  let _userRepository: Repository<User>
  let _eventEmitter: EventEmitter2

  const mockCustomerRepository = {
    create: vi.fn(),
    save: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    update: vi.fn(),
    createQueryBuilder: vi.fn(),
  }

  const mockAddressRepository = {
    create: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    delete: vi.fn(),
  }

  const mockUserRepository = {
    findOne: vi.fn(),
  }

  const mockEventEmitter = {
    emit: vi.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplaceCustomerService,
        {
          provide: getRepositoryToken(MarketplaceCustomer),
          useValue: mockCustomerRepository,
        },
        {
          provide: getRepositoryToken(MarketplaceCustomerAddress),
          useValue: mockAddressRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile()

    service = module.get<MarketplaceCustomerService>(MarketplaceCustomerService)
    _customerRepository = module.get<Repository<MarketplaceCustomer>>(
      getRepositoryToken(MarketplaceCustomer)
    )
    _addressRepository = module.get<Repository<MarketplaceCustomerAddress>>(
      getRepositoryToken(MarketplaceCustomerAddress)
    )
    _userRepository = module.get<Repository<User>>(getRepositoryToken(User))
    _eventEmitter = module.get<EventEmitter2>(EventEmitter2)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new customer successfully', async () => {
      const tenantId = 'tenant-123'
      const userId = 'user-123'
      const createCustomerDto: CreateCustomerDto = {
        userId,
        email: 'customer@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+33123456789',
        company: 'ACME Corp',
      }

      const mockUser = {
        id: userId,
        email: 'customer@example.com',
      }

      const mockCustomer = {
        id: 'customer-123',
        ...createCustomerDto,
        tenantId,
        user: mockUser,
      }

      mockUserRepository.findOne.mockResolvedValue(mockUser)
      mockCustomerRepository.findOne.mockResolvedValue(null) // No existing customer
      mockCustomerRepository.create.mockReturnValue(mockCustomer)
      mockCustomerRepository.save.mockResolvedValue(mockCustomer)

      const result = await service.create(tenantId, createCustomerDto)

      expect(result).toEqual(mockCustomer)
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      })
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('customer.created', {
        customer: mockCustomer,
      })
    })

    it('should throw ConflictException if customer already exists', async () => {
      const tenantId = 'tenant-123'
      const userId = 'user-123'
      const createCustomerDto: CreateCustomerDto = {
        userId,
        email: 'customer@example.com',
        firstName: 'John',
        lastName: 'Doe',
      }

      const mockUser = { id: userId }
      const existingCustomer = { id: 'existing-customer' }

      mockUserRepository.findOne.mockResolvedValue(mockUser)
      mockCustomerRepository.findOne.mockResolvedValue(existingCustomer)

      await expect(service.create(tenantId, createCustomerDto)).rejects.toThrow(ConflictException)
    })

    it('should throw NotFoundException if user does not exist', async () => {
      const tenantId = 'tenant-123'
      const createCustomerDto: CreateCustomerDto = {
        userId: 'invalid-user',
        email: 'customer@example.com',
        firstName: 'John',
        lastName: 'Doe',
      }

      mockUserRepository.findOne.mockResolvedValue(null)

      await expect(service.create(tenantId, createCustomerDto)).rejects.toThrow(NotFoundException)
    })
  })

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      const tenantId = 'tenant-123'
      const customerId = 'customer-123'
      const mockCustomer = {
        id: customerId,
        email: 'customer@example.com',
        tenantId,
      }

      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer)

      const result = await service.findOne(tenantId, customerId)

      expect(result).toEqual(mockCustomer)
      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({
        where: { id: customerId, tenantId },
        relations: ['user', 'addresses', 'orders'],
      })
    })

    it('should throw NotFoundException when customer not found', async () => {
      const tenantId = 'tenant-123'
      const customerId = 'invalid-id'

      mockCustomerRepository.findOne.mockResolvedValue(null)

      await expect(service.findOne(tenantId, customerId)).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update customer information', async () => {
      const tenantId = 'tenant-123'
      const customerId = 'customer-123'
      const updateCustomerDto: UpdateCustomerDto = {
        phone: '+33987654321',
        company: 'New Company',
      }

      const existingCustomer = {
        id: customerId,
        email: 'customer@example.com',
        phone: '+33123456789',
        tenantId,
      }

      const updatedCustomer = {
        ...existingCustomer,
        ...updateCustomerDto,
      }

      mockCustomerRepository.findOne.mockResolvedValue(existingCustomer)
      mockCustomerRepository.save.mockResolvedValue(updatedCustomer)

      const result = await service.update(tenantId, customerId, updateCustomerDto)

      expect(result).toEqual(updatedCustomer)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('customer.updated', {
        customer: updatedCustomer,
        changes: updateCustomerDto,
      })
    })
  })

  describe('addAddress', () => {
    it('should add a new address to customer', async () => {
      const tenantId = 'tenant-123'
      const customerId = 'customer-123'
      const addressDto = {
        label: 'Home',
        street: '123 Main St',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
        isDefault: true,
      }

      const mockCustomer = {
        id: customerId,
        tenantId,
      }

      const mockAddress = {
        id: 'address-123',
        ...addressDto,
        customerId,
        tenantId,
      }

      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer)
      mockAddressRepository.find.mockResolvedValue([]) // No existing addresses
      mockAddressRepository.create.mockReturnValue(mockAddress)
      mockAddressRepository.save.mockResolvedValue(mockAddress)

      const result = await service.addAddress(tenantId, customerId, addressDto)

      expect(result).toEqual(mockAddress)
      expect(mockAddressRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isDefault: true })
      )
    })

    it('should handle default address switching', async () => {
      const tenantId = 'tenant-123'
      const customerId = 'customer-123'
      const addressDto = {
        label: 'Work',
        street: '456 Office Ave',
        city: 'Lyon',
        postalCode: '69001',
        country: 'France',
        isDefault: true,
      }

      const mockCustomer = { id: customerId, tenantId }
      const existingDefaultAddress = {
        id: 'address-old',
        customerId,
        isDefault: true,
      }

      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer)
      mockAddressRepository.find.mockResolvedValue([existingDefaultAddress])
      mockAddressRepository.create.mockReturnValue({ ...addressDto, id: 'address-new' })
      mockAddressRepository.save.mockImplementation((address) => Promise.resolve(address))

      await service.addAddress(tenantId, customerId, addressDto)

      // Verify old default was unset
      expect(mockAddressRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'address-old', isDefault: false })
      )
      // Verify new address is default
      expect(mockAddressRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isDefault: true })
      )
    })
  })

  describe('removeAddress', () => {
    it('should remove an address', async () => {
      const tenantId = 'tenant-123'
      const customerId = 'customer-123'
      const addressId = 'address-123'

      const mockAddress = {
        id: addressId,
        customerId,
        tenantId,
        isDefault: false,
      }

      mockAddressRepository.findOne.mockResolvedValue(mockAddress)
      mockAddressRepository.delete.mockResolvedValue({ affected: 1 })

      await service.removeAddress(tenantId, customerId, addressId)

      expect(mockAddressRepository.delete).toHaveBeenCalledWith({
        id: addressId,
        customerId,
        tenantId,
      })
    })

    it('should prevent removing default address if its the only one', async () => {
      const tenantId = 'tenant-123'
      const customerId = 'customer-123'
      const addressId = 'address-123'

      const mockAddress = {
        id: addressId,
        customerId,
        tenantId,
        isDefault: true,
      }

      mockAddressRepository.findOne.mockResolvedValue(mockAddress)
      mockAddressRepository.find.mockResolvedValue([mockAddress]) // Only one address

      await expect(service.removeAddress(tenantId, customerId, addressId)).rejects.toThrow()
    })
  })

  describe('getCustomerStatistics', () => {
    it('should return customer statistics', async () => {
      const tenantId = 'tenant-123'
      const customerId = 'customer-123'

      const mockStats = {
        totalOrders: 15,
        totalSpent: 5000,
        averageOrderValue: 333.33,
        lastOrderDate: new Date('2024-01-15'),
      }

      const mockQueryBuilder = {
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({
          totalOrders: '15',
          totalSpent: '5000',
          averageOrderValue: '333.33',
          lastOrderDate: mockStats.lastOrderDate,
        }),
      }

      mockCustomerRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder)

      const result = await service.getCustomerStatistics(tenantId, customerId)

      expect(result).toEqual(mockStats)
    })
  })

  describe('findByEmail', () => {
    it('should find customer by email', async () => {
      const tenantId = 'tenant-123'
      const email = 'customer@example.com'

      const mockCustomer = {
        id: 'customer-123',
        email,
        tenantId,
      }

      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer)

      const result = await service.findByEmail(tenantId, email)

      expect(result).toEqual(mockCustomer)
      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({
        where: { email, tenantId },
        relations: ['user'],
      })
    })
  })

  describe('getTopCustomers', () => {
    it('should return top customers by spending', async () => {
      const tenantId = 'tenant-123'
      const limit = 10

      const mockTopCustomers = [
        { customerId: 'c1', totalSpent: 10000, orderCount: 20 },
        { customerId: 'c2', totalSpent: 8000, orderCount: 15 },
        { customerId: 'c3', totalSpent: 6000, orderCount: 10 },
      ]

      const mockQueryBuilder = {
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValue(mockTopCustomers),
      }

      mockCustomerRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder)

      const result = await service.getTopCustomers(tenantId, limit)

      expect(result).toEqual(mockTopCustomers)
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('SUM(order.totalAmount)', 'DESC')
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(limit)
    })
  })
})
